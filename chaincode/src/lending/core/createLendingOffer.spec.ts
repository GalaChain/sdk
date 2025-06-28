/*
 * Copyright (c) Gala Games Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
  CreateLendingOfferDto,
  GalaChainResponse,
  TokenBalance,
  TokenClass,
  TokenClassKey,
  createValidSubmitDTO
} from "@gala-chain/api";
import { currency, fixture, users } from "@gala-chain/test";
import { BigNumber } from "bignumber.js";

import GalaChainTokenContract from "../../__test__/GalaChainTokenContract";

describe("CreateLendingOffer", () => {
  it("should create a lending offer successfully", async () => {
    // Given
    const currencyClass = currency.tokenClass();
    const currencyInstance = currency.tokenInstance();
    const lenderBalance = currency.tokenBalance((b) => ({
      ...b,
      owner: users.testUser1.identityKey,
      quantity: new BigNumber("1000000")
    }));

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser1, users.testUser2)
      .savedState(currencyClass, currencyInstance, lenderBalance);

    const dto = await createValidSubmitDTO(CreateLendingOfferDto, {
      principalToken: currency.tokenClassKey(),
      principalQuantity: new BigNumber("100000"),
      interestRate: new BigNumber("1000"), // 10% APR
      duration: 30 * 24 * 60 * 60, // 30 days
      collateralToken: currency.tokenClassKey(),
      collateralRatio: new BigNumber("1.5"), // 150% collateralization
      uses: new BigNumber("1"),
      expires: 0
    });
    dto.sign(users.testUser1.privateKey);

    // When
    const response = await contract.CreateLendingOffer(ctx, dto);

    // Then
    expect(response).toEqual(GalaChainResponse.Success(expect.any(Array)));
    expect(response.Data!).toHaveLength(1);
    expect(response.Data![0].offer.lender).toBe(users.testUser1.identityKey);
    expect(response.Data![0].offer.principalQuantity).toEqual(new BigNumber("100000"));
  });

  it("should fail when lender has insufficient balance", async () => {
    // Given
    const currencyClass = currency.tokenClass();
    const currencyInstance = currency.tokenInstance();
    const lenderBalance = currency.tokenBalance((b) => ({
      ...b,
      owner: users.testUser1.identityKey,
      quantity: new BigNumber("50000") // Less than required
    }));

    const { ctx, contract } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser1, users.testUser2)
      .savedState(currencyClass, currencyInstance, lenderBalance);

    const dto = await createValidSubmitDTO(CreateLendingOfferDto, {
      principalToken: currency.tokenClassKey(),
      principalQuantity: new BigNumber("100000"),
      interestRate: new BigNumber("1000"),
      duration: 30 * 24 * 60 * 60,
      collateralToken: currency.tokenClassKey(),
      collateralRatio: new BigNumber("1.5"),
      uses: new BigNumber("1"),
      expires: 0
    });
    dto.sign(users.testUser1.privateKey);

    // When
    const response = await contract.CreateLendingOffer(ctx, dto);

    // Then
    expect(response.Status).toBe(0);
    expect(response.Message).toContain("insufficient");
  });

  it("should fail when caller is not the lender", async () => {
    // Given
    const currencyClass = currency.tokenClass();
    const currencyInstance = currency.tokenInstance();
    const lenderBalance = currency.tokenBalance((b) => ({
      ...b,
      owner: users.testUser1.identityKey,
      quantity: new BigNumber("1000000")
    }));

    const { ctx, contract } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser1, users.testUser2)
      .savedState(currencyClass, currencyInstance, lenderBalance);

    const dto = await createValidSubmitDTO(CreateLendingOfferDto, {
      lender: users.testUser1.identityKey, // Lender is user1
      principalToken: currency.tokenClassKey(),
      principalQuantity: new BigNumber("100000"),
      interestRate: new BigNumber("1000"),
      duration: 30 * 24 * 60 * 60,
      collateralToken: currency.tokenClassKey(),
      collateralRatio: new BigNumber("1.5"),
      uses: new BigNumber("1"),
      expires: 0
    });
    dto.sign(users.testUser2.privateKey); // But signed by user2

    // When
    const response = await contract.CreateLendingOffer(ctx, dto);

    // Then
    expect(response.Status).toBe(0);
    expect(response.Message).toContain("does not match lender");
  });
});

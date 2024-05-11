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
  GalaChainResponse,
  LockTokenDto,
  TokenBalance,
  TokenHold,
  ValidationFailedError,
  createValidDTO
} from "@gala-chain/api";
import { currency, fixture, nft, users, writesMap } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";

describe("LockTokens", () => {
  test(`Adds a "lock" hold to a user's GalaChainTokenBalance`, async () => {
    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();
    const nftTokenBalancePlain = {
      owner: users.testUser1,
      collection: nftInstanceKey.collection,
      category: nftInstanceKey.category,
      type: nftInstanceKey.type,
      additionalKey: nftInstanceKey.additionalKey,
      instanceIds: [new BigNumber(nftInstanceKey.instance)],
      lockedHolds: [],
      inUseHolds: [],
      quantity: new BigNumber("1")
    };
    const dto = await createValidDTO(LockTokenDto, {
      owner: users.testUser1,
      lockAuthority: users.testUser1,
      tokenInstance: nftInstanceKey,
      quantity: new BigNumber("1")
    });
    const balance = plainToInstance(TokenBalance, {
      ...nftTokenBalancePlain,
      owner: users.testUser1,
      instanceIds: [nftInstanceKey.instance],
      lockedHolds: [],
      inUseHolds: [],
      quantity: new BigNumber(1)
    });

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testUser1)
      .savedState(nftClass, nftInstance, balance);

    const expectedHold = new TokenHold({
      createdBy: users.testUser1,
      instanceId: nftInstanceKey.instance,
      quantity: new BigNumber("1"),
      created: ctx.txUnixTime,
      lockAuthority: users.testUser1,
      expires: 0
    });

    // When
    const response = await contract.LockToken(ctx, dto);

    // Then
    const balanceWithHold = plainToInstance(TokenBalance, { ...balance, lockedHolds: [expectedHold] });
    expect(response).toEqual(GalaChainResponse.Success(balanceWithHold));
    expect(writes).toEqual(writesMap(balanceWithHold));
  });

  test(`Fails when quantity lower than decimal limit (10)`, async () => {
    // Given
    const currencyInstance = currency.tokenInstance();
    const currencyInstanceKey = currency.tokenInstanceKey();
    const currencyClass = currency.tokenClass();
    const decimalQuantity = new BigNumber("0.000000000001");

    const dto = await createValidDTO(LockTokenDto, {
      owner: users.testUser1,
      lockAuthority: users.testUser1,
      tokenInstance: currencyInstanceKey,
      quantity: decimalQuantity
    });

    const { collection, category, type, additionalKey } = currencyClass;
    const expectedBalance = new TokenBalance({
      owner: users.testUser1,
      collection,
      category,
      type,
      additionalKey
    });

    expectedBalance.ensureCanAddQuantity(new BigNumber("10"));
    const balanceKey = expectedBalance.getCompositeKey();

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testUser1)
      .savedState(currencyClass, currencyInstance, expectedBalance);

    // When
    const response = await contract.LockToken(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(
        new ValidationFailedError("Insufficient balance", {
          balanceKey: balanceKey,
          lockedQuantity: "0",
          total: "0"
        })
      )
    );
    expect(writes).toEqual({});
  });
});

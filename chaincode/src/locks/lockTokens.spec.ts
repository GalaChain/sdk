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
import { GalaChainResponse, LockTokenDto, TokenHold, createValidSubmitDTO } from "@gala-chain/api";
import { currency, fixture, nft, users, writesMap } from "@gala-chain/test";
import BigNumber from "bignumber.js";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { InvalidDecimalError } from "../token";

describe("LockTokens", () => {
  test(`Adds a "lock" hold to a user's GalaChainTokenBalance`, async () => {
    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();

    const balance = nft.tokenBalance();
    expect(balance.getNftInstanceIds()).toContainEqual(nftInstance.instance);

    const dto = await createValidSubmitDTO(LockTokenDto, {
      owner: users.testUser1.identityKey,
      lockAuthority: users.testUser1.identityKey,
      tokenInstance: nftInstanceKey,
      quantity: new BigNumber("1")
    }).signed(users.testUser1.privateKey);

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser1)
      .savedState(nftClass, nftInstance, balance);

    const balanceWithHold = balance.copy();
    balanceWithHold.lockInstance(
      new TokenHold({
        createdBy: users.testUser1.identityKey,
        instanceId: nftInstance.instance,
        quantity: new BigNumber("1"),
        created: ctx.txUnixTime,
        lockAuthority: users.testUser1.identityKey,
        expires: 0
      }),
      1
    );

    // When
    const response = await contract.LockToken(ctx, dto);

    // Then
    expect(response).toEqual(GalaChainResponse.Success(balanceWithHold));
    expect(getWrites()).toEqual(writesMap(balanceWithHold));
  });

  test(`Fails when quantity lower than decimal limit (10)`, async () => {
    // Given
    const currencyInstance = currency.tokenInstance();
    const currencyInstanceKey = currency.tokenInstanceKey();
    const currencyClass = currency.tokenClass();
    const balance = currency.tokenBalance();

    expect(currencyClass.decimals).toEqual(10);

    const decimalQuantity = new BigNumber("0.000000000001");

    const dto = await createValidSubmitDTO(LockTokenDto, {
      owner: users.testUser1.identityKey,
      lockAuthority: users.testUser1.identityKey,
      tokenInstance: currencyInstanceKey,
      quantity: decimalQuantity
    }).signed(users.testUser1.privateKey);

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser1)
      .savedState(currencyClass, currencyInstance, balance);

    // When
    const response = await contract.LockToken(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(new InvalidDecimalError(decimalQuantity, currencyClass.decimals))
    );
    expect(getWrites()).toEqual({});
  });
});

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
import { GalaChainResponse, TokenBalance, TokenHold, UseTokenDto, createValidDTO } from "@gala-chain/api";
import { fixture, nft, users, writesMap } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";

describe("UseToken", () => {
  test(`Adds an "in use" hold to a user's GalaChainTokenBalance`, async () => {
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

    const expectedBalance = await createValidChainObject(TokenBalance, nftTokenBalancePlain);

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testUser1)
      .savedState(nftClass, nftInstance, expectedBalance);

    const dto: UseTokenDto = await createValidDTO(UseTokenDto, {
      owner: users.testUser1,
      inUseBy: users.testUser1,
      tokenInstance: nftInstanceKey,
      quantity: new BigNumber("1")
    });

    const expectedHold = new TokenHold({
      createdBy: users.testUser1,
      instanceId: nftInstanceKey.instance,
      quantity: new BigNumber("1"),
      created: ctx.txUnixTime,
      expires: 0
    });

    // When
    const response = await contract.UseToken(ctx, dto);

    // Then
    const balanceWithHold = await createValidChainObject(TokenBalance, { ...expectedBalance, inUseHolds: [expectedHold] });
    expect(response).toEqual(GalaChainResponse.Success(balanceWithHold));
    expect(writes).toEqual(writesMap(balanceWithHold));
  });
});

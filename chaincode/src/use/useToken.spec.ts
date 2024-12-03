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
  TokenBalance,
  TokenHold,
  UseTokenDto,
  createValidSubmitDTO
} from "@gala-chain/api";
import { fixture, nft, users, writesMap } from "@gala-chain/test";
import BigNumber from "bignumber.js";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";

describe("UseToken", () => {
  test(`Adds an "in use" hold to a user's GalaChainTokenBalance`, async () => {
    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();

    const nftTokenBalance = new TokenBalance({
      owner: users.testUser1.identityKey,
      collection: nftInstanceKey.collection,
      category: nftInstanceKey.category,
      type: nftInstanceKey.type,
      additionalKey: nftInstanceKey.additionalKey
    });
    nftTokenBalance.addInstance(nftInstanceKey.instance);

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser1)
      .savedState(nftClass, nftInstance, nftTokenBalance);

    const dto: UseTokenDto = await createValidSubmitDTO(UseTokenDto, {
      owner: users.testUser1.identityKey,
      inUseBy: users.testUser1.identityKey,
      tokenInstance: nftInstanceKey,
      quantity: new BigNumber("1")
    });
    dto.sign(users.testUser1.privateKey);

    const expectedHold = new TokenHold({
      createdBy: users.testUser1.identityKey,
      instanceId: nftInstanceKey.instance,
      quantity: new BigNumber("1"),
      created: ctx.txUnixTime,
      expires: 0
    });

    const expectedBalance = nftTokenBalance.copy();
    expectedBalance.useInstance(expectedHold, ctx.txUnixTime);

    // When
    const response = await contract.UseToken(ctx, dto);

    // Then
    expect(response).toEqual(GalaChainResponse.Success(expectedBalance));
    expect(getWrites()).toEqual(writesMap(expectedBalance));
  });
});

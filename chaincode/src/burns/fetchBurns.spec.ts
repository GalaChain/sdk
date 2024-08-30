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
  FetchBurnsDto,
  GalaChainResponse,
  TokenBurn,
  createValidChainObject,
  createValidDTO
} from "@gala-chain/api";
import { fixture, nft, users } from "@gala-chain/test";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";

describe("FetchBurns", () => {
  it("should FetchBurns", async () => {
    // Given
    const nftInstance = nft.tokenInstance1();
    const nftClass = nft.tokenClass();
    const nftTokenBurn = nft.tokenBurn();
    const nftTokenBurn2 = await createValidChainObject(TokenBurn, { ...nftTokenBurn, created: 10000 });

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser1)
      .savedState(nftClass, nftInstance, nftTokenBurn, nftTokenBurn2);

    const dto = await createValidDTO(FetchBurnsDto, {
      burnedBy: users.testUser1.alias
    }).signed(users.testUser1.privateKey);

    // When
    const response = await contract.FetchBurns(ctx, dto);

    // Then
    expect(response).toEqual(GalaChainResponse.Success([nftTokenBurn, nftTokenBurn2]));
    expect(writes).toEqual({});
  });
});

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
  FullAllowanceCheckDto,
  FullAllowanceCheckResDto,
  GalaChainResponse,
  TokenInstanceKey,
  createValidDTO
} from "@gala-chain/api";
import { fixture, nft, users } from "@gala-chain/test";
import { plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";

describe("FullAllowanceCheck", () => {
  it("should return false with missing allowances when there are no allowances on chain", async () => {
    // Given
    const nftInstance = nft.tokenInstance1();
    const nftClass = nft.tokenClass();
    const tokenBalance = nft.tokenBalance();

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .registeredUsers(users.admin)
      .savedState(nftClass, nftInstance, tokenBalance);

    const dto = await createValidDTO(FullAllowanceCheckDto, {
      collection: nftInstance.collection,
      category: nftInstance.category,
      type: nftInstance.type,
      additionalKey: nftInstance.additionalKey,
      owner: users.testUser1.alias,
      grantedTo: users.admin.alias,
      allowanceType: 1
    }).signed(users.admin.privateKey);

    // When
    const response = await contract.FullAllowanceCheck(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Success(
        await createValidDTO(FullAllowanceCheckResDto, {
          all: false,
          missing: [
            plainToInstance(TokenInstanceKey, {
              additionalKey: "Elixir",
              category: "Item",
              collection: "TEST",
              instance: "1",
              type: "Potion"
            })
          ]
        })
      )
    );
    expect(writes).toEqual({});
  });
});

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
  AllowanceType,
  BurnTokensDto,
  FetchBalancesDto,
  GrantAllowanceDto,
  TokenAllowance,
  TokenBalance,
  TokenBurn,
  TokenClassKey,
  TokenInstance,
  TokenInstanceKey,
  TokenInstanceQueryKey,
  createValidDTO
} from "@gala-chain/api";
import { ChainUser } from "@gala-chain/client";
import {
  AdminChainClients,
  TestClients,
  grantUsersAllowance,
  mintTokensToUsers,
  randomize,
  transactionSuccess
} from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { instanceToPlain, plainToClass as plainToInstance } from "class-transformer";

jest.setTimeout(30000);

describe("Burn with allowance scenario; run against network:up-stress to test concurrency", () => {
  let client: AdminChainClients;
  let gameAdmin: ChainUser;
  let user1: ChainUser;
  let user2: ChainUser;

  const tokenClassKey: TokenClassKey = plainToInstance(TokenClassKey, {
    collection: randomize("Fungible").slice(0, 20),
    category: "Unit",
    type: "none",
    additionalKey: "none"
  });

  const tokenQueryKey: TokenInstanceQueryKey = plainToInstance(TokenInstanceQueryKey, {
    collection: tokenClassKey.collection,
    category: tokenClassKey.category,
    type: tokenClassKey.type,
    additionalKey: tokenClassKey.additionalKey,
    instance: TokenInstance.FUNGIBLE_TOKEN_INSTANCE
  });

  beforeAll(async () => {
    client = await TestClients.createForAdmin();
    gameAdmin = await client.createRegisteredUser();
    user1 = await client.createRegisteredUser();
    user2 = await client.createRegisteredUser();

    await mintTokensToUsers(
      client.assets,
      tokenClassKey,
      [
        { user: user1, quantity: new BigNumber(1000) },
        { user: user2, quantity: new BigNumber(1000) }
      ],
      false
    );
  });

  afterAll(async () => {
    await client.disconnect();
  });

  it("should let users grant burn allowance to admin", async () => {
    // Given
    const user1Dto = (
      await createValidDTO(GrantAllowanceDto, {
        tokenInstance: tokenQueryKey,
        quantities: [{ user: gameAdmin.identityKey, quantity: new BigNumber(100) }],
        allowanceType: AllowanceType.Burn,
        uses: new BigNumber(100)
      })
    ).signed(user1.privateKey);

    const user2Dto = (
      await createValidDTO(GrantAllowanceDto, {
        tokenInstance: tokenQueryKey,
        quantities: [{ user: gameAdmin.identityKey, quantity: new BigNumber(100) }],
        allowanceType: AllowanceType.Burn,
        uses: new BigNumber(100)
      })
    ).signed(user2.privateKey);

    // When
    const requests = [user1Dto, user2Dto].map((dto) => {
      return client.assets.submitTransaction<TokenAllowance[]>("GrantAllowance", dto, TokenAllowance);
    });

    const results = await Promise.all(requests);

    // Then
    expect(results[0]).toEqual(transactionSuccess());
    expect(results[1]).toEqual(transactionSuccess());
  });

  it("GameAdmin should burn tokens", async () => {
    // Given
    const burnQuantity = {
      tokenInstanceKey: TokenInstanceKey.fungibleKey(tokenClassKey),
      quantity: new BigNumber(10)
    };

    const burnUser1TokensDto = (
      await createValidDTO<BurnTokensDto>(BurnTokensDto, {
        tokenInstances: [burnQuantity],
        owner: user1.identityKey
      })
    ).signed(gameAdmin.privateKey);

    const burnUser2TokensDto = (
      await createValidDTO<BurnTokensDto>(BurnTokensDto, {
        tokenInstances: [burnQuantity],
        owner: user2.identityKey
      })
    ).signed(gameAdmin.privateKey);

    // When
    const requests = [burnUser1TokensDto, burnUser2TokensDto].map((dto) => {
      return client.assets.submitTransaction<TokenBurn[]>("BurnTokens", dto, TokenBurn);
    });

    const results = await Promise.all(requests);

    // Then
    expect(results[0]).toEqual(transactionSuccess());
    expect(results[1]).toEqual(transactionSuccess());
  });
});

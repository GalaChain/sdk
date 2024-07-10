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
  CreateTokenClassDto,
  FetchBalancesDto,
  GrantAllowanceDto,
  MintTokenDto,
  TokenAllowance,
  TokenBalance,
  TokenClassKey,
  TokenInstance,
  TokenInstanceKey,
  createValidDTO
} from "@gala-chain/api";
import { ChainUser } from "@gala-chain/client";
import {
  AdminChainClients,
  TestClients,
  createTransferDto,
  fetchNFTInstances,
  randomize,
  transactionSuccess
} from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { instanceToPlain, plainToInstance } from "class-transformer";

jest.setTimeout(30000);

describe("Simple NFT scenario", () => {
  let client: AdminChainClients;
  let user1: ChainUser;
  let user2: ChainUser;

  beforeAll(async () => {
    client = await TestClients.createForAdmin();
    user1 = await client.createRegisteredUser();
    user2 = await client.createRegisteredUser();
  });

  afterAll(async () => {
    await client.disconnect();
  });

  const nftClassKey: TokenClassKey = plainToInstance(TokenClassKey, {
    collection: randomize("NFT"),
    category: "Weapon",
    type: "Axe",
    additionalKey: "none"
  });

  it("Curator should create NFT Class", async () => {
    // Given
    const galaTokenDto: CreateTokenClassDto = await createValidDTO<CreateTokenClassDto>(CreateTokenClassDto, {
      decimals: 0,
      tokenClass: nftClassKey,
      name: nftClassKey.collection,
      symbol: nftClassKey.collection.slice(0, 20),
      description: "This is a test description!",
      isNonFungible: true,
      image: "https://app.gala.games/_nuxt/img/gala-logo_horizontal_white.8b0409c.png",
      maxSupply: new BigNumber(10)
    });

    // When
    const response = await client.assets.submitTransaction<TokenClassKey>(
      "CreateTokenClass",
      galaTokenDto.signed(client.assets.privateKey),
      TokenClassKey
    );

    // Then
    expect(response).toEqual(transactionSuccess(nftClassKey));
  });

  it("Curator should grant users minting allowance for NFT", async () => {
    // Given
    const galaAllowanceDto = await createValidDTO<GrantAllowanceDto>(GrantAllowanceDto, {
      tokenInstance: TokenInstanceKey.nftKey(nftClassKey, TokenInstance.FUNGIBLE_TOKEN_INSTANCE).toQueryKey(),
      allowanceType: AllowanceType.Mint,
      quantities: [
        { user: user1.identityKey, quantity: new BigNumber(1) },
        { user: user2.identityKey, quantity: new BigNumber(1) }
      ],
      uses: new BigNumber(10)
    });

    // When
    const galaResult = await client.assets.submitTransaction<TokenAllowance[]>(
      "GrantAllowance",
      galaAllowanceDto.signed(client.assets.privateKey),
      TokenAllowance
    );

    // Then
    expect(galaResult).toEqual(
      transactionSuccess([
        expect.objectContaining({
          grantedTo: user1.identityKey,
          quantity: new BigNumber(1)
        }),
        expect.objectContaining({
          grantedTo: user2.identityKey,
          quantity: new BigNumber(1)
        })
      ])
    );
  });

  it("Users should mint NFT", async () => {
    // Given
    const user1MintDto = await createValidDTO<MintTokenDto>(MintTokenDto, {
      owner: user1.identityKey,
      tokenClass: nftClassKey,
      quantity: new BigNumber(1)
    });

    const user2MintDto = await createValidDTO<MintTokenDto>(MintTokenDto, {
      owner: user2.identityKey,
      tokenClass: nftClassKey,
      quantity: new BigNumber(1)
    });

    // When
    const toUser1Response = await client.assets.submitTransaction(
      "MintToken",
      user1MintDto.signed(user1.privateKey)
    );
    const toUser2Response = await client.assets.submitTransaction(
      "MintToken",
      user2MintDto.signed(user2.privateKey)
    );

    // Then
    expect(toUser1Response).toEqual(transactionSuccess());
    expect(toUser2Response).toEqual(transactionSuccess());
  });

  it("Users should have some NTFs", async () => {
    // Given
    const balancesDto = await createValidDTO(FetchBalancesDto, { ...instanceToPlain(nftClassKey) });
    const user1BalancesDto = balancesDto.signed(user1.privateKey);
    const user2BalancesDto = balancesDto.signed(user2.privateKey);

    // When
    const user1checkResponse = await client.assets.evaluateTransaction(
      "FetchBalances",
      user1BalancesDto,
      TokenBalance
    );
    const user2checkResponse = await client.assets.evaluateTransaction(
      "FetchBalances",
      user2BalancesDto,
      TokenBalance
    );

    // Then
    expect((user1checkResponse.Data ?? [])[0].instanceIds).toEqual([new BigNumber(1)]);
    expect((user2checkResponse.Data ?? [])[0].instanceIds).toEqual([new BigNumber(2)]);
  });

  it("transfer NFT between users", async () => {
    // Given
    const transferDto = await createTransferDto(nftClassKey, {
      from: user1.identityKey,
      to: user2.identityKey,
      tokenInstance: new BigNumber(1)
    });

    // When
    const transferResponse = await client.assets.submitTransaction(
      "TransferToken",
      transferDto.signed(user1.privateKey)
    );

    // Then
    expect(transferResponse).toEqual(transactionSuccess());
    expect(await fetchNFTInstances(client.assets, nftClassKey, user1.identityKey)).toEqual([]);
    expect(await fetchNFTInstances(client.assets, nftClassKey, user2.identityKey)).toEqual([
      new BigNumber(1),
      new BigNumber(2)
    ]);
  });
});

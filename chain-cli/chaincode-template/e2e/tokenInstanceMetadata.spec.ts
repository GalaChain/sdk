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
  ChainUser,
  CreateTokenClassDto,
  DeleteTokenInstanceMetadataDto,
  FetchTokenInstanceMetadataDto,
  GrantAllowanceDto,
  GrantNftCollectionAuthorizationDto,
  MintTokenDto,
  SetTokenInstanceMetadataDto,
  TokenClassKey,
  TokenInstance,
  TokenInstanceKey,
  TokenInstanceMetadata,
  TokenInstanceMetadataAttribute,
  TokenInstanceMetadataCustomField,
  createValidDTO,
  createValidSubmitDTO
} from "@gala-chain/api";
import {
  AdminChainClients,
  TestClients,
  randomize,
  transactionErrorCode,
  transactionSuccess
} from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

jest.setTimeout(30000);

describe("Token instance metadata scenario", () => {
  let client: AdminChainClients;
  let user1: ChainUser;
  let user2: ChainUser;

  // project names are claimed in the NFT collection name registry, and claims persist
  // on chain across test runs, so each run claims fresh names
  const project = randomize("project-alpha");
  const projectBeta = randomize("project-beta");

  beforeAll(async () => {
    client = await TestClients.createForAdmin();
    user1 = ChainUser.withRandomKeys();
    user2 = ChainUser.withRandomKeys();
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

  const nftInstanceKey = () => TokenInstanceKey.nftKey(nftClassKey, 1);

  it("Curator should create NFT Class and mint an instance", async () => {
    // Given
    const createClassDto = await createValidSubmitDTO(CreateTokenClassDto, {
      decimals: 0,
      tokenClass: nftClassKey,
      name: nftClassKey.collection,
      symbol: nftClassKey.collection.slice(0, 20),
      description: "This is a test description!",
      isNonFungible: true,
      image: "https://app.gala.games/_nuxt/img/gala-logo_horizontal_white.8b0409c.png",
      maxSupply: new BigNumber(10)
    });

    const allowanceDto = await createValidSubmitDTO(GrantAllowanceDto, {
      tokenInstance: TokenInstanceKey.nftKey(nftClassKey, TokenInstance.FUNGIBLE_TOKEN_INSTANCE).toQueryKey(),
      allowanceType: AllowanceType.Mint,
      quantities: [{ user: user1.identityKey, quantity: new BigNumber(1) }],
      uses: new BigNumber(10)
    });

    const mintDto = await createValidSubmitDTO(MintTokenDto, {
      owner: user1.identityKey,
      tokenClass: nftClassKey,
      quantity: new BigNumber(1)
    });

    // When
    const createClassResponse = await client.assets.submitTransaction<TokenClassKey>(
      "CreateTokenClass",
      createClassDto.signed(client.assets.privateKey),
      TokenClassKey
    );
    const allowanceResponse = await client.assets.submitTransaction(
      "GrantAllowance",
      allowanceDto.signed(client.assets.privateKey)
    );
    const mintResponse = await client.assets.submitTransaction("MintToken", mintDto.signed(user1.privateKey));

    // Then
    expect(createClassResponse).toEqual(transactionSuccess(nftClassKey));
    expect(allowanceResponse).toEqual(transactionSuccess());
    expect(mintResponse).toEqual(transactionSuccess());
  });

  it("Users should claim project names in the collection name registry", async () => {
    // Given
    const claimAlphaDto = await createValidSubmitDTO(GrantNftCollectionAuthorizationDto, {
      collection: project,
      authorizedUser: user1.identityKey
    });

    const claimBetaDto = await createValidSubmitDTO(GrantNftCollectionAuthorizationDto, {
      collection: projectBeta,
      authorizedUser: user2.identityKey
    });

    // When
    const claimAlphaResponse = await client.assets.submitTransaction(
      "GrantNftCollectionAuthorization",
      claimAlphaDto.signed(user1.privateKey)
    );
    const claimBetaResponse = await client.assets.submitTransaction(
      "GrantNftCollectionAuthorization",
      claimBetaDto.signed(user2.privateKey)
    );

    // Then
    expect(claimAlphaResponse).toEqual(transactionSuccess());
    expect(claimBetaResponse).toEqual(transactionSuccess());
  });

  it("User should not set metadata for an unclaimed project name", async () => {
    // Given
    const setDto = await createValidSubmitDTO(SetTokenInstanceMetadataDto, {
      tokenInstance: nftInstanceKey(),
      project: randomize("project-unclaimed"),
      name: "Unclaimed Project View"
    });

    // When
    const response = await client.assets.submitTransaction(
      "SetTokenInstanceMetadata",
      setDto.signed(user1.privateKey)
    );

    // Then
    expect(response).toEqual(transactionErrorCode(403));
  });

  it("User should set token instance metadata for their project", async () => {
    // Given
    const setDto = await createValidSubmitDTO(SetTokenInstanceMetadataDto, {
      tokenInstance: nftInstanceKey(),
      project,
      name: "Legendary Axe #1",
      description: "An axe of legend.",
      image: "https://app.gala.games/test-image-placeholder-url.png",
      attributes: [
        plainToInstance(TokenInstanceMetadataAttribute, {
          traitType: "Sharpness",
          value: 10,
          displayType: "number"
        })
      ],
      customFields: [plainToInstance(TokenInstanceMetadataCustomField, { key: "gameId", value: "axe-001" })]
    });

    // When
    const response = await client.assets.submitTransaction<TokenInstanceMetadata>(
      "SetTokenInstanceMetadata",
      setDto.signed(user1.privateKey),
      TokenInstanceMetadata
    );

    // Then
    expect(response).toEqual(
      transactionSuccess(
        expect.objectContaining({
          project,
          name: "Legendary Axe #1",
          attributes: [expect.objectContaining({ traitType: "Sharpness", value: 10 })]
        })
      )
    );
  });

  it("Another user should not modify the project's metadata", async () => {
    // Given
    const setDto = await createValidSubmitDTO(SetTokenInstanceMetadataDto, {
      tokenInstance: nftInstanceKey(),
      project,
      name: "Hijacked Axe"
    });

    // When
    const response = await client.assets.submitTransaction(
      "SetTokenInstanceMetadata",
      setDto.signed(user2.privateKey)
    );

    // Then
    expect(response).toEqual(transactionErrorCode(403));
  });

  it("Another user should set metadata for a different project on the same instance", async () => {
    // Given
    const setDto = await createValidSubmitDTO(SetTokenInstanceMetadataDto, {
      tokenInstance: nftInstanceKey(),
      project: projectBeta,
      name: "Beta View of the Axe"
    });

    // When
    const response = await client.assets.submitTransaction<TokenInstanceMetadata>(
      "SetTokenInstanceMetadata",
      setDto.signed(user2.privateKey),
      TokenInstanceMetadata
    );

    // Then
    expect(response).toEqual(
      transactionSuccess(expect.objectContaining({ project: projectBeta, name: "Beta View of the Axe" }))
    );
  });

  it("Anyone should fetch metadata of all projects for the instance", async () => {
    // Given
    const fetchDto = await createValidDTO(FetchTokenInstanceMetadataDto, {
      tokenInstance: nftInstanceKey()
    });

    // When
    const response = await client.assets.evaluateTransaction(
      "FetchTokenInstanceMetadata",
      fetchDto,
      TokenInstanceMetadata
    );

    // Then
    expect(response).toEqual(
      transactionSuccess(
        expect.arrayContaining([
          expect.objectContaining({ project, name: "Legendary Axe #1" }),
          expect.objectContaining({ project: projectBeta })
        ])
      )
    );
  });

  it("Project owner should replace metadata as a full document", async () => {
    // Given
    const replaceDto = await createValidSubmitDTO(SetTokenInstanceMetadataDto, {
      tokenInstance: nftInstanceKey(),
      project,
      name: "Renamed Axe"
    });

    // When
    const response = await client.assets.submitTransaction<TokenInstanceMetadata>(
      "SetTokenInstanceMetadata",
      replaceDto.signed(user1.privateKey),
      TokenInstanceMetadata
    );

    // Then
    const metadata = response.Data as TokenInstanceMetadata;
    expect(response).toEqual(transactionSuccess(expect.objectContaining({ name: "Renamed Axe" })));
    expect(metadata.description).toBeUndefined();
    expect(metadata.attributes).toBeUndefined();
  });

  it("Project owner should delete metadata, and project fetch should fail afterwards", async () => {
    // Given
    const deleteDto = await createValidSubmitDTO(DeleteTokenInstanceMetadataDto, {
      tokenInstance: nftInstanceKey(),
      project
    });

    const fetchDto = await createValidDTO(FetchTokenInstanceMetadataDto, {
      tokenInstance: nftInstanceKey(),
      project
    });

    // When
    const deleteResponse = await client.assets.submitTransaction(
      "DeleteTokenInstanceMetadata",
      deleteDto.signed(user1.privateKey)
    );
    const fetchResponse = await client.assets.evaluateTransaction(
      "FetchTokenInstanceMetadata",
      fetchDto,
      TokenInstanceMetadata
    );

    // Then
    expect(deleteResponse).toEqual(transactionSuccess());
    expect(fetchResponse).toEqual(transactionErrorCode(404));
  });
});

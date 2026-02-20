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
  FeeAccelerationRateType,
  FeeCodeDefinition,
  FeeCodeDefinitionDto,
  FeeGateCodes,
  FeeProperties,
  FeePropertiesDto,
  FetchBalancesDto,
  GrantAllowanceDto,
  MintTokenDto,
  TokenAllowance,
  TokenBalance,
  TokenClassKey,
  TokenInstance,
  TokenInstanceKey,
  createValidDTO,
  createValidSubmitDTO
} from "@gala-chain/api";
import {
  AdminChainClients,
  TestClients,
  createTransferDto,
  fetchNFTInstances,
  randomize,
  transactionErrorKey,
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
    await setupTransferFees(client, user1, user2);
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
    const galaTokenDto: CreateTokenClassDto = await createValidSubmitDTO(CreateTokenClassDto, {
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
    const galaAllowanceDto = await createValidSubmitDTO(GrantAllowanceDto, {
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
    const user1MintDto = await createValidSubmitDTO(MintTokenDto, {
      owner: user1.identityKey,
      tokenClass: nftClassKey,
      quantity: new BigNumber(1)
    });

    const user2MintDto = await createValidSubmitDTO(MintTokenDto, {
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
    const user1checkResponse = await client.assets.evaluateTransaction("FetchBalances", user1BalancesDto);
    const user2checkResponse = await client.assets.evaluateTransaction("FetchBalances", user2BalancesDto);

    // Then
    expect(new BigNumber((user1checkResponse.Data ?? [])[0].instanceIds?.[0] ?? 0).isEqualTo(1)).toBe(true);
    expect(new BigNumber((user2checkResponse.Data ?? [])[0].instanceIds?.[0] ?? 0).isEqualTo(2)).toBe(true);
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

async function setupTransferFees(
  client: AdminChainClients,
  user1: ChainUser,
  user2: ChainUser
): Promise<void> {
  // Step 1: Create gala token
  const galaTokenClassKey: TokenClassKey = plainToInstance(TokenClassKey, {
    collection: "GALA",
    category: "Unit",
    type: "none",
    additionalKey: "none"
  });
  const createGalaTokenDto: CreateTokenClassDto = await createValidSubmitDTO(CreateTokenClassDto, {
    decimals: 8,
    tokenClass: galaTokenClassKey,
    name: "GALA",
    symbol: "GALA",
    description: "This is a test description!",
    isNonFungible: false,
    image: "https://app.gala.games/_nuxt/img/gala-logo_horizontal_white.8b0409c.png",
    maxSupply: new BigNumber(50000000000),
    maxCapacity: new BigNumber(50000000000)
  });
  const feeConfigDto = (
    await createValidDTO(FeePropertiesDto, {
      collection: "GALA",
      category: "Unit",
      type: "none",
      additionalKey: "none",
      instance: TokenInstance.FUNGIBLE_TOKEN_INSTANCE,
      uniqueKey: randomize("fee-config")
    })
  ).signed(client.assets.privateKey);
  const expectedResponse = plainToInstance(FeeProperties, {
    id: "galachain", // defined in chaincode/src/fees/galaFeeProperties.ts
    collection: "GALA",
    category: "Unit",
    type: "none",
    additionalKey: "none",
    instance: TokenInstance.FUNGIBLE_TOKEN_INSTANCE
  });
  const transferFeeScheduleDto = await createValidSubmitDTO(FeeCodeDefinitionDto, {
    feeCode: FeeGateCodes.TransferToken,
    feeThresholdUses: new BigNumber(0),
    feeThresholdTimePeriod: 0,
    baseQuantity: new BigNumber(1),
    maxQuantity: new BigNumber(1),
    feeAccelerationRateType: FeeAccelerationRateType.CuratorDefined,
    feeAccelerationRate: new BigNumber(1)
  });

  const createTokenResponse = await client.assets.submitTransaction<TokenClassKey>(
    "CreateTokenClass",
    createGalaTokenDto.signed(client.assets.privateKey),
    TokenClassKey
  );
  try {
    expect(createTokenResponse).toEqual(transactionSuccess(galaTokenClassKey));
  } catch (error) {
    expect(createTokenResponse).toEqual(transactionErrorKey("TOKEN_ALREADY_EXISTS"));
  }

  // Step 2: Set GALA as fee currency
  const response = await client.assets.submitTransaction<FeeProperties>(
    "SetFeeProperties",
    feeConfigDto,
    FeeProperties
  );
  expect(response).toEqual(transactionSuccess(expectedResponse));

  // Step 3: Make transfers charge GALA
  const defineTransferFeeResponse = await client.assets.submitTransaction<FeeCodeDefinition>(
    "DefineFeeSchedule",
    transferFeeScheduleDto.signed(client.assets.privateKey),
    FeeCodeDefinition
  );
  expect(defineTransferFeeResponse).toEqual(
    transactionSuccess(expect.objectContaining({ feeCode: FeeGateCodes.TransferToken }))
  );

  // Step 4: Grant users mint allowance for GALA
  const grantGalaAllowanceDto = await createValidSubmitDTO(GrantAllowanceDto, {
    tokenInstance: TokenInstanceKey.nftKey(
      galaTokenClassKey,
      TokenInstance.FUNGIBLE_TOKEN_INSTANCE
    ).toQueryKey(),
    allowanceType: AllowanceType.Mint,
    quantities: [{ user: client.assets.identityKey, quantity: new BigNumber(20) }],
    uses: new BigNumber(2)
  });
  const grantGalaAllowanceResponse = await client.assets.submitTransaction<TokenAllowance[]>(
    "GrantAllowance",
    grantGalaAllowanceDto.signed(client.assets.privateKey),
    TokenAllowance
  );
  expect(grantGalaAllowanceResponse).toEqual(
    transactionSuccess([
      expect.objectContaining({ grantedTo: client.assets.identityKey, quantity: new BigNumber(20) })
    ])
  );

  // Step 5: Ensure users have GALA balance
  const user1GalaMintDto = await createValidSubmitDTO(MintTokenDto, {
    owner: user1.identityKey,
    tokenClass: galaTokenClassKey,
    quantity: new BigNumber(10)
  });
  const user2GalaMintDto = await createValidSubmitDTO(MintTokenDto, {
    owner: user2.identityKey,
    tokenClass: galaTokenClassKey,
    quantity: new BigNumber(10)
  });
  const user1MintGalaResponse = await client.assets.submitTransaction(
    "MintToken",
    user1GalaMintDto.signed(client.assets.privateKey)
  );
  const user2MintGalaResponse = await client.assets.submitTransaction(
    "MintToken",
    user2GalaMintDto.signed(client.assets.privateKey)
  );
  expect(user1MintGalaResponse).toEqual(transactionSuccess());
  expect(user2MintGalaResponse).toEqual(transactionSuccess());

  const user1GalaBalancesDto = await createValidDTO(FetchBalancesDto, {
    collection: "GALA",
    category: "Unit",
    type: "none",
    additionalKey: "none",
    owner: user1.identityKey
  });
  const user2GalaBalancesDto = await createValidDTO(FetchBalancesDto, {
    collection: "GALA",
    category: "Unit",
    type: "none",
    additionalKey: "none",
    owner: user2.identityKey
  });
  const user1GalaBalanceResponse = await client.assets.evaluateTransaction(
    "FetchBalances",
    user1GalaBalancesDto.signed(user1.privateKey)
  );
  const user2GalaBalanceResponse = await client.assets.evaluateTransaction(
    "FetchBalances",
    user2GalaBalancesDto.signed(user2.privateKey)
  );
  expect(new BigNumber(user1GalaBalanceResponse.Data?.[0]?.quantity ?? 0).isGreaterThan(0)).toBe(true);
  expect(new BigNumber(user2GalaBalanceResponse.Data?.[0]?.quantity ?? 0).isGreaterThan(0)).toBe(true);
}

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
  TokenClassKey,
  TokenInstance,
  TokenInstanceKey,
  createValidDTO,
  createValidSubmitDTO
} from "@gala-chain/api";
import { AdminChainClients, randomize, transactionErrorKey, transactionSuccess } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

export async function setupTransferFees(client: AdminChainClients, users: ChainUser[]): Promise<void> {
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
    quantities: [{ user: client.assets.identityKey, quantity: new BigNumber(users.length * 10) }],
    uses: new BigNumber(users.length)
  });
  const grantGalaAllowanceResponse = await client.assets.submitTransaction<TokenAllowance[]>(
    "GrantAllowance",
    grantGalaAllowanceDto.signed(client.assets.privateKey),
    TokenAllowance
  );
  expect(grantGalaAllowanceResponse).toEqual(
    transactionSuccess([
      expect.objectContaining({
        grantedTo: client.assets.identityKey,
        quantity: new BigNumber(users.length * 10)
      })
    ])
  );

  // Step 5: Ensure users have GALA balance
  for (const user of users) {
    const galaMintDto = await createValidSubmitDTO(MintTokenDto, {
      owner: user.identityKey,
      tokenClass: galaTokenClassKey,
      quantity: new BigNumber(10)
    });
    const mintGalaResponse = await client.assets.submitTransaction(
      "MintToken",
      galaMintDto.signed(client.assets.privateKey)
    );
    expect(mintGalaResponse).toEqual(transactionSuccess());

    const userGalaBalancesDto = await createValidDTO(FetchBalancesDto, {
      collection: "GALA",
      category: "Unit",
      type: "none",
      additionalKey: "none",
      owner: user.identityKey
    });
    const userGalaBalanceResponse = await client.assets.evaluateTransaction(
      "FetchBalances",
      userGalaBalancesDto.signed(user.privateKey)
    );
    expect(new BigNumber(userGalaBalanceResponse.Data?.[0]?.quantity ?? 0).isGreaterThan(0)).toBe(true);
  }
}

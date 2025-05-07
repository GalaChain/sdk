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
  CreatePoolDto,
  DexFeeConfig,
  DexFeePercentageTypes,
  DexNftBatchLimit,
  GalaChainResponse,
  Pool,
  TokenBalance,
  TokenClass,
  TokenClassKey,
  TokenInstance,
  createValidDTO
} from "@gala-chain/api";
import { currency, dex, fixture, users, writesMap } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import { DexV3Contract } from "../__test__/DexV3Contract";
import { GalaChainContext } from "../types";

describe("createPool", () => {
  it("should create a new liquidity pool and save it on-chain", async () => {
    const currencyInstance: TokenInstance = currency.tokenInstance();
    const currencyClass: TokenClass = currency.tokenClass();
    const currencyClassKey: TokenClassKey = currency.tokenClassKey();
    const currencyBalance: TokenBalance = currency.tokenBalance();

    const dexInstance: TokenInstance = dex.tokenInstance();
    const dexClass: TokenClass = dex.tokenClass();
    const dexClassKey: TokenClassKey = dex.tokenClassKey();
    const dexBalance: TokenBalance = dex.tokenBalance();

    const dexFeeConfig: DexFeeConfig = new DexFeeConfig([users.testAdminId], 2);

    const { ctx, contract, callingChainUser } = fixture<GalaChainContext, DexV3Contract>(DexV3Contract)
      .callingUser(users.testUser1Id)
      .savedState(
        currencyInstance,
        currencyClass,
        currencyBalance,
        dexFeeConfig,
        dexInstance,
        dexClass,
        dexBalance
      )
      .savedRangeState([]);

    const dto = new CreatePoolDto(
      dexClassKey,
      currencyClassKey,
      DexFeePercentageTypes.FEE_1_PERCENT,
      new BigNumber("1"),
      1
    );

    const expectedResponse = new Pool(
      dexClassKey.toStringKey(),
      currencyClassKey.toStringKey(),
      dexClassKey,
      currencyClassKey,
      DexFeePercentageTypes.FEE_1_PERCENT,
      new BigNumber("1"),
      dexFeeConfig.protocolFee
    );

    // When
    const response = await contract.CreatePool(ctx, dto);

    // Then
    expect(response).toEqual(GalaChainResponse.Success(expectedResponse));
  });

  it("should create a new liquidity pool and save it on-chain", async () => {
    const token0Properties = {
      collection: "GALA",
      category: "Unit",
      type: "none",
      additionalKey: "none"
    };
    const token1Properties = {
      collection: "Token",
      category: "Unit",
      type: "TENDEXT",
      additionalKey: "client:6337024724eec8c292f0118d"
    };
    const currencyClassKey: TokenClassKey = plainToInstance(TokenClassKey, token0Properties);
    const currencyClass: TokenClass = plainToInstance(TokenClass, currencyClassKey);

    const dexClass: TokenClass = plainToInstance(TokenClass, token1Properties);
    const dexClassKey: TokenClassKey = plainToInstance(TokenClassKey, token1Properties);

    const dexFeeConfig: DexFeeConfig = new DexFeeConfig([users.testAdminId], 2);
    const dexNftBatch: DexNftBatchLimit = new DexNftBatchLimit(new BigNumber("0"));

    const { ctx, contract, writes } = fixture<GalaChainContext, DexV3Contract>(DexV3Contract)
      .callingUser(users.testUser1Id)
      .savedState(currencyClass, dexFeeConfig, dexNftBatch, dexClass)
      .savedRangeState([]);

    const dto = new CreatePoolDto(
      currencyClassKey,
      dexClassKey,
      DexFeePercentageTypes.FEE_0_05_PERCENT,
      new BigNumber("1")
    );

    const expectedResponse = new Pool(
      currencyClassKey.toStringKey(),
      dexClassKey.toStringKey(),
      currencyClassKey,
      dexClassKey,
      DexFeePercentageTypes.FEE_0_05_PERCENT,
      new BigNumber("1"),
      dexFeeConfig.protocolFee
    );

    // When
    const response = await contract.CreatePool(ctx, dto);

    // Then
    expect(response).toEqual(GalaChainResponse.Success(expectedResponse));
    // todo: verify some expected writes with writesMap
    // expect(writes).toEqual([]);
  });
});

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
import { BigNumber } from "bignumber.js";
import { plainToInstance } from "class-transformer";

import { DexFeePercentageTypes } from "./DexDtos";
import { DexPositionData } from "./DexPositionData";
import { Pool } from "./DexV3Pool";
import { TickData } from "./TickData";
import { TokenClassKey } from "./TokenClass";

const tokenClass0Properties = {
  collection: "TEST",
  category: "Token",
  type: "Zero",
  additionalKey: "none"
};

const tokenClass1Properties = {
  collection: "TEST",
  category: "Token",
  type: "One",
  additionalKey: "none"
};

describe("DexV3Pool", () => {
  it("should fail to validate the pool when token class keys are missing proerpties", async () => {
    // Given
    const token0 = "some token key";
    const token1 = "token1 string key";
    const token0ClassKey = new TokenClassKey();
    const token1ClassKey = new TokenClassKey();
    const fee = DexFeePercentageTypes.FEE_1_PERCENT;
    const initialSqrtPrice = new BigNumber("1");

    // When
    const pool = new Pool(token0, token1, token0ClassKey, token1ClassKey, fee, initialSqrtPrice);
    const validationResult = await pool.validate();
    // Then
    expect(validationResult.length).toBeGreaterThan(0);
  });

  it("should validate the pool when token class keys contain all properties", async () => {
    // Given
    const token0 = "some token key";
    const token1 = "token1 string key";
    const token0ClassKey = plainToInstance(TokenClassKey, tokenClass0Properties);
    const token1ClassKey = plainToInstance(TokenClassKey, tokenClass1Properties);
    const fee = DexFeePercentageTypes.FEE_1_PERCENT;
    const initialSqrtPrice = new BigNumber("1");

    // When
    const pool = new Pool(token0, token1, token0ClassKey, token1ClassKey, fee, initialSqrtPrice);
    const validationResult = await pool.validate();
    // Then
    expect(validationResult).toEqual([]);
  });

  it("should validate the pool with more complex properties", async () => {
    // Given
    const token0 = "some token key";
    const token1 = "token1 string key";
    const token0ClassKey = plainToInstance(TokenClassKey, tokenClass0Properties);
    const token1ClassKey = plainToInstance(TokenClassKey, tokenClass1Properties);
    const fee = DexFeePercentageTypes.FEE_1_PERCENT;
    const initialSqrtPrice = new BigNumber("1");

    const bitmap: Record<string, string> = { 1: "test 1", test: "test 2" };

    const pool = new Pool(token0, token1, token0ClassKey, token1ClassKey, fee, initialSqrtPrice);

    pool.bitmap = bitmap;
    pool.liquidity = new BigNumber("1");
    pool.feeGrowthGlobal0 = new BigNumber("1");
    pool.feeGrowthGlobal1 = new BigNumber("1");
    pool.maxLiquidityPerTick = new BigNumber("1");
    pool.tickSpacing = 1;
    pool.protocolFees = 1;
    pool.protocolFeesToken0 = new BigNumber("1");
    pool.protocolFeesToken1 = new BigNumber("1");

    // When
    const validationResult = await pool.validate();
    // Then
    expect(validationResult).toEqual([]);
  });

  test("pool.mint", async () => {
    // Given
    const token0 = "some token key";
    const token1 = "token1 string key";
    const token0ClassKey = plainToInstance(TokenClassKey, tokenClass0Properties);
    const token1ClassKey = plainToInstance(TokenClassKey, tokenClass1Properties);
    const fee = DexFeePercentageTypes.FEE_1_PERCENT;
    const initialSqrtPrice = new BigNumber("1");

    const position1 = new DexPositionData(
      "test poolHash",
      "test position id",
      100,
      1,
      token0ClassKey,
      token1ClassKey,
      fee
    );

    const tickData1 = plainToInstance(TickData, {
      poolHash: "test poolHash",
      tick: 1,
      liquidityGross: new BigNumber("100"),
      initialised: true,
      liquidityNet: new BigNumber("100"),
      feeGrowthOutside0: new BigNumber("1"),
      feeGrowthOutside1: new BigNumber("1")
    });

    const tickData2 = plainToInstance(TickData, {
      ...tickData1,
      tick: 2
    });

    const pool = new Pool(token0, token1, token0ClassKey, token1ClassKey, fee, initialSqrtPrice);

    pool.bitmap = { ...{ "1": "1" } };
    pool.liquidity = new BigNumber("1000000");
    pool.feeGrowthGlobal0 = new BigNumber("1");
    pool.feeGrowthGlobal1 = new BigNumber("1");
    pool.maxLiquidityPerTick = new BigNumber("100000");
    pool.protocolFees = 1;
    pool.protocolFeesToken0 = new BigNumber("1");
    pool.protocolFeesToken1 = new BigNumber("1");

    // When
    const [amount0, amount1] = pool.mint(position1, tickData1, tickData2, new BigNumber("1").f18());

    const validationResult = await pool.validate();

    // Then
    expect(validationResult).toEqual([]);
    expect(amount0).toEqual(new BigNumber("0.00004999375068752344"));
    expect(amount1).toEqual(new BigNumber("0"));
  });
});

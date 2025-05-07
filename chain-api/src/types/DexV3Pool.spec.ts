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

import { Bitmap, PositionData, Positions, TickData, TickDataObj } from "../utils";
import { DexFeePercentageTypes } from "./DexDtos";
import { Pool } from "./DexV3Pool";
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
  it("should create a pool", () => {
    // Given
    const token0 = "some token key";
    const token1 = "token1 string key";
    const token0ClassKey = new TokenClassKey();
    const token1ClassKey = new TokenClassKey();
    const fee = DexFeePercentageTypes.FEE_1_PERCENT;
    const initialSqrtPrice = new BigNumber("1");

    // When
    const pool = new Pool(token0, token1, token0ClassKey, token1ClassKey, fee, initialSqrtPrice);

    // Then
    expect(pool).toBeDefined();
  });

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
    expect(pool).toBeDefined();
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
    expect(pool).toBeDefined();
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

    const position1 = plainToInstance(PositionData, {
      poolAddrKey: "test poolAddrKey",
      tickUpper: "test tickUpper",
      tickLower: "test tickLower",
      liquidity: "test liquidity",
      feeGrowthInside0Last: "test feeGrowthInside0Last",
      feeGrowthInside1Last: "test feeGrowthInside1Last",
      tokensOwed0: "test tokensOwed0",
      tokensOwed1: "test tokensOwed1",
      nftId: "test nftId"
    });

    const positions: Positions = {
      [position1.nftId]: position1
    };

    const bitmap = plainToInstance(Bitmap, { 1: "test 1", test: "test 2" });

    const tickData1 = plainToInstance(TickData, {
      liquidityGross: "test liquidityGross",
      initialised: true,
      liquidityNet: "test liquidityNet",
      feeGrowthOutside0: "test feeGrowthOutside0",
      feeGrowthOutside1: "test feeGrowthOutside1"
    });

    const tickDataIdx = plainToInstance(TickDataObj, { test: tickData1 });

    const pool = new Pool(token0, token1, token0ClassKey, token1ClassKey, fee, initialSqrtPrice);

    pool.positions = positions;
    pool.bitmap = bitmap;
    pool.tickData = tickDataIdx;
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
    expect(pool).toBeDefined();
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

    const position1 = plainToInstance(PositionData, {
      poolAddrKey: "test poolAddrKey",
      tickUpper: "100",
      tickLower: "1",
      liquidity: "100000",
      feeGrowthInside0Last: "test feeGrowthInside0Last",
      feeGrowthInside1Last: "test feeGrowthInside1Last",
      tokensOwed0: "test tokensOwed0",
      tokensOwed1: "test tokensOwed1",
      nftId: "test nftId"
    });

    const positions: Positions = {
      [position1.nftId]: position1
    };

    const bitmap = plainToInstance(Bitmap, { 1: "test 1", test: "test 2" });

    const tickData1 = plainToInstance(TickData, {
      liquidityGross: "test liquidityGross",
      initialised: true,
      liquidityNet: "test liquidityNet",
      feeGrowthOutside0: "test feeGrowthOutside0",
      feeGrowthOutside1: "test feeGrowthOutside1"
    });

    const tickDataIdx = plainToInstance(TickDataObj, { test: tickData1 });

    const pool = new Pool(token0, token1, token0ClassKey, token1ClassKey, fee, initialSqrtPrice);

    pool.positions = { ...positions };
    pool.bitmap = { ...{ "1": "1" } };
    pool.tickData = { ...tickDataIdx };
    pool.liquidity = new BigNumber("1000000");
    pool.feeGrowthGlobal0 = new BigNumber("1");
    pool.feeGrowthGlobal1 = new BigNumber("1");
    pool.maxLiquidityPerTick = new BigNumber("100000");
    pool.tickSpacing = 1;
    pool.protocolFees = 1;
    pool.protocolFeesToken0 = new BigNumber("1");
    pool.protocolFeesToken1 = new BigNumber("1");

    // When
    const [amount0, amount1] = pool.mint(
      position1.nftId,
      parseInt(position1.tickLower.toString()),
      parseInt(position1.tickUpper.toString()),
      new BigNumber("1").f18()
    );

    const [newPosition1, newPosition2] = pool.mint(
      "new position nft id",
      10,
      2000,
      new BigNumber("1000").f18()
    );

    const validationResult = await pool.validate();
    // Then
    expect(pool).toBeDefined();
    expect(amount0).toBeDefined();
    expect(amount1).toBeDefined();
    expect(newPosition1).toBeDefined();
    expect(newPosition2).toBeDefined();
    expect(validationResult).toEqual([]);
  });
});

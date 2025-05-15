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
import { ChainError, ErrorCode, GetTickDataDto, TickData } from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { GalaChainContext } from "../types";
import { getObjectByKey, putChainObject } from "../utils";

/**
 * Fetches TickData objects for the given tickLower and tickUpper values.
 * If the data does not exist on-chain, new default TickData instances are created instead.
 *
 * @param ctx - The GalaChain context used to access the ledger
 * @param poolHash - Unique identifier for the liquidity pool
 * @param tickLower - Lower tick boundary
 * @param tickUpper - Upper tick boundary
 * @returns An object containing tickLowerData and tickUpperData
 */
export async function fetchOrCreateTickDataPair(
  ctx: GalaChainContext,
  poolHash: string,
  tickLower: number,
  tickUpper: number
): Promise<{ tickUpperData: TickData; tickLowerData: TickData }> {
  // Try to get tickUpper from chain; fallback to default if not found
  const tickUpperKey = ctx.stub.createCompositeKey(TickData.INDEX_KEY, [poolHash, tickUpper.toString()]);
  const tickUpperData = await getObjectByKey(ctx, TickData, tickUpperKey).catch((e) => {
    const chainError = ChainError.from(e);
    if (chainError.matches(ErrorCode.NOT_FOUND)) {
      return new TickData(poolHash, tickUpper); // Create default if missing
    } else {
      throw chainError;
    }
  });

  // Try to get tickLower from chain; fallback to default if not found
  const tickLowerKey = ctx.stub.createCompositeKey(TickData.INDEX_KEY, [poolHash, tickLower.toString()]);
  const tickLowerData = await getObjectByKey(ctx, TickData, tickLowerKey).catch((e) => {
    const chainError = ChainError.from(e);
    if (chainError.matches(ErrorCode.NOT_FOUND)) {
      return new TickData(poolHash, tickLower); // Create default if missing
    } else {
      throw chainError;
    }
  });

  return { tickUpperData, tickLowerData };
}

/**
 * Fetches an existing tick from the chain or creates it if not found, then crosses the tick.
 *
 * @param ctx - The GalaChain context for accessing the ledger.
 * @param poolHash - Unique identifier for the liquidity pool.
 * @param tick - The tick index to fetch or create.
 * @param feeGrowthGlobal0 - Global fee growth for token 0.
 * @param feeGrowthGlobal1 - Global fee growth for token 1.
 * @returns The net change in liquidity after crossing the tick.
 */
export async function fetchOrCreateAndCrossTick(
  ctx: GalaChainContext,
  poolHash: string,
  tick: number,
  feeGrowthGlobal0: BigNumber,
  feeGrowthGlobal1: BigNumber
): Promise<BigNumber> {
  // Try to get tickLower from chain; fallback to default if not found
  const tickKey = ctx.stub.createCompositeKey(TickData.INDEX_KEY, [poolHash, tick.toString()]);
  const tickData = await getObjectByKey(ctx, TickData, tickKey).catch((e) => {
    const chainError = ChainError.from(e);
    if (chainError.matches(ErrorCode.NOT_FOUND)) {
      return new TickData(poolHash, tick); // Create default if missing
    } else {
      throw chainError;
    }
  });

  // Cross the tick and calculate the net liquidity change
  const liquidityNet = tickData.tickCross(feeGrowthGlobal0, feeGrowthGlobal1);
  await putChainObject(ctx, tickData);

  return liquidityNet;
}

export async function getTickData(ctx: GalaChainContext, dto: GetTickDataDto): Promise<TickData> {
  const tickKey = ctx.stub.createCompositeKey(TickData.INDEX_KEY, [dto.poolHash, dto.tick.toString()]);
  const tickData = await getObjectByKey(ctx, TickData, tickKey);
  return tickData;
}

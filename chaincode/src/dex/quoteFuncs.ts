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
  ConflictError,
  NotFoundError,
  Pool,
  QuoteExactAmountDto,
  QuoteExactAmountResDto,
  SwapState,
  ValidationFailedError,
  sqrtPriceToTick
} from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { fetchOrCreateBalance } from "../balances";
import { GalaChainContext } from "../types";
import { getObjectByKey } from "../utils";
import { getTokenDecimalsFromPool, roundTokenAmount, validateTokenOrder } from "./dexUtils";
import { processSwapSteps } from "./swap.helper";

/**
 * @dev The quoteExactAmount function calculates the required amount of the other token for a swap or liquidity addition in a Dex pool within the GalaChain ecosystem.
 * @param ctx GalaChainContext – The execution context providing access to the GalaChain environment.
 * @param dto QuoteExactAmountDto – A data transfer object containing:
  - Input token details – Specifies which token and amount are being provided.
  - Trade direction – Determines whether the quote is for token0 → token1 or token1 → token0.
  -  Pool state parameters – Includes information such as current tick and fee tier
 * @returns Promise<{ amount0: string; amount1: string; sqrtPriceLimit: string }> – A response object containing:
  - amount0 – The calculated amount of token0 required for the trade.
  - amount1 – The calculated amount of token1 required for the trade.
  - sqrtPriceLimit – The square root price limit after the swap or liquidity operation.
 */
export async function quoteExactAmount(
  ctx: GalaChainContext,
  dto: QuoteExactAmountDto
): Promise<QuoteExactAmountResDto> {
  // Ensure tokens are ordered consistently
  const [token0, token1] = validateTokenOrder(dto.token0, dto.token1);

  const zeroForOne = dto.zeroForOne;

  // Generate pool key from tokens and fee tier
  const key = ctx.stub.createCompositeKey(Pool.INDEX_KEY, [token0, token1, dto.fee.toString()]);
  const pool = await getObjectByKey(ctx, Pool, key);
  if (pool == undefined) throw new NotFoundError("Pool does not exist");

  // Define square root price limit as the maximum possible value in trade direction for estimation purposes
  const sqrtPriceLimit = zeroForOne
    ? new BigNumber("0.000000000000000000054212147")
    : new BigNumber("18446050999999999999");

  const currentSqrtPrice = pool.sqrtPrice;

  const amountSpecified = dto.amount.f18();
  if (amountSpecified.isEqualTo(0)) {
    throw new ValidationFailedError("Invalid specified amount");
  }

  // Prepare slot0 state from the pool (current price, tick, liquidity)
  const slot0 = {
    sqrtPrice: new BigNumber(pool.sqrtPrice),
    tick: sqrtPriceToTick(pool.sqrtPrice),
    liquidity: new BigNumber(pool.liquidity)
  };

  // Initialize swap state for computation
  const state: SwapState = {
    amountSpecifiedRemaining: amountSpecified,
    amountCalculated: new BigNumber(0),
    sqrtPrice: new BigNumber(pool.sqrtPrice),
    tick: slot0.tick,
    liquidity: new BigNumber(slot0.liquidity),
    feeGrowthGlobalX: zeroForOne ? pool.feeGrowthGlobal0 : pool.feeGrowthGlobal1,
    protocolFee: new BigNumber(0)
  };

  // Determine if it's exact input (positive amount) or exact output (negative)
  const exactInput = amountSpecified.isGreaterThan(0);

  // Swap steps until input amount is consumed or price limit hit and apply to pool state
  await processSwapSteps(ctx, state, pool, sqrtPriceLimit, exactInput, zeroForOne);
  const [amount0, amount1] = pool.swap(zeroForOne, state, amountSpecified);
  const [token0Decimal, token1Decimal] = await getTokenDecimalsFromPool(ctx, pool);
  const roundedToken0Amount = roundTokenAmount(amount0, token0Decimal);
  const roundedToken1Amount = roundTokenAmount(amount1, token1Decimal);

  // Check whether pool has enough liquidity to carry out this operation
  if (roundedToken0Amount.isNegative()) {
    const poolTokenBalance = await fetchOrCreateBalance(ctx, pool.getPoolAlias(), pool.token0ClassKey);
    if (poolTokenBalance.getQuantityTotal().isLessThan(roundedToken0Amount.abs())) {
      throw new ConflictError("Not enough liquidity available in pool");
    }
  } else {
    const poolTokenBalance = await fetchOrCreateBalance(ctx, pool.getPoolAlias(), pool.token1ClassKey);
    if (poolTokenBalance.getQuantityTotal().isLessThan(roundedToken1Amount.abs())) {
      throw new ConflictError("Not enough liquidity available in pool");
    }
  }

  // Return quote response including price movement
  const newSqrtPrice = pool.sqrtPrice;
  return new QuoteExactAmountResDto(roundedToken0Amount, roundedToken1Amount, currentSqrtPrice, newSqrtPrice);
}

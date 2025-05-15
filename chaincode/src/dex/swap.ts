/*
 * Copyright (c) Gala Games Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use pool file except in compliance with the License.
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
  Pool,
  SlippageToleranceExceededError,
  SwapDto,
  SwapResDto,
  SwapState,
  TokenInstanceKey,
  ValidationFailedError,
  sqrtPriceToTick
} from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { fetchOrCreateBalance } from "../balances";
import { fetchTokenClass } from "../token";
import { transferToken } from "../transfer";
import { GalaChainContext } from "../types";
import { getObjectByKey, putChainObject } from "../utils";
import { roundTokenAmount, validateTokenOrder } from "./dexUtils";
import { processSwapSteps } from "./swap.helper";

/**
 * @dev The swap function executes a token swap in a Uniswap V3-like liquidity pool within the GalaChain ecosystem.
 * @param ctx GalaChainContext – The execution context providing access to the GalaChain environment.
 * @param dto SwapDto – A data transfer object containing:
  - tokenIn – The input token being swapped.
  - amountIn – The amount of tokenIn provided for the swap.
  - amountInMaximum – The amount of tokenIn provided for the swap.
  - tokenOut – The token the user wants to receive.
  - amountOutMinimum- pool amount token user want to receive Minimum;
  - zeroForOne - Boolean value for swap direction
  - Pool Identifiers – Identifier for the liquidity pool facilitating the swap.
  - sqrtPriceLimit – The square root price limit to protect against excessive price impact.
 * @returns 
 */
export async function swap(ctx: GalaChainContext, dto: SwapDto): Promise<SwapResDto> {
  const [token0, token1] = validateTokenOrder(dto.token0, dto.token1);
  const zeroForOne = dto.zeroForOne;
  const sqrtPriceLimit = dto.sqrtPriceLimit;

  const key = ctx.stub.createCompositeKey(Pool.INDEX_KEY, [token0, token1, dto.fee.toString()]);
  const pool = await getObjectByKey(ctx, Pool, key);

  // Validate sqrtPriceLimit and input amount
  if (zeroForOne) {
    if (
      !(
        sqrtPriceLimit.isLessThan(pool.sqrtPrice) &&
        sqrtPriceLimit.isGreaterThan(new BigNumber("0.000000000000000000054212146"))
      )
    )
      throw new SlippageToleranceExceededError("SquarePriceLImit exceeds limit");
  } else {
    if (
      !(
        sqrtPriceLimit.isGreaterThan(pool.sqrtPrice) &&
        sqrtPriceLimit.isLessThan(new BigNumber("18446051000000000000"))
      )
    )
      throw new SlippageToleranceExceededError("SquarePriceLImit exceeds limit");
  }
  const amountSpecified = dto.amount;

  if (amountSpecified.isEqualTo(0)) throw new ValidationFailedError("Invalid specified amount");

  const slot0 = {
    sqrtPrice: new BigNumber(pool.sqrtPrice),
    tick: sqrtPriceToTick(pool.sqrtPrice),
    liquidity: new BigNumber(pool.liquidity)
  };

  const state: SwapState = {
    amountSpecifiedRemaining: amountSpecified,
    amountCalculated: new BigNumber(0),
    sqrtPrice: new BigNumber(pool.sqrtPrice),
    tick: slot0.tick,
    liquidity: new BigNumber(slot0.liquidity),
    feeGrowthGlobalX: zeroForOne ? pool.feeGrowthGlobal0 : pool.feeGrowthGlobal1,
    protocolFee: new BigNumber(0)
  };

  const exactInput = amountSpecified.isGreaterThan(0);

  //swap till the amount specified for the swap is completely exhausted
  await processSwapSteps(ctx, state, pool, sqrtPriceLimit, exactInput, zeroForOne);

  const amounts = pool.swap(zeroForOne, state, amountSpecified);
  const poolAlias = pool.getPoolAlias();

  //create tokenInstanceKeys
  const tokenInstanceKeys = [pool.token0ClassKey, pool.token1ClassKey].map(TokenInstanceKey.fungibleKey);

  //fetch token classes
  const tokenClasses = await Promise.all(tokenInstanceKeys.map((key) => fetchTokenClass(ctx, key)));

  for (const [index, amount] of amounts.entries()) {
    if (amount.gt(0)) {
      if (dto.amountInMaximum && amount.gt(dto.amountInMaximum)) {
        throw new SlippageToleranceExceededError(
          `Slippage tolerance exceeded: maximum allowed tokens (${dto.amountInMaximum}) is less than required amount (${amount}).`
        );
      }

      await transferToken(ctx, {
        from: ctx.callingUser,
        to: poolAlias,
        tokenInstanceKey: tokenInstanceKeys[index],
        quantity: roundTokenAmount(amount, tokenClasses[index].decimals),
        allowancesToUse: [],
        authorizedOnBehalf: undefined
      });
    }
    if (amount.lt(0)) {
      if (dto.amountOutMinimum && amount.gt(dto.amountOutMinimum)) {
        throw new SlippageToleranceExceededError(
          `Slippage tolerance exceeded: minimum received tokens (${dto.amountInMaximum}) is less than actual received amount (${amount}).`
        );
      }

      const poolTokenBalance = await fetchOrCreateBalance(
        ctx,
        poolAlias,
        tokenInstanceKeys[index].getTokenClassKey()
      );
      const roundedAmount = new BigNumber(amount.toFixed(tokenClasses[index].decimals)).abs();
      if (poolTokenBalance.getQuantityTotal().isGreaterThan(roundedAmount)) {
        throw new ConflictError("Not enough liquidity available in pool");
      }

      await transferToken(ctx, {
        from: poolAlias,
        to: ctx.callingUser,
        tokenInstanceKey: tokenInstanceKeys[index],
        quantity: roundedAmount,
        allowancesToUse: [],
        authorizedOnBehalf: {
          callingOnBehalf: poolAlias,
          callingUser: poolAlias
        }
      });
    }
  }

  const response = new SwapResDto(
    tokenClasses[0].symbol,
    tokenClasses[0].image,
    tokenClasses[1].symbol,
    tokenClasses[1].image,
    amounts[0].toFixed(tokenClasses[0].decimals),
    amounts[1].toFixed(tokenClasses[1].decimals),
    ctx.callingUser,
    ctx.txUnixTime
  );

  await putChainObject(ctx, pool);
  return response;
}

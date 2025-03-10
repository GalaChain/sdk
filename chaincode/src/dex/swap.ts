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
import { ConflictError, Pool, SlippageToleranceExceededError, SwapDto, SwapResDto } from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { fetchOrCreateBalance } from "../balances";
import { fetchTokenClass } from "../token";
import { transferToken } from "../transfer";
import { GalaChainContext } from "../types";
import {
  convertToTokenInstanceKey,
  genKey,
  getObjectByKey,
  putChainObject,
  validateTokenOrder,
  virtualAddress
} from "../utils";

/**
 * @dev The swap function executes a token swap in a Uniswap V3-like liquidity pool within the GalaChain ecosystem.
 * @param ctx GalaChainContext – The execution context providing access to the GalaChain environment.
 * @param dto SwapDto – A data transfer object containing:
  - tokenIn – The input token being swapped.
  - amountIn – The amount of tokenIn provided for the swap.
  - amountInMaximum – The amount of tokenIn provided for the swap.
  - tokenOut – The token the user wants to receive.
  - amountOutMinimum- This amount token user want to receive Minimum;
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

  //If pool does not exist
  if (pool == undefined) throw new ConflictError("Pool does not exist");

  const amounts = pool.swap(zeroForOne, dto.amount, sqrtPriceLimit);
  const poolAddrKey = genKey(pool.token0, pool.token1, pool.fee.toString());
  const poolVirtualAddress = virtualAddress(poolAddrKey);

  //create tokenInstanceKeys
  const tokenInstanceKeys = [pool.token0ClassKey, pool.token1ClassKey].map(convertToTokenInstanceKey);

  //fetch token classes
  const tokenClasses = await Promise.all(tokenInstanceKeys.map((key) => fetchTokenClass(ctx, key)));

  for (const [index, amount] of amounts.entries()) {
    if (amount.gt(0)) {
      if (dto.amountInMaximum && amount.gt(dto.amountInMaximum)) throw new SlippageToleranceExceededError("Slippage exceeded");

      await transferToken(ctx, {
        from: ctx.callingUser,
        to: poolVirtualAddress,
        tokenInstanceKey: tokenInstanceKeys[index],
        quantity: new BigNumber(amount.toFixed(tokenClasses[index].decimals)),
        allowancesToUse: [],
        authorizedOnBehalf: undefined
      });
    }
    if (amount.lt(0)) {
      if (dto.amountOutMinimum && amount.gt(dto.amountOutMinimum))
        throw new SlippageToleranceExceededError("Slippage exceeded");

      const poolTokenBalance = await fetchOrCreateBalance(
        ctx,
        poolVirtualAddress,
        tokenInstanceKeys[index].getTokenClassKey()
      );
      const roundedAmount = BigNumber.min(
        new BigNumber(amount.toFixed(tokenClasses[index].decimals)).abs(),
        poolTokenBalance.getQuantityTotal()
      );
      await transferToken(ctx, {
        from: poolVirtualAddress,
        to: ctx.callingUser,
        tokenInstanceKey: tokenInstanceKeys[index],
        quantity: roundedAmount,
        allowancesToUse: [],
        authorizedOnBehalf: {
          callingOnBehalf: poolVirtualAddress,
          callingUser: poolVirtualAddress
        }
      });
    }
  }

  const response = new SwapResDto(
    tokenClasses[0].symbol,
    tokenClasses[0].image,
    tokenClasses[1].symbol,
    tokenClasses[1].image,
    amounts[0].toFixed(tokenClasses[0].decimals).toString(),
    amounts[1].toFixed(tokenClasses[1].decimals).toString(),
    ctx.callingUser,
    ctx.txUnixTime
  );

  await putChainObject(ctx, pool);
  return response;
}

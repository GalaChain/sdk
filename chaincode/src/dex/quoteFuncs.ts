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
import { ConflictError, Pool, QuoteExactAmountDto, QuoteExactAmountResDto } from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { GalaChainContext } from "../types";
import { getObjectByKey, validateTokenOrder } from "../utils";

/**
 * @dev The quoteExactAmount function calculates the required amount of the other token for a swap or liquidity addition in a Uniswap V3 pool within the GalaChain ecosystem.
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
  const [token0, token1] = validateTokenOrder(dto.token0, dto.token1);

  const zeroForOne = dto.zeroForOne;

  const key = ctx.stub.createCompositeKey(Pool.INDEX_KEY, [token0, token1, dto.fee.toString()]);
  const pool = await getObjectByKey(ctx, Pool, key);
  if (pool == undefined) throw new ConflictError("Pool does not exist");

  const currentSqrtPrice = pool.sqrtPrice;
  const amounts = pool.swap(
    zeroForOne,
    dto.amount.f18(),
    zeroForOne ? new BigNumber("0.000000000000000000054212147") : new BigNumber("18446050999999999999")
  );
  const newSqrtPrice = pool.sqrtPrice;
  return new QuoteExactAmountResDto(amounts[0], amounts[1], currentSqrtPrice, newSqrtPrice);
}

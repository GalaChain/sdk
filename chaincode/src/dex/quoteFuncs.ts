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
import { ConflictError, Pool, QuoteExactAmountDto, formatBigNumber } from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { GalaChainContext } from "../types";
import { getObjectByKey, validateTokenOrder } from "../utils";

export async function quoteExactAmount(
  ctx: GalaChainContext,
  dto: QuoteExactAmountDto
): Promise<[amount0: string, amount1: string, sqrtPriceLimit: string]> {
  const [token0, token1] = validateTokenOrder(dto.token0, dto.token1);

  const zeroForOne = dto.zeroForOne;

  const key = ctx.stub.createCompositeKey(Pool.INDEX_KEY, [token0, token1, dto.fee.toString()]);
  const pool = await getObjectByKey(ctx, Pool, key);
  if (pool == undefined) throw new ConflictError("Pool does not exist");

  let currentSqrtPrice = pool.sqrtPrice;
  const amounts = pool.swap(
    zeroForOne,
    dto.amount.f18(),
    zeroForOne ? new BigNumber("0.000000000000000000054212147") : new BigNumber("18446050999999999999")
  );
  let newSqrtPrice = pool.sqrtPrice;

  return formatBigNumber([...amounts, currentSqrtPrice, newSqrtPrice]);
}

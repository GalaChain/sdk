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
import { BurnDto, ConflictError, Pool, formatBigNumber } from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { getObjectByKey, validateTokenOrder } from "../utils";

/**
 * @dev The getRemoveLiquidityEstimation function estimates the amount of tokens a user will receive when removing liquidity from a Uniswap V3 pool within the GalaChain ecosystem. It calculates the expected token amounts based on the user's liquidity position and market conditions.
 * @param ctx GalaChainContext – The execution context providing access to the GalaChain environment.
 * @param dto BurnDto – A data transfer object containing details of the liquidity position to be removed, including pool information, token amounts, and position ID.
 * @returns array with estimated value recieved after burning the positions
 */
export async function getRemoveLiquidityEstimation(ctx: GalaChainContext, dto: BurnDto): Promise<String[]> {
  const [token0, token1] = validateTokenOrder(dto.token0, dto.token1);

  const key = ctx.stub.createCompositeKey(Pool.INDEX_KEY, [token0, token1, dto.fee.toString()]);
  const pool = await getObjectByKey(ctx, Pool, key);

  //If pool does not exist
  if (pool == undefined) throw new ConflictError("Pool does not exist");

  let tickLower = parseInt(dto.tickLower.toString()),
    tickUpper = parseInt(dto.tickUpper.toString());
  const amounts = pool.burn(ctx.callingUser, tickLower, tickUpper, dto.amount.f18());

  return formatBigNumber(amounts);
}

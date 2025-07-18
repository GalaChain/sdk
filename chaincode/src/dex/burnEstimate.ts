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
import { BurnEstimateDto, GetRemoveLiqEstimationResDto, Pool, f18 } from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { GalaChainContext } from "../types";
import { getObjectByKey } from "../utils";
import { getTokenDecimalsFromPool, validateTokenOrder } from "./dexUtils";
import { fetchUserPositionInTickRange } from "./position.helper";
import { fetchOrCreateTickDataPair } from "./tickData.helper";

/**
 * @dev The getRemoveLiquidityEstimation function estimates the amount of tokens a user will receive when removing liquidity from a Decentralized exchange pool within the GalaChain ecosystem. It calculates the expected token amounts based on the user's liquidity position and market conditions.
 * @param ctx GalaChainContext – The execution context providing access to the GalaChain environment.
 * @param dto BurnEstimateDto – A data transfer object containing details of the liquidity position to be removed, including pool information, token amounts, and position ID.
 * @returns array with estimated value recieved after burning the positions
 */
export async function getRemoveLiquidityEstimation(
  ctx: GalaChainContext,
  dto: BurnEstimateDto
): Promise<GetRemoveLiqEstimationResDto> {
  const [token0, token1] = validateTokenOrder(dto.token0, dto.token1);

  const key = ctx.stub.createCompositeKey(Pool.INDEX_KEY, [token0, token1, dto.fee.toString()]);
  const pool = await getObjectByKey(ctx, Pool, key);

  const poolHash = pool.genPoolHash();
  const position = await fetchUserPositionInTickRange(
    ctx,
    pool.genPoolHash(),
    dto.tickUpper,
    dto.tickLower,
    dto.positionId,
    dto.owner
  );

  const tickLower = parseInt(dto.tickLower.toString()),
    tickUpper = parseInt(dto.tickUpper.toString());

  const { tickUpperData, tickLowerData } = await fetchOrCreateTickDataPair(
    ctx,
    poolHash,
    tickLower,
    tickUpper
  );
  const amounts = pool.burn(position, tickLowerData, tickUpperData, f18(dto.amount));

  const [token0Decimal, token1Decimal] = await getTokenDecimalsFromPool(ctx, pool);

  return new GetRemoveLiqEstimationResDto(
    amounts[0].toFixed(token0Decimal, BigNumber.ROUND_DOWN),
    amounts[1].toFixed(token1Decimal, BigNumber.ROUND_DOWN)
  );
}

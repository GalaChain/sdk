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
import { DexPositionData, f18 } from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { GalaChainContext } from "../types";
import { deleteChainObject, putChainObject } from "../utils";
import { genTickRange, getUserPositionIds } from "./dexUtils";

/**
 * Deletes a user's position in a specific tick range if it has negligible liquidity and tokens owed.
 *
 * @param ctx - GalaChain context object.
 * @param poolHash - Identifier for the pool.
 * @param position - The DexPositionData object representing the position to evaluate and possibly delete.
 */
export async function removePositionIfEmpty(
  ctx: GalaChainContext,
  poolHash: string,
  position: DexPositionData
) {
  //  Fetch user positions
  const userPositions = await getUserPositionIds(ctx, ctx.callingUser, poolHash);

  // Check if given position needs to be deleted
  const deleteUserPos =
    f18(position.tokensOwed0).isLessThan(new BigNumber("0.00000001")) &&
    f18(position.tokensOwed1).isLessThan(new BigNumber("0.00000001")) &&
    f18(position.liquidity).isLessThan(new BigNumber("0.00000001"));

  // Remove position
  if (deleteUserPos) {
    const tickRange = genTickRange(position.tickLower, position.tickUpper);
    userPositions.removePosition(tickRange, position.positionId);
    await deleteChainObject(ctx, position);
    await putChainObject(ctx, userPositions);
  }
}

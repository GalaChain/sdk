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
  ChainError,
  DexPositionData,
  DexPositionOwner,
  ErrorCode,
  NotFoundError,
  Pool
} from "@gala-chain/api";
import { keccak256 } from "js-sha3";

import { GalaChainContext } from "../types";
import { getObjectByKey, putChainObject } from "../utils";
import { genTickRange, getUserPositionIds } from "./dexUtils";

/**
 * Fetches an existing DEX position for a user based on tick range and pool hash,
 * or creates a new one if it doesn't exist.
 *
 * @param ctx - The GalaChain context containing blockchain state and utilities
 * @param pool - The liquidity pool in which this position exists
 * @param tickUpper - The upper bound of the tick range
 * @param tickLower - The lower bound of the tick range
 * @param owner - (Optional) The user address; defaults to the calling user
 * @returns The DexPositionData object representing the user's position
 */
export async function fetchOrCreateDexPosition(
  ctx: GalaChainContext,
  pool: Pool,
  tickUpper: number,
  tickLower: number,
  uniqueKey: string,
  positionId?: string
): Promise<DexPositionData> {
  const poolHash = pool.genPoolHash();
  const tickRange = genTickRange(tickLower, tickUpper);
  const emptyUserPosition = new DexPositionOwner(ctx.callingUser, poolHash);

  // Fetch or initialize positionHolder's DEX position owner record
  const fetchedUserPosition = await getObjectByKey(
    ctx,
    DexPositionOwner,
    emptyUserPosition.getCompositeKey()
  ).catch((e) => ChainError.ignore(e, ErrorCode.NOT_FOUND, emptyUserPosition));

  await fetchedUserPosition.validateOrReject();

  // Check if the position Id provided is valid or try to fetch one in given tick range
  if (positionId) {
    const actualTickRange = fetchedUserPosition.getTickRangeByPositionId(positionId);
    if (actualTickRange !== tickRange) {
      throw new NotFoundError(
        `Cannot find any position with the id ${positionId} in the tick range ${tickRange} that belongs to ${ctx.callingUser} in this pool.`
      );
    }
  } else {
    positionId = fetchedUserPosition.getPositionId(tickRange);
  }

  // Create a new position if none exists
  if (!positionId) {
    positionId = keccak256(uniqueKey);
    fetchedUserPosition.addPosition(tickRange, positionId);
    await putChainObject(ctx, fetchedUserPosition);

    return new DexPositionData(
      poolHash,
      positionId,
      tickUpper,
      tickLower,
      pool.token0ClassKey,
      pool.token1ClassKey,
      pool.fee
    );
  }

  // Fetch and return existing position data
  return getDexPosition(ctx, poolHash, tickUpper, tickLower, positionId);
}

/**
 * Fetches a user's position within a specific tick range in a Dex pool.
 *
 * @param ctx - GalaChain context object.
 * @param poolHash - Identifier for the pool.
 * @param tickUpper - Upper bound of the tick range.
 * @param tickLower - Lower bound of the tick range.
 * @param owner - (Optional) Explicit user address to query; defaults to the calling user.
 * @returns DexPositionData - The position data for the specified tick range.
 * @throws NotFoundError - If the user has no position in the given tick range.
 */
export async function fetchUserPositionInTickRange(
  ctx: GalaChainContext,
  poolHash: string,
  tickUpper: number,
  tickLower: number,
  positionId?: string,
  owner?: string
): Promise<DexPositionData> {
  // Fetch user positions
  const positionHolder = owner ?? ctx.callingUser;
  const tickRange = genTickRange(tickLower, tickUpper);
  const userPositions = await getUserPositionIds(ctx, positionHolder, poolHash);

  // Check if the position Id provided is valid or try to fetch one in given tick range
  if (positionId) {
    const actualTickRange = userPositions.getTickRangeByPositionId(positionId);
    if (actualTickRange !== tickRange) {
      throw new NotFoundError(
        `Cannot find any position with the id ${positionId} in the tick range ${tickRange} that belongs to ${positionHolder} in this pool.`
      );
    }
  } else {
    positionId = userPositions.getPositionId(tickRange);
    if (!positionId) {
      throw new NotFoundError(`User doesnt holds any position for the tick range ${tickRange} in this pool.`);
    }
  }

  // Fetch and return position data
  return getDexPosition(ctx, poolHash, tickUpper, tickLower, positionId);
}

/**
 * Retrieves a DexPositionData object from the ledger.
 *
 * @param ctx - The chaincode stub context.
 * @param poolHash - Unique identifier for the pool.
 * @param tickUpper - Upper tick boundary for the position.
 * @param tickLower - Lower tick boundary for the position.
 * @param positionId - Unique identifier for the position.
 * @returns The deserialized DexPositionData object.
 */
export async function getDexPosition(
  ctx: GalaChainContext,
  poolHash: string,
  tickUpper: number,
  tickLower: number,
  positionId: string
) {
  const compositeKey = ctx.stub.createCompositeKey(DexPositionData.INDEX_KEY, [
    poolHash,
    tickUpper.toString(),
    tickLower.toString(),
    positionId
  ]);
  return getObjectByKey(ctx, DexPositionData, compositeKey);
}

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
  DexFeeConfig,
  DexPositionOwner,
  ErrorCode,
  Pool,
  TokenClassKey,
  ValidationFailedError
} from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { fetchTokenClass } from "../token";
import { GalaChainContext } from "../types";
import { getObjectByKey } from "../utils/state";

/**
 *
 * @param arr It will sort array for string
 * @returns It will return modified array with sorted according to lexiographical order
 */
export const sortString = (arr: string[]) => {
  const sortedArr = [...arr].sort((a, b) => a.localeCompare(b));
  const isChanged = !arr.every((val, index) => val === sortedArr[index]);

  return { sortedArr, isChanged };
};

/**
 * @dev it will round down the Bignumber to 18 decimals
 * @param BN
 * @param round
 * @returns
 */
export const f18 = (BN: BigNumber, round: BigNumber.RoundingMode = BigNumber.ROUND_DOWN): BigNumber =>
  new BigNumber(BN.toFixed(18, round));

export function generateKeyFromClassKey(obj: TokenClassKey) {
  return Object.assign(new TokenClassKey(), obj).toStringKey().replace(/\|/g, ":") || "";
}

/**
 * Validates and normalizes the order of two tokens for pool creation.
 *
 * Ensures that token0 is lexicographically smaller than token1 and that both tokens are different.
 *
 * @param token0 - The first token's class key.
 * @param token1 - The second token's class key.
 * @throws ValidationFailedError if tokens are the same or in the wrong order.
 * @returns A tuple containing the normalized token0 and token1 keys.
 */
export function validateTokenOrder(token0: TokenClassKey, token1: TokenClassKey) {
  const [normalizedToken0, normalizedToken1] = [token0, token1].map(generateKeyFromClassKey);

  if (normalizedToken0.localeCompare(normalizedToken1) > 0) {
    throw new ValidationFailedError("Token0 must be smaller");
  } else if (normalizedToken0.localeCompare(normalizedToken1) === 0) {
    throw new ValidationFailedError(
      `Cannot create pool of same tokens. Token0 ${JSON.stringify(token0)} and Token1 ${JSON.stringify(
        token1
      )} must be different.`
    );
  }
  return [normalizedToken0, normalizedToken1];
}

export function genBookMark(...params: string[] | number[]): string {
  return params.join("@");
}

export function splitBookmark(bookmark = "") {
  const [chainBookmark = "", localBookmark = "0"] = bookmark.split("@");
  return { chainBookmark, localBookmark };
}

/**
 * Generates a tick range string in the format "lower:upper".
 */
export function genTickRange(tickLower: number, tickUpper: number): string {
  return [tickLower, tickUpper].join(":");
}

/**
 * Parses a tick range string and returns the lower and upper ticks as numbers.
 */
export function parseTickRange(tickRange: string): { tickLower: number; tickUpper: number } {
  const [tickLower, tickUpper] = tickRange.split(":").map(Number);

  if (isNaN(tickLower) || isNaN(tickUpper)) {
    throw new Error(`Invalid tick range format: ${tickRange}`);
  }

  return { tickLower, tickUpper };
}

/**
 * Retrieves the global DEX protocol fee configuration.
 *
 * @param ctx - GalaChain context object.
 * @returns A Promise resolving to the DexFeeConfig object if found, or undefined if not set.
 */
export async function fetchDexProtocolFeeConfig(ctx: GalaChainContext): Promise<DexFeeConfig | undefined> {
  const key = ctx.stub.createCompositeKey(DexFeeConfig.INDEX_KEY, []);

  const dexConfig = await getObjectByKey(ctx, DexFeeConfig, key).catch((e) => {
    const chainError = ChainError.from(e);
    if (chainError.matches(ErrorCode.NOT_FOUND)) {
      return undefined;
    } else {
      throw chainError;
    }
  });

  return dexConfig;
}

/**
 * Retrieves the user position object for a given holder and pool.
 *
 * @param ctx - GalaChain context object.
 * @param positionHolder - The user's address or ID.
 * @param poolHash - Identifier for the pool.
 * @returns A Promise resolving to the user's DexPositionOwner object.
 */
export async function getUserPositionIds(
  ctx: GalaChainContext,
  positionHolder: string,
  poolHash: string
): Promise<DexPositionOwner> {
  const compositeKey = ctx.stub.createCompositeKey(DexPositionOwner.INDEX_KEY, [positionHolder, poolHash]);
  return getObjectByKey(ctx, DexPositionOwner, compositeKey);
}

/**
 * Retrieves the decimals for token0 and token1 from a given pool.
 *
 * @param ctx - GalaChain context object.
 * @param pool - The Pool object containing token class keys.
 * @returns A Promise resolving to a tuple of [token0Decimals, token1Decimals].
 */
export async function getTokenDecimalsFromPool(ctx: GalaChainContext, pool: Pool): Promise<[number, number]> {
  const token0Class = await fetchTokenClass(ctx, pool.token0ClassKey);
  const token1Class = await fetchTokenClass(ctx, pool.token1ClassKey);

  return [token0Class.decimals, token1Class.decimals];
}

/**
 * Rounds a raw token amount to the token class's decimal precision.
 *
 * @param amount - The token amount as a string or BigNumber.
 * @param decimals - The number of decimals to round to (from token class).
 * @returns A BigNumber rounded down to the specified decimals.
 */
export function roundTokenAmount(amount: string | BigNumber, decimals: number, roundUp: boolean): BigNumber {
  return new BigNumber(amount).decimalPlaces(decimals, roundUp ? BigNumber.ROUND_UP : BigNumber.ROUND_DOWN);
}

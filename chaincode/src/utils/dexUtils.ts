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
  ErrorCode,
  TokenClassKey,
  TokenInstanceKey,
  ValidationFailedError
} from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { GalaChainContext } from "../types";
import { getObjectByKey } from "./state";

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
 *
 * @param arr Array Element
 * @param idx Element1 to swap
 * @param idx2 Element2 to swap
 */
export const swapAmounts = (arr: string[] | BigNumber[], idx = 0, idx2 = 1) => {
  const temp = arr[idx];
  arr[idx] = arr[idx2];
  arr[idx2] = temp;
};
/**
 *
 * @param address address of pool in string
 * @returns
 */
export const virtualAddress = (address: string) => {
  return "service|" + address;
};

/**
 * @dev it will round down the Bignumber to 18 decimals
 * @param BN
 * @param round
 * @returns
 */
export const f18 = (BN: BigNumber, round: BigNumber.RoundingMode = BigNumber.ROUND_DOWN): BigNumber =>
  new BigNumber(BN.toFixed(18, round));

export const generateKeyFromClassKey = (obj: TokenClassKey) => {
  return Object.assign(new TokenClassKey(), obj).toStringKey().replace(/\|/g, ":") || "";
};

export function convertToTokenInstanceKey(tokenClassKey: TokenClassKey): TokenInstanceKey {
  return Object.assign(new TokenInstanceKey(), {
    collection: tokenClassKey.collection,
    category: tokenClassKey.category,
    type: tokenClassKey.type,
    additionalKey: tokenClassKey.additionalKey,
    instance: new BigNumber(0)
  });
}

export function validateTokenOrder(token0: TokenClassKey, token1: TokenClassKey) {
  const [normalizedToken0, normalizedToken1] = [token0, token1].map(generateKeyFromClassKey);

  if (normalizedToken0.localeCompare(normalizedToken1) > 0) {
    throw new Error("Token0 must be smaller");
  } else if (normalizedToken0.localeCompare(normalizedToken1) === 0) {
    throw new Error(
      `Cannot create pool of same tokens. Token0 ${JSON.stringify(token0)} and Token1 ${JSON.stringify(
        token1
      )} must be different.`
    );
  }
  return [normalizedToken0, normalizedToken1];
}

export function genKey(...params: string[] | number[]): string {
  return params.join("_").replace(/\|/g, ":");
}

export function genKeyWithPipe(...params: string[] | number[]): string {
  return params.join("_");
}

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

export function parseNftId(nftId: string): { batchNumber: string; instanceId: BigNumber } {
  const parts = nftId.split("_");
  if (parts.length !== 2) {
    throw new ValidationFailedError("Invalid NFT ID format. Expected format: 'batchNumber_instanceId'.");
  }
  return {
    batchNumber: parts[0],
    instanceId: new BigNumber(parts[1])
  };
}

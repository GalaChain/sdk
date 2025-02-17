import { TokenClassKey, TokenInstanceKey, asValidUserAlias } from "@gala-chain/api";
import BigNumber from "bignumber.js";

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
export const swapAmounts = (arr: string[] | BigNumber[], idx: number = 0, idx2: number = 1) => {
  let temp = arr[idx];
  arr[idx] = arr[idx2];
  arr[idx2] = temp;
};
/**
 *
 * @param address address of pool in string
 * @returns
 */
export const virtualAddress = (address: string) => {
  return asValidUserAlias("service|" + address);
};

export const requirePosititve = (...params) => {
  for (const positive of params) {
    if (positive instanceof BigNumber) {
      if (positive.lt(new BigNumber(0))) {
        throw new Error("Uint Out of Bounds error :Uint");
      }
    }
  }
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
      `Cannot create pool of same tokens. Token0 ${JSON.stringify(token0)} and Token1 ${JSON.stringify(token1)} must be different.`
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

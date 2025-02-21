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
import BigNumber from "bignumber.js";

import { DefaultError } from "../error";

/**
 * Gets the amount0 delta between two prices.
 *
 * Calculates `liquidity / sqrt(lower) - liquidity / sqrt(upper)`,
 * i.e., `liquidity * (sqrt(upper) - sqrt(lower)) / (sqrt(upper) * sqrt(lower))`.
 *
 * @param sqrtPriceA - A square root price.
 * @param sqrtPriceB - Another square root price.
 * @param liquidity - The amount of usable liquidity.
 * @returns The amount of token0 required to cover a position of size liquidity between the two passed prices.
 */
export function getAmount0Delta(
  sqrtPriceA: BigNumber,
  sqrtPriceB: BigNumber,
  liquidity: BigNumber
): BigNumber {
  let [lowerPrice, higherPrice] = sqrtPriceA.isLessThan(sqrtPriceB)
    ? [sqrtPriceA, sqrtPriceB]
    : [sqrtPriceB, sqrtPriceA];

  return liquidity.multipliedBy(higherPrice.minus(lowerPrice)).div(higherPrice.multipliedBy(lowerPrice));
}

/**
 * Gets the amount1 delta between two prices.
 *
 * Calculates `liquidity * (sqrt(upper) - sqrt(lower))`.
 *
 * @param sqrtPriceLower - A square root price (lower bound).
 * @param sqrtPriceUpper - Another square root price (upper bound).
 * @param liquidityDelta - The amount of usable liquidity.
 * @returns The amount of token1 required to cover a position of size liquidity between the two passed prices.
 */
export function getAmount1Delta(
  sqrtPriceLower: BigNumber,
  sqrtPriceUpper: BigNumber,
  liquidityDelta: BigNumber
): BigNumber {
  let [lowerPrice, higherPrice] = sqrtPriceLower.isLessThan(sqrtPriceUpper)
    ? [sqrtPriceLower, sqrtPriceUpper]
    : [sqrtPriceUpper, sqrtPriceLower];

  return liquidityDelta.times(higherPrice.minus(lowerPrice));
}

/**
 * Gets the next square root price given an input amount of token0 or token1.
 *
 * @param sqrtPrice - The starting price, before accounting for the input amount.
 * @param liquidity - The amount of usable liquidity.
 * @param amountIn - How much of token0 or token1 is being swapped in.
 * @param zeroForOne - Whether the amount in is token0 (`true`) or token1 (`false`).
 * @returns The price after adding the input amount to token0 or token1.
 * @throws If price or liquidity are zero.
 */
export function getNextSqrtPriceFromInput(
  sqrtPrice: BigNumber,
  liquidity: BigNumber,
  amountIn: BigNumber,
  zeroForOne: boolean
): BigNumber {
  if (sqrtPrice.isLessThanOrEqualTo(0)) throw new DefaultError("Invalid Price");
  if (liquidity.isLessThanOrEqualTo(0)) throw new DefaultError("Invalid liquidity");

  return zeroForOne
    ? getNextSqrtPriceFromAmount0(sqrtPrice, liquidity, amountIn, true)
    : getNextSqrtPriceFromAmount1(sqrtPrice, liquidity, amountIn, true);
}

/**
 * Gets the next square root price given an output amount of token0 or token1.
 *
 * @param sqrtPrice - The starting price before accounting for the output amount.
 * @param liquidity - The amount of usable liquidity.
 * @param amountOut - How much of token0 or token1 is being swapped out.
 * @param zeroForOne - Whether the amount out is token0 (`true`) or token1 (`false`).
 * @returns The price after removing the output amount of token0 or token1.
 * @throws If price or liquidity are zero.
 */
export function getNextSqrtPriceFromOutput(
  sqrtPrice: BigNumber,
  liquidity: BigNumber,
  amountOut: BigNumber,
  zeroForOne: boolean
): BigNumber {
  if (sqrtPrice.isLessThanOrEqualTo(0)) throw new DefaultError("Invalid Price");
  if (liquidity.isLessThanOrEqualTo(0)) throw new DefaultError("Invalid liquidity");

  return zeroForOne
    ? getNextSqrtPriceFromAmount1(sqrtPrice, liquidity, amountOut, false)
    : getNextSqrtPriceFromAmount0(sqrtPrice, liquidity, amountOut, false);
}

/**
 * Gets the next square root price given a delta of token0.
 *
 * Uses `liquidity * sqrtPrice / (liquidity ± amount * sqrtPrice)`.
 *
 * @param sqrtPrice - The starting price, before accounting for the token0 delta.
 * @param liquidity - The amount of usable liquidity.
 * @param amount - The amount of token0 to add or remove from virtual reserves.
 * @param add - Whether to add (`true`) or remove (`false`) the amount of token0.
 * @returns The price after adding or removing the specified amount.
 */
export function getNextSqrtPriceFromAmount0(
  sqrtPrice: BigNumber,
  liquidity: BigNumber,
  amount: BigNumber,
  add: boolean
): BigNumber {
  return add
    ? liquidity.times(sqrtPrice).div(liquidity.plus(sqrtPrice.times(amount)))
    : liquidity.times(sqrtPrice).div(liquidity.minus(sqrtPrice.times(amount)));
}

/**
 * Gets the next square root price given a delta of token1.
 *
 * Uses `sqrtPrice ± amount / liquidity`.
 *
 * @param sqrtPrice - The starting price, before accounting for the token1 delta.
 * @param liquidity - The amount of usable liquidity.
 * @param amount - The amount of token1 to add or remove from virtual reserves.
 * @param add - Whether to add (`true`) or remove (`false`) the amount of token1.
 * @returns The price after adding or removing the specified amount.
 */
export function getNextSqrtPriceFromAmount1(
  sqrtPrice: BigNumber,
  liquidity: BigNumber,
  amount: BigNumber,
  add: boolean
): BigNumber {
  return add ? amount.div(liquidity).plus(sqrtPrice) : sqrtPrice.minus(amount.div(liquidity));
}

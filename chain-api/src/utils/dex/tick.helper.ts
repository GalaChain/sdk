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

import { TickData } from "../../types/TickData";
import { ValidationFailedError } from "../error";
import { leastSignificantBit, mostSignificantBit } from "./bitMath.helper";

const MIN_TICK = -887272,
  MAX_TICK = 887272;

/**
 *
 *  @notice Calculates sqrt(1.0001^tick)
 *  @param tick The input tick for the above formula
 *  @return sqrtPrice A Bignumber representing the sqrt of the ratio of the two assets (token1/token0)
 *  at the given tick
 */
export function tickToSqrtPrice(tick: number): BigNumber {
  return new BigNumber(1.0001 ** (tick / 2));
}

/**
 *
 * @notice Calculates the greatest tick value such that getRatioAtTick(tick) <= ratio
 *  @param sqrtPrice The sqrt ratio for which to compute the tick
 *  @return tick The greatest tick for which the ratio is less than or equal to the input ratio
 */
export function sqrtPriceToTick(sqrtPrice: BigNumber): number {
  return Number((Math.log(sqrtPrice.toNumber() ** 2) / Math.log(1.0001)).toFixed(0));
}

/**
 * Calculates the word and bit position for a given tick in a bitmap.
 *
 * @param tick - The tick index.
 * @returns A tuple of [word index, bit position within the word].
 */
function position(tick: number): [word: number, position: number] {
  tick = Math.trunc(tick);

  const wordPos = Math.trunc(tick / 256); // Equivalent to tick >> 8

  let bitPos = tick % 256; // Equivalent to tick % 256
  if (bitPos < 0) bitPos += 256; // Ensure it's always positive like uint8

  return [wordPos, bitPos];
}

/**
 *
 *  @notice Flips the initialized state for a given tick from false to true, or vice versa
 *  @param bitmap The mapping in which to flip the tick
 *  @param tick The tick to flip
 */
export function flipTick(bitmap: Record<string, string>, tick: number, tickSpacing: number) {
  if (tick % tickSpacing != 0) {
    throw new ValidationFailedError("Tick is not spaced " + tick + " " + tickSpacing);
  }
  tick /= tickSpacing;
  const [word, pos] = position(tick);
  const mask = BigInt(1) << BigInt(pos);

  //initialise the bitmask for word if required
  if (bitmap[word] == undefined) bitmap[word] = BigInt(0).toString();

  const currentMask = BigInt(bitmap[word]);
  const newMask = currentMask ^ mask;

  //update bitmask state
  bitmap[word] = newMask.toString();
}

function isTickInitialized(tick: number, tickSpacing: number, bitmap: Record<string, string>): boolean {
  tick /= tickSpacing;
  const [word, pos] = position(tick);
  const mask = BigInt(1) << BigInt(pos);

  if (bitmap[word] === undefined) return false;

  const currentMask = BigInt(bitmap[word]);
  const newMask = currentMask ^ mask;

  return newMask == BigInt(0);
}

/**
 *
 *  @notice Returns the next initialized tick contained in the same word (or adjacent word) as the tick that is either
 *  to the left (less than or equal to) or right (greater than) of the given tick
 *  @param bitmap The mapping in which to compute the next initialized tick
 *  @param tick The starting tick
 *  @param lte Whether to search for the next initialized tick to the left (less than or equal to the starting tick)
 *  @return next The next initialized or uninitialized tick up to 256 ticks away from the current tick
 *  @return initialized Whether the next tick is initialized, as the function only searches within up to 256 ticks
 */
export function nextInitialisedTickWithInSameWord(
  bitmap: Record<string, string>,
  tick: number,
  tickSpacing: number,
  lte: boolean,
  sqrtPrice: BigNumber
): [number, boolean] {
  let compressed = Math.trunc(tick / tickSpacing);
  if (tick < 0 && tick % tickSpacing != 0) compressed--;
  if (tick == sqrtPriceToTick(sqrtPrice)) {
    const tickPrice = tickToSqrtPrice(tick);
    if (lte && tickPrice.lt(sqrtPrice)) {
      return [tick, isTickInitialized(tick, tickSpacing, bitmap)];
    } else if (!lte && tickPrice.gt(sqrtPrice)) {
      return [tick, isTickInitialized(tick, tickSpacing, bitmap)];
    }
  }

  if (lte) {
    const [word, pos] = position(compressed);

    //initialise the bitmask for word if required
    if (bitmap[word] == undefined) bitmap[word] = BigInt(0).toString();

    const bitmask = BigInt(bitmap[word]);
    const mask = (BigInt(1) << BigInt(pos)) - BigInt(1) + (BigInt(1) << BigInt(pos));
    const masked = bitmask & mask;

    const newPos = mostSignificantBit(masked);
    const intialized = masked != BigInt(0);
    const value = intialized ? compressed - (pos - newPos) : compressed - pos;
    return [value * tickSpacing, intialized];
  } else {
    compressed = compressed + 1;
    const [word, pos] = position(compressed);
    //initialise the bitmask for word if required
    if (bitmap[word] == undefined) bitmap[word] = BigInt(0).toString();
    const bitmask = BigInt(bitmap[word]);

    const mask = ~((BigInt(1) << BigInt(pos)) - BigInt(1));
    const masked = bitmask & mask;

    const intialized = masked != BigInt(0);
    const newPos = leastSignificantBit(masked);
    const value = intialized ? compressed + newPos - pos : compressed + (2 ** 8 - 1 - pos);
    return [value * tickSpacing, intialized];
  }
}

/**
 *
 *  @notice Retrieves fee growth data
 *  @param tickLowerData The tick data of lower tick boundary of the position
 *  @param tickUpperData The tick data of upper tick boundary of the position
 *  @param tickCurrent The current tick
 *  @param feeGrowthGlobal0 The all-time global fee growth, per unit of liquidity, in token0
 *  @param feeGrowthGlobal1 The all-time global fee growth, per unit of liquidity, in token1
 *  @return feeGrowthInside0 The all-time fee growth in token0, per unit of liquidity, inside the position's tick boundaries
 *  @return feeGrowthInside1 The all-time fee growth in token1, per unit of liquidity, inside the position's tick boundaries
 */
export function getFeeGrowthInside(
  tickLowerData: TickData,
  tickUpperData: TickData,
  tickCurrent: number,
  feeGrowthGlobal0: BigNumber,
  feeGrowthGlobal1: BigNumber
): BigNumber[] {
  const tickLower = tickLowerData.tick;
  const tickUpper = tickUpperData.tick;

  //calculate fee growth below
  let feeGrowthBelow0: BigNumber, feeGrowthBelow1: BigNumber;

  if (tickCurrent >= tickLower) {
    feeGrowthBelow0 = tickLowerData.feeGrowthOutside0;
    feeGrowthBelow1 = tickLowerData.feeGrowthOutside1;
  } else {
    feeGrowthBelow0 = feeGrowthGlobal0.minus(tickLowerData.feeGrowthOutside0);
    feeGrowthBelow1 = feeGrowthGlobal1.minus(tickLowerData.feeGrowthOutside1);
  }

  //calculate fee growth above
  let feeGrowthAbove0: BigNumber, feeGrowthAbove1: BigNumber;
  if (tickCurrent < tickUpper) {
    feeGrowthAbove0 = tickUpperData.feeGrowthOutside0;
    feeGrowthAbove1 = tickUpperData.feeGrowthOutside1;
  } else {
    feeGrowthAbove0 = feeGrowthGlobal0.minus(tickUpperData.feeGrowthOutside0);
    feeGrowthAbove1 = feeGrowthGlobal1.minus(tickUpperData.feeGrowthOutside1);
  }

  // Calculate fee growth inside tick range
  const feeGrowthInside0 = feeGrowthGlobal0.minus(feeGrowthBelow0).minus(feeGrowthAbove0);
  const feeGrowthInside1 = feeGrowthGlobal1.minus(feeGrowthBelow1).minus(feeGrowthAbove1);

  return [feeGrowthInside0, feeGrowthInside1];
}

/**
 *
 *  @notice Derives max liquidity per tick from given tick spacing
 *  @dev thows if the ticks are not in the valid range
 *  @param tickLower lower tick
 *  @param tickUpper upper tick
 */
export function checkTicks(tickLower: number, tickUpper: number) {
  if (tickLower >= tickUpper) throw new ValidationFailedError("Lower Tick is greater than Upper Tick");
  if (tickLower < MIN_TICK) throw new ValidationFailedError("Lower Tick is less than Min Tick");
  if (tickUpper > MAX_TICK) throw new ValidationFailedError("Upper Tick is greater than Max Tick");
}

/**
 *
 * @notice Derives max liquidity per tick from given tick spacing
 *  @dev Executed within the pool constructor
 *  @param tickSpacing The amount of required tick separation, realized in multiples of `tickSpacing`
 *      e.g., a tickSpacing of 3 requires ticks to be initialized every 3rd tick i.e., ..., -6, -3, 0, 3, 6, ...
 *  @return The max liquidity per tick
 */
export function tickSpacingToMaxLiquidityPerTick(tickSpacing: number): BigNumber {
  const minTick = Math.ceil((MIN_TICK / tickSpacing) * tickSpacing);

  const maxTick = Math.floor((MAX_TICK / tickSpacing) * tickSpacing);

  const numTicks = (maxTick - minTick) / tickSpacing + 1;

  return new BigNumber(2).pow(128).minus(1).dividedBy(numTicks);
}
/**
 * Fee Amount mapped to the tick spacing
 */
export const feeAmountTickSpacing = {
  500: 10,
  3000: 60,
  10000: 200
};

/**
 *
 * @notice it will make the tick countable for other token
 *  @param tick
 *  @return reverse tick
 */
export function flipTickOrientation(tick: number): number {
  return sqrtPriceToTick(new BigNumber(1).dividedBy(tickToSqrtPrice(tick)));
}

/**
 *
 * @notice it will ensure the tick spacing
 * @param tick - tick to be spaced
 * @param tickSpacing - tick spacing that should be considered while spacing a tick
 * @return spaced tick
 */
export function spaceTick(tick: number, tickSpacing: number): number {
  if (tickSpacing === 0) throw new ValidationFailedError("Tickspacing cannot be zero");
  return Math.trunc(tick / tickSpacing) * tickSpacing;
}

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
import { leastSignificantBit, mostSignificantBit } from "./bitMath.helper";
import { Bitmap, TickDataObj } from "./dexHelperDtos";

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
 *
 * @notice Updates a tick and returns true if the tick was flipped from initialized to uninitialized, or vice versa
 *  @param tickData The mapping containing all tick information for initialized ticks
 *  @param tick The tick that will be updated
 *  @param tickCurrent The current tick
 *  @param liquidityDelta A new amount of liquidity to be added (subtracted) when tick is crossed from left to right (right to left)
 *  @param upper true for updating a position's upper tick, or false for updating a position's lower tick
 *  @param feeGrowthGlobal0 The all-time global fee growth, per unit of liquidity, in token0
 *  @param feeGrowthGlobal1 The all-time global fee growth, per unit of liquidity, in token1
 *  @param maxLiquidity The maximum liquidity allocation for a single tick
 *  @return flipped Whether the tick was flipped from initialized to uninitialized, or vice versa
 */
export function updateTick(
  tickData: TickDataObj,
  tick: number,
  tickCurrent: number,
  liquidityDelta: BigNumber,
  upper: boolean,
  feeGrowthGlobal0: BigNumber,
  feeGrowthGlobal1: BigNumber,
  maxLiquidity: BigNumber
): boolean {
  //initialise tickData for the required tick
  if (tickData[tick] == undefined)
    tickData[tick] = {
      liquidityGross: new BigNumber(0).toString(),
      initialised: false,
      liquidityNet: new BigNumber(0).toString(),
      feeGrowthOutside0: new BigNumber(0).toString(),
      feeGrowthOutside1: new BigNumber(0).toString()
    };

  const liquidityGrossBefore = new BigNumber(tickData[tick].liquidityGross);
  const liquidityGrossAfter = new BigNumber(liquidityGrossBefore).plus(liquidityDelta);

  if (liquidityGrossAfter.isGreaterThan(maxLiquidity))
    throw new DefaultError("liquidity crossed max liquidity");

  //update liquidity gross and net
  tickData[tick].liquidityGross = liquidityGrossAfter.toString();
  tickData[tick].liquidityNet = upper
    ? new BigNumber(tickData[tick].liquidityNet).minus(liquidityDelta).toString()
    : new BigNumber(tickData[tick].liquidityNet).plus(liquidityDelta).toString();

  //tick is initialised for the first time
  if (liquidityGrossBefore.isEqualTo(0)) {
    if (tick <= tickCurrent) {
      tickData[tick].feeGrowthOutside0 = feeGrowthGlobal0.toString();
      tickData[tick].feeGrowthOutside1 = feeGrowthGlobal1.toString();
    }
    tickData[tick].initialised = true;
    return true;
  }

  //either tick is turning on or off
  const flipped = liquidityGrossBefore.isEqualTo(0) != liquidityGrossAfter.isEqualTo(0);

  return flipped;
}

function position(tick: number): [word: number, position: number] {
  tick = Math.floor(tick);
  const wordPos = Math.floor(tick / 256); // Equivalent to tick >> 8
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
export function flipTick(bitmap: Bitmap, tick: number, tickSpacing: number) {
  if (tick % tickSpacing != 0) {
    throw new Error("Tick is not spaced " + tick + " " + tickSpacing);
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
  bitmap: Bitmap,
  tick: number,
  tickSpacing: number,
  lte: boolean
): [number, boolean] {
  let compressed = Math.floor(tick / tickSpacing);
  if (tick < 0 && tick % tickSpacing != 0) compressed--;
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
 *  @notice Transitions to next tick as needed by price movement
 *  @param tick The destination tick of the transition
 *  @param tickData The mapping containing all tick information for initialized ticks
 *  @param feeGrowthGlobal0 The all-time global fee growth, per unit of liquidity, in token0
 *  @param feeGrowthGlobal1 The all-time global fee growth, per unit of liquidity, in token1
 *  @return liquidityNet The amount of liquidity added (subtracted) when tick is crossed from left to right (right to left)
 */
export function tickCross(
  tick: number,
  tickData: TickDataObj,
  feeGrowthGlobal0: BigNumber,
  feeGrowthGlobal1: BigNumber
): BigNumber {
  //initialise tickData for the required tick
  if (tickData[tick] == undefined)
    tickData[tick] = {
      liquidityGross: new BigNumber(0).toString(),
      initialised: false,
      liquidityNet: new BigNumber(0).toString(),
      feeGrowthOutside0: new BigNumber(0).toString(),
      feeGrowthOutside1: new BigNumber(0).toString()
    };

  tickData[tick].feeGrowthOutside0 = feeGrowthGlobal0
    .minus(new BigNumber(tickData[tick].feeGrowthOutside0))
    .toString();
  tickData[tick].feeGrowthOutside1 = feeGrowthGlobal1
    .minus(new BigNumber(tickData[tick].feeGrowthOutside1))
    .toString();

  return new BigNumber(tickData[tick].liquidityNet);
}

/**
 *
 *  @notice Retrieves fee growth data
 *  @param tickData The mapping containing all tick information for initialized ticks
 *  @param tickLower The lower tick boundary of the position
 *  @param tickUpper The upper tick boundary of the position
 *  @param tickCurrent The current tick
 *  @param feeGrowthGlobal0 The all-time global fee growth, per unit of liquidity, in token0
 *  @param feeGrowthGlobal1 The all-time global fee growth, per unit of liquidity, in token1
 *  @return feeGrowthInside0 The all-time fee growth in token0, per unit of liquidity, inside the position's tick boundaries
 *  @return feeGrowthInside1 The all-time fee growth in token1, per unit of liquidity, inside the position's tick boundaries
 */
export function getFeeGrowthInside(
  tickData: TickDataObj,
  tickLower: number,
  tickUpper: number,
  tickCurrent: number,
  feeGrowthGlobal0: BigNumber,
  feeGrowthGlobal1: BigNumber
): BigNumber[] {
  //calculate fee growth below
  let feeGrowthBelow0: BigNumber, feeGrowthBelow1: BigNumber;
  if (tickCurrent >= tickLower) {
    feeGrowthBelow0 = new BigNumber(tickData[tickLower].feeGrowthOutside0);
    feeGrowthBelow1 = new BigNumber(tickData[tickLower].feeGrowthOutside1);
  } else {
    feeGrowthBelow0 = feeGrowthGlobal0.minus(new BigNumber(tickData[tickLower].feeGrowthOutside0));
    feeGrowthBelow1 = feeGrowthGlobal1.minus(new BigNumber(tickData[tickLower].feeGrowthOutside1));
  }

  //calculate fee growth above
  let feeGrowthAbove0: BigNumber, feeGrowthAbove1: BigNumber;
  if (tickCurrent < tickUpper) {
    feeGrowthAbove0 = new BigNumber(tickData[tickUpper].feeGrowthOutside0);
    feeGrowthAbove1 = new BigNumber(tickData[tickUpper].feeGrowthOutside1);
  } else {
    feeGrowthAbove0 = feeGrowthGlobal0.minus(new BigNumber(tickData[tickUpper].feeGrowthOutside0));
    feeGrowthAbove1 = feeGrowthGlobal1.minus(new BigNumber(tickData[tickUpper].feeGrowthOutside1));
  }

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
  if (tickLower >= tickUpper) throw new DefaultError("TLU");
  if (tickLower < -887272) throw new DefaultError("TLM");
  if (tickUpper > 887272) throw new DefaultError("TUM");
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
  const minTick = Math.ceil((-887272 / tickSpacing) * tickSpacing);
  const maxTick = Math.floor((887272 / tickSpacing) * tickSpacing);
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
  if (tickSpacing === 0) throw new Error("Tickspacing cannot be zero");
  return Math.floor(tick / tickSpacing) * tickSpacing;
}

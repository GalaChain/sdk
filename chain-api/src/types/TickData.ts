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
import { Exclude } from "class-transformer";
import { IsBoolean, IsInt, IsString, Max, Min } from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import { ChainKey, ValidationFailedError } from "../utils";
import { BigNumberIsPositive, BigNumberProperty, IsBigNumber } from "../validators";
import { ChainObject } from "./ChainObject";

export class TickData extends ChainObject {
  @Exclude()
  static INDEX_KEY = "GCTD"; //GalaChain Tick Data

  @JSONSchema({
    description: "Minimum tick value allowed for the pool"
  })
  public static MIN_TICK = -887272;

  @JSONSchema({
    description: "Maximum tick value allowed for the pool"
  })
  public static MAX_TICK = 887272;

  @ChainKey({ position: 0 })
  @IsString()
  public readonly poolHash: string;

  @ChainKey({ position: 1 })
  @IsInt()
  @Max(TickData.MAX_TICK)
  @Min(TickData.MIN_TICK)
  public readonly tick: number;

  @BigNumberIsPositive()
  @BigNumberProperty()
  liquidityGross: BigNumber;

  @IsBoolean()
  initialised: boolean;

  @IsBigNumber()
  @BigNumberProperty()
  liquidityNet: BigNumber;

  @BigNumberIsPositive()
  @BigNumberProperty()
  feeGrowthOutside0: BigNumber;

  @BigNumberIsPositive()
  @BigNumberProperty()
  feeGrowthOutside1: BigNumber;

  constructor(poolHash: string, tick: number) {
    super();
    this.poolHash = poolHash;
    this.tick = tick;
    this.liquidityGross = new BigNumber(0);

    this.initialised = false;
    this.liquidityNet = new BigNumber(0);
    this.feeGrowthOutside0 = new BigNumber(0);
    this.feeGrowthOutside1 = new BigNumber(0);
  }

  /**
   * Updates the tick's liquidity and initialization state.
   *
   * - Adjusts liquidity gross and net based on the delta and direction (upper/lower).
   * - Initializes the tick if it's being used for the first time.
   * - If initializing and tick is below or at the current price, sets fee growth outside.
   * - Returns `true` if the tick was just initialized or its state flipped on/off.
   *
   * @param tickCurrent - The current active tick index in the pool.
   * @param liquidityDelta - The amount of liquidity to add or remove.
   * @param upper - Whether this tick is the upper tick of a position.
   * @param feeGrowthGlobal0 - Global fee growth for token0.
   * @param feeGrowthGlobal1 - Global fee growth for token1.
   * @param maxLiquidity - The maximum allowed liquidity for a tick.
   * @returns `true` if the tick was initialized or flipped, else `false`.
   */
  updateTick(
    tickCurrent: number,
    liquidityDelta: BigNumber,
    upper: boolean,
    feeGrowthGlobal0: BigNumber,
    feeGrowthGlobal1: BigNumber,
    maxLiquidity: BigNumber
  ): boolean {
    // Calculate new gross liquidity after applying delta
    const liquidityGrossBefore = new BigNumber(this.liquidityGross);
    const liquidityGrossAfter = liquidityGrossBefore.plus(liquidityDelta);

    if (liquidityGrossAfter.isGreaterThan(maxLiquidity)) {
      throw new ValidationFailedError("liquidity crossed max liquidity");
    }

    // Update gross and net liquidity
    this.liquidityGross = liquidityGrossAfter;
    this.liquidityNet = upper
      ? new BigNumber(this.liquidityNet).minus(liquidityDelta)
      : new BigNumber(this.liquidityNet).plus(liquidityDelta);

    // Record fee growth if tick is below or at current tick and has been initialized for the first time
    if (liquidityGrossBefore.isEqualTo(0)) {
      if (this.tick <= tickCurrent) {
        this.feeGrowthOutside0 = feeGrowthGlobal0;
        this.feeGrowthOutside1 = feeGrowthGlobal1;
      }
      this.initialised = true;
      return true;
    }

    // Return true if tick flipped from initialized to uninitialized or vice versa
    const flipped = liquidityGrossBefore.isEqualTo(0) != liquidityGrossAfter.isEqualTo(0);
    return flipped;
  }

  /**
   * Updates the fee growth outside values based on current global fee growth and returns the net liquidity.
   *
   * @param feeGrowthGlobal0 - The global fee growth for token0.
   * @param feeGrowthGlobal1 - The global fee growth for token1.
   * @returns The net liquidity after updating fee growth values.
   */
  tickCross(feeGrowthGlobal0: BigNumber, feeGrowthGlobal1: BigNumber): BigNumber {
    this.feeGrowthOutside0 = feeGrowthGlobal0.minus(new BigNumber(this.feeGrowthOutside0));
    this.feeGrowthOutside1 = feeGrowthGlobal1.minus(new BigNumber(this.feeGrowthOutside1));

    return new BigNumber(this.liquidityNet);
  }
}

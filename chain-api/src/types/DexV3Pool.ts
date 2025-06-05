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
import { Exclude, Type } from "class-transformer";
import { IsNumber, IsString, ValidateNested } from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";
import { keccak256 } from "js-sha3";

import {
  ChainKey,
  ConflictError,
  SwapState,
  ValidationFailedError,
  checkTicks,
  feeAmountTickSpacing,
  flipTick,
  getAmount0Delta,
  getAmount1Delta,
  getFeeGrowthInside,
  liquidity0,
  liquidity1,
  requirePosititve,
  sqrtPriceToTick,
  tickSpacingToMaxLiquidityPerTick,
  tickToSqrtPrice
} from "../utils";
import { BigNumberIsNotNegative, BigNumberProperty, EnumProperty, IsStringRecord } from "../validators";
import { ChainObject } from "./ChainObject";
import { DexFeePercentageTypes } from "./DexDtos";
import { DexPositionData } from "./DexPositionData";
import { TickData } from "./TickData";
import { TokenClassKey } from "./TokenClass";

@JSONSchema({
  description: "Decentralized exchange pool chain object with the core contract functionality."
})
export class Pool extends ChainObject {
  @Exclude()
  static INDEX_KEY = "GCDXCHLP"; //GalaChain Decentralised Exchange Liquidity Pool

  @ChainKey({ position: 0 })
  @IsString()
  public readonly token0: string;

  @ChainKey({ position: 1 })
  @IsString()
  public readonly token1: string;

  @ChainKey({ position: 2 })
  @EnumProperty(DexFeePercentageTypes)
  public readonly fee: DexFeePercentageTypes;

  @ValidateNested()
  @Type(() => TokenClassKey)
  public readonly token0ClassKey: TokenClassKey;

  @ValidateNested()
  @Type(() => TokenClassKey)
  public readonly token1ClassKey: TokenClassKey;

  @JSONSchema({
    description:
      "An object where each key is a tick index and each value is a 256-bit binary string indicating which ticks are active."
  })
  @IsStringRecord()
  public bitmap: Record<string, string>;

  @BigNumberProperty()
  public sqrtPrice: BigNumber;

  @BigNumberProperty()
  public liquidity: BigNumber;

  @BigNumberIsNotNegative()
  @BigNumberProperty()
  public grossPoolLiquidity: BigNumber;

  @BigNumberProperty()
  public feeGrowthGlobal0: BigNumber;

  @BigNumberProperty()
  public feeGrowthGlobal1: BigNumber;

  @BigNumberProperty()
  public maxLiquidityPerTick: BigNumber;

  @IsNumber()
  public tickSpacing: number;

  @IsNumber()
  public protocolFees: number;

  @BigNumberProperty()
  public protocolFeesToken0: BigNumber;

  @BigNumberProperty()
  public protocolFeesToken1: BigNumber;

  /**
   * @dev Creates and initializes a new Pool with a given sqrtPrice.
   * @param token0 TokenKey0 used to create a composite key for the pool.
   * @param token1 TokenKey1 used to create a composite key for the pool.
   * @param token0ClassKey Token class key to identify token0.
   * @param token1ClassKey Token class key to identify token1.
   * @param fee Fee parameter that determines the pool's fee structure and tick spacing.
   * @param initialSqrtPrice Initial square root price for the V3 pool.
   */
  constructor(
    token0: string,
    token1: string,
    token0ClassKey: TokenClassKey,
    token1ClassKey: TokenClassKey,
    fee: DexFeePercentageTypes,
    initialSqrtPrice: BigNumber,
    protocolFees = 0
  ) {
    super();
    this.token0 = token0;
    this.token1 = token1;
    this.token0ClassKey = token0ClassKey;
    this.token1ClassKey = token1ClassKey;
    this.fee = fee;
    this.bitmap = {};

    this.sqrtPrice = initialSqrtPrice;
    this.liquidity = new BigNumber(0);
    this.grossPoolLiquidity = new BigNumber(0);
    this.feeGrowthGlobal0 = new BigNumber(0);
    this.feeGrowthGlobal1 = new BigNumber(0);
    this.tickSpacing = feeAmountTickSpacing[fee];
    this.maxLiquidityPerTick = tickSpacingToMaxLiquidityPerTick(this.tickSpacing);

    if (protocolFees < 0 || protocolFees > 1) {
      throw new ValidationFailedError(`Protocol fees must be between 0 and 1 but is ${protocolFees}`);
    }
    this.protocolFees = protocolFees;
    this.protocolFeesToken0 = new BigNumber(0);
    this.protocolFeesToken1 = new BigNumber(0);
  }

  /**
   * @dev Effect some changes to a position
   * @param position The Dex position that is being updated here
   * @param tickLowerData The tick data of the lower tick of the position's tick range
   * @param tickUpperData The tick data of the upper tick of the position's tick range
   * @param liquidityDelata The amount of liquidity to change in the position
   * @return amount0 the amount of token0 owed to the pool, negative if the pool should pay the recipient
   * @return amount1 the amount of token1 owed to the pool, negative if the pool should pay the recipient
   */
  private _modifyPosition(
    position: DexPositionData,
    tickLowerData: TickData,
    tickUpperData: TickData,
    liquidityDelta: BigNumber
  ): BigNumber[] {
    const tickLower = tickLowerData.tick;
    const tickUpper = tickUpperData.tick;

    //tick to Price
    const sqrtPriceLower = tickToSqrtPrice(tickLower);
    const sqrtPriceUpper = tickToSqrtPrice(tickUpper);
    const tickCurrent = sqrtPriceToTick(this.sqrtPrice);

    // Common checks for valid tick input
    checkTicks(tickLower, tickUpper);

    this._updatePosition(position, tickLowerData, tickUpperData, liquidityDelta, tickCurrent);

    //amounts of tokens required to provided given liquidity
    let amount0Req = new BigNumber(0),
      amount1Req = new BigNumber(0);

    if (!liquidityDelta.isEqualTo(0)) {
      // Update gross pool liquidity
      this.grossPoolLiquidity = this.grossPoolLiquidity.plus(
        liquidityDelta.multipliedBy(Math.abs(tickUpper - tickLower))
      );
      //current tick is below the desired range
      if (this.sqrtPrice.isLessThan(sqrtPriceLower))
        amount0Req = getAmount0Delta(sqrtPriceLower, sqrtPriceUpper, liquidityDelta);
      //current tick is in the desired range
      else if (this.sqrtPrice.isLessThan(sqrtPriceUpper)) {
        amount0Req = getAmount0Delta(this.sqrtPrice, sqrtPriceUpper, liquidityDelta);
        amount1Req = getAmount1Delta(sqrtPriceLower, this.sqrtPrice, liquidityDelta);
        //liquidity is added to the active liquidity
        this.liquidity = this.liquidity.plus(liquidityDelta);
        requirePosititve(this.liquidity);
      }
      //current tick is above the desired range
      else amount1Req = getAmount1Delta(sqrtPriceLower, sqrtPriceUpper, liquidityDelta);
    }
    return [amount0Req, amount1Req];
  }

  /**
   * @dev Gets and updates a position with the given liquidity delta
   * @param position The Dex position that is being updated here
   * @param tickLowerData the tick data of the lower tick of the position's tick range
   * @param tickUpperData the tick data of the upper tick of the position's tick range
   * @param tickCurrent the current tick
   */

  public _updatePosition(
    position: DexPositionData,
    tickLowerData: TickData,
    tickUpperData: TickData,
    liquidityDelta: BigNumber,
    tickCurrent: number
  ) {
    const tickLower = tickLowerData.tick;
    const tickUpper = tickUpperData.tick;
    if (!liquidityDelta.isEqualTo(0)) {
      //update ticks
      const flippedLower = tickLowerData.updateTick(
        tickCurrent,
        liquidityDelta,
        false,
        this.feeGrowthGlobal0,
        this.feeGrowthGlobal1,
        this.maxLiquidityPerTick
      );
      const flippedUpper = tickUpperData.updateTick(
        tickCurrent,
        liquidityDelta,
        true,
        this.feeGrowthGlobal0,
        this.feeGrowthGlobal1,
        this.maxLiquidityPerTick
      );

      //flip ticks if needed
      if (flippedLower) flipTick(this.bitmap, tickLower, this.tickSpacing);
      if (flippedUpper) flipTick(this.bitmap, tickUpper, this.tickSpacing);
    }

    //calculate fee growth inside the range
    const [feeGrowthInside0, feeGrowthInside1] = getFeeGrowthInside(
      tickLowerData,
      tickUpperData,
      tickCurrent,
      this.feeGrowthGlobal0,
      this.feeGrowthGlobal1
    );

    //Update position
    position.updatePosition(liquidityDelta, feeGrowthInside0, feeGrowthInside1);
  }

  /**
   * @notice Adds liquidity for the given recipient/tickLower/tickUpper position
   * @param position The Dex position that is being updated here
   * @param tickLowerData The tick data of the lower tick of the position in which to add liquidity
   * @param tickUpperData The tick data of the upper tick of the position in which to add liquidity
   * @param liquidity The amount of liquidity to mint
   * @return amount0 The amount of token0 that was paid to mint the given amount of liquidity
   * @return amount1 The amount of token1 that was paid to mint the given amount of liquidity
   */
  public mint(
    position: DexPositionData,
    tickLowerData: TickData,
    tickUpperData: TickData,
    liquidity: BigNumber
  ): BigNumber[] {
    if (liquidity.isEqualTo(0)) throw new ValidationFailedError("Invalid Liquidity");

    const [amount0Req, amount1Req] = this._modifyPosition(position, tickLowerData, tickUpperData, liquidity);

    return [amount0Req, amount1Req];
  }

  /**
   * @notice Burn liquidity from the sender and account tokens owed for the liquidity to the position
   * @dev Can be used to trigger a recalculation of fees owed to a position by calling with an amount of 0
   * @dev Fees must be collected separately via a call to #collect
   * @param position The Dex position that is being updated here
   * @param tickLowerData The tick data of the lower tick of the position for which to burn liquidity
   * @param tickUpperData The tick data of the upper tick of the position for which to burn liquidity
   * @param amount How much liquidity to burn
   * @return amount0 The amount of token0 sent to the recipient
   * @return amount1 The amount of token1 sent to the recipient
   */
  public burn(
    position: DexPositionData,
    tickLowerData: TickData,
    tickUpperData: TickData,
    amount: BigNumber
  ): BigNumber[] {
    let [amount0, amount1] = this._modifyPosition(
      position,
      tickLowerData,
      tickUpperData,
      amount.multipliedBy(-1)
    );

    amount0 = amount0.abs();
    amount1 = amount1.abs();

    return [amount0, amount1];
  }

  /**
   * @dev It will estimate the tokens required to add liquidity
   * @param amount Amount for which one wants estimation
   * @param tickLowerData The tick data of the lower tick of the position for which to add liquidity
   * @param tickUpperData The tick data of the upper tick of the position for which to add liquidity
   * @param isToken0 Is the amount for token0
   * @return amount0 The amount of token0 are required to add liquidity
   * @return amount1 The amount of token1 are required to add liquidity
   * @return liquidity The amount of liquidity that it consist of
   */
  public getAmountForLiquidity(
    amount: BigNumber,
    tickLower: number,
    tickUpper: number,
    isToken0: boolean
  ): BigNumber[] {
    const sqrtPriceLower = tickToSqrtPrice(tickLower);
    const sqrtPriceUpper = tickToSqrtPrice(tickUpper);
    const tickCurrent = sqrtPriceToTick(this.sqrtPrice);
    let liquidity: BigNumber;
    let res: BigNumber[];
    if (BigNumber(amount).isZero()) throw new ValidationFailedError("You cannot add zero liqudity");
    if (tickCurrent >= tickLower && tickCurrent < tickUpper) {
      liquidity = isToken0
        ? liquidity0(amount, this.sqrtPrice, sqrtPriceUpper)
        : liquidity1(amount, sqrtPriceLower, this.sqrtPrice);
      res = [
        isToken0 ? amount : getAmount0Delta(this.sqrtPrice, sqrtPriceUpper, liquidity),
        isToken0 ? getAmount1Delta(sqrtPriceLower, this.sqrtPrice, liquidity) : amount,
        liquidity
      ];
    } else if (tickCurrent < tickLower) {
      if (!isToken0) {
        throw new ValidationFailedError("Wrong values");
      }
      res = [amount, new BigNumber(0), liquidity0(amount, sqrtPriceLower, sqrtPriceUpper)];
    } else {
      if (isToken0) {
        throw new ValidationFailedError("Wrong values");
      }
      res = [new BigNumber(0), amount, liquidity1(amount, sqrtPriceLower, sqrtPriceUpper)];
    }
    return res;
  }

  /**
   * @dev this will change the Protocol fee of the pool
   * @param protocolFees Percentage of protocol fees that needs to be deducted
   */
  public configureProtocolFee(protocolFees: number) {
    if (protocolFees < 0 || protocolFees > 1) {
      throw new ValidationFailedError(`Protocol fees must be between 0 and 1 but is ${protocolFees}`);
    }
    this.protocolFees = protocolFees;
    return this.protocolFees;
  }

  /**
   * @dev this will bring the state of protocolFeesTokens and reset them to 0
   * @returns [protocolFeeToken0,protocolFeesToken1]
   */
  public collectProtocolFees() {
    const protocolFeesToken0 = this.protocolFeesToken0,
      protocolFeesToken1 = this.protocolFeesToken1;
    this.protocolFeesToken0 = new BigNumber(0);
    this.protocolFeesToken1 = new BigNumber(0);
    return [protocolFeesToken0, protocolFeesToken1];
  }
  /**
   *
   * @param position The Dex position that is being updated here
   * @param tickLowerData The tick data of the lower tick of the position for which to collect fee accumulated
   * @param tickUpperData The tick data of the upper tick of the position for which to collect fee accumulated
   * @param amount0Requested amount0 The amount of token0 sent to be collected by the recipient
   * @param amount1Requested amount1 The amount of token1 sent to be collected by the recipient
   * @returns
   */
  public collect(
    position: DexPositionData,
    tickLowerData: TickData,
    tickUpperData: TickData,
    amount0Requested: BigNumber,
    amount1Requested: BigNumber
  ) {
    if (
      new BigNumber(position.tokensOwed0).lt(amount0Requested) ||
      new BigNumber(position.tokensOwed1).lt(amount1Requested)
    ) {
      const [tokensOwed0, tokensOwed1] = this.getFeeCollectedEstimation(
        position,
        tickLowerData,
        tickUpperData
      );
      if (tokensOwed0.isGreaterThan(0) || tokensOwed1.isGreaterThan(0)) {
        position.tokensOwed0 = new BigNumber(position.tokensOwed0).plus(tokensOwed0);
        position.tokensOwed1 = new BigNumber(position.tokensOwed1).plus(tokensOwed1);
      }
    }
    if (
      new BigNumber(position.tokensOwed0).lt(amount0Requested) ||
      new BigNumber(position.tokensOwed1).lt(amount1Requested)
    ) {
      throw new ConflictError("Less balance accumulated");
    }
    position.tokensOwed0 = new BigNumber(position.tokensOwed0).minus(amount0Requested);
    position.tokensOwed1 = new BigNumber(position.tokensOwed1).minus(amount1Requested);

    return [amount0Requested, amount1Requested];
  }

  /**
   * @dev it will give Estimation for the tokens collected due swaps
   * @param position The Dex position that is being updated here
   * @param tickLowerData The tick data of the lower tick of the position for which to collect fee accumulated
   * @param tickUpperData The tick data of the upper tick of the position for which to collect fee accumulated
   * @returns the amount of tokens that this position have accumulated as its fees
   */
  public getFeeCollectedEstimation(
    position: DexPositionData,
    tickLowerData: TickData,
    tickUpperData: TickData
  ) {
    // Calculate total fees accumulated in given tick range
    const tickCurrent = sqrtPriceToTick(this.sqrtPrice);
    const [feeGrowthInside0, feeGrowthInside1] = getFeeGrowthInside(
      tickLowerData,
      tickUpperData,
      tickCurrent,
      this.feeGrowthGlobal0,
      this.feeGrowthGlobal1
    );

    // Calculate fees accumulated for this position
    const tokensOwed0 = feeGrowthInside0
      .minus(new BigNumber(position.feeGrowthInside0Last))
      .times(new BigNumber(position.liquidity));
    const tokensOwed1 = feeGrowthInside1
      .minus(new BigNumber(position.feeGrowthInside1Last))
      .times(new BigNumber(position.liquidity));

    // Update position to track its last fee collection
    position.feeGrowthInside0Last = feeGrowthInside0;
    position.feeGrowthInside1Last = feeGrowthInside1;

    return [tokensOwed0, tokensOwed1];
  }

  /**
   * @dev returns a hash that is unique to this pool
   * @returns poolHash
   */
  public genPoolHash() {
    const hashingString = [this.token0, this.token1, this.fee].join();
    return keccak256(hashingString);
  }

  /**
   * @dev returns service address which holds the pool's liquidity
   * @returns poolAlias
   */
  public getPoolAlias() {
    return `service|pool_${this.genPoolHash()}`;
  }

  /**
   * Estimates the amount of token0 and token1 required to burn a given liquidity amount
   * within a specified tick range.
   *
   * @param liquidityDelta - The amount of liquidity to be removed (burned).
   * @param tickLowerData - Tick data of the lower tick boundary of the burn range.
   * @param tickUpperData - Tick data of the upper tick boundary of the burn range.
   * @returns A tuple containing:
   *  - amount0Req: The estimated amount of token0 to be burned.
   *  - amount1Req: The estimated amount of token1 to be burned.
   */
  public burnEstimate(
    liquidityDelta: BigNumber,
    tickLower: number,
    tickUpper: number
  ): [amount0Req: BigNumber, amount1Req: BigNumber] {
    const sqrtPriceLower = tickToSqrtPrice(tickLower);
    const sqrtPriceUpper = tickToSqrtPrice(tickUpper);

    let amount0Req: BigNumber = new BigNumber(0),
      amount1Req: BigNumber = new BigNumber(0);

    if (!liquidityDelta.isEqualTo(0)) {
      //current tick is below the desired range
      if (this.sqrtPrice.isLessThan(sqrtPriceLower))
        amount0Req = getAmount0Delta(sqrtPriceLower, sqrtPriceUpper, liquidityDelta);
      //current tick is in the desired range
      else if (this.sqrtPrice.isLessThan(sqrtPriceUpper)) {
        amount0Req = getAmount0Delta(this.sqrtPrice, sqrtPriceUpper, liquidityDelta);
        amount1Req = getAmount1Delta(sqrtPriceLower, this.sqrtPrice, liquidityDelta);
      }
      //current tick is above the desired range
      else amount1Req = getAmount1Delta(sqrtPriceLower, sqrtPriceUpper, liquidityDelta);
    }
    return [amount0Req, amount1Req];
  }

  /**
   * Performs a swap based on the specified amount and direction, updating global state.
   *
   * @param zeroForOne - Boolean indicating the swap direction (true for token0 -> token1, false for token1 -> token0).
   * @param state - The current state of the swap, including price, liquidity, fee growth, and protocol fees.
   * @param amountSpecified - The amount specified for the swap.
   * @returns A tuple of [amount0, amount1] representing the swap amounts for token0 and token1.
   */
  public swap(
    zeroForOne: boolean,
    state: SwapState,
    amountSpecified: BigNumber
  ): [amount0: BigNumber, amount1: BigNumber] {
    const exactInput = amountSpecified.isGreaterThan(0);

    // update to new price
    this.sqrtPrice = state.sqrtPrice;

    // Updating global liquidity
    if (this.liquidity != state.liquidity) this.liquidity = state.liquidity;

    // Update fee growth global
    if (zeroForOne) {
      this.feeGrowthGlobal0 = state.feeGrowthGlobalX;
      if (state.protocolFee.gt(new BigNumber(0)))
        this.protocolFeesToken0 = this.protocolFeesToken0.plus(state.protocolFee);
    } else {
      this.feeGrowthGlobal1 = state.feeGrowthGlobalX;
      if (state.protocolFee.gt(new BigNumber(0)))
        this.protocolFeesToken1 = this.protocolFeesToken1.plus(state.protocolFee);
    }

    // Calculate and return swap amounts
    const amount0: BigNumber =
      zeroForOne == exactInput
        ? new BigNumber(amountSpecified).minus(state.amountSpecifiedRemaining)
        : state.amountCalculated;
    const amount1: BigNumber =
      zeroForOne == exactInput
        ? new BigNumber(state.amountCalculated)
        : new BigNumber(amountSpecified).minus(state.amountSpecifiedRemaining);

    return [amount0, amount1];
  }
}

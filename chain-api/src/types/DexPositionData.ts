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
import { IsInt, IsNotEmpty, IsString, Max, Min, ValidateNested } from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import { ChainKey, requirePosititve } from "../utils";
import { BigNumberIsNotNegative, BigNumberProperty, EnumProperty, IsLessThan } from "../validators";
import { ChainObject } from "./ChainObject";
import { DexFeePercentageTypes } from "./DexDtos";
import { TickData } from "./TickData";
import { TokenClassKey } from "./TokenClass";

@JSONSchema({
  description:
    `Represents a liquidity position in a decentralized exchange (DEX) pool.` +
    `Each position is associated with a unique NFT and defined by tick boundaries, liquidity amount, and fee tracking information.`
})
export class DexPositionData extends ChainObject {
  @Exclude()
  static INDEX_KEY = "GCDXCHLPDA"; //GalaChain Decentralised Exchange Liqudiity Position Data

  @ChainKey({ position: 0 })
  @IsNotEmpty()
  @IsString()
  poolHash: string;

  @ChainKey({ position: 1 })
  @IsInt()
  @Max(TickData.MAX_TICK)
  tickUpper: number;

  @ChainKey({ position: 2 })
  @IsInt()
  @Min(TickData.MIN_TICK)
  @IsLessThan("tickUpper")
  tickLower: number;

  @ChainKey({ position: 3 })
  @IsNotEmpty()
  @IsString()
  positionId: string;

  @BigNumberIsNotNegative()
  @BigNumberProperty()
  liquidity: BigNumber;

  @BigNumberProperty()
  feeGrowthInside0Last: BigNumber;

  @BigNumberProperty()
  feeGrowthInside1Last: BigNumber;

  @BigNumberIsNotNegative()
  @BigNumberProperty()
  tokensOwed0: BigNumber;

  @BigNumberIsNotNegative()
  @BigNumberProperty()
  tokensOwed1: BigNumber;

  @ValidateNested()
  @Type(() => TokenClassKey)
  public readonly token0ClassKey: TokenClassKey;

  @ValidateNested()
  @Type(() => TokenClassKey)
  public readonly token1ClassKey: TokenClassKey;

  @EnumProperty(DexFeePercentageTypes)
  public readonly fee: DexFeePercentageTypes;

  /**
   * Initializes a new instance of the pool position.
   *
   * @param poolHash - Unique identifier for the pool.
   * @param positionId - Unique identifier for this position.
   * @param tickUpper - Upper tick boundary for the position.
   * @param tickLower - Lower tick boundary for the position.
   */
  constructor(
    poolHash: string,
    positionId: string,
    tickUpper: number,
    tickLower: number,
    token0ClassKey: TokenClassKey,
    token1ClassKey: TokenClassKey,
    fee: DexFeePercentageTypes
  ) {
    super();
    this.poolHash = poolHash;
    this.positionId = positionId;
    this.tickUpper = tickUpper;
    this.tickLower = tickLower;
    this.liquidity = new BigNumber(0);
    this.feeGrowthInside0Last = new BigNumber(0);
    this.feeGrowthInside1Last = new BigNumber(0);
    this.tokensOwed0 = new BigNumber(0);
    this.tokensOwed1 = new BigNumber(0);
    this.token0ClassKey = token0ClassKey;
    this.token1ClassKey = token1ClassKey;
    this.fee = fee;
  }

  /**
   * Updates the position's liquidity and fee tracking data.
   *
   * @param liquidityDelta - Change in liquidity (can be positive or negative).
   * @param feeGrowthInside0 - Latest accumulated fee growth for token0 within the tick range.
   * @param feeGrowthInside1 - Latest accumulated fee growth for token1 within the tick range.
   */

  public updatePosition(liquidityDelta: BigNumber, feeGrowthInside0: BigNumber, feeGrowthInside1: BigNumber) {
    // Calculate and validate change in liquidity
    let liquidityNext: BigNumber;
    if (liquidityDelta.isEqualTo(0)) {
      liquidityNext = this.liquidity;
    } else {
      liquidityNext = this.liquidity.plus(liquidityDelta);
      requirePosititve(liquidityNext);
    }

    // Calculate accumulated fees
    const tokensOwed0 = feeGrowthInside0.minus(this.feeGrowthInside0Last).times(this.liquidity);
    const tokensOwed1 = feeGrowthInside1.minus(this.feeGrowthInside1Last).times(this.liquidity);

    // Update the position
    if (!liquidityDelta.isEqualTo(0)) this.liquidity = liquidityNext;
    this.feeGrowthInside0Last = feeGrowthInside0;
    this.feeGrowthInside1Last = feeGrowthInside1;

    if (tokensOwed0.isGreaterThan(0) || tokensOwed1.isGreaterThan(0)) {
      this.tokensOwed0 = this.tokensOwed0.plus(tokensOwed0);
      this.tokensOwed1 = this.tokensOwed1.plus(tokensOwed1);
    }
  }
}

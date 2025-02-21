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
import { IsString } from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import { ChainKey } from "../utils";
import { ChainObject } from "./ChainObject";
import { PositionsObject } from "./DexDtos";

JSONSchema({
  description: "Stores all the positions that the user has made in all the uniswap v3 pools."
});
export class UserPosition extends ChainObject {
  @Exclude()
  static INDEX_KEY = "POSITIONS";

  @ChainKey({ position: 0 })
  @IsString()
  public readonly user: string;
  public positions: PositionsObject;

  constructor(user: string) {
    super();
    this.user = user;
    this.positions = {};
  }

  updateOrCreate(poolAddress: string, tickLower: number, tickUpper: number, liquidity: BigNumber) {
    if (!this.positions[poolAddress]) {
      this.positions[poolAddress] = [];
    }

    const poolPositions = this.positions[poolAddress];
    const existingPosition = poolPositions.find(
      (e) => e.tickLower === tickLower && e.tickUpper === tickUpper
    );

    if (existingPosition) {
      existingPosition.liquidity = BigNumber(existingPosition.liquidity).plus(liquidity).toString();
    } else {
      poolPositions.push({
        tickLower,
        tickUpper,
        liquidity: liquidity.toString()
      });
    }
  }

  removeLiquidity(poolAddress: string, tickLower: number, tickUpper: number, liquidity: BigNumber) {
    if (!this.positions[poolAddress]) return;
    const poolPositions = this.positions[poolAddress] || [];
    const posIdx = poolPositions.findIndex((e) => e.tickLower === tickLower && e.tickUpper === tickUpper);
    const existingPosition = poolPositions[posIdx];

    if (existingPosition) {
      if (BigNumber(existingPosition.liquidity).gte(liquidity)) {
        existingPosition.liquidity = BigNumber(existingPosition.liquidity).minus(liquidity).toString();
      }
    }
  }

  deletePosition(poolAddress: string, tickLower: number, tickUpper: number) {
    if (!this.positions[poolAddress]) return;
    const poolPositions = this.positions[poolAddress] || [];
    const posIdx = poolPositions.findIndex((e) => e.tickLower === tickLower && e.tickUpper === tickUpper);
    const existingPosition = poolPositions[posIdx];
    if (existingPosition) {
      poolPositions[posIdx] = poolPositions[poolPositions.length - 1];
      poolPositions.pop();
    }
    if (poolPositions.length === 0) {
      delete this.positions[poolAddress];
    }
  }
}

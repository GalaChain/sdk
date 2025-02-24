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
import { Exclude } from "class-transformer";
import { IsNumber, Max, Min } from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import { ChainObject } from "./ChainObject";

@JSONSchema({
  description: "Defines the platform fee and owner allocation percentages."
})
export class LaunchpadFinalizeFeeAllocation extends ChainObject {
  @Exclude()
  static INDEX_KEY = "GCLFFA"; //GalaChain Launchpad Final Fee Allocatoin

  @IsNumber()
  @Min(0)
  @Max(1)
  public platformFeePercentage: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  public ownerAllocationPercentage: number;

  public liquidityAllocationPercentage: number;

  constructor(platformFeePercentage: number, ownerAllocationPercentage: number) {
    super();
    const total = platformFeePercentage + ownerAllocationPercentage;
    if (total > 1) {
      throw new Error("Total allocation (Platform Fee + Owner Allocation) cannot exceed 1.");
    }

    this.platformFeePercentage = platformFeePercentage;
    this.ownerAllocationPercentage = ownerAllocationPercentage;

    const liquidity = 1 - total;
    this.liquidityAllocationPercentage = Number(Math.max(liquidity, 0).toFixed(5));
  }

  public setAllocation(platformFee: number, ownerAllocation: number) {
    const total = platformFee + ownerAllocation;
    if (total > 1) {
      throw new Error("Total allocation (Platform Fee + Owner Allocation) cannot exceed 1.");
    }

    this.platformFeePercentage = platformFee;
    this.ownerAllocationPercentage = ownerAllocation;

    const liquidity = 1 - total;
    this.liquidityAllocationPercentage = Number(Math.max(liquidity, 0).toFixed(5)); // Ensure it doesn't go negative
  }
}

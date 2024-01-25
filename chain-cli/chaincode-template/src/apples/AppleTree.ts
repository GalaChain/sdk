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
  BigNumberProperty,
  ChainKey,
  ChainObject,
  DefaultError,
  NotFoundError,
  StringEnumProperty
} from "@gala-chain/api";
import BigNumber from "bignumber.js";
import { Exclude } from "class-transformer";
import { IsString } from "class-validator";

import { Variety } from "./types";

export class AppleTree extends ChainObject {
  @Exclude()
  static INDEX_KEY = "GCAPPL";

  @ChainKey({ position: 0 })
  @IsString()
  public readonly plantedBy: string;

  @ChainKey({ position: 1 })
  @StringEnumProperty(Variety)
  public readonly variety: Variety;

  @ChainKey({ position: 2 })
  public readonly index: number;

  public readonly plantedAt: number;

  @BigNumberProperty()
  public applesPicked: BigNumber;

  constructor(plantedBy: string, variety: Variety, index: number, plantedAt: number) {
    super();
    this.plantedBy = plantedBy;
    this.variety = variety;
    this.index = index;
    this.plantedAt = plantedAt;
    this.applesPicked = new BigNumber(0);
  }

  public ageInYears(now: number): BigNumber {
    if (this.plantedAt > now) {
      throw new DefaultError("Tree planted in the future", { plantedAt: this.plantedAt, now });
    }

    return new BigNumber(now - this.plantedAt)
      .dividedBy(365 * 24 * 60 * 60 * 1000)
      .integerValue(BigNumber.ROUND_FLOOR);
  }

  public applesTotal(now: number): BigNumber {
    const ageInYears = this.ageInYears(now);
    if (ageInYears.isLessThan(1)) {
      return new BigNumber(0);
    }

    return new BigNumber(2).pow(ageInYears.minus(1));
  }

  public canPick(now: number): boolean {
    return this.applesPicked.isLessThan(this.applesTotal(now));
  }

  public ensureCanPick(now: number): { pick(): void } {
    if (!this.canPick(now)) {
      throw new NoApplesLeftError(this.applesPicked, this.applesTotal(now));
    }

    const pick = () => {
      this.applesPicked = this.applesPicked.plus(1);
    };

    return { pick };
  }
}

class NoApplesLeftError extends NotFoundError {
  constructor(total: BigNumber, picked: BigNumber) {
    super(`No apples left to pick. Total: ${total}, picked: ${picked}`);
  }
}

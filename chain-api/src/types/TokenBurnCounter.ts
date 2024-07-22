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
import { BigNumber } from "bignumber.js";
import { Exclude } from "class-transformer";
import { IsDefined, IsNotEmpty } from "class-validator";

import { ChainKey } from "../utils";
import { BigNumberIsInteger, BigNumberIsNotNegative, BigNumberProperty, IsUserAlias } from "../validators";
import { ChainObject } from "./ChainObject";
import { RangedChainObject } from "./RangedChainObject";

export class TokenBurnCounter extends RangedChainObject {
  public static INDEX_KEY = "GCTBRC";

  @ChainKey({ position: 0 })
  @IsNotEmpty()
  public collection: string;

  @ChainKey({ position: 1 })
  @IsNotEmpty()
  public category: string;

  @ChainKey({ position: 2 })
  @IsNotEmpty()
  public type: string;

  @ChainKey({ position: 3 })
  @IsDefined()
  public additionalKey: string;

  @ChainKey({ position: 4 })
  @IsNotEmpty()
  public timeKey: string;

  @ChainKey({ position: 5 })
  @IsUserAlias()
  public burnedBy: string;

  @ChainKey({ position: 6 })
  @IsNotEmpty()
  @BigNumberIsInteger()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  public instance: BigNumber;

  @ChainKey({ position: 7 })
  @IsNotEmpty()
  @BigNumberProperty()
  public totalKnownBurnsCount: BigNumber;

  @IsNotEmpty()
  public created: number;

  @IsNotEmpty()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  public quantity: BigNumber;

  // id of a referenced TokenBurn
  @IsNotEmpty()
  public referenceId: string;

  // todo: revisit epoch as chain key if/when fabric implements it beyond hard-coded 0
  // @ChainKey({ position: 4 })
  @IsNotEmpty()
  public epoch: string;

  @Exclude()
  public referencedBurnId(): string {
    const { collection, category, type, additionalKey, burnedBy, created } = this;

    return ChainObject.getStringKeyFromParts([
      burnedBy,
      collection,
      category,
      type,
      additionalKey,
      burnedBy,
      `${created}`
    ]);
  }
}

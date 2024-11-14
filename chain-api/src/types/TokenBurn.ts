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
import { IsDefined, IsInt, IsNotEmpty, IsPositive } from "class-validator";

import { ChainKey } from "../utils";
import { BigNumberIsInteger, BigNumberIsNotNegative, BigNumberProperty, IsUserAlias } from "../validators";
import { ChainObject } from "./ChainObject";

export class TokenBurn extends ChainObject {
  @Exclude()
  public static INDEX_KEY = "GCTBR";

  @ChainKey({ position: 0 })
  @IsUserAlias()
  public burnedBy: string;

  @ChainKey({ position: 1 })
  @IsNotEmpty()
  public collection: string;

  @ChainKey({ position: 2 })
  @IsNotEmpty()
  public category: string;

  @ChainKey({ position: 3 })
  @IsNotEmpty()
  public type: string;

  @ChainKey({ position: 4 })
  @IsDefined()
  public additionalKey: string;

  @ChainKey({ position: 5 })
  @IsNotEmpty()
  @BigNumberIsInteger()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  public instance: BigNumber;

  @ChainKey({ position: 6 })
  @IsPositive()
  @IsInt()
  public created: number;

  @IsNotEmpty()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  public quantity: BigNumber;
}

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
import { IsDefined, IsInt, IsNotEmpty, IsOptional, IsPositive, Min } from "class-validator";

import { ChainKey } from "../utils";
import {
  BigNumberIsInteger,
  BigNumberIsNotNegative,
  BigNumberIsPositive,
  BigNumberProperty,
  EnumProperty,
  IsUserAlias
} from "../validators";
import { ChainObject } from "./ChainObject";
import { AllowanceType } from "./common";

export class TokenAllowance extends ChainObject {
  @Exclude()
  public static INDEX_KEY = "GCTA";

  @ChainKey({ position: 0 })
  @IsUserAlias()
  public grantedTo: string;

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
  @EnumProperty(AllowanceType)
  public allowanceType: AllowanceType;

  // This would make it hard to find all allowances issued out...
  @ChainKey({ position: 7 })
  @IsUserAlias()
  public grantedBy: string;

  @ChainKey({ position: 8 })
  @IsPositive()
  @IsInt()
  public created: number;

  @IsNotEmpty()
  @BigNumberIsPositive()
  @BigNumberProperty({ allowInfinity: true })
  public uses: BigNumber;

  @BigNumberIsNotNegative()
  @BigNumberIsInteger()
  @BigNumberProperty()
  @IsOptional()
  public usesSpent?: BigNumber;

  @Min(0)
  @IsInt()
  public expires: number;

  @IsNotEmpty()
  @BigNumberIsNotNegative()
  @BigNumberProperty({ allowInfinity: true })
  public quantity: BigNumber;

  @BigNumberIsNotNegative()
  @BigNumberProperty()
  @IsOptional()
  public quantitySpent?: BigNumber;
}

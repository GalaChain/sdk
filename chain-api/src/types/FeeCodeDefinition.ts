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
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

import { ChainKey } from "../utils";
import { BigNumberIsInteger, BigNumberIsNotNegative, BigNumberProperty, EnumProperty } from "../validators";
import { ChainObject } from "./ChainObject";

export enum FeeAccelerationRateType {
  CuratorDefined = 0,
  // optional? todo: define mathematically increasing fee schedules
  Additive = 1,
  Multiplicative = 2,
  Exponential = 3,
  Logarithmic = 4,
  Custom = 5
}

export class FeeCodeDefinition extends ChainObject {
  public static INDEX_KEY = "GCFD";
  public static DECIMAL_PRECISION = 8;

  @ChainKey({ position: 0 })
  @IsString()
  @IsNotEmpty()
  public feeCode: string;

  @ChainKey({ position: 1 })
  @BigNumberIsNotNegative()
  @BigNumberIsInteger()
  @BigNumberProperty()
  public feeThresholdUses: BigNumber;

  @IsNumber()
  public feeThresholdTimePeriod: number;

  @BigNumberIsNotNegative()
  @BigNumberProperty()
  public baseQuantity: BigNumber;

  @BigNumberIsNotNegative()
  @BigNumberProperty()
  public maxQuantity: BigNumber;

  @IsOptional()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  public maxUses?: BigNumber;

  @EnumProperty(FeeAccelerationRateType)
  public feeAccelerationRateType: FeeAccelerationRateType;

  @BigNumberProperty()
  public feeAccelerationRate: BigNumber;

  @IsOptional()
  @IsBoolean()
  public isCrossChannel?: boolean;
}

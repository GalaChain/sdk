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
import { ArrayNotEmpty, IsInt, IsNotEmpty, IsNumber, IsOptional, Min, ValidateNested } from "class-validator";

import { ChainKey } from "../utils";
import { BigNumberIsInteger, BigNumberIsPositive, BigNumberProperty, IsUserAlias } from "../validators";
import { ChainObject } from "./ChainObject";
import { TokenInstanceQuantity } from "./TokenInstance";

export class TokenSwapRequest extends ChainObject {
  @ChainKey({ position: 0 })
  @IsNumber()
  public created: number;

  @ChainKey({ position: 1 })
  @IsNotEmpty()
  public txid: string;

  @IsNotEmpty()
  public swapRequestId: string;

  @ValidateNested({ each: true })
  @Type(() => TokenInstanceQuantity)
  @ArrayNotEmpty()
  public offered: Array<TokenInstanceQuantity>;

  @ValidateNested({ each: true })
  @Type(() => TokenInstanceQuantity)
  @ArrayNotEmpty()
  public wanted: Array<TokenInstanceQuantity>;

  @IsOptional()
  @IsUserAlias()
  public offeredTo?: string;

  @IsUserAlias()
  public offeredBy: string;

  @IsNotEmpty() // i.e. not null/undefined, it can be an empty array
  public fillIds: Array<string>;

  @BigNumberIsPositive()
  @BigNumberIsInteger()
  @BigNumberProperty()
  public uses: BigNumber;

  @BigNumberIsPositive()
  @BigNumberIsInteger()
  @BigNumberProperty()
  public usesSpent: BigNumber;

  @Min(0)
  @IsInt()
  public expires: number;

  @Exclude()
  public static INDEX_KEY = "GCTSR";
}

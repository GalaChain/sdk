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
import { Exclude, Type } from "class-transformer";
import { ArrayMinSize, ArrayUnique, IsDefined, IsInt, IsNotEmpty, IsString, Min, ValidateNested } from "class-validator";

import { ChainKey } from "../utils";
import { ChainObject } from "./ChainObject";
import { Allocation } from "./Allocation";

export class VestingToken extends ChainObject {
  @Exclude()
  public static INDEX_KEY = "GCVT";

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

  @IsString()
  vestingName: string;

  @Min(0)
  @IsInt()
  startDate: number;

  @ValidateNested({ each: true })
  @Type(() => Allocation)
  @ArrayMinSize(1)
  @ArrayUnique()
  allocations: Array<Allocation>;
}

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
import { IsDefined, IsNotEmpty } from "class-validator";

import { ChainKey } from "../utils";
import { BigNumberIsInteger, BigNumberIsNotNegative, BigNumberProperty } from "../validators";
import { ChainObject } from "./ChainObject";

export class FeeProperties extends ChainObject {
  public static INDEX_KEY = "GCFP";

  @ChainKey({ position: 0 })
  @IsNotEmpty()
  public id: string;

  @IsNotEmpty()
  public collection: string;

  @IsNotEmpty()
  public category: string;

  @IsNotEmpty()
  public type: string;

  @IsDefined()
  public additionalKey: string;

  @IsNotEmpty()
  @BigNumberIsInteger()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  public instance: BigNumber;
}

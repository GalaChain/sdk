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
import { IsNotEmpty } from "class-validator";

import { ChainKey } from "../utils";
import { BigNumberIsInteger, BigNumberIsNotNegative, BigNumberProperty } from "../validators";
import { ChainObject } from "./ChainObject";

// index class added in long after initial implementation to faciliate targeted query of TokenSwapRequests
// query by TokenClass / TokenInstance keys, get swapRequestId properties for FillTokenSwap calls
// As a user, I want to see all swaps that want TokenClass foo, so that I can trade/sell one
export class TokenSwapRequestInstanceWanted extends ChainObject {
  @Exclude()
  public static INDEX_KEY = "GCTSRIW";

  @ChainKey({ position: 0 })
  @IsNotEmpty()
  public collection: string;

  @ChainKey({ position: 1 })
  public category: string;

  @ChainKey({ position: 2 })
  @IsNotEmpty()
  public type: string;

  @ChainKey({ position: 3 })
  @IsNotEmpty()
  public additionalKey: string;

  @ChainKey({ position: 4 })
  @IsNotEmpty()
  @BigNumberIsInteger()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  public instance: BigNumber;

  @ChainKey({ position: 5 })
  @IsNotEmpty()
  public swapRequestId: string;
}

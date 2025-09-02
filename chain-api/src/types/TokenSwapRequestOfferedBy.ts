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
import { IsNotEmpty } from "class-validator";

import { ChainKey } from "../utils";
import { IsUserAlias } from "../validators";
import { ChainObject } from "./ChainObject";

// index class added in long after initial implementation to faciliate targeted query of TokenSwapRequests
// query by owner keys, get swapRequestId properties for FillTokenSwap calls
// As a user, I want to see a list of all my offers, so I can optionally close/cancel/terminate one or more
export class TokenSwapRequestOfferedBy extends ChainObject {
  @Exclude()
  public static INDEX_KEY = "GCTSROB";

  @ChainKey({ position: 0 })
  @IsUserAlias()
  public offeredBy: string;

  @ChainKey({ position: 1 })
  @IsNotEmpty()
  public swapRequestId: string;
}

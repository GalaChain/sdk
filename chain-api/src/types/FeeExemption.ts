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
import { IsUserAlias } from "../validators";
import { ChainKey } from "../utils";
import { ChainObject } from "./ChainObject";

import { ArrayUnique, IsOptional } from "class-validator";

export class FeeExemption extends ChainObject {
  public static INDEX_KEY = "GCFE"; // GalaChain Fee Exemption

  @ChainKey({ position: 0 })
  @IsUserAlias()
  public user: string;

  @IsOptional()
  @ArrayUnique()
  public limitedTo?: string[];
}

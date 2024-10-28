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
import { IsBoolean, IsDefined, IsNotEmpty, IsOptional } from "class-validator";

import { ChainKey } from "../utils";
import { ChainObject } from "./ChainObject";
import { IsBigNumber } from "../validators";

/**
 * @description
 *
 * Configure mint configurations for specific token classes.
 * The chain key properties are expected to match a token
 * class.
 *
 * On mint actions, the `@GalaTransaction` decorator's
 * `before` and/or `after`
 * property can potentially be configured with custom functions
 * that will look for these configuration options.
 *
 * If present,  they can execute myriad additional actions
 * atomically with the mint, such as post-mint fees,
 * nft crafting (e.g. burn three common parts to assemble one rare) etc.
 *
 */
export class TokenMintConfiguration extends ChainObject {
  public static INDEX_KEY = "GCTMC"; // GalaChain Token Mint Configuration

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

  /**
   * @description
   *
   * (optional) set as `true` to configure a specific
   * token class to potentially burn some amount of
   * minted quantity post-mint.
   *
   * @remarks
   *
   * Use in conjucntion with `FeeCodeDefintion` chain objects
   * and Fee Exit Gates to set specific amounts and/or percentages
   * to be burned.
   *
   */
  @IsOptional()
  @IsBoolean()
  public postMintBurn?: boolean;

  /**
   * @description
   *
   * (optional) set a quantity to configure a specific
   * token class to lock some amount of
   * minted quantity post-mint.
   *
   * @remarks
   *
   * Use in conjucntion with `FeeCodeDefintion` chain objects
   * and Fee Exit Gates to set specific amounts and/or percentages
   * to be burned.
   *
   */
  @IsOptional()
  @IsBigNumber()
  public postMintLock?: string;
}

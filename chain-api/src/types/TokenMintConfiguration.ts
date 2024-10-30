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
import {
  IsBoolean,
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested
} from "class-validator";

import { ChainKey, ValidationFailedError } from "../utils";
import { IsUserAlias } from "../validators";
import { ChainObject } from "./ChainObject";

/**
 * @description
 *
 * Configure properties that may be used in conjunction with
 * a `TokenMintConfiguration` to lock some percentage of
 * tokens minted as a post-mint action.
 *
 */
export class PostMintLockConfiguration extends ChainObject {
  /**
   * @description
   *
   * This property will be used to create the `name` property
   * of the `TokenHold` created on the user's balance.
   *
   */
  @IsNotEmpty()
  lockName: string;

  /**
   * @description
   *
   * This property will be used to create the `lockAuthority`
   * property of the `TokenHold` created on the user's balance.
   *
   */
  @IsNotEmpty()
  @IsUserAlias()
  lockAuthority: string;

  /**
   * @description
   *
   * This value will be used to set the `expires` property of
   * the `TokenHold` property created on the user's balance.
   *
   * It will be added to the GalaChainContext.txUnixTime value
   * which, at the time of this writing (Oct 2024), is
   * represented in milliseconds.
   *
   * @example
   *
   * 2592000000 = 30 days (1000 * 60 * 60 * 24 * 30)
   */
  @IsNumber()
  @IsInt()
  expirationModifier: number;

  /**
   * @description
   *
   * Set the percentage of tokens that should be locked,
   * post-mint.
   *
   * @example
   *
   * 0.25 = 25%
   */
  @IsNumber()
  @Min(0)
  @Max(1)
  lockPercentage: number;
}

/**
 * @description
 *
 * Configure properties that may be used in conjunction with
 * a `TokenMintConfiguration` to specify a pre-mint or post-mint
 * burn of the token quantity being minted as part of the
 * mint action.
 */
export class BurnToMintConfiguration extends ChainObject {
  /**
   * @description
   *
   * Percentage of tokens to be burned in conjunction with each
   * mint action, expressed as a value between 0 and 1.
   *
   * @example
   *
   * 0.25 = 25%
   */
  @IsNumber()
  @Min(0)
  @Max(1)
  burnPercentage: number;
}

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
   * (optional) specify a `BurnToMintConfiguration` to configure a specific
   * token class to potentially burn some amount of
   * the quantity to-be-minted prior to executing
   * the mint.
   *
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => BurnToMintConfiguration)
  public preMintBurn?: BurnToMintConfiguration;

  /**
   * @description
   *
   * (optional) specify a `BurnToMintConfiguration` to configure a specific
   * token class to potentially burn some amount of
   * minted quantity post-mint.
   *
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => BurnToMintConfiguration)
  public postMintBurn?: BurnToMintConfiguration;

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
  @ValidateNested()
  @Type(() => PostMintLockConfiguration)
  public postMintLock?: PostMintLockConfiguration;

  @Exclude()
  public validatePostProcessingTotals() {
    const burnPercentage: number | undefined = this.postMintBurn?.burnPercentage;
    const lockPercentage: number | undefined = this.postMintLock?.lockPercentage;

    if (burnPercentage !== undefined) {
      const remainderPostBurn = 1 - burnPercentage;

      if (lockPercentage !== undefined && lockPercentage > remainderPostBurn) {
        throw new ValidationFailedError(
          `TokenMintConfiguration specified a combined post-processing total ` +
            `greater than 1 (100%): lockPercentage: ${lockPercentage}, burnPercentage: ${burnPercentage}`
        );
      }
    }
  }
}

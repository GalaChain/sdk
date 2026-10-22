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
import { IsNotEmpty, IsOptional, IsPositive, IsString } from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import { ChainKey } from "../utils";
import { BigNumberIsPositive, BigNumberProperty, IsUserAlias } from "../validators";
import { ChainObject } from "./ChainObject";
import { compositeKeyOmittingUnset } from "./compositeKey";

export class TokenSwapFill extends ChainObject {
  @Exclude()
  public static INDEX_KEY = "GCTSF";

  @ChainKey({ position: 0 })
  @IsNotEmpty()
  public swapRequestId: string;

  @ChainKey({ position: 1 })
  @IsUserAlias()
  public filledBy: string;

  @ChainKey({ position: 2 })
  @JSONSchema({
    description: "Unix epoch timestamp in milliseconds (ms) when this swap fill was recorded."
  })
  @IsPositive()
  public created: number;

  @ChainKey({ position: 3 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @JSONSchema({
    description:
      "Set when the same swap is filled more than once by the same user in one transaction, so each fill has its own key. " +
      "Omitted on the first fill."
  })
  public fillOrdinal?: string;

  public getCompositeKey(): string {
    return compositeKeyOmittingUnset(this, TokenSwapFill.INDEX_KEY, ["fillOrdinal"]);
  }

  @BigNumberIsPositive()
  @BigNumberProperty()
  public uses: BigNumber;
}

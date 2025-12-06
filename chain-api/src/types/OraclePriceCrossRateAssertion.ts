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
import { Type } from "class-transformer";
import { IsNotEmpty, ValidateNested } from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import { ChainKey } from "../utils";
import { ChainObject } from "./ChainObject";
import { OraclePriceAssertion } from "./OraclePriceAssertion";

export class OraclePriceCrossRateAssertion extends ChainObject {
  public static INDEX_KEY = "GCOC"; // GalaChain Oracle Cross-rate

  @JSONSchema({
    description: "Name of the signing authoritative oracle defined on chain."
  })
  @ChainKey({ position: 0 })
  @IsNotEmpty()
  public oracle: string;

  @JSONSchema({
    description: "Signing identity making the assertion within the DTO."
  })
  @ChainKey({ position: 1 })
  @IsNotEmpty()
  public identity: string;

  @ChainKey({ position: 2 })
  @IsNotEmpty()
  public txid: string;

  @JSONSchema({
    description: "Chain key referencing the saved baseToken price assertion"
  })
  @ValidateNested()
  @Type(() => OraclePriceAssertion)
  public baseTokenCrossRate: OraclePriceAssertion;

  @JSONSchema({
    description: "Chain key referencing the saved quote token price assertion"
  })
  @ValidateNested()
  @Type(() => OraclePriceAssertion)
  public quoteTokenCrossRate: OraclePriceAssertion;
}

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
import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, ValidateIf, ValidateNested } from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import { ChainKey } from "../utils";
import { BigNumberProperty } from "../validators";
import { ChainObject } from "./ChainObject";
import { TokenInstanceKey } from "./TokenInstance";

@JSONSchema({
  description:
    "External token/currency definition. Use to specify an external currency that does not have a TokenClass defined on GalaChain."
})
export class ExternalToken extends ChainObject {
  @JSONSchema({
    description: `Name of the external currency, e.g. "Ethereum"`
  })
  @IsNotEmpty()
  public name: string;

  @JSONSchema({
    description: `Symbol of the external currency, e.g. "ETH"`
  })
  public symbol: string;
}

export class OraclePriceAssertion extends ChainObject {
  public static INDEX_KEY = "GCOAP"; // GalaChain Oracle Assertion: Price
  @JSONSchema({
    description: "Name of the signing authoritative oracle defined on chain."
  })
  @ChainKey({ position: 0 })
  @IsNotEmpty()
  public oracle: string;

  @JSONSchema({
    description: "Signing identity making the assertion contained within the DTO."
  })
  @ChainKey({ position: 1 })
  @IsNotEmpty()
  public identity: string;

  @ChainKey({ position: 2 })
  @IsNotEmpty()
  public txid: string;

  @JSONSchema({
    description: "First currency in the described currency pair. Unit of exchange."
  })
  @ValidateIf((assertion) => !!assertion.externalBaseToken)
  @ValidateNested()
  @Type(() => TokenInstanceKey)
  baseToken?: TokenInstanceKey;

  @JSONSchema({
    description:
      "External token representing the first currency in the described currency pair. " +
      "Unit of exchange. Optional, but required if baseToken is not provided."
  })
  @ValidateIf((assertion) => !!assertion.baseToken)
  @ValidateNested()
  @Type(() => ExternalToken)
  externalBaseToken?: ExternalToken;

  @JSONSchema({
    description:
      "Second token/currency in the pair. Token/Currency in which the baseToken is quoted. " +
      "Optional, but required if externalQuoteToken is not provided."
  })
  @ValidateIf((o) => !o.externalQuoteToken)
  @ValidateNested()
  @Type(() => TokenInstanceKey)
  quoteToken?: TokenInstanceKey;

  @JSONSchema({
    description:
      "Second token/currency in the pair. Token/Currency in which the baseToken is quoted. " +
      "Optional, but required if quoteToken is not provided."
  })
  @ValidateIf((o) => !o.quoteToken)
  @ValidateNested()
  @Type(() => ExternalToken)
  externalQuoteToken?: ExternalToken;

  @JSONSchema({
    description: "How much of the quoteToken is needed to purchase one unit of the baseToken."
  })
  @BigNumberProperty()
  exchangeRate: BigNumber;

  @JSONSchema({
    description: "(Optional). Base Token quantity from conversion to/from quote token quantity."
  })
  @IsOptional()
  @BigNumberProperty()
  baseTokenQuantity?: BigNumber;

  @JSONSchema({
    description: "(Optional). Quote token quantity from conversion to/from base token quantity."
  })
  @IsOptional()
  @BigNumberProperty()
  quoteTokenQuantity?: BigNumber;

  @JSONSchema({
    description: "(Optional) Source of price data. Name of Third Party data source."
  })
  @IsOptional()
  @IsNotEmpty()
  source?: string;

  @JSONSchema({
    description: "(Optional) URL referencing source data."
  })
  @IsOptional()
  @IsNotEmpty()
  sourceUrl?: string;

  @JSONSchema({
    description:
      "Unix timestamp representing the date/time at which this price / exchange rate was calculated or estimated."
  })
  @IsNumber()
  timestamp: number;
}

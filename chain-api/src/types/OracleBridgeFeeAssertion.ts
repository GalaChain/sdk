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
import { BigNumberProperty } from "../validators";
import { ChainKey } from "../utils";
import { ChainObject } from "./ChainObject";

import BigNumber from "bignumber.js";
import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, Max, Min, ValidateNested } from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import { OraclePriceAssertion } from "./OraclePriceAssertion";

@JSONSchema({
  description: "Response with signed bridging fee data."
})
export class OracleBridgeFeeAssertion extends ChainObject {
  public static INDEX_KEY = "GCOAB"; // GalaChain Oracle Assertion: Bridge
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
  public signingIdentity: string;

  @ChainKey({ position: 2 })
  @IsNotEmpty()
  public txid: string;

  @JSONSchema({
    description: "Exchange Rate Price Assertion used to calculate Gas Fee"
  })
  @ValidateNested()
  @Type(() => OraclePriceAssertion)
  public galaExchangeRate: OraclePriceAssertion;

  @JSONSchema({
    description:
      "Rounding decimals used for estimatedTotalTxFeeInGala. " +
      "Expected to match $GALA TokenClass.decimals."
  })
  @Min(0)
  @Max(32)
  public galaDecimals: number;

  @JSONSchema({
    description: "Estimated number of gas units required for the transaction."
  })
  @BigNumberProperty()
  public estimatedTxFeeUnitsTotal: BigNumber;

  @JSONSchema({
    description: "Estimated price per unit of gas, as retrieved approximately " + "at the time of assertion."
  })
  @BigNumberProperty()
  public estimatedPricePerTxFeeUnit: BigNumber;

  @JSONSchema({
    description:
      "The sum total of the estimated transaction fee " +
      "denominated in the destinaton chain's native currency, token, or unit. " +
      "The denomination used is identified in the `externalToken` property. " +
      "The unit, currency, and/or token used to denominate the " +
      "`estimatedTotalTxFeeInExternalToken` property is specified in the " +
      "galaExchangeRate.externalQuoteToken property. " +
      "This total is calculated by multiplying the `estimatedTxFeeUnitsTotal` " +
      "times the `estimatedPricePerTxFeeUnit`, and then, if necessary, converting " +
      "the result to the `galaExchangeRate.externalQuoteToken unit denomination.`"
  })
  @BigNumberProperty()
  public estimatedTotalTxFeeInExternalToken: BigNumber;

  @JSONSchema({
    description:
      "Conversion of the estimated transaction fee calculated for the " +
      "destination chain, converted to $GALA, for payment on GalaChain"
  })
  @BigNumberProperty()
  public estimatedTotalTxFeeInGala: BigNumber;

  @JSONSchema({
    description:
      "Unix timestamp representing the date/time at which this assertion " +
      "was calculated and/or estimated."
  })
  @IsNumber()
  timestamp: number;
}

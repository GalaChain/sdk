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
import {
  NotImplementedError,
  ValidationFailedError
} from "../utils";
import { TokenInstanceKey } from "./TokenInstance";

import BigNumber from "bignumber.js";
import { Exclude, Type } from "class-transformer";
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
  ValidateNested
} from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import { ChainCallDTO } from "./dtos";
import { OracleDefinition } from "./OracleDefinition";
import { ExternalToken, OraclePriceAssertion } from "./OraclePriceAssertion";
import { OraclePriceCrossRateAssertion } from "./OraclePriceCrossRateAssertion";

@JSONSchema({
  description: "Save an Oracle definition on chain"
})
export class OracleDefinitionDto extends ChainCallDTO {
  @JSONSchema({
    description: "Name of the oracle. Unique chain key."
  })
  @IsNotEmpty()
  public name: string;

  @JSONSchema({
    description: "Oracle Authorities. On-Chain identities that speak for this Oracle."
  })
  @ArrayUnique()
  public authorities: string[];
}

@JSONSchema({
  description: "Fetch Oracle definitions"
})
export class FetchOracleDefinitionsDto extends ChainCallDTO {
  @JSONSchema({
    description: "(optional). Provide a name key to fetch a specific oracle definition"
  })
  name?: string | undefined;

  @JSONSchema({
    description: "(optional). Bookmark for paginated results"
  })
  bookmark?: string | undefined;

  @JSONSchema({
    description: "(optional). Limit results set."
  })
  limit?: number | undefined;
}

@JSONSchema({
  description: "Fetch Oracle Assertions with pagination"
})
export class FetchOracleAssertionsDto extends ChainCallDTO {
  @JSONSchema({
    description: "(optional). Provide a oracle name key to fetch a specific oracle definition"
  })
  oracle?: string | undefined;

  @JSONSchema({
    description: "(optional). Filter by identity"
  })
  identity?: string | undefined;

  @JSONSchema({
    description: "(optional). Filter by a specific txid"
  })
  txid?: string | undefined;

  @JSONSchema({
    description: "(optional). Bookmark for paginated results"
  })
  bookmark?: string | undefined;

  @JSONSchema({
    description: "(optional). Limit results set."
  })
  limit?: number | undefined;
}

@JSONSchema({
  description: "Paginated response DTO for Oracle definition chain objects."
})
export class FetchOracleDefinitionsResponse extends ChainCallDTO {
  public static DEFAULT_LIMIT = 1000;

  @ValidateNested({ each: true })
  @Type(() => OracleDefinition)
  results: OracleDefinition[];

  @IsOptional()
  @IsString()
  bookmark?: string | undefined;
}

@JSONSchema({
  description: "Price data for exchanging two tokens/currenices signed by an Authoritative Oracle"
})
export class OraclePriceAssertionDto extends ChainCallDTO {
  @JSONSchema({
    description: "Name of the oracle defined on chain."
  })
  @IsNotEmpty()
  public oracle: string;

  @JSONSchema({
    description: "Signing identity making the assertion contained within the DTO."
  })
  @IsNotEmpty()
  public identity: string;

  @JSONSchema({
    description: "First currency in the described currency pair. Unit of exchange."
  })
  @ValidateNested()
  @Type(() => TokenInstanceKey)
  baseToken: TokenInstanceKey;

  @JSONSchema({
    description:
      "Second token/currency in the pair. Token/Currency in which the baseToken is quoted. Optional, but required if externalQuoteToken is not provided."
  })
  @ValidateIf((o) => !!o.externalQuoteToken)
  @ValidateNested()
  @Type(() => TokenInstanceKey)
  quoteToken?: TokenInstanceKey;

  @JSONSchema({
    description:
      "Second token/currency in the pair. Token/Currency in which the baseToken is quoted. Optional, but required if quoteToken is not provided."
  })
  @ValidateIf((o) => !!o.quoteToken)
  @ValidateNested()
  @Type(() => ExternalToken)
  externalQuoteToken?: ExternalToken;

  @JSONSchema({
    description: "How much of the quoteToken is needed to purchase one unit of the baseToken."
  })
  @BigNumberProperty()
  exchangeRate: BigNumber;

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

@JSONSchema({
  description: "Paginated response DTO for OraclePriceAssertions"
})
export class FetchOraclePriceAssertionsResponse extends ChainCallDTO {
  public static DEFAULT_LIMIT = 1000;

  @ValidateNested({ each: true })
  @Type(() => OraclePriceAssertion)
  results: OraclePriceAssertion[];

  @IsOptional()
  @IsString()
  bookmark?: string | undefined;
}

@JSONSchema({
  description: "Cross Rate Exchange price assertion. E.g. compare $GALA to $ETH via price in $USD for each."
})
export class OraclePriceCrossRateAssertionDto extends ChainCallDTO {
  @JSONSchema({
    description: "Name of the oracle defined on chain."
  })
  @IsNotEmpty()
  public oracle: string;

  @JSONSchema({
    description: "Signing identity making the assertion contained within the DTO."
  })
  @IsNotEmpty()
  public identity: string;

  @JSONSchema({
    description: "Cross rate for First currency in the described currency pair. Unit of exchange."
  })
  @ValidateNested()
  @Type(() => OraclePriceAssertionDto)
  baseTokenCrossRate: OraclePriceAssertionDto;

  @JSONSchema({
    description:
      "Cross rate for Second token/currency in the pair. Token/Currency in which the baseToken is quoted."
  })
  @ValidateNested()
  @Type(() => OraclePriceAssertionDto)
  quoteTokenCrossRate: OraclePriceAssertionDto;

  // todo: consider supporting external tokens here as well
  @JSONSchema({
    description:
      "Comparative token used to price both the base and quote tokens in order to calculate an exchange cross-rate."
  })
  @ValidateNested()
  @Type(() => TokenInstanceKey)
  crossRateToken: TokenInstanceKey;

  // todo: maybe we don't require this to be set, we just always calculate it
  // arguably this is duplication, or maybe unnecessary validation steps
  // maybe calculate it and write it in the chain data structure, but don't specify it in the DTO
  // @JSONSchema({
  //   description: "Cross rate for baseToken and quoteToken, calculated from the crossRateToken exchange rates."
  // })
  // @BigNumberProperty()
  // crossRate: BigNumber;

  @Exclude()
  public validateCrossRateTokenKeys() {
    const baseTokenCrossRateToken: TokenInstanceKey | undefined = this.baseTokenCrossRate.quoteToken;
    const quoteTokenCrossRateToken: TokenInstanceKey | undefined = this.quoteTokenCrossRate.quoteToken;

    if (baseTokenCrossRateToken === undefined || quoteTokenCrossRateToken === undefined) {
      throw new NotImplementedError(
        `External token support is not yet implemented for cross rate exchange assertions`
      );
    }

    if (baseTokenCrossRateToken.toStringKey() !== quoteTokenCrossRateToken.toStringKey()) {
      throw new ValidationFailedError(
        `Cross rate validation failed: ` +
          `baseToken cross-quoted in ${baseTokenCrossRateToken.toStringKey()} but ` +
          `quoteToken cross-quoted in ${quoteTokenCrossRateToken.toStringKey()}`
      );
    }
  }

  @Exclude()
  public calculateCrossRate() {
    this.validateCrossRateTokenKeys();

    const quoteTokenCrossRate = this.quoteTokenCrossRate.exchangeRate;
    const baseTokenCrossRate = this.baseTokenCrossRate.exchangeRate;

    const calculatedCrossRate = quoteTokenCrossRate.dividedBy(baseTokenCrossRate);

    return calculatedCrossRate;
  }
  // @Exclude()
  // public validateCrossRate() {
  //   const calculatedCrossRate = this.calculateCrossRate();

  //   if (!this.crossRate.isEqualTo(calculatedCrossRate)) {
  //     throw new ValidationFailedError(
  //       `Asserted cross rate (${this.crossRate} is not equal to calculated cross rate)`
  //     )
  //   }
  // }
}

export class FetchOraclePriceCrossRateAssertionsResponse extends ChainCallDTO {
  public static DEFAULT_LIMIT = 1000;

  @ValidateNested({ each: true })
  @Type(() => OraclePriceCrossRateAssertion)
  results: OraclePriceCrossRateAssertion[];

  @IsOptional()
  @IsString()
  bookmark?: string;
}

export class DeleteOracleAssertionsDto extends ChainCallDTO {
  public static MAX_LIMIT = 1000;

  @ArrayNotEmpty()
  chainKeys: string[];
}

export class DeleteOracleDefinitionDto extends ChainCallDTO {
  @IsNotEmpty()
  name: string;
}

@JSONSchema({
  description: "Response with signed bridging fee data."
})
export class OracleBridgeFeeAssertionDto extends ChainCallDTO {
  @JSONSchema({
    description: "Exchange Rate Price Assertion used to calculate Gas Fee"
  })
  @ValidateNested()
  @Type(() => OraclePriceAssertionDto)
  public galaExchangeRate: OraclePriceAssertionDto;

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

  @JSONSchema({
    description:
      "Oracle identity / alias. Used with signature and GalaChain SDK " +
      "authorize() function for verification/validation."
  })
  @IsNotEmpty()
  signingIdentity: string;
}

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
import { Exclude, Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  Max,
  Min,
  ValidateNested
} from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import { ChainKey, DefaultError, ValidationFailedError } from "../utils";
import { BigNumberIsInteger, BigNumberIsPositive, BigNumberProperty, IsUserAlias } from "../validators";
import { ChainObject } from "./ChainObject";
import { TokenClassKey } from "./TokenClass";
import { TokenInstanceQuantity } from "./TokenInstance";
import { TokenSwapRequest } from "./TokenSwapRequest";
import { AllowanceType } from "./common";
import { ChainCallDTO } from "./dtos";

@JSONSchema({
  description: "Defines a sale token with quantity of tokens to be received"
})
export class TokenSaleQuantity extends ChainCallDTO {
  @JSONSchema({
    description: "Token class key of the token to be sold."
  })
  @ValidateNested()
  @Type(() => TokenClassKey)
  @IsNotEmpty()
  public tokenClassKey: TokenClassKey;

  @JSONSchema({
    description: "Quantity of tokens to be received."
  })
  @IsNotEmpty()
  @BigNumberIsPositive()
  @BigNumberIsInteger()
  @BigNumberProperty()
  public quantity: BigNumber;
}

// Chain objects

@JSONSchema({
  description:
    "Defines a token sale. A sale is a collection of tokens to be sold, and the quantity of each token to be received."
})
export class TokenSale extends ChainObject {
  @JSONSchema({
    description: "Timestamp of when the sale was created"
  })
  @ChainKey({ position: 0 })
  @IsNumber()
  public created: number;

  @JSONSchema({
    description: "Transaction ID"
  })
  @ChainKey({ position: 1 })
  @IsNotEmpty()
  public txid: string;

  @JSONSchema({
    description: "Token sale ID"
  })
  @IsNotEmpty()
  public tokenSaleId: string;

  @JSONSchema({
    description: "Tokens and quantities to be sold"
  })
  @ValidateNested({ each: true })
  @Type(() => TokenSaleQuantity)
  @ArrayNotEmpty()
  public selling: Array<TokenSaleQuantity>;

  @JSONSchema({
    description: "Tokens and quantities to be received"
  })
  @ValidateNested({ each: true })
  @Type(() => TokenInstanceQuantity)
  @ArrayNotEmpty()
  public cost: Array<TokenInstanceQuantity>;

  @JSONSchema({
    description: "User who created the sale"
  })
  @IsUserAlias()
  public owner: string;

  @JSONSchema({
    description: "Ids of each sale fullfillment"
  })
  @IsNotEmpty()
  public fulfillmentIds: Array<string>;

  @JSONSchema({
    description: "Token quantity of items being sold"
  })
  @BigNumberIsPositive()
  @BigNumberIsInteger()
  @BigNumberProperty()
  public quantity: BigNumber;

  @JSONSchema({
    description: "Quantity of items sold"
  })
  @BigNumberIsPositive()
  @BigNumberIsInteger()
  @BigNumberProperty()
  public quantityFulfilled: BigNumber;

  @JSONSchema({
    description: "Timestamp when sale ends"
  })
  @Min(0)
  @IsInt()
  public end: number;

  @JSONSchema({
    description: "Timestamp when sale starts"
  })
  @Min(0)
  @IsInt()
  public start: number;

  @Exclude()
  public static INDEX_KEY = "GCTTS";
}

export class TokenSaleTokenSold extends ChainObject {
  public static INDEX_KEY = `${TokenSale.INDEX_KEY}TS`;

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
  @BigNumberIsPositive()
  @BigNumberIsInteger()
  @BigNumberProperty()
  public quantity: string;

  @ChainKey({ position: 5 })
  @IsNotEmpty()
  public tokenSaleId: string;
}

export class TokenSaleTokenCost extends ChainObject {
  public static INDEX_KEY = `${TokenSale.INDEX_KEY}TC`;

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
  @BigNumberIsPositive()
  @BigNumberIsInteger()
  @BigNumberProperty()
  public quantity: string;

  @ChainKey({ position: 5 })
  @IsNotEmpty()
  public tokenSaleId: string;
}

export class TokenSaleOwner extends ChainObject {
  public static INDEX_KEY = `${TokenSale.INDEX_KEY}O`;

  @ChainKey({ position: 0 })
  @IsUserAlias()
  public owner: string;

  @ChainKey({ position: 1 })
  @IsNotEmpty()
  public tokenSaleId: string;
}

export class TokenSaleMintAllowance extends ChainObject {
  public static INDEX_KEY = `${TokenSale.INDEX_KEY}MA`;

  @ChainKey({ position: 0 })
  @IsNotEmpty()
  public tokenSaleId: string;

  @ChainKey({ position: 1 })
  @IsNotEmpty()
  public allowanceObjectKey: string;
}

export class TokenSaleFulfillment extends ChainObject {
  public static INDEX_KEY = "GCTSF";

  @ChainKey({ position: 0 })
  @IsNotEmpty()
  public tokenSaleId: string;

  @ChainKey({ position: 1 })
  @IsUserAlias()
  public fulfilledBy: string;

  @ChainKey({ position: 2 })
  @IsPositive()
  public created: number;

  @BigNumberIsPositive()
  @BigNumberProperty()
  public quantity: BigNumber;
}

// Chain DTOs

@JSONSchema({
  description:
    "Defines a swap request to be created, i.e. a request when a requester " +
    "offers some tokens to another user in exchange of another tokens."
})
export class CreateTokenSaleDto extends ChainCallDTO {
  static DEFAULT_END = 0;
  static DEFAULT_START = 0;

  @JSONSchema({
    description:
      "User who creates the token sale, typically an authority of the token. " +
      "Optional field, by default set to chaincode calling user."
  })
  @IsOptional()
  @IsUserAlias()
  public owner?: string;

  @JSONSchema({
    description: "A list of offered tokens to be sold."
  })
  @ValidateNested({ each: true })
  @Type(() => TokenSaleQuantity)
  @ArrayMinSize(1)
  @ArrayUnique()
  public selling: Array<TokenSaleQuantity>;

  @JSONSchema({
    description: "A list of tokens to be paid to the seller."
  })
  @ValidateNested({ each: true })
  @Type(() => TokenInstanceQuantity)
  @ArrayMinSize(1)
  @ArrayUnique()
  public cost: Array<TokenInstanceQuantity>;

  @JSONSchema({
    description: "How many sale items can be purchased."
  })
  @BigNumberIsPositive()
  @BigNumberIsInteger()
  @BigNumberProperty()
  public quantity: BigNumber;

  @JSONSchema({
    description:
      "Unix timestamp of the date when the sale should end. 0 means that it won't end. " +
      `By default set to ${CreateTokenSaleDto.DEFAULT_END}.`
  })
  @IsOptional()
  @Min(0)
  @IsInt()
  public end?: number;

  @JSONSchema({
    description:
      "Unix timestamp of the date when the sale should start. 0 means that it starts immediately. " +
      `By default set to ${CreateTokenSaleDto.DEFAULT_START}.`
  })
  public start?: number;
}

@JSONSchema({
  description: "Defines an expected token swap trade, i.e. offered and wanted tokens."
})
export class ExpectedTokenSale extends ChainCallDTO {
  @JSONSchema({
    description:
      "A list of purchasable token classes and quantities. The order of this array must match the order of the TokenSale stored on chain."
  })
  @ValidateNested({ each: true })
  @Type(() => TokenSaleQuantity)
  @ArrayMinSize(1)
  @ArrayUnique()
  public selling: Array<TokenSaleQuantity>;

  @JSONSchema({
    description:
      "A list of cost token classes and quantites. The order of this array must match the order of the TokenSale stored on chain."
  })
  @ValidateNested({ each: true })
  @Type(() => TokenInstanceQuantity)
  @ArrayMinSize(1)
  @ArrayUnique()
  public cost: Array<TokenInstanceQuantity>;
}

@JSONSchema({
  description: "Defines a swap fill object, i.e. a response of another user for a swap request."
})
export class FulfillTokenSaleDto extends ChainCallDTO {
  public static DEFAULT_QUANTITY = new BigNumber(1);

  @JSONSchema({
    description: "Token sale ID to be filled"
  })
  @IsNotEmpty()
  public tokenSaleId: string;

  @JSONSchema({
    description: "Expected token sale to be validated before filling the swap."
  })
  @IsOptional()
  @ValidateNested()
  public expectedTokenSale?: ExpectedTokenSale;

  @JSONSchema({
    description:
      "User who fulfills the sale, an owner of tokens wanted in swap. " +
      "Optional field, by default set to chaincode calling user."
  })
  @IsOptional()
  @IsUserAlias()
  public fulfilledBy?: string;

  @JSONSchema({
    description:
      "How many uses are filled with this swap fill. " +
      `In most cases it will be ${FulfillTokenSaleDto.DEFAULT_QUANTITY}, and this is the default value for it.`
  })
  @IsOptional()
  @BigNumberIsPositive()
  @BigNumberIsInteger()
  @BigNumberProperty()
  public quantity?: BigNumber;
}

export class RemoveTokenSaleDto extends ChainCallDTO {
  @JSONSchema({
    description: "Token sale ID to be removed."
  })
  @IsNotEmpty()
  public readonly tokenSaleId: string;
}

@JSONSchema({
  description:
    "Legacy FetchTokenSwapsDto. Provided created timestamp to limit result, or leave empty to query all swaps."
})
export class FetchTokenSalesWithPaginationDto extends ChainCallDTO {
  static readonly MAX_LIMIT = 10 * 1000;
  static readonly DEFAULT_LIMIT = 1000;

  @JSONSchema({
    description: "(optional). User alias of the creating user."
  })
  @IsOptional()
  @IsUserAlias()
  public owner?: string;

  @JSONSchema({
    description: "Page bookmark. If it is undefined, then the first page is returned."
  })
  @IsOptional()
  @IsNotEmpty()
  bookmark?: string;

  @JSONSchema({
    description:
      `Page size limit. ` +
      `Defaults to ${FetchTokenSalesWithPaginationDto.DEFAULT_LIMIT}, max possible value ${FetchTokenSalesWithPaginationDto.MAX_LIMIT}. ` +
      "Note you will likely get less results than the limit, because the limit is applied before additional filtering."
  })
  @IsOptional()
  @Max(FetchTokenSalesWithPaginationDto.MAX_LIMIT)
  @Min(1)
  @IsInt()
  limit?: number;
}

@JSONSchema({
  description:
    "Response DTO for FetchTokenSwaps{ByInstanceOffered|ByInstanceWanted|OfferedBy|OfferedTo} methods. Supports pagination."
})
export class FetchTokenSalesWithPaginationResponse extends ChainCallDTO {
  @IsOptional()
  public nextPageBookmark?: string | undefined;

  @ValidateNested({ each: true })
  @Type(() => TokenSale)
  public results: TokenSale[];
}

export class FetchTokenSaleByIdDto extends ChainCallDTO {
  @JSONSchema({
    description: "Token sale ID."
  })
  @IsNotEmpty()
  public tokenSaleId: string;
}

@JSONSchema({
  description:
    "Ensure that provided tokenSaleId chain objects have proper supporting index Chain Objects. " +
    "This method permits migration / upgrade of TokenSales written prior to the advent of new index objects " +
    "which were added to support fine-grained querying of TokenSale by client applications. " +
    "The provided tokenSaleIds will be looked up on chain, then their corresponding index Chain objects will be queried and written if necessary."
})
export class EnsureTokenSaleIndexingDto extends ChainCallDTO {
  @ArrayNotEmpty()
  tokenSaleIds: string[];
}

@JSONSchema({
  description:
    "Response DTO for a EnsureTokenSaleIndexing request. If any writes were made, they will be provided in the writes array and noOp will be true."
})
export class EnsureTokenSaleIndexingResponse extends ChainCallDTO {
  @IsBoolean()
  noOp: boolean;

  @ArrayMinSize(0)
  writes: ChainObject[];
}

// Errors

export class TokenSaleDtoValidationError extends ValidationFailedError {
  constructor(dtoName: string, errors: string[]) {
    super(`${dtoName} validation failed: ${errors.join(". ")}`, {
      dtoName,
      errors
    });
  }
}

export class TokenSaleFailedError extends DefaultError {
  constructor(message: string, payload: Record<string, unknown> | undefined) {
    super(`SwapToken failed: ${message}$`, payload);
  }
}

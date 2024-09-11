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
  Max,
  Min,
  ValidateIf,
  ValidateNested
} from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import {
  BigNumberIsInteger,
  BigNumberIsPositive,
  BigNumberProperty,
  IsDifferentValue,
  IsUserAlias
} from "../validators";
import { ChainObject } from "./ChainObject";
import { TokenInstanceQuantity } from "./TokenInstance";
import { TokenSwapRequest } from "./TokenSwapRequest";
import { ChainCallDTO } from "./dtos";

@JSONSchema({
  description:
    "Defines a swap request to be created, i.e. a request when a requester " +
    "offers some tokens to another user in exchange of another tokens."
})
export class RequestTokenSwapDto extends ChainCallDTO {
  static DEFAULT_EXPIRES = 0;

  @JSONSchema({
    description:
      "User who requests the swap, typically an owner of tokens. " +
      "Optional field, by default set to chaincode calling user."
  })
  @IsOptional()
  @IsUserAlias()
  public offeredBy?: string;

  @JSONSchema({
    description: "User who probably has tokens the requester wants."
  })
  @IsDifferentValue("offeredBy", {
    message:
      "offeredBy should be different than offeredTo. " +
      "offeredTo can be optional - e.g. a user is offering a swap to any other user willing to fill it " +
      "and their client id is not known at the time the swap is offered."
  })
  @IsOptional()
  @IsNotEmpty()
  @IsUserAlias()
  public offeredTo?: string;

  @JSONSchema({
    description: "A list of offered token instances."
  })
  @ValidateNested({ each: true })
  @Type(() => TokenInstanceQuantity)
  @ArrayMinSize(1)
  @ArrayUnique()
  public offered: Array<TokenInstanceQuantity>;

  @JSONSchema({
    description: "A list of wanted token instances."
  })
  @ValidateNested({ each: true })
  @Type(() => TokenInstanceQuantity)
  @ArrayMinSize(1)
  @ArrayUnique()
  public wanted: Array<TokenInstanceQuantity>;

  @JSONSchema({
    description: "How many times swap can filled."
  })
  @BigNumberIsPositive()
  @BigNumberIsInteger()
  @BigNumberProperty()
  public uses: BigNumber;

  @JSONSchema({
    description:
      "Unix timestamp of the date when the swap request should expire. 0 means that it won' expire. " +
      `By default set to ${RequestTokenSwapDto.DEFAULT_EXPIRES}.`
  })
  @IsOptional()
  @Min(0)
  @IsInt()
  public expires?: number;
}

@JSONSchema({
  description: "Defines an expected token swap trade, i.e. offered and wanted tokens."
})
export class ExpectedTokenSwap extends ChainCallDTO {
  @JSONSchema({
    description:
      "A list of offered token instances. The order of this array must match the order of the TokenSwapRequest stored on chain."
  })
  @ValidateNested({ each: true })
  @Type(() => TokenInstanceQuantity)
  @ArrayMinSize(1)
  @ArrayUnique()
  public offered: Array<TokenInstanceQuantity>;

  @JSONSchema({
    description:
      "A list of wanted token instances. The order of this array must match the order of the TokenSwapRequest stored on chain."
  })
  @ValidateNested({ each: true })
  @Type(() => TokenInstanceQuantity)
  @ArrayMinSize(1)
  @ArrayUnique()
  public wanted: Array<TokenInstanceQuantity>;
}

@JSONSchema({
  description: "Defines a swap fill object, i.e. a response of another user for a swap request."
})
export class FillTokenSwapDto extends ChainCallDTO {
  public static DEFAULT_USES = new BigNumber(1);

  @JSONSchema({
    description: "Swap request ID to be filled"
  })
  @IsNotEmpty()
  public swapRequestId: string;

  @JSONSchema({
    description: "Expected token swap trade to be validated before filling the swap."
  })
  @IsOptional()
  @ValidateNested()
  public expectedTokenSwap?: ExpectedTokenSwap;

  @JSONSchema({
    description:
      "User who fills the swap, an owner of tokens wanted in swap. " +
      "Optional field, by default set to chaincode calling user."
  })
  @IsOptional()
  @IsUserAlias()
  public filledBy?: string;

  @JSONSchema({
    description:
      "How many uses are filled with this swap fill. " +
      `In most cases it will be ${FillTokenSwapDto.DEFAULT_USES}, and this is the default value for it.`
  })
  @IsOptional()
  @BigNumberIsPositive()
  @BigNumberIsInteger()
  @BigNumberProperty()
  public uses?: BigNumber;
}

@JSONSchema({
  description:
    "Fill multiple swaps in a single transaction, potentially swaps offered by many different users."
})
export class BatchFillTokenSwapDto extends ChainCallDTO {
  static MAX_ARR_SIZE = 1000;

  @JSONSchema({
    description: "Array of FillTokenSwapDto objects each representing a swap to fulfill"
  })
  @ValidateNested({ each: true })
  @Type(() => FillTokenSwapDto)
  @ArrayNotEmpty()
  @ArrayMaxSize(BatchFillTokenSwapDto.MAX_ARR_SIZE)
  swapDtos: Array<FillTokenSwapDto>;
}

export class TerminateTokenSwapDto extends ChainCallDTO {
  @JSONSchema({
    description: "Swap request ID to be terminated."
  })
  @IsNotEmpty()
  public readonly swapRequestId: string;
}

@JSONSchema({
  description:
    "Legacy FetchTokenSwapsDto. Provided created timestamp to limit result, or leave empty to query all swaps."
})
export class FetchTokenSwapsDto extends ChainCallDTO {
  @JSONSchema({
    description: "(optional). ChainKey 0 - Created timestamp of swap."
  })
  @IsOptional()
  @IsNumber()
  public created?: number;
}

export class FetchTokenSwapByRequestIdDto extends ChainCallDTO {
  @JSONSchema({
    description: "Token swap request ID."
  })
  @IsNotEmpty()
  public swapRequestId: string;
}

@JSONSchema({
  description: "Query for TokenSwapRequests by Token Instance properties. Supports pagination."
})
export class FetchTokenSwapsByInstanceDto extends ChainCallDTO {
  static readonly MAX_LIMIT = 10 * 1000;
  static readonly DEFAULT_LIMIT = 1000;

  @JSONSchema({
    description: "Token collection. Optional, but required if category is provided."
  })
  @ValidateIf((o) => !!o.category)
  @IsNotEmpty()
  collection?: string;

  @JSONSchema({
    description: "Token category. Optional, but required if type is provided."
  })
  @ValidateIf((o) => !!o.type)
  @IsNotEmpty()
  category?: string;

  @JSONSchema({
    description: "Token type. Optional, but required if additionalKey is provided."
  })
  @ValidateIf((o) => !!o.additionalKey)
  @IsNotEmpty()
  type?: string;

  @JSONSchema({
    description: "Token additionalKey. Optional, but required if instance is provided."
  })
  @ValidateIf((o) => !!o.instance)
  @IsNotEmpty()
  additionalKey?: string;

  @JSONSchema({
    description: "Token instance. Optional, but required if allowanceType is provided"
  })
  @ValidateIf((o) => o.allowanceType !== undefined)
  @IsNotEmpty()
  instance?: string;

  @JSONSchema({
    description: "Page bookmark. If it is undefined, then the first page is returned."
  })
  @IsOptional()
  @IsNotEmpty()
  bookmark?: string;

  @JSONSchema({
    description:
      `Page size limit. ` +
      `Defaults to ${FetchTokenSwapsByInstanceDto.DEFAULT_LIMIT}, max possible value ${FetchTokenSwapsByInstanceDto.MAX_LIMIT}. ` +
      "Note you will likely get less results than the limit, because the limit is applied before additional filtering."
  })
  @IsOptional()
  @Max(FetchTokenSwapsByInstanceDto.MAX_LIMIT)
  @Min(1)
  @IsInt()
  limit?: number;
}

@JSONSchema({
  description: "Query for TokenSwapRequests by User properties (offeredBy/offeredTo). Supports pagination."
})
export class FetchTokenSwapsByUserDto extends ChainCallDTO {
  static readonly MAX_LIMIT = 10 * 1000;
  static readonly DEFAULT_LIMIT = 1000;

  @IsOptional()
  @IsUserAlias()
  public user?: string;

  @JSONSchema({
    description: "Page bookmark. If it is undefined, then the first page is returned."
  })
  @IsOptional()
  @IsNotEmpty()
  bookmark?: string;

  @JSONSchema({
    description:
      `Page size limit. ` +
      `Defaults to ${FetchTokenSwapsByUserDto.DEFAULT_LIMIT}, max possible value ${FetchTokenSwapsByUserDto.MAX_LIMIT}. ` +
      "Note you will likely get less results than the limit, because the limit is applied before additional filtering."
  })
  @IsOptional()
  @Max(FetchTokenSwapsByUserDto.MAX_LIMIT)
  @Min(1)
  @IsInt()
  limit?: number;
}

@JSONSchema({
  description:
    "Response DTO for FetchTokenSwaps{ByInstanceOffered|ByInstanceWanted|OfferedBy|OfferedTo} methods. Supports pagination."
})
export class FetchTokenSwapsWithPaginationResponse extends ChainCallDTO {
  @IsOptional()
  public nextPageBookmark?: string | undefined;

  @ValidateNested({ each: true })
  @Type(() => TokenSwapRequest)
  public results: TokenSwapRequest[];
}

@JSONSchema({
  description:
    "Ensure that provided swapRequestId chain objects have proper supporting index Chain Objects. " +
    "This method permits migration / upgrade of TokenSwapRequests written prior to the advent of new index objects " +
    "which were added to support fine-grained querying of TokenSwapRequests by client applications. " +
    "The provided swapRequestIds will be looked up on chain, then their corresponding index Chain objects will be queried and written if necessary."
})
export class EnsureTokenSwapIndexingDto extends ChainCallDTO {
  @ArrayNotEmpty()
  swapRequestIds: string[];
}

@JSONSchema({
  description:
    "Response DTO for a EnsureTokenSwapIndexing request. If any writes were made, they will be provided in the writes array and noOp will be true."
})
export class EnsureTokenSwapIndexingResponse extends ChainCallDTO {
  @IsBoolean()
  noOp: boolean;

  @ArrayMinSize(0)
  writes: ChainObject[];
}

@JSONSchema({
  description:
    "Request DTO for CleanTokenSwaps. Optionally, provide a list of ChainKeys to specifically clean/delete from world state. "
})
export class CleanTokenSwapsDto extends ChainCallDTO {
  @IsOptional()
  @ArrayNotEmpty()
  swapRequestIds?: string[];
}

@JSONSchema({
  description:
    "Response DTO for a CleanTokenSwaps request. If any deletes occurred, they will be provided in the deletes array."
})
export class CleanTokenSwapsResponse extends ChainCallDTO {
  @ArrayMinSize(0)
  deletes: TokenSwapRequest[];
}

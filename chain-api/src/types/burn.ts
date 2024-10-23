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
  ArrayNotEmpty,
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  ValidateIf,
  ValidateNested
} from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import { BigNumberIsInteger, BigNumberIsNotNegative, BigNumberProperty, IsUserAlias } from "../validators";
import { BurnTokenQuantity } from "./BurnTokenQuantity";
import { TokenBurnCounter } from "./TokenBurnCounter";
import { TokenInstance } from "./TokenInstance";
import { ChainCallDTO } from "./dtos";
import { BatchMintTokenDto } from "./mint";

@JSONSchema({
  description: "Contains parameters for fetching burns."
})
export class FetchBurnsDto extends ChainCallDTO {
  @JSONSchema({
    description: "The user who burned the token."
  })
  @IsUserAlias()
  burnedBy: string;

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
    description: "Token instance. Optional, but required if allowanceType is provided."
  })
  @ValidateIf((o) => o.allowanceType !== undefined)
  @IsNotEmpty()
  instance?: string;

  @JSONSchema({
    description: "Created time. Optional."
  })
  @IsPositive()
  @IsInt()
  @IsOptional()
  public created?: number;
}

@JSONSchema({
  description: "Defines burns to be created."
})
export class BurnTokensDto extends ChainCallDTO {
  @JSONSchema({
    description:
      "Array of token instances of token to be burned. In case of fungible tokens, tokenInstance.instance field " +
      `should be set to ${TokenInstance.FUNGIBLE_TOKEN_INSTANCE} and quantity set to 1.`
  })
  @ValidateNested({ each: true })
  @Type(() => BurnTokenQuantity)
  @ArrayNotEmpty()
  tokenInstances: Array<BurnTokenQuantity>;

  @JSONSchema({
    description:
      "Owner of the tokens to be burned. If not provided, the calling user is assumed to be the owner."
  })
  @IsOptional()
  @IsUserAlias()
  owner?: string;
}

@JSONSchema({
  description:
    "Permits an atomic burn-to-mint transaction. Supply the token(s) to be burned, and the token(s) to be minted. " +
    "The `burnDto` and `mintDto` properties should be signed by their respective approving parties: " +
    "As an example for NFTs, the `burnDto` might be signed by the end user that owns the tokens, while " +
    "the mintDto is signed by an NFT token authority with the ability to mint NFTs. " +
    "If the burn is successful, mint the requested token(s)." +
    "Mints are executed under the identity of the calling user of this function. " +
    "All operations occur in the same transaction, meaning either all succeed or none are written to chain."
})
export class BurnAndMintDto extends ChainCallDTO {
  static MAX_ARR_SIZE = 1000;

  @JSONSchema({
    description: "A valid BurnTokensDto, properly signed by the owner of the tokens to be burned."
  })
  @ValidateNested()
  @Type(() => BurnTokensDto)
  @IsNotEmpty()
  burnDto: BurnTokensDto;

  @JSONSchema({
    description:
      "User ID of the identity that owns the tokens to be burned. " +
      "The burnDto signature will be validated against this user's public key on chain."
  })
  @IsUserAlias()
  burnOwner: string;

  @JSONSchema({
    description: "DTOs of tokens to mint."
  })
  @ValidateNested()
  @Type(() => BatchMintTokenDto)
  @IsNotEmpty()
  mintDto: BatchMintTokenDto;
}

@JSONSchema({
  description: "Contains parameters for fetching TokenBurnCounters with pagination."
})
export class FetchBurnCountersWithPaginationDto extends ChainCallDTO {
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
    description: "Page bookmark. If it is undefined, then the first page is returned."
  })
  @IsOptional()
  @IsNotEmpty()
  bookmark?: string;

  @JSONSchema({
    description:
      `Page size limit. ` +
      `Defaults to ${FetchBurnCountersWithPaginationDto.DEFAULT_LIMIT}, max possible value ${FetchBurnCountersWithPaginationDto.MAX_LIMIT}. ` +
      "Note you will likely get less results than the limit, because the limit is applied before additional filtering."
  })
  @IsOptional()
  @Max(FetchBurnCountersWithPaginationDto.MAX_LIMIT)
  @Min(1)
  @IsInt()
  limit?: number;
}

export class FetchBurnCountersResponse extends ChainCallDTO {
  @JSONSchema({ description: "List of token burn counters." })
  @ValidateNested({ each: true })
  @Type(() => TokenBurnCounter)
  results: TokenBurnCounter[];

  @JSONSchema({ description: "Next page bookmark." })
  @IsOptional()
  @IsString()
  nextPageBookmark?: string;
}

@JSONSchema({
  description: "Key properties representing a TokenBurnCounter."
})
export class TokenBurnCounterCompositeKeyDto extends ChainCallDTO {
  @JSONSchema({
    description: "Token collection."
  })
  @IsNotEmpty()
  collection: string;

  @JSONSchema({
    description: "Token category."
  })
  @IsNotEmpty()
  category: string;
  @JSONSchema({
    description: "Token type."
  })
  @IsNotEmpty()
  type: string;
  @JSONSchema({
    description: "Token additionalKey."
  })
  @IsDefined()
  additionalKey: string;

  @JSONSchema({
    description: "timeKey of TokenBurnCounter for range reads"
  })
  @IsNotEmpty()
  timeKey: string;

  @JSONSchema({
    description: "burnedBy user."
  })
  @IsUserAlias()
  burnedBy: string;

  @JSONSchema({
    description: "Token instance."
  })
  @IsNotEmpty()
  @BigNumberIsInteger()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  instance: BigNumber;

  @JSONSchema({
    description:
      "Known burn counts at time of write, " +
      "discounting concurrent writes that occurred in the same block.."
  })
  @IsNotEmpty()
  @BigNumberProperty()
  totalKnownBurnsCount: BigNumber;
}

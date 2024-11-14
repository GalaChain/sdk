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
  IsAlpha,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested
} from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import { BigNumberIsNotNegative, BigNumberIsPositive, BigNumberProperty, IsUserAlias } from "../validators";
import { TokenBalance } from "./TokenBalance";
import { TokenClass, TokenClassKey } from "./TokenClass";
import { TokenInstance, TokenInstanceKey } from "./TokenInstance";
import { ChainCallDTO } from "./dtos";

@JSONSchema({
  description: "Contains list of objects representing token classes to fetch."
})
export class FetchTokenClassesDto extends ChainCallDTO {
  @ValidateNested({ each: true })
  @Type(() => TokenClassKey)
  @ArrayNotEmpty()
  tokenClasses: Array<TokenClassKey>;
}

@JSONSchema({
  description:
    "Fetch token classes currently available in world state. Supports filtering, " +
    "pagination, and optionality of TokenClassKey properties."
})
export class FetchTokenClassesWithPaginationDto extends ChainCallDTO {
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
      `Defaults to ${FetchTokenClassesWithPaginationDto.DEFAULT_LIMIT}, max possible value ${FetchTokenClassesWithPaginationDto.MAX_LIMIT}. ` +
      "Note you will likely get less results than the limit, because the limit is applied before additional filtering."
  })
  @IsOptional()
  @Max(FetchTokenClassesWithPaginationDto.MAX_LIMIT)
  @Min(1)
  @IsInt()
  limit?: number;
}

export class FetchTokenClassesResponse extends ChainCallDTO {
  @JSONSchema({ description: "List of Token Classes." })
  @ValidateNested({ each: true })
  @Type(() => TokenClass)
  results: TokenClass[];

  @JSONSchema({ description: "Next page bookmark." })
  @IsOptional()
  @IsString()
  nextPageBookmark?: string;
}

@JSONSchema({
  description: "Contains list of objects representing token instances to fetch."
})
export class FetchTokenInstancesDto extends ChainCallDTO {
  @ValidateNested({ each: true })
  @Type(() => TokenInstanceKey)
  @ArrayNotEmpty()
  tokenInstances: Array<TokenInstanceKey>;
}

@JSONSchema({
  description:
    "Contains properties of token class to be created. Actual token units and NFT instances are created on mint."
})
export class CreateTokenClassDto extends ChainCallDTO {
  static DEFAULT_NETWORK = "GC";
  static DEFAULT_DECIMALS = 0;
  static DEFAULT_MAX_CAPACITY = new BigNumber("Infinity");
  static DEFAULT_MAX_SUPPLY = new BigNumber("Infinity");
  static INITIAL_MINT_ALLOWANCE = new BigNumber("0");
  static INITIAL_TOTAL_SUPPLY = new BigNumber("0");
  static INITIAL_TOTAL_BURNED = new BigNumber("0");

  @JSONSchema({
    description:
      `A network of the token. An optional field, by default set to ${CreateTokenClassDto.DEFAULT_NETWORK}. ` +
      `Custom value is required when we want to use different network than ${CreateTokenClassDto.DEFAULT_NETWORK} ` +
      `to store tokens (but this is not supported yet).`
  })
  @IsOptional()
  @IsNotEmpty()
  network?: string;

  @JSONSchema({
    description: `If missing, and for NFTs, it is set to ${CreateTokenClassDto.DEFAULT_DECIMALS}.`
  })
  @Min(0)
  @Max(32)
  @IsOptional()
  decimals?: number;

  @JSONSchema({
    description: `If missing, set to ${CreateTokenClassDto.DEFAULT_MAX_CAPACITY}.`
  })
  @IsOptional()
  @BigNumberIsPositive()
  @BigNumberProperty({ allowInfinity: true })
  maxCapacity?: BigNumber;

  @JSONSchema({
    description: `If missing, set to infinity ${CreateTokenClassDto.DEFAULT_MAX_SUPPLY}.`
  })
  @IsOptional()
  @BigNumberIsPositive()
  @BigNumberProperty({ allowInfinity: true })
  maxSupply?: BigNumber;

  @JSONSchema({
    description: "A unique identifier of this token."
  })
  @ValidateNested()
  @Type(() => TokenClassKey)
  @IsNotEmpty()
  tokenClass: TokenClassKey;

  @MaxLength(200)
  name: string;

  @MaxLength(20)
  @IsAlpha()
  symbol: string;

  @IsNotEmpty()
  @MaxLength(1000)
  description: string;

  @JSONSchema({
    description:
      `How much units or how many NFTs were allowed to be minted in the past. ` +
      `By default set to ${CreateTokenClassDto.INITIAL_MINT_ALLOWANCE}.`
  })
  @IsOptional()
  @IsNotEmpty()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  totalMintAllowance?: BigNumber;

  @JSONSchema({
    description:
      `How much units or how many NFTs are already on the market. ` +
      `By default set to ${CreateTokenClassDto.INITIAL_TOTAL_SUPPLY}.`
  })
  @IsOptional()
  @IsNotEmpty()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  totalSupply?: BigNumber;

  @JSONSchema({
    description:
      `How much units or how many NFTs ware already burned. ` +
      `By default set to ${CreateTokenClassDto.INITIAL_TOTAL_BURNED}.`
  })
  @IsOptional()
  @IsNotEmpty()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  totalBurned?: BigNumber;

  @IsOptional()
  @MaxLength(500)
  contractAddress?: string;

  @IsOptional()
  @MaxLength(500)
  metadataAddress?: string;

  @JSONSchema({
    description: "How rare is the NFT"
  })
  @IsOptional()
  @IsAlpha()
  rarity?: string;

  @IsUrl()
  image: string;

  @JSONSchema({
    description: "Determines if the token is an NFT. Set to false if missing."
  })
  @IsOptional()
  @IsBoolean()
  isNonFungible?: boolean;

  @JSONSchema({
    description:
      "List of chain user identifiers who should become token authorities. " +
      "Only token authorities can give mint allowances. " +
      "By default the calling user becomes a single token authority. "
  })
  @IsString({ each: true })
  @IsOptional()
  @ArrayNotEmpty()
  authorities?: string[];
}

export class UpdateTokenClassDto extends ChainCallDTO {
  /* todo: should these fields be update-able? probably not, unless in exceptional circumstances.
           these are more complicted, as they track properties with second order effects.
           in theory, it's probably a bad idea if a token authority can just come in later
           and up the total amount of what was meant to be a scarce NFT.
           Also, implementation will be more complicated to ensure that chagnes like a
           reducation in capacity don't end up with invalid values.
  maxCapacity?: BigNumber;
  maxSupply?: BigNumber;
  totalSupply?: BigNumber;
  totalBurned?: BigNumber;
  isNonFungible?: boolean;
  network?: string;
  */

  @JSONSchema({
    description: "The unique identifier of the existing token which will be updated."
  })
  @ValidateNested()
  @Type(() => TokenClassKey)
  @IsNotEmpty()
  tokenClass: TokenClassKey;

  @IsOptional()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @MaxLength(20)
  @IsAlpha()
  symbol?: string;

  @IsOptional()
  @IsNotEmpty()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @MaxLength(500)
  contractAddress?: string;

  @IsOptional()
  @MaxLength(500)
  metadataAddress?: string;

  @JSONSchema({
    description: "How rare is the NFT"
  })
  @IsOptional()
  @IsAlpha()
  rarity?: string;

  @IsOptional()
  @IsUrl()
  image?: string;

  @JSONSchema({
    description:
      "List of chain user identifiers who should become token authorities. " +
      "Only token authorities can give mint allowances. " +
      "By default the calling user becomes a single token authority. "
  })
  @IsUserAlias({ each: true })
  @IsOptional()
  @ArrayNotEmpty()
  authorities?: string[];

  @JSONSchema({
    description:
      "Overwrite existing authorities completely with new values. Default: false. " +
      "The default behavior will augment the existing authorities with new values. " +
      "Set this to true and provide a full list to remove one or more existing authorities."
  })
  @IsOptional()
  overwriteAuthorities?: boolean;
}

@JSONSchema({
  description: "Contains parameters for fetching balances. Each parameter is optional."
})
export class FetchBalancesDto extends ChainCallDTO {
  @JSONSchema({
    description: "Person who owns the balance. If the value is missing, chaincode caller is used."
  })
  @IsOptional()
  @IsUserAlias()
  owner?: string;

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
    description: "Token additionalKey."
  })
  @IsOptional()
  additionalKey?: string;
}

@JSONSchema({
  description: "Contains parameters for fetching balances. Each parameter is optional."
})
export class FetchBalancesWithPaginationDto extends ChainCallDTO {
  static readonly MAX_LIMIT = 10 * 1000;
  static readonly DEFAULT_LIMIT = 1000;

  @JSONSchema({
    description: "Person who owns the balance. If the value is missing, chaincode caller is used."
  })
  @IsOptional()
  @IsUserAlias()
  owner?: string;

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
    description: "Token additionalKey."
  })
  @IsOptional()
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
      `Defaults to ${FetchBalancesWithPaginationDto.DEFAULT_LIMIT}, max possible value ${FetchBalancesWithPaginationDto.MAX_LIMIT}. ` +
      "Note you will likely get less results than the limit, because the limit is applied before additional filtering."
  })
  @IsOptional()
  @Max(FetchBalancesWithPaginationDto.MAX_LIMIT)
  @Min(1)
  @IsInt()
  limit?: number;
}

@JSONSchema({
  description: "Response DTO containing a TokenBalance and the balance's corresponding TokenClass."
})
export class TokenBalanceWithMetadata extends ChainCallDTO {
  @JSONSchema({
    description: "A TokenBalance read of chain."
  })
  @ValidateNested()
  @Type(() => TokenBalance)
  @IsObject()
  balance: TokenBalance;

  @JSONSchema({
    description: "The TokenClass metadata corresponding to the TokenBalance on this DTO."
  })
  @Type(() => TokenClass)
  @IsObject()
  token: TokenClass;
}

export class FetchBalancesWithTokenMetadataResponse extends ChainCallDTO {
  @JSONSchema({ description: "List of balances with token metadata." })
  @ValidateNested({ each: true })
  @Type(() => TokenBalanceWithMetadata)
  results: TokenBalanceWithMetadata[];

  @JSONSchema({ description: "Next page bookmark." })
  @IsOptional()
  @IsString()
  nextPageBookmark?: string;
}

@JSONSchema({
  description:
    "Experimental: After submitting request to RequestMintAllowance, follow up with FulfillMintAllowance."
})
export class TransferTokenDto extends ChainCallDTO {
  @JSONSchema({
    description: "The current owner of tokens. If the value is missing, chaincode caller is used."
  })
  @IsOptional()
  @IsUserAlias()
  from?: string;

  @IsUserAlias()
  to: string;

  @JSONSchema({
    description:
      "Token instance of token to be transferred. In case of fungible tokens, tokenInstance.instance field " +
      `should be set to ${TokenInstance.FUNGIBLE_TOKEN_INSTANCE}.`
  })
  @ValidateNested()
  @Type(() => TokenInstanceKey)
  @IsNotEmpty()
  tokenInstance: TokenInstanceKey;

  @JSONSchema({
    description: "The quantity of token units to be transferred."
  })
  @IsNotEmpty()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  quantity: BigNumber;

  @JSONSchema({
    description: "Allowance ids to be used on transferToken (optional)."
  })
  @IsString({ each: true })
  @IsOptional()
  @ArrayNotEmpty()
  useAllowances?: Array<string>;
}

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
  ArrayNotEmpty,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
  ValidateNested
} from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import {
  ArrayUniqueObjects,
  BigNumberIsInteger,
  BigNumberIsPositive,
  BigNumberProperty,
  EnumProperty,
  IsUserAlias
} from "../validators";
import { GrantAllowanceQuantity } from "./GrantAllowance";
import { TokenAllowance } from "./TokenAllowance";
import { TokenInstance, TokenInstanceKey, TokenInstanceQueryKey } from "./TokenInstance";
import { AllowanceKey, AllowanceType, MintRequestDto } from "./common";
import { ChainCallDTO } from "./dtos";

@JSONSchema({
  description: "Contains parameters for fetching allowances with pagination."
})
export class FetchAllowancesDto extends ChainCallDTO {
  static readonly MAX_LIMIT = 10 * 1000;
  static readonly DEFAULT_LIMIT = 1000;

  @JSONSchema({
    description: "A user who can use an allowance."
  })
  @IsUserAlias()
  grantedTo: string;

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

  @IsOptional()
  @EnumProperty(AllowanceType)
  allowanceType?: AllowanceType;

  @JSONSchema({
    description: "User who granted allowances."
  })
  @IsOptional()
  @IsUserAlias()
  grantedBy?: string;

  @JSONSchema({
    description: "Page bookmark. If it is undefined, then the first page is returned."
  })
  @IsOptional()
  @IsNotEmpty()
  bookmark?: string;

  @JSONSchema({
    description:
      `Page size limit. ` +
      `Defaults to ${FetchAllowancesDto.DEFAULT_LIMIT}, max possible value ${FetchAllowancesDto.MAX_LIMIT}. ` +
      "Note you will likely get less results than the limit, because the limit is applied before additional filtering."
  })
  @IsOptional()
  @Max(FetchAllowancesDto.MAX_LIMIT)
  @Min(1)
  @IsInt()
  limit?: number;
}

@JSONSchema({
  description:
    "Contains parameters for fetching allowances. " +
    "Deprecated since 2023-05-29. Please use version with pagination."
})
/**
 * @deprecated
 */
export class FetchAllowancesLegacyDto extends ChainCallDTO {
  @JSONSchema({
    description: "A user who can use an allowance."
  })
  @IsUserAlias()
  grantedTo: string;

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

  @IsOptional()
  @EnumProperty(AllowanceType)
  allowanceType?: AllowanceType;

  @JSONSchema({
    description: "User who granted allowances."
  })
  @IsOptional()
  @IsUserAlias()
  grantedBy?: string;

  @JSONSchema({
    description: "Page bookmark. If it is undefined, then the first page is returned."
  })
  @IsOptional()
  @IsNotEmpty()
  bookmark?: string;
}

export class FetchAllowancesResponse extends ChainCallDTO {
  @JSONSchema({ description: "List of allowances." })
  @ValidateNested({ each: true })
  @Type(() => TokenAllowance)
  results: TokenAllowance[];

  @JSONSchema({ description: "Next page bookmark." })
  @IsOptional()
  @IsString()
  nextPageBookmark?: string;
}

@JSONSchema({
  description: "Contains parameters for deleting allowances for a calling user."
})
export class DeleteAllowancesDto extends ChainCallDTO {
  @JSONSchema({
    description: "A user who can use an allowance."
  })
  @IsUserAlias()
  grantedTo: string;

  @JSONSchema({
    description: "User who granted allowances."
  })
  @IsOptional()
  @IsUserAlias()
  grantedBy?: string;

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

  @IsOptional()
  @EnumProperty(AllowanceType)
  allowanceType?: AllowanceType;
}

@JSONSchema({
  description: "Defines allowances to be created."
})
export class GrantAllowanceDto extends ChainCallDTO {
  static DEFAULT_EXPIRES = 0;

  @JSONSchema({
    description:
      "Token instance of token which the allowance concerns. " +
      "In case of fungible tokens, tokenInstance.instance field " +
      `should be set to ${TokenInstance.FUNGIBLE_TOKEN_INSTANCE}.`
  })
  @ValidateNested()
  @Type(() => TokenInstanceQueryKey)
  @IsNotEmpty()
  tokenInstance: TokenInstanceQueryKey;

  @JSONSchema({
    description: "List of objects with user and token quantities. " + "The user fields must be unique"
  })
  @ValidateNested({ each: true })
  @Type(() => GrantAllowanceQuantity)
  @ArrayNotEmpty()
  @ArrayUniqueObjects("user")
  quantities: Array<GrantAllowanceQuantity>;

  @IsNotEmpty()
  @EnumProperty(AllowanceType)
  allowanceType: AllowanceType;

  @JSONSchema({
    description: "How many times each allowance can be used."
  })
  @BigNumberIsPositive()
  @BigNumberProperty({ allowInfinity: true })
  uses: BigNumber;

  @JSONSchema({
    description:
      "Unix timestamp of the date when the allowances should expire. 0 means that it won' expire. " +
      `By default set to ${GrantAllowanceDto.DEFAULT_EXPIRES}.`
  })
  @IsOptional()
  expires?: number;
}

/**
 * Experimental: Defines allowances to be created. High-throughput implementation.
 *
 * @experimental 2023-03-23
 */
@JSONSchema({
  description:
    "Experimental: Defines allowances to be created. High-throughput implementation. " +
    "DTO properties backwards-compatible with prior GrantAllowanceDto, with the " +
    "exception that this implementation only supports AllowanceType.Mint."
})
export class HighThroughputGrantAllowanceDto extends ChainCallDTO {
  // todo: remove all these duplicated properties
  // it seems something about our @GalaTransaction decorator does not pass through
  // parent properties. Leaving this class empty with just the `extends GrantAllowanceDto`
  // results in an api definition with no property except the signature.
  // update: using extends GrantAllowanceDto causes issues with property validation and failure
  static DEFAULT_EXPIRES = 0;

  @JSONSchema({
    description:
      "Token instance of token which the allowance concerns. " +
      "In case of fungible tokens, tokenInstance.instance field " +
      `should be set to ${TokenInstance.FUNGIBLE_TOKEN_INSTANCE}.`
  })
  @ValidateNested()
  @Type(() => TokenInstanceQueryKey)
  @IsNotEmpty()
  tokenInstance: TokenInstanceQueryKey;

  @JSONSchema({
    description: "List of objects with user and token quantities. " + "The user fields must be unique"
  })
  @ValidateNested({ each: true })
  @Type(() => GrantAllowanceQuantity)
  @ArrayNotEmpty()
  @ArrayUniqueObjects("user")
  quantities: Array<GrantAllowanceQuantity>;

  @IsNotEmpty()
  @EnumProperty(AllowanceType)
  allowanceType: AllowanceType;

  @JSONSchema({
    description: "How many times each allowance can be used."
  })
  @BigNumberIsPositive()
  @BigNumberIsInteger()
  @BigNumberProperty()
  uses: BigNumber;

  @JSONSchema({
    description:
      "Unix timestamp of the date when the allowances should expire. 0 means that it won' expire. " +
      `By default set to ${GrantAllowanceDto.DEFAULT_EXPIRES}.`
  })
  @IsOptional()
  expires?: number;
}

@JSONSchema({
  description:
    "Experimental: After submitting request to RequestMintAllowance, follow up with FulfillMintAllowance."
})
export class FulfillMintAllowanceDto extends ChainCallDTO {
  static MAX_ARR_SIZE = 1000;

  @ValidateNested({ each: true })
  @Type(() => MintRequestDto)
  @ArrayNotEmpty()
  @ArrayMaxSize(FulfillMintAllowanceDto.MAX_ARR_SIZE)
  @ArrayUniqueObjects("id")
  requests: MintRequestDto[];
}

@JSONSchema({
  description:
    "Fetch one or more balances, verify all owned TokenInstances have at least one available " +
    "allowance of the specified type. Any token instance key(s) with no available allowances will " +
    "be returned in the response."
})
export class FullAllowanceCheckDto extends ChainCallDTO {
  @JSONSchema({
    description: "Person who owns the balance(s). If the value is missing, chaincode caller is used."
  })
  @IsOptional()
  @IsUserAlias()
  owner?: string;

  @JSONSchema({
    description:
      "Person/UserId to whom allowance(s) were granted. If the value is missing, chaincode caller is used."
  })
  @IsOptional()
  @IsUserAlias()
  grantedTo?: string;

  @JSONSchema({
    description: "Token collection. Optional."
  })
  @ValidateIf((o) => !!o.category)
  @IsNotEmpty()
  collection?: string;

  @JSONSchema({
    description: "Token category. Optional, and ignored if collection is not provided."
  })
  @ValidateIf((o) => !!o.type)
  @IsNotEmpty()
  category?: string;

  @JSONSchema({
    description: "Token type. Optional, and ignored if category is not provded."
  })
  @ValidateIf((o) => !!o.additionalKey)
  @IsNotEmpty()
  type?: string;

  @JSONSchema({
    description: "Token additionalKey. Optional, and ignored if type is not provided."
  })
  @IsOptional()
  additionalKey?: string;

  @JSONSchema({
    description: "AllowanceType to check. Default: Use (0)"
  })
  @IsOptional()
  @IsNotEmpty()
  allowanceType?: AllowanceType;
}

@JSONSchema({
  description: "Response Data Transfer Object for FullLockAllowance request."
})
export class FullAllowanceCheckResDto extends ChainCallDTO {
  @JSONSchema({
    description: "True if all resulting token(s) have active/un-expired allowances available."
  })
  @IsBoolean()
  all: boolean;

  @JSONSchema({
    description: "TokenInstanceKey(s) of any tokens missing the requested AllowanceType."
  })
  @ValidateNested({ each: true })
  @Type(() => TokenInstanceKey)
  @ArrayNotEmpty()
  missing?: Array<TokenInstanceKey>;
}

@JSONSchema({
  description:
    "Refresh the uses or expiration date of an existing allowance. " +
    "If quantity needs updating, grant a new allowance instead."
})
export class RefreshAllowanceDto extends ChainCallDTO {
  @Type(() => AllowanceKey)
  @IsNotEmpty()
  public allowanceKey: AllowanceKey;

  @BigNumberIsPositive()
  @BigNumberIsInteger()
  @BigNumberProperty()
  public uses: BigNumber;

  @Min(0)
  @IsInt()
  public expires: number;
}

@JSONSchema({
  description:
    "Refresh the uses or expiration date of an existing allowance. " +
    "If quantity needs updating, grant a new allowance instead."
})
export class RefreshAllowancesDto extends ChainCallDTO {
  @ValidateNested({ each: true })
  @Type(() => RefreshAllowanceDto)
  @ArrayNotEmpty()
  allowances: Array<RefreshAllowanceDto>;
}

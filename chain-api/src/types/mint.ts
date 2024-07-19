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
import { ArrayMaxSize, ArrayNotEmpty, IsNotEmpty, IsOptional, ValidateNested } from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import { BigNumberProperty, ConstructorArgs } from "../utils";
import { ArrayUniqueObjects, BigNumberIsNotNegative, IsUserAlias } from "../validators";
import { TokenClassKey } from "./TokenClass";
import { AllowanceKey, MintRequestDto } from "./common";
import { ChainCallDTO } from "./dtos";

export type MintTokenParams = ConstructorArgs<MintTokenDto>;

@JSONSchema({
  description:
    "Describes an action to mint a token. " +
    `For NFTs you can mint up to ${MintTokenDto.MAX_NFT_MINT_SIZE} tokens.`
})
export class MintTokenDto extends ChainCallDTO {
  static MAX_NFT_MINT_SIZE = 1000;

  @JSONSchema({
    description: "Token class of token to be minted."
  })
  @ValidateNested()
  @Type(() => TokenClassKey)
  @IsNotEmpty()
  tokenClass: TokenClassKey;

  @JSONSchema({
    description: "The owner of minted tokens. If the value is missing, chaincode caller is used."
  })
  @IsOptional()
  @IsUserAlias()
  owner?: string;

  @JSONSchema({
    description: "How many units of Fungible/NonFungible Token will be minted."
  })
  @IsNotEmpty()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  quantity: BigNumber;

  @IsOptional()
  @Type(() => AllowanceKey)
  @IsNotEmpty()
  public allowanceKey?: AllowanceKey;
}

export type MintTokenWithAllowanceParams = ConstructorArgs<MintTokenWithAllowanceDto>;

@JSONSchema({
  description:
    "Describes an action to grant allowance to self and mint token to owner in single transaction. " +
    "This action will fail is the calling user lacks the authority to grant MINT allowances."
})
export class MintTokenWithAllowanceDto extends ChainCallDTO {
  @JSONSchema({
    description: "Token class of token to be minted."
  })
  @ValidateNested()
  @Type(() => TokenClassKey)
  @IsNotEmpty()
  tokenClass: TokenClassKey;

  @JSONSchema({
    description: "The owner of minted tokens. If the value is missing, chaincode caller is used."
  })
  @IsOptional()
  @IsUserAlias()
  owner?: string;

  @JSONSchema({
    description: "Instance of token to be minted"
  })
  @IsNotEmpty()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  tokenInstance: BigNumber;

  @JSONSchema({
    description: "How many units of Fungible/NonFungible Token will be minted."
  })
  @IsNotEmpty()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  quantity: BigNumber;
}

export type BatchMintTokenParams = ConstructorArgs<BatchMintTokenDto>;
@JSONSchema({
  description:
    "Describes an action to transferToken a token. " +
    `For NFTs you can mint up to ${MintTokenDto.MAX_NFT_MINT_SIZE} tokens.`
})
export class BatchMintTokenDto extends ChainCallDTO {
  static MAX_ARR_SIZE = 1000;

  @JSONSchema({
    description: "DTOs of tokens to mint."
  })
  @ValidateNested({ each: true })
  @Type(() => MintTokenDto)
  @ArrayNotEmpty()
  @ArrayMaxSize(BatchMintTokenDto.MAX_ARR_SIZE)
  mintDtos: Array<MintTokenDto>;
}

export type HighThroughputMintTokenParams = ConstructorArgs<HighThroughputMintTokenDto>;

/**
 * Experimental: Defines an action to mint a token. High-throughput implementation.
 *
 * @experimental 2023-03-23
 */
@JSONSchema({
  description:
    "Experimental: Describes an action to mint a token. High-throughput implementation. " +
    "DTO properties backwards-compatible with prior MintTokenDto,"
})
export class HighThroughputMintTokenDto extends ChainCallDTO {
  // todo: remove all these duplicated properties
  // it seems something about our @GalaTransaction decorator does not pass through
  // parent properties. Leaving this class empty with just the `extends MintTokenDto`
  // results in an api definition with no property except the signature.
  // update: seems extending MintTokenDto results in failures value.toFixed is not a function,
  // presumably something about the quantity and our dynamic type/class validator
  static MAX_NFT_MINT_SIZE = 1000;

  @JSONSchema({
    description: "Token class of token to be minted."
  })
  @ValidateNested()
  @Type(() => TokenClassKey)
  @IsNotEmpty()
  tokenClass: TokenClassKey;

  @JSONSchema({
    description: "The owner of minted tokens. If the value is missing, chaincode caller is used."
  })
  @IsOptional()
  @IsUserAlias()
  owner?: string;

  @JSONSchema({
    description: "How many units of fungible token of how many NFTs are going to be minted."
  })
  @IsNotEmpty()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  quantity: BigNumber;

  @IsOptional()
  @Type(() => AllowanceKey)
  @IsNotEmpty()
  public allowanceKey?: AllowanceKey;
}

export type FulfillMintParams = ConstructorArgs<FulfillMintDto>;

@JSONSchema({
  description:
    "Experimental: After submitting request to RequestMintAllowance, follow up with FulfillMintAllowance."
})
export class FulfillMintDto extends ChainCallDTO {
  static MAX_ARR_SIZE = 1000;

  @ValidateNested({ each: true })
  @Type(() => MintRequestDto)
  @ArrayNotEmpty()
  @ArrayMaxSize(FulfillMintDto.MAX_ARR_SIZE)
  @ArrayUniqueObjects("id")
  requests: MintRequestDto[];
}

export type FetchMintRequestsParams = ConstructorArgs<FetchMintRequestsDto>;

@JSONSchema({
  description: "Fetch MintRequest or MintAllowanceRequest objects off chain."
})
export class FetchMintRequestsDto extends ChainCallDTO {
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
  @IsNotEmpty()
  additionalKey: string;

  @IsNotEmpty()
  startTimestamp: number;

  @IsNotEmpty()
  endTimestamp: number;
}

export type FetchTokenSupplyParams = ConstructorArgs<FetchTokenSupplyDto>;

@JSONSchema({
  description: "Fetch Mint, Burn or Mint Allowance supply totals off chain."
})
export class FetchTokenSupplyDto extends ChainCallDTO {
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
  @IsNotEmpty()
  additionalKey: string;
}

export type FetchTokenSupplyResponseBody = ConstructorArgs<FetchTokenSupplyDto>;

@JSONSchema({
  description: "Fetch MintRequest or MintAllowanceRequest objects off chain and return the supply."
})
export class FetchTokenSupplyResponse extends ChainCallDTO {
  @JSONSchema({
    description: "Total known supply at time of chaincode execution."
  })
  @BigNumberProperty()
  supply: BigNumber;
}

export type PatchMintAllowanceRequestParams = ConstructorArgs<PatchMintAllowanceRequestDto>;

@JSONSchema({
  description:
    "Write a MintAllowanceRequest object to chain. " +
    "Designed to patch, update, or correct the known total supply. " +
    "An administrative / token authority can patch in the chain objects " +
    "needed with an off-chain, correctly-calculated total supply " +
    "such that ongoing high throughput mints/mint allowances are migrated " +
    "to a correct running total."
})
export class PatchMintAllowanceRequestDto extends ChainCallDTO {
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
  @IsNotEmpty()
  additionalKey: string;

  @JSONSchema({
    description: "The total known mint allowances count."
  })
  @IsNotEmpty()
  @BigNumberProperty()
  totalKnownMintAllowancesCount: BigNumber;
}

export type PatchMintRequestParams = ConstructorArgs<PatchMintRequestDto>;

@JSONSchema({
  description:
    "Write MintRequest objects to chain. " +
    "Designed to patch, update, or correct the known total supply. " +
    "An administrative / token authority can patch in the chain objects " +
    "needed with an off-chain, correctly-calculated total supply " +
    "such that ongoing high throughput mints/mint allowances are migrated " +
    "to a correct running total."
})
export class PatchMintRequestDto extends ChainCallDTO {
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
  @IsNotEmpty()
  additionalKey: string;

  @JSONSchema({
    description: "The total known mint allowances count."
  })
  @IsNotEmpty()
  @BigNumberProperty()
  totalKnownMintsCount: BigNumber;
}

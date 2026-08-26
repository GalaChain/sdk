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
import { BigNumber } from "bignumber.js";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsDefined,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested
} from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import { ChainKey } from "../utils";
import {
  BigNumberIsInteger,
  BigNumberIsNotNegative,
  BigNumberProperty,
  IsStringOrNumber,
  IsUserAlias,
  ValidateNestedAllowUnknown
} from "../validators";
import { ChainObject } from "./ChainObject";
import { TokenInstanceKey } from "./TokenInstance";
import { UserAlias } from "./UserAlias";
import { ChainCallDTO, SubmitCallDTO } from "./dtos";

// Display types defined by the OpenSea metadata standard for numeric traits
export const METADATA_ATTRIBUTE_DISPLAY_TYPES = [
  "number",
  "boost_number",
  "boost_percentage",
  "date"
] as const;

// Six-character hexadecimal color, without a pre-pended #, per the OpenSea metadata standard
export const METADATA_BACKGROUND_COLOR_REGEX = /^[0-9a-fA-F]{6}$/;

// Unsigned integer token instance id, in the canonical form BigNumber.toString() produces.
// Leading zeros are rejected: composite keys are built from that rendering, so "01" would
// silently match nothing rather than the instance the caller meant.
export const METADATA_INSTANCE_ID_REGEX = /^(0|[1-9]\d*)$/;

// Caps on the repeated fields of a metadata document, to bound the size of a single write
export const MAX_METADATA_ATTRIBUTES = 100;
export const MAX_METADATA_CUSTOM_FIELDS = 100;

// Embedded value type, never sent to a contract method on its own, so it is a plain class
// rather than a ChainCallDTO -- the same shape as LockTokenQuantity, BurnTokenQuantity and
// GrantAllowanceQuantity. Extending ChainCallDTO would publish the signing envelope
// (signature, signerPublicKey, multisig, uniqueKey, trace, ...) as part of a trait's schema.
@JSONSchema({
  description: "Single trait of a token instance, following the OpenSea metadata standard attribute format."
})
export class TokenInstanceMetadataAttribute {
  @IsNotEmpty()
  @MaxLength(200)
  public traitType: string;

  @JSONSchema({
    description: "Trait value. Either a string or a finite number (strings limited to 500 characters)."
  })
  @IsDefined()
  @IsStringOrNumber(500)
  public value: string | number;

  @JSONSchema({
    description: `Optional OpenSea display type for numeric traits: ${METADATA_ATTRIBUTE_DISPLAY_TYPES.join(
      ", "
    )}.`
  })
  @IsOptional()
  @IsIn(METADATA_ATTRIBUTE_DISPLAY_TYPES)
  public displayType?: string;
}

// Embedded value type; see the note on TokenInstanceMetadataAttribute above
@JSONSchema({
  description:
    "Arbitrary key-value entry for game or product specific token instance metadata " +
    "that does not fit the OpenSea standard fields."
})
export class TokenInstanceMetadataCustomField {
  @IsNotEmpty()
  @MaxLength(200)
  public key: string;

  @IsNotEmpty()
  @MaxLength(2000)
  public value: string;
}

@JSONSchema({
  description:
    "Metadata document for a single NFT token instance, scoped to a project. A token instance " +
    "may have multiple metadata documents, one per project. Fields mirror the OpenSea metadata " +
    "standard, named in camelCase per GalaChain convention: consumers rendering OpenSea format " +
    "map camelCase to the standard's snake_case (externalUrl -> external_url, and so on)."
})
export class TokenInstanceMetadata extends ChainObject {
  public static INDEX_KEY = "GCTIM";

  @ChainKey({ position: 0 })
  @IsNotEmpty()
  public collection: string;

  @ChainKey({ position: 1 })
  @IsNotEmpty()
  public category: string;

  @ChainKey({ position: 2 })
  @IsNotEmpty()
  public type: string;

  @ChainKey({ position: 3 })
  @IsDefined()
  public additionalKey: string;

  @ChainKey({ position: 4 })
  @IsNotEmpty()
  @BigNumberIsInteger()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  public instance: BigNumber;

  @JSONSchema({
    description: "Identifier of the game or product this metadata document belongs to."
  })
  @ChainKey({ position: 5 })
  @IsNotEmpty()
  @MaxLength(200)
  public project: string;

  @IsOptional()
  @MaxLength(200)
  public name?: string;

  @IsOptional()
  @MaxLength(1000)
  public description?: string;

  @IsOptional()
  @MaxLength(500)
  public image?: string;

  @IsOptional()
  @MaxLength(500)
  public externalUrl?: string;

  @IsOptional()
  @MaxLength(500)
  public animationUrl?: string;

  @JSONSchema({
    description: "Background color as a six-character hexadecimal without a pre-pended #."
  })
  @IsOptional()
  @Matches(METADATA_BACKGROUND_COLOR_REGEX)
  public backgroundColor?: string;

  @IsOptional()
  @MaxLength(500)
  public youtubeUrl?: string;

  @IsOptional()
  @ArrayMaxSize(MAX_METADATA_ATTRIBUTES)
  @ValidateNested({ each: true })
  @Type(() => TokenInstanceMetadataAttribute)
  public attributes?: TokenInstanceMetadataAttribute[];

  @IsOptional()
  @ArrayMaxSize(MAX_METADATA_CUSTOM_FIELDS)
  @ValidateNested({ each: true })
  @Type(() => TokenInstanceMetadataCustomField)
  public customFields?: TokenInstanceMetadataCustomField[];

  @IsUserAlias()
  public createdBy: UserAlias;

  @IsUserAlias()
  public lastModifiedBy: UserAlias;

  @IsPositive()
  public created: number;

  @IsPositive()
  public lastModified: number;
}

@JSONSchema({
  description:
    "Full-document upsert of a project's metadata for a single NFT token instance. The project " +
    "identifier is a name claimed in the NFT collection name registry: the calling user must be " +
    "authorized for it (see GrantNftCollectionAuthorization). Replaces any existing metadata " +
    "document of the project for the instance."
})
export class SetTokenInstanceMetadataDto extends SubmitCallDTO {
  @JSONSchema({
    description: "Key of the NFT token instance to attach the metadata to."
  })
  @ValidateNested()
  @Type(() => TokenInstanceKey)
  @IsNotEmpty()
  tokenInstance: TokenInstanceKey;

  @JSONSchema({
    description: "Identifier of the game or product this metadata document belongs to."
  })
  @IsNotEmpty()
  @MaxLength(200)
  project: string;

  @IsOptional()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @MaxLength(500)
  image?: string;

  @IsOptional()
  @MaxLength(500)
  externalUrl?: string;

  @IsOptional()
  @MaxLength(500)
  animationUrl?: string;

  @JSONSchema({
    description: "Background color as a six-character hexadecimal without a pre-pended #."
  })
  @IsOptional()
  @Matches(METADATA_BACKGROUND_COLOR_REGEX)
  backgroundColor?: string;

  @IsOptional()
  @MaxLength(500)
  youtubeUrl?: string;

  @JSONSchema({
    description:
      "Traits following the OpenSea metadata standard attribute format. " +
      `At most ${MAX_METADATA_ATTRIBUTES} entries.`
  })
  @IsOptional()
  @ArrayMaxSize(MAX_METADATA_ATTRIBUTES)
  @ValidateNestedAllowUnknown({ each: true })
  @Type(() => TokenInstanceMetadataAttribute)
  attributes?: TokenInstanceMetadataAttribute[];

  @JSONSchema({
    description:
      "Arbitrary key-value entries for game or product specific metadata. " +
      `At most ${MAX_METADATA_CUSTOM_FIELDS} entries.`
  })
  @IsOptional()
  @ArrayMaxSize(MAX_METADATA_CUSTOM_FIELDS)
  @ValidateNestedAllowUnknown({ each: true })
  @Type(() => TokenInstanceMetadataCustomField)
  customFields?: TokenInstanceMetadataCustomField[];
}

@JSONSchema({
  description:
    "Fetches metadata documents of a single NFT token instance. If project is provided, fetches " +
    "the document of that project only. Otherwise, fetches documents of all projects for the instance."
})
export class FetchTokenInstanceMetadataDto extends ChainCallDTO {
  @JSONSchema({
    description: "Key of the NFT token instance to fetch the metadata of."
  })
  @ValidateNested()
  @Type(() => TokenInstanceKey)
  @IsNotEmpty()
  tokenInstance: TokenInstanceKey;

  @JSONSchema({
    description: "Optional project identifier to fetch a single project's metadata document."
  })
  @IsOptional()
  @IsNotEmpty()
  project?: string;
}

@JSONSchema({
  description:
    "Fetch token instance metadata documents currently available in world state. Supports " +
    "filtering, pagination, and optionality of instance key properties."
})
export class FetchTokenInstanceMetadataWithPaginationDto extends ChainCallDTO {
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
    description: "Token instance, as an unsigned integer. Optional, but required if project is provided."
  })
  @ValidateIf((o) => !!o.project || o.instance !== undefined)
  @IsNotEmpty()
  @Matches(METADATA_INSTANCE_ID_REGEX)
  instance?: string;

  @JSONSchema({
    description: "Project identifier. Optional."
  })
  @IsOptional()
  @IsNotEmpty()
  project?: string;

  @JSONSchema({
    description: "Page bookmark. If it is undefined, then the first page is returned."
  })
  @IsOptional()
  @IsNotEmpty()
  bookmark?: string;

  @JSONSchema({
    description:
      `Page size limit. ` +
      `Defaults to ${FetchTokenInstanceMetadataWithPaginationDto.DEFAULT_LIMIT}, max possible value ${FetchTokenInstanceMetadataWithPaginationDto.MAX_LIMIT}. ` +
      "Note you will likely get less results than the limit, because the limit is applied before additional filtering."
  })
  @IsOptional()
  @Max(FetchTokenInstanceMetadataWithPaginationDto.MAX_LIMIT)
  @Min(1)
  @IsInt()
  limit?: number;
}

export class FetchTokenInstanceMetadataResponse extends ChainCallDTO {
  @JSONSchema({ description: "List of token instance metadata documents." })
  @ValidateNested({ each: true })
  @Type(() => TokenInstanceMetadata)
  results: TokenInstanceMetadata[];

  @JSONSchema({ description: "Next page bookmark." })
  @IsOptional()
  @IsString()
  nextPageBookmark?: string;
}

@JSONSchema({
  description:
    "Deletes a project's metadata document of a single NFT token instance. Callable only by " +
    "users authorized for the project name in the NFT collection name registry."
})
export class DeleteTokenInstanceMetadataDto extends SubmitCallDTO {
  @JSONSchema({
    description: "Key of the NFT token instance to delete the metadata of."
  })
  @ValidateNested()
  @Type(() => TokenInstanceKey)
  @IsNotEmpty()
  tokenInstance: TokenInstanceKey;

  @JSONSchema({
    description: "Identifier of the game or product whose metadata document should be deleted."
  })
  @IsNotEmpty()
  @MaxLength(200)
  project: string;
}

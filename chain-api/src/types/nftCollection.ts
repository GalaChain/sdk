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
import { IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import { BigNumberIsPositive, BigNumberProperty, IsUserRef } from "../validators";
import { UserRef } from "./UserRef";
import { ChainCallDTO, SubmitCallDTO } from "./dtos";

@JSONSchema({
  description:
    "DTO for granting authorization to a user to create NFT collections for a specific collection name."
})
export class GrantNftCollectionAuthorizationDto extends SubmitCallDTO {
  @JSONSchema({
    description: "The collection name for which authorization is being granted."
  })
  @IsString()
  @IsNotEmpty()
  public collection: string;

  @JSONSchema({
    description: "User alias or secp256k1 public key of the user to authorize for creating NFT collections."
  })
  @IsString()
  @IsNotEmpty()
  public authorizedUser: UserRef;
}

@JSONSchema({
  description:
    "DTO for revoking authorization from a user to create NFT collections for a specific collection name."
})
export class RevokeNftCollectionAuthorizationDto extends SubmitCallDTO {
  @JSONSchema({
    description: "The collection name for which authorization is being revoked."
  })
  @IsString()
  @IsNotEmpty()
  public collection: string;

  @JSONSchema({
    description: "User alias or secp256k1 public key of the user to revoke authorization from."
  })
  @IsString()
  @IsNotEmpty()
  public authorizedUser: UserRef;
}

@JSONSchema({
  description: "DTO for fetching authorization information for a specific collection name."
})
export class FetchNftCollectionAuthorizationDto extends ChainCallDTO {
  @JSONSchema({
    description: "The collection name to fetch authorization for."
  })
  @IsString()
  @IsNotEmpty()
  public collection: string;
}

@JSONSchema({
  description: "DTO for fetching all NFT collection authorizations with pagination support."
})
export class FetchNftCollectionAuthorizationsWithPaginationDto extends ChainCallDTO {
  @JSONSchema({
    description:
      "Optional bookmark for pagination. Use the bookmark from the previous response to fetch the next page."
  })
  @IsString()
  @IsOptional()
  public bookmark?: string;

  @JSONSchema({
    description: "Optional limit for the number of results to return per page."
  })
  @IsNumber()
  @IsOptional()
  public limit?: number;

  public static readonly DEFAULT_LIMIT = 100;
}

@JSONSchema({
  description: "Response containing paginated NFT collection authorizations."
})
export class FetchNftCollectionAuthorizationsResponse extends ChainCallDTO {
  @JSONSchema({
    description: "Array of NFT collection authorization objects."
  })
  @ValidateNested({ each: true })
  @Type(() => Object)
  public results: any[];

  @JSONSchema({
    description: "Bookmark for the next page of results. Present if there are more results available."
  })
  @IsString()
  @IsOptional()
  public nextPageBookmark?: string;
}

@JSONSchema({
  description: "DTO for creating an NFT collection. Requires prior authorization for the collection name."
})
export class CreateNftCollectionDto extends SubmitCallDTO {
  @JSONSchema({
    description: "The collection name. Must match an authorization the calling user has been granted."
  })
  @IsString()
  @IsNotEmpty()
  collection: string;

  @JSONSchema({
    description: "The category of the NFT collection."
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @JSONSchema({
    description: "The type of the NFT collection."
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @JSONSchema({
    description: "Additional key for the NFT collection."
  })
  @IsString()
  @IsNotEmpty()
  additionalKey: string;

  @JSONSchema({
    description: "The name of the NFT collection."
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @JSONSchema({
    description: "The symbol of the NFT collection."
  })
  @IsString()
  symbol: string;

  @JSONSchema({
    description: "Description of the NFT collection."
  })
  @IsString()
  @IsNotEmpty()
  public description: string;

  @JSONSchema({
    description: "Image URL for the NFT collection."
  })
  @IsString()
  @IsNotEmpty()
  public image: string;

  @JSONSchema({
    description: "Optional metadata address for the NFT collection."
  })
  @IsString()
  @IsOptional()
  metadataAddress?: string;

  @JSONSchema({
    description: "Optional contract address for the NFT collection."
  })
  @IsString()
  @IsOptional()
  contractAddress?: string;

  @JSONSchema({
    description: "Optional rarity information for the NFT collection."
  })
  @IsString()
  @IsOptional()
  rarity?: string;

  @JSONSchema({
    description: "Maximum supply for the NFT collection."
  })
  @BigNumberIsPositive()
  @BigNumberProperty()
  @IsOptional()
  maxSupply?: BigNumber;

  @JSONSchema({
    description: "Maximum capacity for the NFT collection."
  })
  @BigNumberIsPositive()
  @BigNumberProperty()
  @IsOptional()
  maxCapacity?: BigNumber;

  @JSONSchema({
    description: "List of user aliases who should become token authorities. Defaults to the calling user."
  })
  @IsUserRef({ each: true })
  @IsOptional()
  authorities?: UserRef[];
}

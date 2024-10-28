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
import { Exclude, instanceToInstance } from "class-transformer";
import {
  Equals,
  IsAlpha,
  IsBoolean,
  IsDefined,
  IsNotEmpty,
  IsOptional,
  Max,
  MaxLength,
  Min
} from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import { ChainKey } from "../utils";
import { BigNumberIsPositive, BigNumberProperty, IsUserAlias } from "../validators";
import { ChainObject } from "./ChainObject";
import { GC_NETWORK_ID } from "./contract";
import { ChainCallDTO } from "./dtos";

export interface TokenClassKeyProperties {
  collection: string;
  category: string;
  type: string;
  additionalKey: string;
}

@JSONSchema({
  description: "Object representing the chain identifier of token class."
})
export class TokenClassKey extends ChainCallDTO {
  @IsNotEmpty()
  public collection: string;

  @IsNotEmpty()
  public category: string;

  @IsNotEmpty()
  public type: string;

  @IsDefined()
  public additionalKey: string;

  public toString() {
    return this.toStringKey();
  }

  public toStringKey(): string {
    const keyList = TokenClass.buildClassKeyList(this);
    return ChainObject.getStringKeyFromParts(keyList);
  }

  public static toStringKey(props: TokenClassKeyProperties): string {
    const keyList = TokenClass.buildClassKeyList(props);
    return ChainObject.getStringKeyFromParts(keyList);
  }

  public allKeysPresent(): boolean {
    const keysAndValues = Object.entries(this);
    if (keysAndValues.length !== 4) return false;

    const additionalKeyPresent = typeof this.additionalKey === "string";
    if (this.collection && this.category && this.type && additionalKeyPresent) return true;

    return false;
  }
}

export class TokenClass extends ChainObject {
  public static INDEX_KEY = "GCTI";

  /// ///////////////////////////////////////////////////
  // READ-ONLY PROPERTIES
  // CANNOT BE CHANGED AFTER CREATION
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

  @IsNotEmpty()
  @Equals(GC_NETWORK_ID)
  public network: string;

  /// ///////////////////////////////////////////////////
  // READ-ONLY PROPERTIES
  // CAN ONLY BE MODIFIED BY CHAINCODE CALLS
  //

  @Min(0)
  @Max(32)
  public decimals: number; // This can only be expanded after creation

  @IsNotEmpty()
  @BigNumberIsPositive()
  @BigNumberProperty()
  public maxSupply: BigNumber;

  @IsBoolean()
  public isNonFungible: boolean;

  @IsNotEmpty()
  @BigNumberIsPositive()
  @BigNumberProperty({ allowInfinity: true })
  public maxCapacity: BigNumber;

  // IDs of authorities who can manage this token
  @IsUserAlias({ each: true })
  public authorities: Array<string>;

  /// ///////////////////////////////////////////////////
  // Permissioned Properties (Authorities can directly modify)
  @IsNotEmpty()
  public name: string;

  @IsNotEmpty()
  @IsAlpha()
  public symbol: string;

  @IsNotEmpty()
  @MaxLength(1000)
  public description: string;

  // This is for tracking external token data. We don't use it internally (I think?)
  @IsOptional()
  @MaxLength(500)
  public contractAddress?: string;

  // Contract address where the information about the NFT will live
  @IsOptional()
  @MaxLength(500)
  public metadataAddress?: string;

  // a URI to the image
  @IsNotEmpty()
  @MaxLength(500)
  public image: string;

  // Rarity of the NFT
  @IsOptional()
  @IsAlpha()
  public rarity?: string;

  @BigNumberIsPositive()
  @BigNumberProperty()
  public totalBurned: BigNumber;

  @BigNumberProperty()
  public totalMintAllowance: BigNumber;

  @IsOptional()
  @BigNumberProperty()
  public knownMintAllowanceSupply?: BigNumber;

  /**
   * Total supply of tokens minted for class.
   *
   * @deprecated 2023-05-30, replaced with knownMintSupply for high-throughput implementation.
   */
  @BigNumberProperty()
  public totalSupply: BigNumber;

  @IsOptional()
  @BigNumberProperty()
  public knownMintSupply?: BigNumber;

  @Exclude()
  public getKey(): Promise<TokenClassKey> {
    return TokenClass.buildClassKeyObject(this);
  }

  public static buildClassKeyList(
    tokenClassKey: TokenClassKeyProperties
  ): [collection: string, category: string, type: string, additionalKey: string] {
    const { collection, category, type, additionalKey } = tokenClassKey;
    return [collection, category, type, additionalKey];
  }

  @Exclude()
  public static buildTokenClassCompositeKey(tokenClassKey: TokenClassKeyProperties): string {
    const partialClassObj = new TokenClass();
    partialClassObj.collection = tokenClassKey.collection;
    partialClassObj.category = tokenClassKey.category;
    partialClassObj.type = tokenClassKey.type;
    partialClassObj.additionalKey = tokenClassKey.additionalKey;
    return partialClassObj.getCompositeKey();
  }

  @Exclude()
  public static async buildClassKeyObject(token: TokenClassKeyProperties): Promise<TokenClassKey> {
    const tokenClassKey = new TokenClassKey();

    tokenClassKey.collection = token?.collection ?? null;
    tokenClassKey.category = token?.category ?? null;
    tokenClassKey.type = token?.type ?? null;
    tokenClassKey.additionalKey = token?.additionalKey ?? null;

    const instanceValidationErrors = await tokenClassKey.validate();

    if (instanceValidationErrors.length !== 0) {
      throw new Error(instanceValidationErrors.join(". "));
    }

    return tokenClassKey;
  }

  /**
   * Returns new token class object updated with properties that are allowed to be updated
   */
  public updatedWith(toUpdate: ToUpdate): TokenClass {
    return createUpdated(this, toUpdate);
  }
}

interface ToUpdate {
  name?: string;
  symbol?: string;
  description?: string;
  contractAddress?: string;
  metadataAddress?: string;
  rarity?: string;
  image?: string;
  authorities?: string[];
  overwriteAuthorities?: boolean;
}

function createUpdated(existingToken: TokenClass, toUpdate: ToUpdate): TokenClass {
  const newToken = instanceToInstance(existingToken);
  newToken.name = toUpdate.name ?? existingToken.name;
  newToken.symbol = toUpdate.symbol ?? existingToken.symbol;
  newToken.description = toUpdate.description ?? existingToken.description;
  newToken.contractAddress = toUpdate.contractAddress ?? existingToken.contractAddress;
  newToken.metadataAddress = toUpdate.metadataAddress ?? existingToken.metadataAddress;
  newToken.rarity = toUpdate.rarity ?? existingToken.rarity;
  newToken.image = toUpdate.image ?? existingToken.image;

  if (Array.isArray(toUpdate.authorities) && toUpdate.authorities.length > 0) {
    newToken.authorities = toUpdate.overwriteAuthorities
      ? toUpdate.authorities
      : Array.from(new Set(newToken.authorities.concat(toUpdate.authorities))).sort();
  }

  return newToken;
}

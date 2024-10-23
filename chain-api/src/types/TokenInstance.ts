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
import { Exclude, Type, classToPlain as instanceToPlain } from "class-transformer";
import {
  IsBoolean,
  IsDefined,
  IsNotEmpty,
  IsObject,
  IsOptional,
  ValidateIf,
  ValidateNested
} from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import { ChainKey } from "../utils";
import { BigNumberIsInteger, BigNumberIsNotNegative, BigNumberProperty, IsUserAlias } from "../validators";
import { ChainObject } from "./ChainObject";
import { TokenClass, TokenClassKey, TokenClassKeyProperties } from "./TokenClass";
import { ChainCallDTO } from "./dtos";

export interface TokenInstanceKeyProperties {
  collection: string;
  category: string;
  type: string;
  additionalKey: string;
  instance: BigNumber;
}

@JSONSchema({
  description: "Object representing the chain identifier of token instance."
})
export class TokenInstanceKey extends ChainCallDTO {
  @IsNotEmpty()
  public collection: string;

  @IsNotEmpty()
  public category: string;

  @IsNotEmpty()
  public type: string;

  @IsDefined()
  public additionalKey: string;

  @IsNotEmpty()
  @BigNumberIsInteger()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  public instance: BigNumber;

  public static nftKey(
    c: TokenClassKey | TokenClass | TokenClassKeyProperties,
    instance: BigNumber | string | number
  ): TokenInstanceKey {
    const instanceKey = new TokenInstanceKey();
    instanceKey.collection = c.collection;
    instanceKey.category = c.category;
    instanceKey.type = c.type;
    instanceKey.additionalKey = c.additionalKey;
    instanceKey.instance = new BigNumber(instance);

    return instanceKey;
  }

  public static fungibleKey(c: TokenClassKey | TokenClass): TokenInstanceKey {
    return TokenInstanceKey.nftKey(c, TokenInstance.FUNGIBLE_TOKEN_INSTANCE);
  }

  public getTokenClassKey(): TokenClassKey {
    const returnKey = new TokenClassKey();
    returnKey.category = this.category;
    returnKey.collection = this.collection;
    returnKey.type = this.type;
    returnKey.additionalKey = this.additionalKey;

    return returnKey;
  }

  public toQueryKey(): TokenInstanceQueryKey {
    const queryKey = new TokenInstanceQueryKey();
    queryKey.collection = this.collection;
    queryKey.category = this.category;
    queryKey.type = this.type;
    queryKey.additionalKey = this.additionalKey;
    queryKey.instance = this.instance;

    return queryKey;
  }

  public toString() {
    return this.toStringKey();
  }

  public toStringKey(): string {
    const keyList = TokenInstance.buildInstanceKeyList(this);
    return ChainObject.getStringKeyFromParts(keyList);
  }

  public isFungible(): boolean {
    return TokenInstance.isFungible(this.instance);
  }
}

export class TokenInstanceQuantity extends ChainCallDTO {
  @ValidateNested()
  @Type(() => TokenInstanceKey)
  @IsNotEmpty()
  public tokenInstance: TokenInstanceKey;

  @IsNotEmpty()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  public quantity: BigNumber;

  @IsOptional()
  @JSONSchema({
    description: "The TokenClass metadata corresponding to the TokenBalance on this DTO."
  })
  @Type(() => TokenClass)
  @IsObject()
  tokenMetadata?: TokenClass;

  public getTokenClassKey(this: TokenInstanceQuantity): TokenClassKey {
    return this.tokenInstance.getTokenClassKey();
  }

  public toString(this: TokenInstanceQuantity) {
    return this.tokenInstance.toStringKey();
  }

  public toStringKey(this: TokenInstanceQuantity): string {
    return this.tokenInstance.toStringKey();
  }
}

@JSONSchema({
  description:
    "A full or partial key of a TokenInstance, for querying or actioning one or more instances of a token."
})
export class TokenInstanceQueryKey extends ChainCallDTO {
  @IsNotEmpty()
  public collection: string;

  @IsOptional()
  public category?: string;

  @IsOptional()
  public type?: string;

  @IsOptional()
  public additionalKey?: string;

  @IsOptional()
  @BigNumberIsInteger()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  public instance?: BigNumber;

  public isCompleteKey(): boolean {
    // for feature parity and transformation to TokenInstanceKey for compatibility with existing chain calls
    return !!(
      this.collection &&
      this.category &&
      this.type &&
      typeof this.additionalKey === "string" &&
      BigNumber.isBigNumber(this.instance)
    );
  }

  public toCompleteKey(): TokenInstanceKey {
    // a TokenInstanceKey can always convert to a TokenQueryKey,
    // but a query key must have all required properties to convert to a TokenInstanceKey
    if (
      !(
        this.collection &&
        this.category &&
        this.type &&
        typeof this.additionalKey === "string" &&
        BigNumber.isBigNumber(this.instance)
      )
    ) {
      throw new Error(
        `Attempted to convert partial key to complete instance key with missing properties: ${this.toQueryParams().join(
          ", "
        )}`
      );
    }

    const instanceKey = new TokenInstanceKey();

    instanceKey.collection = this.collection;
    instanceKey.category = this.category;
    instanceKey.type = this.type;
    instanceKey.additionalKey = this.additionalKey;
    instanceKey.instance = this.instance;

    return instanceKey;
  }

  publicKeyProperties() {
    // key properties, in order, to support partial key construction.
    // fabric permits partial keys, in order of specificity, with no gaps.
    // e.g. if "type" is undefined, "additionalKey" must not be specified.
    return ["collection", "category", "type", "additionalKey"];
  }

  public toQueryParams() {
    const queryParams: string[] = [];

    const publicKeyProperties = this.publicKeyProperties();
    for (const property of publicKeyProperties) {
      if (typeof this[property] !== "string") {
        break;
      }
      queryParams.push(this[property]);
    }
    return queryParams;
  }
}

export class TokenInstance extends ChainObject {
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

  @IsBoolean()
  public isNonFungible: boolean;

  @ValidateIf((i) => i.isNonFungible === true)
  @IsUserAlias()
  public owner?: string;

  public static INDEX_KEY = "GCTI2";

  public static FUNGIBLE_TOKEN_INSTANCE = new BigNumber(0);

  // This returns the unique identifying string used in the composite key for querying HLF
  @Exclude()
  public GetCompositeKeyString(): string {
    return TokenInstance.CreateCompositeKey(this);
  }

  @Exclude()
  public static GetFungibleInstanceFromClass(token: TokenClassKeyProperties): string {
    const { MIN_UNICODE_RUNE_VALUE } = ChainObject;
    const { collection, category, type, additionalKey } = token;

    return [collection, category, type, additionalKey, this.FUNGIBLE_TOKEN_INSTANCE].join(
      MIN_UNICODE_RUNE_VALUE
    );
  }

  // This returns the unique identifying string used in the composite key for querying HLF
  @Exclude()
  public static CreateCompositeKey(token: TokenInstanceKeyProperties): string {
    const { MIN_UNICODE_RUNE_VALUE } = ChainObject;
    const { collection, category, type, additionalKey, instance } = instanceToPlain(token);

    return [collection, category, type, additionalKey, instance].join(MIN_UNICODE_RUNE_VALUE);
  }

  // This parses a string into the key that can be used to query HLF
  // This looks to be built to only handle the key to be composed of two parts and seperated by a |
  @Exclude()
  public static GetCompositeKeyFromString(tokenCid: string): string {
    const idParts = tokenCid.split(ChainObject.ID_SPLIT_CHAR);

    // We expect two parts, and for the second one to be a number
    if (idParts.length !== 2 || Number.isNaN(Number.parseInt(idParts[1]))) {
      throw new Error(`Invalid string passed to TokenInstance.GetCompositeKeyFromString : ${tokenCid}`);
    } else {
      return ChainObject.getCompositeKeyFromParts(TokenInstance.INDEX_KEY, idParts);
    }
  }

  @Exclude()
  public static buildInstanceKeyList(
    token: TokenInstanceKeyProperties
  ): [collection: string, category: string, type: string, additionalKey: string, instance: string] {
    const { collection, category, type, additionalKey, instance } = token;
    return [collection, category, type, additionalKey, instance.toString()];
  }

  @Exclude()
  public static async buildInstanceKeyObject(token: TokenInstanceKeyProperties): Promise<TokenInstanceKey> {
    const tokenInstanceKey = new TokenInstanceKey();

    tokenInstanceKey.collection = token?.collection ?? null;
    tokenInstanceKey.category = token?.category ?? null;
    tokenInstanceKey.type = token?.type ?? null;
    tokenInstanceKey.additionalKey = token?.additionalKey ?? null;
    tokenInstanceKey.instance = token?.instance ?? null;

    const instanceValidationErrors = await tokenInstanceKey.validate();

    if (instanceValidationErrors.length !== 0) {
      throw new Error(instanceValidationErrors.join(". "));
    }

    return tokenInstanceKey;
  }

  public static isFungible(instanceId: BigNumber): boolean {
    return TokenInstance.FUNGIBLE_TOKEN_INSTANCE.isEqualTo(instanceId);
  }

  public static isNFT(instanceId: BigNumber): boolean {
    return !TokenInstance.isFungible(instanceId);
  }
}

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
import { IsDefined, IsNotEmpty, IsOptional } from "class-validator";

import { ChainKey } from "../utils";
import { BigNumberIsNotNegative, BigNumberProperty, IsUserAlias } from "../validators";
import { ChainObject } from "./ChainObject";
import { RangedChainObject } from "./RangedChainObject";
import { TokenMintFulfillment } from "./TokenMintFulfillment";
import { AllowanceKey, TokenMintStatus } from "./common";

export class TokenMintRequest extends RangedChainObject {
  public static INDEX_KEY = "GCTMR";
  public static OBJECT_TYPE = "TokenMintRequest"; // for contract.GetObjectsByPartialCompositeKey

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
  public timeKey: string;

  @ChainKey({ position: 5 })
  @IsUserAlias()
  public owner: string;

  @IsNotEmpty()
  @BigNumberProperty()
  public totalKnownMintsCount: BigNumber;

  @IsUserAlias()
  public requestor: string;

  @IsNotEmpty()
  public created: number;

  @IsNotEmpty()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  public quantity: BigNumber;

  @IsNotEmpty()
  public state: TokenMintStatus;

  @IsNotEmpty()
  public id: string;

  // todo: revisit epoch as chain key if/when fabric implements it beyond hard-coded 0
  // @ChainKey({ position: ? })
  @IsNotEmpty()
  public epoch: string;

  @IsOptional()
  @Type(() => AllowanceKey)
  @IsNotEmpty()
  public allowanceKey?: AllowanceKey;

  public isTimeKeyValid(): boolean {
    try {
      new BigNumber(this.timeKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  public requestId(): string {
    const { collection, category, type, additionalKey, totalKnownMintsCount, requestor, owner, created } =
      this;

    return ChainObject.getStringKeyFromParts([
      collection,
      category,
      type,
      additionalKey,
      totalKnownMintsCount.toString(),
      requestor,
      owner,
      `${created}`
    ]);
  }

  public fulfillmentKey(): string {
    const { collection, category, type, additionalKey, totalKnownMintsCount, requestor, owner, created } =
      this;

    return ChainObject.getCompositeKeyFromParts(TokenMintFulfillment.INDEX_KEY, [
      collection,
      category,
      type,
      additionalKey,
      totalKnownMintsCount.toString(),
      requestor,
      owner,
      `${created}`
    ]);
  }

  public fulfill(qty: BigNumber): TokenMintFulfillment {
    const { collection, category, type, additionalKey, requestor, created, owner } = this;

    const mintFulfillment = new TokenMintFulfillment();

    mintFulfillment.collection = collection;
    mintFulfillment.category = category;
    mintFulfillment.type = type;
    mintFulfillment.additionalKey = additionalKey;
    mintFulfillment.requestor = requestor;
    mintFulfillment.requestCreated = created;
    mintFulfillment.owner = owner;
    mintFulfillment.created = created;

    mintFulfillment.quantity = qty;

    if (qty.isLessThan(this.quantity)) {
      mintFulfillment.state = TokenMintStatus.PartiallyMinted;
    } else {
      mintFulfillment.state = TokenMintStatus.Minted;
    }

    mintFulfillment.id = this.requestId();

    return mintFulfillment;
  }
}

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
import { IsDefined, IsNotEmpty, IsOptional } from "class-validator";

import { ChainKey } from "../utils";
import { BigNumberIsNotNegative, BigNumberProperty, IsUserAlias } from "../validators";
import { ChainObject } from "./ChainObject";
import { RangedChainObject } from "./RangedChainObject";
import { TokenAllowance } from "./TokenAllowance";
import { TokenMintAllowance } from "./TokenMintAllowance";
import { AllowanceType, TokenMintStatus } from "./common";

export class TokenMintAllowanceRequest extends RangedChainObject {
  public static INDEX_KEY = "GCTMAR";

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
  @IsDefined()
  public timeKey: string;

  @ChainKey({ position: 5 })
  @IsUserAlias()
  public grantedTo: string;

  @IsNotEmpty()
  @BigNumberProperty()
  public totalKnownMintAllowancesCount: BigNumber;

  @IsNotEmpty()
  public created: number;

  @IsUserAlias()
  public grantedBy: string;

  @IsNotEmpty()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  public quantity: BigNumber;

  @IsNotEmpty()
  public state: TokenMintStatus;

  @IsNotEmpty()
  public id: string;

  @IsNotEmpty()
  @BigNumberProperty()
  public uses: BigNumber;

  @IsOptional()
  public expires?: number;

  // todo: revisist epoch as chain key if/when fabric implements it beyond hard-coded 0
  // @ChainKey({ position: 4 })
  @IsNotEmpty()
  public epoch: string;

  public requestId(): string {
    const {
      collection,
      category,
      type,
      additionalKey,
      totalKnownMintAllowancesCount,
      created,
      grantedBy,
      grantedTo
    } = this;

    return ChainObject.getStringKeyFromParts([
      collection,
      category,
      type,
      additionalKey,
      totalKnownMintAllowancesCount.toString(),
      `${created}`,
      grantedBy,
      grantedTo
    ]);
  }

  public fulfillmentKey(): string {
    const {
      collection,
      category,
      type,
      additionalKey,
      totalKnownMintAllowancesCount,
      created,
      grantedBy,
      grantedTo
    } = this;

    return ChainObject.getCompositeKeyFromParts(TokenMintAllowance.INDEX_KEY, [
      collection,
      category,
      type,
      additionalKey,
      totalKnownMintAllowancesCount.toString(),
      `${created}`,
      grantedBy,
      grantedTo
    ]);
  }

  public fulfill(instance: BigNumber): [TokenMintAllowance, TokenAllowance] {
    const {
      collection,
      category,
      type,
      additionalKey,
      totalKnownMintAllowancesCount,
      created,
      grantedBy,
      grantedTo,
      quantity,
      id,
      uses,
      expires
    } = this;

    const mintAllowanceEntry = new TokenMintAllowance();

    mintAllowanceEntry.collection = collection;
    mintAllowanceEntry.category = category;
    mintAllowanceEntry.type = type;
    mintAllowanceEntry.additionalKey = additionalKey;
    mintAllowanceEntry.totalKnownMintAllowancesAtRequest = totalKnownMintAllowancesCount;
    mintAllowanceEntry.grantedBy = grantedBy;
    mintAllowanceEntry.grantedTo = grantedTo;
    mintAllowanceEntry.created = created;
    mintAllowanceEntry.reqId = id;
    mintAllowanceEntry.quantity = quantity;

    const allowance = new TokenAllowance();

    allowance.grantedTo = grantedTo;
    allowance.collection = collection;
    allowance.category = category;
    allowance.type = type;
    allowance.additionalKey = additionalKey;
    allowance.instance = instance;
    allowance.allowanceType = AllowanceType.Mint;
    allowance.grantedBy = grantedBy;
    // todo: determine if using the created timestamp of the request is fine,
    // or if we need to use the timestamp of the fulfillment.
    allowance.created = created;
    allowance.uses = uses;
    allowance.usesSpent = new BigNumber("0");
    allowance.expires = expires ?? 0;
    allowance.quantity = quantity;
    allowance.quantitySpent = new BigNumber("0");

    return [mintAllowanceEntry, allowance];
  }
}

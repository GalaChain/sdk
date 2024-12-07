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
import { Exclude, Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Min,
  ValidateNested
} from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import { ChainKey } from "../utils";
import {
  BigNumberIsInteger,
  BigNumberIsNotNegative,
  BigNumberIsPositive,
  BigNumberProperty,
  IsUserAlias
} from "../validators";
import { ChainObject } from "./ChainObject";
import { TokenInstanceKey, TokenInstanceQuantity, TokenInstanceQueryKey } from "./TokenInstance";

/*
 * Chain INDEX_KEY naming conventions for Loans:
 * Prefix with "GCTL" for "Gala's Chain Token Loan".
 * Followed by two characters determined by the following rules:
 *  a) If the Class name makes two or more words, the first leter of two of the words as makes sense.
 *  b) If the Class name is a single word, the first and last letters of the word.
 *  c) If there is a comflict with an existing INDEX_KEY, then whatever makes sense.
 */

/*
 * Here, "Any" is set as the first value. First value = 0, which is a falsy value in TypeScript/JavaScript.
 * When Querying by LoanStatus, this avoids the pitfalls of `if (dto.status) {}` failing for "Open".
 * https://github.com/microsoft/TypeScript/issues/7473
 * Retrieved 2022-09-07
 * "I suggest that, as a general practice, enums should always be defined with the
 * 0 value being equivalent to the "Zero Like", "Unspecified", or "Falsy" value for that enum type."
 */
export enum LoanStatus {
  Any = 0,
  Open = 1,
  Contracted = 2,
  Fulfilled = 3,
  Cancelled = 4
}

export enum LoanClosedBy {
  Unspecified = 0,
  Owner = 1,
  Registrar = 2
}

export class LoanOffer extends ChainObject {
  @JSONSchema({ description: "TokenInstance collection. ChainKey property." })
  @ChainKey({ position: 0 })
  @IsNotEmpty()
  public collection: string;

  @JSONSchema({ description: "TokenInstance category. ChainKey property." })
  @ChainKey({ position: 1 })
  @IsNotEmpty()
  public category: string;

  @JSONSchema({ description: "TokenInstance type. ChainKey property." })
  @ChainKey({ position: 2 })
  @IsNotEmpty()
  public type: string;

  @JSONSchema({ description: "TokenInstance additionalKey. ChainKey property." })
  @ChainKey({ position: 3 })
  @IsDefined()
  public additionalKey: string;

  @JSONSchema({ description: "TokenInstance instance. ChainKey property." })
  @ChainKey({ position: 4 })
  @IsNotEmpty()
  @BigNumberIsInteger()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  public instance: BigNumber;

  @JSONSchema({ description: "Chain identity of the NFT owner that offered the loan. ChainKey property." })
  @ChainKey({ position: 5 })
  @IsUserAlias()
  public owner: string;

  @JSONSchema({ description: "Timestamp tracking when the offer was made. ChainKey property." })
  @ChainKey({ position: 6 })
  @IsNotEmpty()
  public created: number;

  @JSONSchema({
    description:
      "ChainKey property. Numeric id to differentiate multiple " +
      "LoanOffers written to chain, at the same time, for the same NFT, such as p2p loans offered " +
      "to a small group of known users."
  })
  @ChainKey({ position: 7 })
  public id: number;

  @JSONSchema({
    description: "Registrar chain identity. For p2p loans, equal to the " + "Loan.NULL_REGISTRAR_KEY."
  })
  @IsOptional()
  @IsNotEmpty()
  public registrar?: string;

  @JSONSchema({ description: "Optional borrower identity, for loans offered to a specific group of users." })
  @IsOptional()
  @IsUserAlias()
  public borrower?: string;

  @JSONSchema({ description: "LoanStatus, e.g. Open, Contracted, Fulfilled, Cancelled." })
  @IsNotEmpty()
  public status: LoanStatus;

  @JSONSchema({ description: "Optional reward property, available for use by consumer implementations." })
  @ValidateNested({ each: true })
  @Type(() => TokenInstanceQuantity)
  @IsOptional()
  @ArrayNotEmpty()
  public reward?: Array<TokenInstanceQuantity>;

  @JSONSchema({
    description: "Number of times this offered can be accepted and fulfilled (non-concurrently)"
  })
  @BigNumberIsPositive()
  @BigNumberIsInteger()
  @BigNumberProperty()
  public uses: BigNumber;

  @JSONSchema({ description: "Number of uses spent." })
  @BigNumberIsPositive()
  @BigNumberIsInteger()
  @BigNumberProperty()
  public usesSpent: BigNumber;

  @Min(0)
  @IsInt()
  public expires: number;

  @Exclude()
  public static INDEX_KEY = "GCTLOR";

  @Exclude()
  public tokenKey() {
    const stringKey =
      `${this.collection}|${this.category}|${this.type}|${this.additionalKey}|` +
      `${this.instance.toFixed()}`;

    return stringKey;
  }

  @Exclude()
  public verifyTokenKey(key: TokenInstanceKey): boolean {
    return (
      this.collection === key.collection &&
      this.category === key.category &&
      this.type === key.type &&
      this.additionalKey === key.additionalKey &&
      this.instance.isEqualTo(key.instance)
    );
  }

  @Exclude()
  public Lender() {
    const lender: Lender = new Lender();
    lender.id = this.owner;
    lender.status = LoanStatus.Open;
    lender.offer = this.getCompositeKey();
    lender.collection = this.collection;
    lender.category = this.category;
    lender.type = this.type;
    lender.additionalKey = this.additionalKey;
    lender.instance = this.instance;

    return lender;
  }
}

@JSONSchema({
  description:
    "Lender data written to chain. Lender.offer property can retrieve a " +
    "specific LoanOffer. Useful within chaicnode for queries via " +
    "full or partial key. For example, query by Lender's client identity to retrieve " +
    "all offer IDs made by that Lender."
})
export class Lender extends ChainObject {
  @JSONSchema({ description: "Client identity id for Lender that made the referenced LoanOffer." })
  @ChainKey({ position: 0 })
  @IsUserAlias()
  id: string;

  @JSONSchema({ description: "LoanStatus. ChainKey Property." })
  @ChainKey({ position: 1 })
  @IsNotEmpty()
  status: LoanStatus;

  @JSONSchema({ description: "LoanOffer chain key." })
  @ChainKey({ position: 2 })
  @IsNotEmpty()
  offer: string;

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

  @Exclude()
  public static INDEX_KEY = "GCTLLR";

  @Exclude()
  public matchesQuery(key: TokenInstanceQueryKey) {
    const tokenKeys = key.publicKeyProperties();
    const queryParams = key.toQueryParams();

    for (let i = 0; i < queryParams.length; i++) {
      if (this[tokenKeys[i]] !== queryParams[i]) {
        return false;
      }
    }

    return true;
  }
}

export class LoanAgreement extends ChainObject {
  @ChainKey({ position: 0 })
  @IsUserAlias()
  owner: string;

  @ChainKey({ position: 1 })
  @IsNotEmpty()
  offer: string;

  @ChainKey({ position: 2 })
  loan: string;

  @ChainKey({ position: 3 })
  @IsUserAlias()
  borrower: string;

  @ChainKey({ position: 4 })
  @IsNotEmpty()
  created: number;

  @Exclude()
  public static INDEX_KEY = "GCTLLA";

  @Exclude()
  public static OBJECT_TYPE = "LoanAgreement";
}

export class Loan extends ChainObject {
  @ChainKey({ position: 0 })
  @IsNotEmpty()
  public registrar: string;

  @ChainKey({ position: 1 })
  @IsNotEmpty()
  public collection: string;

  @ChainKey({ position: 2 })
  @IsNotEmpty()
  public category: string;

  @ChainKey({ position: 3 })
  @IsNotEmpty()
  public type: string;

  @ChainKey({ position: 4 })
  @IsNotEmpty()
  public additionalKey: string;

  @ChainKey({ position: 5 })
  @IsNotEmpty()
  @BigNumberIsInteger()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  public instance: BigNumber;

  @ChainKey({ position: 6 })
  @IsNotEmpty()
  public start: number;

  public end: number;

  @IsUserAlias()
  public owner: string;

  @IsNotEmpty()
  public borrower: string;

  @IsNotEmpty()
  public status: LoanStatus;

  @IsNotEmpty()
  public closedBy: LoanClosedBy;

  @Exclude()
  public static INDEX_KEY = "GCTLLN";

  @Exclude()
  public static NULL_REGISTRAR_KEY = "p2p";
}

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
import { IsDefined, IsInt, IsNotEmpty, IsOptional, Min, ValidateNested } from "class-validator";
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
import { TokenClassKey } from "./TokenClass";

/*
 * Chain INDEX_KEY naming conventions for Lending:
 * Prefix with "GCTL" for "Gala's Chain Token Lending".
 * Followed by two characters determined by the following rules:
 *  a) If the Class name makes two or more words, the first letter of two of the words as makes sense.
 *  b) If the Class name is a single word, the first and last letters of the word.
 *  c) If there is a conflict with an existing INDEX_KEY, then whatever makes sense.
 */

/*
 * Here, "Any" is set as the first value. First value = 0, which is a falsy value in TypeScript/JavaScript.
 * When Querying by LendingStatus, this avoids the pitfalls of `if (dto.status) {}` failing for "Open".
 * https://github.com/microsoft/TypeScript/issues/7473
 * Retrieved 2022-09-07
 * "I suggest that, as a general practice, enums should always be defined with the
 * 0 value being equivalent to the "Zero Like", "Unspecified", or "Falsy" value for that enum type."
 */
export enum LendingStatus {
  Any = 0,
  OfferOpen = 1,
  OfferAccepted = 2,
  LoanActive = 3,
  LoanRepaid = 4,
  LoanDefaulted = 5,
  LoanLiquidated = 6,
  OfferCancelled = 7,
  OfferExpired = 8
}

export enum LendingClosedBy {
  Unspecified = 0,
  Lender = 1,
  Borrower = 2,
  Liquidator = 3,
  Protocol = 4
}

@JSONSchema({
  description:
    "Fungible token lending offer. A lender offers to lend a specific quantity " +
    "of fungible tokens with defined terms including interest rate, duration, and collateral requirements."
})
export class FungibleLendingOffer extends ChainObject {
  @JSONSchema({ description: "Principal token class being offered for lending. ChainKey property." })
  @ChainKey({ position: 0 })
  @ValidateNested()
  @Type(() => TokenClassKey)
  public principalToken: TokenClassKey;

  @JSONSchema({ description: "Quantity of principal tokens being offered. ChainKey property." })
  @ChainKey({ position: 1 })
  @IsNotEmpty()
  @BigNumberIsPositive()
  @BigNumberProperty()
  public principalQuantity: BigNumber;

  @JSONSchema({ description: "Chain identity of the lender offering the loan. ChainKey property." })
  @ChainKey({ position: 2 })
  @IsUserAlias()
  public lender: string;

  @JSONSchema({ description: "Timestamp tracking when the offer was made. ChainKey property." })
  @ChainKey({ position: 3 })
  @IsNotEmpty()
  public created: number;

  @JSONSchema({
    description:
      "ChainKey property. Numeric id to differentiate multiple " +
      "lending offers written to chain, at the same time, by the same lender."
  })
  @ChainKey({ position: 4 })
  public id: number;

  @JSONSchema({ description: "Annual interest rate as basis points (e.g., 500 = 5.00%)" })
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  public interestRate: BigNumber;

  @JSONSchema({ description: "Loan duration in seconds" })
  @Min(0)
  @IsInt()
  public duration: number;

  @JSONSchema({ description: "Required collateral token class" })
  @ValidateNested()
  @Type(() => TokenClassKey)
  public collateralToken: TokenClassKey;

  @JSONSchema({ description: "Collateral ratio required (e.g., 1.5 = 150% collateralization)" })
  @BigNumberIsPositive()
  @BigNumberProperty()
  public collateralRatio: BigNumber;

  @JSONSchema({ description: "Optional specific borrower for private lending offers" })
  @IsOptional()
  @IsUserAlias()
  public borrower?: string;

  @JSONSchema({ description: "LendingStatus, e.g. OfferOpen, OfferAccepted, LoanActive" })
  @IsNotEmpty()
  public status: LendingStatus;

  @JSONSchema({
    description: "Number of times this offer can be accepted and fulfilled (non-concurrently)"
  })
  @BigNumberIsPositive()
  @BigNumberIsInteger()
  @BigNumberProperty()
  public uses: BigNumber;

  @JSONSchema({ description: "Number of uses spent." })
  @BigNumberIsNotNegative()
  @BigNumberIsInteger()
  @BigNumberProperty()
  public usesSpent: BigNumber;

  @Min(0)
  @IsInt()
  public expires: number;

  @Exclude()
  public static INDEX_KEY = "GCTLFO";

  @Exclude()
  public static OBJECT_TYPE = "FungibleLendingOffer";
}

@JSONSchema({
  description:
    "Active fungible token loan representing an accepted lending offer with ongoing interest accrual."
})
export class FungibleLoan extends ChainObject {
  @JSONSchema({ description: "Chain identity of the lender. ChainKey property." })
  @ChainKey({ position: 0 })
  @IsUserAlias()
  public lender: string;

  @JSONSchema({ description: "Chain identity of the borrower. ChainKey property." })
  @ChainKey({ position: 1 })
  @IsUserAlias()
  public borrower: string;

  @JSONSchema({ description: "Reference to the original lending offer. ChainKey property." })
  @ChainKey({ position: 2 })
  @IsNotEmpty()
  public offerKey: string;

  @JSONSchema({ description: "Loan creation timestamp. ChainKey property." })
  @ChainKey({ position: 3 })
  @IsNotEmpty()
  public startTime: number;

  @JSONSchema({ description: "Principal token class" })
  @ValidateNested()
  @Type(() => TokenClassKey)
  public principalToken: TokenClassKey;

  @JSONSchema({ description: "Principal amount borrowed" })
  @BigNumberIsPositive()
  @BigNumberProperty()
  public principalAmount: BigNumber;

  @JSONSchema({ description: "Annual interest rate as basis points" })
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  public interestRate: BigNumber;

  @JSONSchema({ description: "Interest accrued so far" })
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  public interestAccrued: BigNumber;

  @JSONSchema({ description: "Last time interest was calculated and updated" })
  @IsNotEmpty()
  public lastInterestUpdate: number;

  @JSONSchema({ description: "Collateral token class" })
  @ValidateNested()
  @Type(() => TokenClassKey)
  public collateralToken: TokenClassKey;

  @JSONSchema({ description: "Amount of collateral locked" })
  @BigNumberIsPositive()
  @BigNumberProperty()
  public collateralAmount: BigNumber;

  @JSONSchema({ description: "Required collateral ratio" })
  @BigNumberIsPositive()
  @BigNumberProperty()
  public collateralRatio: BigNumber;

  @JSONSchema({ description: "Current health factor (collateral value / debt value)" })
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  public healthFactor: BigNumber;

  @JSONSchema({ description: "Loan end time (start + duration)" })
  @IsNotEmpty()
  public endTime: number;

  @JSONSchema({ description: "Current loan status" })
  @IsNotEmpty()
  public status: LendingStatus;

  @JSONSchema({ description: "Who closed the loan if applicable" })
  @IsNotEmpty()
  public closedBy: LendingClosedBy;

  @JSONSchema({ description: "Price at which liquidation occurred (if applicable)" })
  @IsOptional()
  @BigNumberIsPositive()
  @BigNumberProperty()
  public liquidationPrice?: BigNumber;

  @JSONSchema({ description: "Who triggered liquidation (if applicable)" })
  @IsOptional()
  @IsUserAlias()
  public liquidatedBy?: string;

  @Exclude()
  public static INDEX_KEY = "GCTLLN";

  @Exclude()
  public static OBJECT_TYPE = "FungibleLoan";
}

@JSONSchema({
  description: "Agreement record linking lending offers to active loans for tracking and audit purposes."
})
export class LendingAgreement extends ChainObject {
  @ChainKey({ position: 0 })
  @IsUserAlias()
  lender: string;

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
  public static OBJECT_TYPE = "LendingAgreement";
}

@JSONSchema({
  description: "Lender tracking object for efficient queries of lending offers by lender identity."
})
export class LendingLender extends ChainObject {
  @JSONSchema({ description: "Client identity id for Lender that made the referenced offer." })
  @ChainKey({ position: 0 })
  @IsUserAlias()
  id: string;

  @JSONSchema({ description: "LendingStatus. ChainKey Property." })
  @ChainKey({ position: 1 })
  @IsNotEmpty()
  status: LendingStatus;

  @JSONSchema({ description: "FungibleLendingOffer chain key." })
  @ChainKey({ position: 2 })
  @IsNotEmpty()
  offer: string;

  @JSONSchema({ description: "Principal token class" })
  @ValidateNested()
  @Type(() => TokenClassKey)
  public principalToken: TokenClassKey;

  @JSONSchema({ description: "Principal quantity offered" })
  @BigNumberIsPositive()
  @BigNumberProperty()
  public principalQuantity: BigNumber;

  @Exclude()
  public static INDEX_KEY = "GCTLLR";

  @Exclude()
  public static OBJECT_TYPE = "LendingLender";
}

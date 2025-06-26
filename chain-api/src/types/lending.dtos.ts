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
  ArrayUnique,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Min,
  ValidateNested
} from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import {
  BigNumberIsInteger,
  BigNumberIsNotNegative,
  BigNumberIsPositive,
  BigNumberProperty,
  EnumProperty,
  IsDifferentValue,
  IsUserRef
} from "../validators";
import { FungibleLendingOffer, FungibleLoan, LendingLender, LendingStatus } from "./lending";
import { TokenClassKey } from "./TokenClass";
import { ChainCallDTO, SubmitCallDTO } from "./dtos";

@JSONSchema({
  description:
    "Create a fungible token lending offer. A lender offers to lend a specific quantity " +
    "of fungible tokens with defined terms including interest rate, duration, and collateral requirements."
})
export class CreateLendingOfferDto extends SubmitCallDTO {
  static DEFAULT_EXPIRES = 0;

  @JSONSchema({
    description:
      "Lender of the fungible tokens offered. Optional field, by default set to chaincode calling user."
  })
  @IsOptional()
  @IsUserRef()
  public lender?: string;

  @JSONSchema({
    description:
      "Principal token class being offered for lending."
  })
  @ValidateNested()
  @Type(() => TokenClassKey)
  @IsNotEmpty()
  public principalToken: TokenClassKey;

  @JSONSchema({
    description:
      "Quantity of principal tokens being offered for lending."
  })
  @BigNumberIsPositive()
  @BigNumberProperty()
  public principalQuantity: BigNumber;

  @JSONSchema({
    description:
      "Annual interest rate as basis points (e.g., 500 = 5.00%)."
  })
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  public interestRate: BigNumber;

  @JSONSchema({
    description:
      "Loan duration in seconds."
  })
  @Min(1)
  @IsInt()
  public duration: number;

  @JSONSchema({
    description:
      "Required collateral token class."
  })
  @ValidateNested()
  @Type(() => TokenClassKey)
  @IsNotEmpty()
  public collateralToken: TokenClassKey;

  @JSONSchema({
    description:
      "Collateral ratio required (e.g., 1.5 = 150% collateralization)."
  })
  @BigNumberIsPositive()
  @BigNumberProperty()
  public collateralRatio: BigNumber;

  @JSONSchema({
    description:
      "Borrower(s) that will be borrowing the loaned tokens. " +
      "A loan can be offered directly to specific borrowers to facilitate p2p loans."
  })
  @IsDifferentValue("lender", {
    message: "borrower(s) should be different than lender."
  })
  @IsOptional()
  @ArrayUnique()
  @IsUserRef({ each: true })
  @ArrayMaxSize(12, { message: "p2p loan offers are currently limited to 12 per request." })
  public borrowers?: Array<string>;

  @JSONSchema({
    description: "How many times the loan offer can be accepted and fulfilled."
  })
  @BigNumberIsPositive()
  @BigNumberIsInteger()
  @BigNumberProperty()
  public uses: BigNumber;

  @JSONSchema({
    description:
      "Unix timestamp of the date when the offer should expire. 0 means that it won't expire. " +
      `By default set to ${0}.`
  })
  @IsOptional()
  @Min(0)
  @IsInt()
  public expires?: number;
}

@JSONSchema({
  description:
    "Response DTO for a successful lending offer creation. This object encapsulates a FungibleLendingOffer object " +
    "written to chain and its corresponding LendingLender object written to chain. " +
    "For p2p loans offered to 1 or more specific users there will be multiple results. " +
    "The LendingLender.offer property contains the chain key for the FungibleLendingOffer, which can be used " +
    "to construct an AcceptLendingOfferDto at a later time."
})
export class LendingOfferResDto extends SubmitCallDTO {
  @JSONSchema({
    description: "A FungibleLendingOffer written to chain."
  })
  @ValidateNested()
  @Type(() => FungibleLendingOffer)
  offer: FungibleLendingOffer;

  @JSONSchema({
    description: "The LendingLender data written to chain, corresponding to the created offer."
  })
  @ValidateNested()
  @Type(() => LendingLender)
  lender: LendingLender;
}

@JSONSchema({
  description:
    "Accept a fungible token lending offer by providing the required collateral."
})
export class AcceptLendingOfferDto extends SubmitCallDTO {
  @JSONSchema({
    description: "Chain key of the lending offer to accept."
  })
  @IsNotEmpty()
  offer: string;

  @JSONSchema({
    description: "Chain identity of the borrower accepting the offer."
  })
  @IsUserRef()
  borrower: string;

  @JSONSchema({
    description: "Amount of collateral tokens being provided."
  })
  @BigNumberIsPositive()
  @BigNumberProperty()
  collateralAmount: BigNumber;
}

@JSONSchema({
  description:
    "Repay a fungible token loan with principal plus accrued interest."
})
export class RepayLoanDto extends SubmitCallDTO {
  @JSONSchema({
    description: "Chain key of the loan to repay."
  })
  @IsNotEmpty()
  loanKey: string;

  @JSONSchema({
    description: "Amount to repay. If not specified, repays full outstanding debt."
  })
  @IsOptional()
  @BigNumberIsPositive()
  @BigNumberProperty()
  repaymentAmount?: BigNumber;
}

@JSONSchema({
  description:
    "Liquidate an undercollateralized fungible token loan."
})
export class LiquidateLoanDto extends SubmitCallDTO {
  @JSONSchema({
    description: "Chain key of the loan to liquidate."
  })
  @IsNotEmpty()
  loanKey: string;

  @JSONSchema({
    description: "Maximum amount of debt to repay in liquidation."
  })
  @BigNumberIsPositive()
  @BigNumberProperty()
  maxDebtRepayment: BigNumber;
}

@JSONSchema({
  description:
    "Cancel a lending offer, removing it from available offers."
})
export class CancelLendingOfferDto extends SubmitCallDTO {
  @JSONSchema({
    description: "Chain key of the lending offer to cancel."
  })
  @IsNotEmpty()
  offerKey: string;
}

@JSONSchema({
  description:
    "Fetch lending offers with optional filtering parameters."
})
export class FetchLendingOffersDto extends ChainCallDTO {
  @JSONSchema({
    description: "Principal token class to filter offers by."
  })
  @ValidateNested()
  @Type(() => TokenClassKey)
  @IsOptional()
  principalToken?: TokenClassKey;

  @JSONSchema({
    description: "Collateral token class to filter offers by."
  })
  @ValidateNested()
  @Type(() => TokenClassKey)
  @IsOptional()
  collateralToken?: TokenClassKey;

  @IsOptional()
  @IsUserRef()
  lender?: string;

  @IsOptional()
  @IsUserRef()
  borrower?: string;

  @IsOptional()
  @IsNotEmpty()
  @EnumProperty(LendingStatus)
  status?: LendingStatus;

  @JSONSchema({
    description: "Maximum interest rate in basis points."
  })
  @IsOptional()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  maxInterestRate?: BigNumber;

  @JSONSchema({
    description: "Minimum loan duration in seconds."
  })
  @IsOptional()
  @Min(0)
  @IsInt()
  minDuration?: number;

  @JSONSchema({
    description: "Maximum loan duration in seconds."
  })
  @IsOptional()
  @Min(0)
  @IsInt()
  maxDuration?: number;
}

@JSONSchema({
  description:
    "Fetch active loans with optional filtering parameters."
})
export class FetchLoansDto extends ChainCallDTO {
  @IsOptional()
  @IsUserRef()
  lender?: string;

  @IsOptional()
  @IsUserRef()
  borrower?: string;

  @IsOptional()
  @EnumProperty(LendingStatus)
  status?: LendingStatus;

  @JSONSchema({
    description: "Principal token class to filter loans by."
  })
  @ValidateNested()
  @Type(() => TokenClassKey)
  @IsOptional()
  principalToken?: TokenClassKey;

  @JSONSchema({
    description: "Collateral token class to filter loans by."
  })
  @ValidateNested()
  @Type(() => TokenClassKey)
  @IsOptional()
  collateralToken?: TokenClassKey;
}

@JSONSchema({
  description:
    "Result of a successful loan repayment operation."
})
export class RepaymentResultDto extends SubmitCallDTO {
  @JSONSchema({
    description: "Updated loan object after repayment."
  })
  @ValidateNested()
  @Type(() => FungibleLoan)
  loan: FungibleLoan;

  @JSONSchema({
    description: "Amount of principal repaid."
  })
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  principalRepaid: BigNumber;

  @JSONSchema({
    description: "Amount of interest repaid."
  })
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  interestRepaid: BigNumber;

  @JSONSchema({
    description: "Amount of collateral returned to borrower."
  })
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  collateralReturned: BigNumber;
}

@JSONSchema({
  description:
    "Result of a successful loan liquidation operation."
})
export class LiquidationResultDto extends SubmitCallDTO {
  @JSONSchema({
    description: "Updated loan object after liquidation."
  })
  @ValidateNested()
  @Type(() => FungibleLoan)
  loan: FungibleLoan;

  @JSONSchema({
    description: "Amount of debt repaid through liquidation."
  })
  @BigNumberIsPositive()
  @BigNumberProperty()
  debtRepaid: BigNumber;

  @JSONSchema({
    description: "Amount of collateral liquidated."
  })
  @BigNumberIsPositive()
  @BigNumberProperty()
  collateralLiquidated: BigNumber;

  @JSONSchema({
    description: "Liquidation bonus paid to liquidator."
  })
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  liquidatorReward: BigNumber;

  @JSONSchema({
    description: "Remaining collateral returned to borrower."
  })
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  collateralReturned: BigNumber;
}
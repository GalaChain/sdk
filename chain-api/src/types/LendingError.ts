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
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationFailedError
} from "../utils";
import { LendingStatus } from "./lending";

export class InsufficientCollateralError extends ValidationFailedError {
  constructor(required: string, provided: string, borrower: string) {
    super(
      `Insufficient collateral provided. Required: ${required}, Provided: ${provided}, Borrower: ${borrower}`,
      {
        required,
        provided,
        borrower
      }
    );
  }
}

export class LendingOfferLenderCallerMismatchError extends ForbiddenError {
  constructor(callingUser: string, lender: string) {
    super(
      `CreateLendingOffer: Calling user (${callingUser}) does not match lender id provided in dto (${lender})`,
      {
        callingUser,
        lender
      }
    );
  }
}

export class LendingOfferNotAvailableError extends ForbiddenError {
  constructor(status: LendingStatus, offerKey: string, borrower: string) {
    super(
      `AcceptLendingOffer: Offer is no longer available. ` +
        `Offer status: ${status}, ` +
        `Offer: ${offerKey}, borrower: ${borrower}`,
      {
        status,
        offerKey,
        borrower
      }
    );
  }
}

export class ExpiredLendingOfferError extends ForbiddenError {
  constructor(expires: number, acceptanceTime: number, offerKey: string, borrower: string) {
    super(
      `AcceptLendingOffer: This offer has expired. Offer expires: ${expires}, ` +
        `Current time: ${acceptanceTime}, ` +
        `Offer: ${offerKey}, borrower: ${borrower}`,
      {
        expires,
        acceptanceTime,
        offerKey,
        borrower
      }
    );
  }
}

export class LoanNotFoundError extends NotFoundError {
  constructor(user: string, loanKey: string) {
    super(`Error finding loan (${loanKey}) on chain for user ${user}`, { user, loanKey });
  }
}

export class LoanAlreadyClosedError extends ConflictError {
  constructor(loanKey: string, status: string) {
    super(`Loan with id ${loanKey} has been ${status} and its status can no longer be changed.`, {
      loanKey,
      status
    });
  }
}

export class UnauthorizedLoanOperationError extends ForbiddenError {
  constructor(operation: string, callingUser: string, loanKey: string, authorizedUsers: string[]) {
    super(
      `User ${callingUser} attempted to ${operation} loan ${loanKey}, but is not authorized. ` +
        `Authorized users: ${authorizedUsers.join(", ")}`,
      {
        operation,
        callingUser,
        loanKey,
        authorizedUsers
      }
    );
  }
}

export class InsufficientPrincipalBalanceError extends ValidationFailedError {
  constructor(lender: string, required: string, available: string, tokenKey: string) {
    super(
      `Lender ${lender} has insufficient principal token balance. ` +
        `Required: ${required}, Available: ${available}, Token: ${tokenKey}`,
      {
        lender,
        required,
        available,
        tokenKey
      }
    );
  }
}

export class InsufficientCollateralBalanceError extends ValidationFailedError {
  constructor(borrower: string, required: string, available: string, tokenKey: string) {
    super(
      `Borrower ${borrower} has insufficient collateral token balance. ` +
        `Required: ${required}, Available: ${available}, Token: ${tokenKey}`,
      {
        borrower,
        required,
        available,
        tokenKey
      }
    );
  }
}

export class InvalidHealthFactorError extends ValidationFailedError {
  constructor(healthFactor: string, threshold: string, loanKey: string) {
    super(
      `Loan health factor ${healthFactor} is below liquidation threshold ${threshold} for loan ${loanKey}`,
      {
        healthFactor,
        threshold,
        loanKey
      }
    );
  }
}

export class LiquidationNotAllowedError extends ForbiddenError {
  constructor(healthFactor: string, threshold: string, loanKey: string) {
    super(
      `Loan ${loanKey} cannot be liquidated. Health factor ${healthFactor} is above threshold ${threshold}`,
      {
        healthFactor,
        threshold,
        loanKey
      }
    );
  }
}

export class InvalidRepaymentAmountError extends ValidationFailedError {
  constructor(repaymentAmount: string, maxRepayment: string, loanKey: string) {
    super(
      `Repayment amount ${repaymentAmount} exceeds maximum repayment ${maxRepayment} for loan ${loanKey}`,
      {
        repaymentAmount,
        maxRepayment,
        loanKey
      }
    );
  }
}

export class InterestCalculationError extends ValidationFailedError {
  constructor(principal: string, rate: string, time: string, error: string) {
    super(
      `Failed to calculate interest. Principal: ${principal}, Rate: ${rate}, Time: ${time}. Error: ${error}`,
      {
        principal,
        rate,
        time,
        error
      }
    );
  }
}

export class InvalidTokenClassError extends ValidationFailedError {
  constructor(tokenClass: string, operation: string, reason: string) {
    super(
      `Invalid token class ${tokenClass} for operation ${operation}. Reason: ${reason}`,
      {
        tokenClass,
        operation,
        reason
      }
    );
  }
}

export class OfferBorrowerMismatchError extends ValidationFailedError {
  constructor(borrower: string, offerBorrower: string, offerKey: string) {
    super(
      `AcceptLendingOffer: requested borrower (${borrower}) does not match offer borrower (${offerBorrower})`,
      {
        borrower,
        offerBorrower,
        offerKey
      }
    );
  }
}

export class InvalidLendingParametersError extends ValidationFailedError {
  constructor(parameter: string, value: string, requirement: string) {
    super(
      `Invalid lending parameter: ${parameter} = ${value}. Requirement: ${requirement}`,
      {
        parameter,
        value,
        requirement
      }
    );
  }
}

export class CollateralValuationError extends ValidationFailedError {
  constructor(collateralToken: string, principalToken: string, error: string) {
    super(
      `Failed to value collateral token ${collateralToken} against principal token ${principalToken}. Error: ${error}`,
      {
        collateralToken,
        principalToken,
        error
      }
    );
  }
}

export class PriceOracleError extends ValidationFailedError {
  constructor(tokenClass: string, operation: string, error: string) {
    super(
      `Price oracle error for token ${tokenClass} during ${operation}. Error: ${error}`,
      {
        tokenClass,
        operation,
        error
      }
    );
  }
}
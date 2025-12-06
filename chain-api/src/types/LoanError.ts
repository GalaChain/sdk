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
  NotImplementedError,
  ValidationFailedError
} from "../utils";
import { LoanStatus } from "./Loan";

export class InvalidClosingStatusError extends ForbiddenError {
  constructor(closingStatus: LoanStatus) {
    super(`CloseLoan() requires a valid closing status: Fulfilled or Cancelled. Received: ${closingStatus}`, {
      closingStatus
    });
  }
}

export class LoanAlreadyClosedError extends ConflictError {
  constructor(loanKey: string, status: string) {
    super(`loan with id ${loanKey} has been ${status} and its status can no longer be changed.`, {
      loanKey,
      status
    });
  }
}

export class LoanCloseForbiddenUserError extends ForbiddenError {
  constructor(callingUser: string, loanKey: string, owner: string, registrar: string) {
    super(
      `User ${callingUser} attempted to close Loan ${loanKey}, but does not match the ` +
        `loan owner (${owner}) nor the loan registrar (${registrar}).`,
      {
        callingUser,
        loanKey,
        owner,
        registrar
      }
    );
  }
}

export class MissingLoanError extends NotFoundError {
  constructor(user: string, loanKey: string) {
    super(`Error finding loan (${loanKey}) on chain for user ${user}`, { user, loanKey });
  }
}

export class OfferLoanOwnerCallerMismatchError extends ForbiddenError {
  constructor(callingUser: string, owner: string) {
    super(`OfferLoan: Calling user (${callingUser}) does not match owner id provided in dto (${owner})`, {
      callingUser,
      owner
    });
  }
}

export class OfferLoanFungibleTokenNotImplementedError extends NotImplementedError {
  constructor(tokenQueryKey: string) {
    super(
      `OfferLoan currently supports Non-Fungible tokens only. Received fungible token instance: ` +
        `${tokenQueryKey}`,
      { tokenQueryKey }
    );
  }
}

export class InvalidTokenKeyError extends ValidationFailedError {
  constructor(tokenKey: string, borrower: string) {
    super(`AcceptLoanOffer: failed to verify tokenKey for LoanOffer: ${tokenKey}, borrower: ${borrower}`, {
      tokenKey,
      borrower
    });
  }
}

export class OfferBorrowerMismatchError extends ValidationFailedError {
  constructor(borrower: string, offerBorrower: string, tokenKey: string) {
    super(
      `AcceptLoanOffer: requested borrower (${borrower}) does not match offer borrower (${offerBorrower})`,
      {
        borrower,
        offerBorrower,
        tokenKey
      }
    );
  }
}

export class MultipleTokenBalancesError extends ForbiddenError {
  constructor(owner: string, completeKey: string) {
    super(
      `OfferLoan error: Complete query key for single instance provided, ` +
        `but multiple token balances received. owner: ${owner}, key: ${completeKey}`,
      {
        owner,
        completeKey
      }
    );
  }
}

export class MissingInstanceBalanceError extends NotFoundError {
  constructor(owner: string, completeKey: string) {
    super(
      `OfferLoan error: Query key for single instace provided, ` +
        `but instance is not present in owner's balance. owner: ${owner}, key: ${completeKey}`,
      {
        owner,
        completeKey
      }
    );
  }
}

export class ExclusiveRegistrarBorrowersError extends ConflictError {
  constructor(registrar: string, borrowers: string[]) {
    super(
      `OfferLoan called with both registrar ${registrar} and borrowers array defined. ` +
        `Only one may be defined. Borrowers: ${borrowers.join(", ")}`,
      {
        registrar,
        borrowers
      }
    );
  }
}

export class UserMustBeRegistrarError extends ForbiddenError {
  constructor(registrar: string, callingUser: string, tokenKey: string, borrower: string) {
    super(
      `AcceptLoanOffer: Offer mediated by a registrar, callingUser not authorized. ` +
        `LoanOffer.registrar: ${registrar}, caller: ${callingUser}, ` +
        `LoanOffer: ${tokenKey}, borrower: ${borrower}`,
      {
        registrar,
        callingUser,
        tokenKey,
        borrower
      }
    );
  }
}

export class OfferUnavailableError extends ForbiddenError {
  constructor(status: LoanStatus, tokenKey: string, borrower: string) {
    super(
      `AcceptLoanOffer: Offer is no longer available. ` +
        `LoanOffer.status: ${status}, ` +
        `LoanOffer: ${tokenKey}, borrower: ${borrower}`,
      {
        status,
        tokenKey,
        borrower
      }
    );
  }
}

// TODO: Implement 410 Gone error in galachain-common for this:
export class ExpiredOfferError extends ForbiddenError {
  constructor(expires: number, acceptanceTime: number, tokenKey: string, borrower: string) {
    super(
      `AcceptLoanOffer: This offer has expired. LoanOffer.expires: ${expires}, ` +
        `TxUnixTime: ${acceptanceTime}, ` +
        `LoanOffer: ${tokenKey}, borrower: ${borrower}`,
      {
        expires,
        acceptanceTime,
        tokenKey,
        borrower
      }
    );
  }
}

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
  ChainError,
  ErrorCode,
  InvalidClosingStatusError,
  Loan,
  LoanAlreadyClosedError,
  LoanCloseForbiddenUserError,
  LoanClosedBy,
  LoanStatus,
  MissingLoanError
} from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { getObjectByKey, putChainObject } from "../utils";

interface CloseLoanParams {
  loanKey: string;
  closingStatus: LoanStatus;
}

export async function closeLoan(
  ctx: GalaChainContext,
  { loanKey, closingStatus }: CloseLoanParams
): Promise<Loan> {
  if (closingStatus !== LoanStatus.Fulfilled && closingStatus !== LoanStatus.Cancelled) {
    throw new InvalidClosingStatusError(closingStatus).logError(ctx.logger);
  }

  const loan = await getObjectByKey(ctx, Loan, loanKey).catch((e) => {
    throw ChainError.map(e, ErrorCode.NOT_FOUND, new MissingLoanError(ctx.callingUser, loanKey));
  });

  if (loan.status === LoanStatus.Cancelled) {
    throw new LoanAlreadyClosedError(loanKey, "Cancelled").logError(ctx.logger);
  } else if (loan.status === LoanStatus.Fulfilled) {
    throw new LoanAlreadyClosedError(loanKey, "Fulfilled").logError(ctx.logger);
  }

  if (ctx.callingUser === loan.owner) {
    loan.status = closingStatus;
    loan.closedBy = LoanClosedBy.Owner;
  } else if (loan.registrar !== Loan.NULL_REGISTRAR_KEY && ctx.callingUser === loan.registrar) {
    loan.status = closingStatus;
    loan.closedBy = LoanClosedBy.Registrar;
  } else {
    throw new LoanCloseForbiddenUserError(ctx.callingUser, loanKey, loan.owner, loan.registrar).logError(
      ctx.logger
    );
  }

  await putChainObject(ctx, loan);

  return loan;
}

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
import { Loan, LoanAgreement, LoanStatus } from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { getObjectsByKeys, getObjectsByPartialCompositeKey } from "../utils";

interface FetchLoansParams {
  byOwner: string;
  registrar: string | undefined;
  status: LoanStatus | undefined;
}

export async function fetchLoans(
  ctx: GalaChainContext,
  { byOwner, registrar, status }: FetchLoansParams
): Promise<Loan[]> {
  let loans: Loan[] = [];

  if (byOwner) {
    const agreements = await getObjectsByPartialCompositeKey(
      ctx,
      LoanAgreement.OBJECT_TYPE,
      [byOwner],
      LoanAgreement
    );

    const loanKeys: string[] = agreements.map((elem: LoanAgreement) => {
      return elem.loan;
    });

    loans = await getObjectsByKeys(ctx, Loan, loanKeys);

    if (registrar) {
      loans = loans.filter((elem) => {
        return elem.registrar === registrar;
      });
    }
  } else if (registrar) {
    loans = await getObjectsByPartialCompositeKey(ctx, "Loan", [registrar], Loan);
  }

  if (status) {
    loans = loans.filter((elem) => {
      return elem.status === status;
    });
  }

  return loans;
}

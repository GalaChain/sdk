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
import { Lender, LoanOffer, LoanStatus, TokenInstanceQueryKey } from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { getObjectByKey, getObjectsByPartialCompositeKey } from "../utils";

interface FetchLoanOffersParams {
  owner?: string;
  tokenQuery?: TokenInstanceQueryKey;
  status?: LoanStatus;
}

export async function fetchLoanOffers(
  ctx: GalaChainContext,
  { owner, tokenQuery, status }: FetchLoanOffersParams
): Promise<LoanOffer[]> {
  const lookups: Promise<LoanOffer>[] = [];
  let offers: LoanOffer[];

  // typeof data.owner === "string" because being truthy isn't enough;
  // TypeScript needs to know it's not undefined
  if (owner && typeof owner === "string") {
    const lendQuery: string[] = [owner];
    if (status) {
      lendQuery.push(`${status}`);
    }

    let lendings: Lender[] = await getObjectsByPartialCompositeKey(ctx, Lender.INDEX_KEY, lendQuery, Lender);

    if (tokenQuery) {
      lendings = lendings.filter((lender) => lender.matchesQuery(tokenQuery));
    }

    for (let i = 0; i < lendings.length; i++) {
      lookups.push(getObjectByKey(ctx, LoanOffer, lendings[i].offer));
    }

    offers = await Promise.all(lookups);
  } else if (tokenQuery) {
    const offerQuery = tokenQuery.toQueryParams();

    offers = await getObjectsByPartialCompositeKey(ctx, LoanOffer.INDEX_KEY, offerQuery, LoanOffer);

    if (status) {
      offers = offers.filter((elem) => {
        return elem.status === status;
      });
    }
  } else {
    const offerQuery = [];

    offers = await getObjectsByPartialCompositeKey(ctx, LoanOffer.INDEX_KEY, offerQuery, LoanOffer);

    if (status) {
      offers = offers.filter((elem) => {
        return elem.status === status;
      });
    }
  }

  return offers;
}

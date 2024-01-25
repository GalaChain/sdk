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
import { AllowanceType, FetchAllowancesResponse, TokenAllowance } from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { getObjectsByPartialCompositeKey, getObjectsByPartialCompositeKeyWithPagination } from "../utils";
import { takeUntilUndefined } from "../utils";

interface FetchAllowancesParams {
  collection?: string;
  category?: string;
  type?: string;
  additionalKey?: string;
  instance?: string;
  allowanceType?: AllowanceType;
  grantedTo: string;
  grantedBy?: string;
}

// This will return the list sorted by creation date descending (oldest first)
// If the "From Filter" is applied, it will filter the results
export async function fetchAllowances(
  ctx: GalaChainContext,
  data: FetchAllowancesParams
): Promise<TokenAllowance[]> {
  const queryParams: string[] = takeUntilUndefined(
    data.grantedTo,
    data.collection,
    data.category,
    data.type,
    data.additionalKey,
    data.instance,
    data.allowanceType?.toString()
  );

  const getObjectsResponse = await getObjectsByPartialCompositeKey(
    ctx,
    TokenAllowance.INDEX_KEY,
    queryParams,
    TokenAllowance,
    true // TODO: may lead to incomplete results
  );

  const results = filterByGrantedBy(getObjectsResponse, data.grantedBy);
  sort(results);

  return results;
}

export async function fetchAllowancesWithPagination(
  ctx: GalaChainContext,
  data: FetchAllowancesParams & { bookmark?: string; limit: number }
): Promise<FetchAllowancesResponse> {
  const queryParams: string[] = takeUntilUndefined(
    data.grantedTo,
    data.collection,
    data.category,
    data.type,
    data.additionalKey,
    data.instance,
    data.allowanceType?.toString()
  );

  const getObjectsResponse = await getObjectsByPartialCompositeKeyWithPagination(
    ctx,
    TokenAllowance.INDEX_KEY,
    queryParams,
    TokenAllowance,
    data.bookmark,
    data.limit
  );

  const response = new FetchAllowancesResponse();
  response.nextPageBookmark = getObjectsResponse.metadata.bookmark;
  response.results = filterByGrantedBy(getObjectsResponse.results, data.grantedBy);
  sort(response.results);

  return response;
}

// Sort the items descending by date
function sort(results: TokenAllowance[]): void {
  results.sort((a: TokenAllowance, b: TokenAllowance): number => (a.created < b.created ? -1 : 1));
}

function filterByGrantedBy(results: TokenAllowance[], grantedBy?: string): TokenAllowance[] {
  if (grantedBy) {
    return results.filter((x: TokenAllowance) => x.grantedBy === grantedBy);
  } else {
    return results;
  }
}

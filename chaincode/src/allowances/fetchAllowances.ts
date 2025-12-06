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

export interface FetchAllowancesParams {
  collection?: string;
  category?: string;
  type?: string;
  additionalKey?: string;
  instance?: string;
  allowanceType?: AllowanceType;
  grantedTo: string;
  grantedBy?: string;
}

/**
 * @description
 *
 * Query allowances from on-chain World State using the provided parameters.
 * The results will be sorted by creation date ascending (oldest first)
 *
 * If `grantedBy` is provided, but the remaining parameters that constitute
 * ChainKeys 0 through 7 on the `TokenAllowance` class definition are not all
 * provided, this function will lookup a larger result set than is returned.
 * The results set pulled from World State will be  filtered
 * by the `grantedBy` identity after lookup.
 *
 * The `@ChainKeys` that make up the World State index key are ordered,
 * and cannot be skipped when making partial composite key queries.
 * Be advised that broad queries can lead
 * to performance issues for large result sets.
 *
 * Non-paginated version, use `fetchAllowancesWithPagination()` if use case
 * expects large result sets.
 *
 * @param ctx
 * @param data
 * @returns Promise<TokenAllowance[]>
 */
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
    data.allowanceType?.toString(),
    data.allowanceType === undefined ? undefined : data.grantedBy
  );

  const getObjectsResponse: TokenAllowance[] = await getObjectsByPartialCompositeKey(
    ctx,
    TokenAllowance.INDEX_KEY,
    queryParams,
    TokenAllowance
  );

  // ChainKeys 0 through 7 already provided, `grantedBy` included in query, skip filtering
  if (queryParams.length >= 8) {
    sort(getObjectsResponse);
    return getObjectsResponse;
  }

  const results: TokenAllowance[] = filterByGrantedBy(getObjectsResponse, data.grantedBy);
  sort(results);

  return results;
}

/**
 * @description
 *
 * Query allowances from on-chain World State using the provided parameters.
 * The results will be sorted by creation date ascending (oldest first)
 *
 * Paginated version, replaces fetchAllowances() for use cases that
 * expect large result sets. Tuning the limit parameter to a reasonable
 * page size will optimize performance.
 *
 * @param ctx
 * @param data
 * @returns <Promise<FetchAllowancesResponse>
 */
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

// Sort the items ascending by date
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

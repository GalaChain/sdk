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
import { GalaChainContext, getObjectsByPartialCompositeKeyWithPagination, } from "@gala-chain/chaincode";
import { NftCollectionAuthorization, FetchNftCollectionAuthorizationsResponse } from "@gala-chain/api";
import { plainToInstance } from "class-transformer";

export interface FetchNftCollectionAuthorizationsWithPaginationParams {
  bookmark?: string;
  limit?: number;
}

export async function fetchNftCollectionAuthorizationsWithPagination(
  ctx: GalaChainContext,
  data: FetchNftCollectionAuthorizationsWithPaginationParams
): Promise<FetchNftCollectionAuthorizationsResponse> {
  // Use empty array to fetch all collections (no filtering)
  const queryParams: string[] = [];

  const lookupResult = await getObjectsByPartialCompositeKeyWithPagination(
    ctx,
    NftCollectionAuthorization.INDEX_KEY,
    queryParams,
    NftCollectionAuthorization,
    data.bookmark,
    data.limit
  );

  const results = lookupResult.results;
  const bookmark = lookupResult.metadata.bookmark;

  const response = plainToInstance(FetchNftCollectionAuthorizationsResponse, {
    results: results,
    nextPageBookmark: bookmark
  });

  return response;
}

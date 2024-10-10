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
import { FetchTokenSalesWithPaginationDto, FetchTokenSalesWithPaginationResponse, TokenSale, TokenSaleOwner, ValidationFailedError } from "@gala-chain/api";
import { GalaChainContext } from "../types";
import { getObjectsByKeys, getObjectsByPartialCompositeKeyWithPagination, takeUntilUndefined } from "../utils";
import { plainToInstance } from "class-transformer";

export async function fetchTokenSalesWithPagination(
  ctx: GalaChainContext,
  params: FetchTokenSalesWithPaginationDto
): Promise<FetchTokenSalesWithPaginationResponse> {
  const instanceQueryKeys = takeUntilUndefined(params.owner);

  const limit = params.limit ?? FetchTokenSalesWithPaginationDto.DEFAULT_LIMIT;

  if (limit > FetchTokenSalesWithPaginationDto.MAX_LIMIT) {
    throw new ValidationFailedError(`FetchTokenSalesWithPaginationDto.MAX_LIMIT exceeded: ${limit}`);
  }

  const tokenSaleOwnerObjects = await getObjectsByPartialCompositeKeyWithPagination(
    ctx,
    TokenSaleOwner.INDEX_KEY,
    instanceQueryKeys,
    TokenSaleOwner,
    params.bookmark,
    limit
  );

  const tokenSaleIds = tokenSaleOwnerObjects.results.map((tokenSaleOwner) => {
    return tokenSaleOwner.tokenSaleId;
  });

  if (tokenSaleIds.length === 0) {
    return plainToInstance(FetchTokenSalesWithPaginationResponse, {
      nextPageBookMark: tokenSaleOwnerObjects.metadata.bookmark,
      results: []
    });
  }

  const results = await getObjectsByKeys(ctx, TokenSale, tokenSaleIds);


  // TODO: not sure what metadata get is for here, taken from swap code
  // for (const result of results) {
  //   await fetchTokenMetadataForSwap(ctx, result);
  // }

  const response = plainToInstance(FetchTokenSalesWithPaginationResponse, {
    nextPageBookMark: tokenSaleOwnerObjects.metadata.bookmark,
    results: results
  });

  return response;
}
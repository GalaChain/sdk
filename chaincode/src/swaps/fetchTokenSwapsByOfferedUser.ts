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
  FetchTokenSwapsByUserDto,
  FetchTokenSwapsWithPaginationResponse,
  TokenSwapRequest,
  TokenSwapRequestOfferedBy,
  TokenSwapRequestOfferedTo,
  ValidationFailedError
} from "@gala-chain/api";
import { plainToInstance } from "class-transformer";

import { GalaChainContext } from "../types";
import {
  getObjectsByKeys,
  getObjectsByPartialCompositeKeyWithPagination,
  takeUntilUndefined
} from "../utils";
import { fetchTokenMetadataForSwap } from "./fetchTokenMetadataForSwap";

export interface FetchTokenSwapByOfferedUser {
  user?: string | undefined;
  bookmark?: string;
  limit?: number;
}

export async function fetchTokenSwapsOfferedByUser(
  ctx: GalaChainContext,
  params: FetchTokenSwapByOfferedUser
): Promise<FetchTokenSwapsWithPaginationResponse> {
  const instanceQueryKeys = takeUntilUndefined(params.user);

  const limit = params.limit ?? FetchTokenSwapsByUserDto.DEFAULT_LIMIT;

  if (limit > FetchTokenSwapsByUserDto.MAX_LIMIT) {
    throw new ValidationFailedError(`FetchTokenSwapsByUserDto.MAX_LIMIT exceeded: ${limit}`);
  }

  const swapsOfferedByUser = await getObjectsByPartialCompositeKeyWithPagination(
    ctx,
    TokenSwapRequestOfferedBy.INDEX_KEY,
    instanceQueryKeys,
    TokenSwapRequestOfferedBy,
    params.bookmark,
    limit
  );

  const swapRequestIds = swapsOfferedByUser.results.map((instanceOffered) => {
    return instanceOffered.swapRequestId;
  });

  if (swapRequestIds.length === 0) {
    return plainToInstance(FetchTokenSwapsWithPaginationResponse, {
      nextPageBookMark: swapsOfferedByUser.metadata.bookmark,
      results: []
    });
  }

  const results = await getObjectsByKeys(ctx, TokenSwapRequest, swapRequestIds);

  for (const result of results) {
    await fetchTokenMetadataForSwap(ctx, result);
  }

  const response = plainToInstance(FetchTokenSwapsWithPaginationResponse, {
    nextPageBookMark: swapsOfferedByUser.metadata.bookmark,
    results: results
  });

  return response;
}

export async function fetchTokenSwapsOfferedToUser(
  ctx: GalaChainContext,
  params: FetchTokenSwapByOfferedUser
): Promise<FetchTokenSwapsWithPaginationResponse> {
  const instanceQueryKeys = takeUntilUndefined(params.user);

  const limit = params.limit ?? FetchTokenSwapsByUserDto.DEFAULT_LIMIT;

  if (limit > FetchTokenSwapsByUserDto.MAX_LIMIT) {
    throw new ValidationFailedError(`FetchTokenSwapsByUserDto.MAX_LIMIT exceeded: ${limit}`);
  }

  const swapsOfferedToUser = await getObjectsByPartialCompositeKeyWithPagination(
    ctx,
    TokenSwapRequestOfferedTo.INDEX_KEY,
    instanceQueryKeys,
    TokenSwapRequestOfferedTo,
    params.bookmark,
    limit
  );

  const swapRequestIds = swapsOfferedToUser.results.map((instanceOffered) => {
    return instanceOffered.swapRequestId;
  });

  if (swapRequestIds.length === 0) {
    return plainToInstance(FetchTokenSwapsWithPaginationResponse, {
      nextPageBookMark: swapsOfferedToUser.metadata.bookmark,
      results: []
    });
  }

  const results = await getObjectsByKeys(ctx, TokenSwapRequest, swapRequestIds);

  for (const result of results) {
    await fetchTokenMetadataForSwap(ctx, result);
  }

  const response = plainToInstance(FetchTokenSwapsWithPaginationResponse, {
    nextPageBookMark: swapsOfferedToUser.metadata.bookmark,
    results: results
  });

  return response;
}

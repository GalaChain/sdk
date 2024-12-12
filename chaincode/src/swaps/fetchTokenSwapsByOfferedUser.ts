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

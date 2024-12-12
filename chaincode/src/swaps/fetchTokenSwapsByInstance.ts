import {
  FetchTokenSwapsByInstanceDto,
  FetchTokenSwapsWithPaginationResponse,
  TokenSwapRequest,
  TokenSwapRequestInstanceOffered,
  TokenSwapRequestInstanceWanted,
  ValidationFailedError
} from "@gala-chain/api";
import { plainToInstance } from "class-transformer";

import { GalaChainContext } from "../types";
import { getObjectsByKeys, getObjectsByPartialCompositeKeyWithPagination } from "../utils";
import { takeUntilUndefined } from "../utils";
import { fetchTokenMetadataForSwap } from "./fetchTokenMetadataForSwap";

export interface FetchTokenSwapByInstance {
  collection?: string | undefined;
  category?: string | undefined;
  type?: string | undefined;
  additionalKey?: string | undefined;
  instance?: string | undefined;
  bookmark?: string | undefined;
  limit?: number | undefined;
}

export async function fetchTokenSwapsByInstanceOffered(
  ctx: GalaChainContext,
  params: FetchTokenSwapByInstance
): Promise<FetchTokenSwapsWithPaginationResponse> {
  const instanceQueryKeys = takeUntilUndefined(
    params.collection,
    params.category,
    params.type,
    params.additionalKey,
    params.instance
  );

  const limit = params.limit ?? FetchTokenSwapsByInstanceDto.DEFAULT_LIMIT;

  if (limit > FetchTokenSwapsByInstanceDto.MAX_LIMIT) {
    throw new ValidationFailedError(`FetchTokenSwapsByInstanceDto.MAX_LIMIT exceeded: ${limit}`);
  }

  const instancesOffered = await getObjectsByPartialCompositeKeyWithPagination(
    ctx,
    TokenSwapRequestInstanceOffered.INDEX_KEY,
    instanceQueryKeys,
    TokenSwapRequestInstanceOffered,
    params.bookmark,
    limit
  );

  const swapRequestIds = Array.from(
    new Set(
      instancesOffered.results.map((instanceOffered) => {
        return instanceOffered.swapRequestId;
      })
    )
  );

  if (swapRequestIds.length === 0) {
    return plainToInstance(FetchTokenSwapsWithPaginationResponse, {
      nextPageBookMark: instancesOffered.metadata.bookmark,
      results: []
    });
  }

  const results = await getObjectsByKeys(ctx, TokenSwapRequest, swapRequestIds);

  for (const result of results) {
    await fetchTokenMetadataForSwap(ctx, result);
  }

  const response = plainToInstance(FetchTokenSwapsWithPaginationResponse, {
    nextPageBookMark: instancesOffered.metadata.bookmark,
    results: results
  });

  return response;
}

export async function fetchTokenSwapsByInstanceWanted(
  ctx: GalaChainContext,
  params: FetchTokenSwapByInstance
): Promise<FetchTokenSwapsWithPaginationResponse> {
  const instanceQueryKeys = takeUntilUndefined(
    params.collection,
    params.category,
    params.type,
    params.additionalKey,
    params.instance?.toString()
  );

  const limit = params.limit ?? FetchTokenSwapsByInstanceDto.DEFAULT_LIMIT;

  if (limit > FetchTokenSwapsByInstanceDto.MAX_LIMIT) {
    throw new ValidationFailedError(`FetchTokenSwapsByInstanceDto.MAX_LIMIT exceeded: ${limit}`);
  }

  const instancesOffered = await getObjectsByPartialCompositeKeyWithPagination(
    ctx,
    TokenSwapRequestInstanceWanted.INDEX_KEY,
    instanceQueryKeys,
    TokenSwapRequestInstanceWanted,
    params.bookmark,
    limit
  );

  const swapRequestIds = Array.from(
    new Set(
      instancesOffered.results.map((instanceOffered) => {
        return instanceOffered.swapRequestId;
      })
    )
  );

  if (swapRequestIds.length === 0) {
    return plainToInstance(FetchTokenSwapsWithPaginationResponse, {
      nextPageBookMark: instancesOffered.metadata.bookmark,
      results: []
    });
  }

  const results = await getObjectsByKeys(ctx, TokenSwapRequest, swapRequestIds);

  for (const result of results) {
    await fetchTokenMetadataForSwap(ctx, result);
  }

  const response = plainToInstance(FetchTokenSwapsWithPaginationResponse, {
    nextPageBookMark: instancesOffered.metadata.bookmark,
    results: results
  });

  return response;
}

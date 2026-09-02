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
  FetchTokenInstanceMetadataResponse,
  FetchTokenInstanceMetadataWithPaginationDto,
  TokenInstance,
  TokenInstanceKey,
  TokenInstanceMetadata
} from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { getObjectByKey, getObjectsByPartialCompositeKeyWithPagination, takeUntilUndefined } from "../utils";
import {
  TokenInstanceMetadataNotFoundError,
  TooManyMetadataDocumentsError
} from "./TokenInstanceMetadataError";
import { buildTokenInstanceMetadataCompositeKey } from "./tokenInstanceMetadataHelpers";

// Upper bound on how many metadata documents the unpaginated fetch will return for one instance
export const MAX_METADATA_DOCUMENTS_PER_INSTANCE = 1000;

export interface FetchTokenInstanceMetadataParams {
  tokenInstance: TokenInstanceKey;
  project?: string;
}

export async function fetchTokenInstanceMetadata(
  ctx: GalaChainContext,
  params: FetchTokenInstanceMetadataParams
): Promise<TokenInstanceMetadata[]> {
  const { tokenInstance, project } = params;

  if (project !== undefined) {
    const metadataKey = buildTokenInstanceMetadataCompositeKey(tokenInstance, project);
    const metadata = await getObjectByKey(ctx, TokenInstanceMetadata, metadataKey).catch(() => {
      throw new TokenInstanceMetadataNotFoundError(tokenInstance.toStringKey(), project);
    });
    return [metadata];
  }

  const instanceKeyParts = TokenInstance.buildInstanceKeyList(tokenInstance);

  // Any user can create a metadata document under a new project name on any instance, so the
  // number of documents under this prefix is caller-controlled. Page one result past the cap so
  // an oversized instance reports an actionable error instead of silently returning a truncated
  // list, or accumulating until the global TOTAL_RESULTS_LIMIT rejects every call outright.
  const response = await getObjectsByPartialCompositeKeyWithPagination(
    ctx,
    TokenInstanceMetadata.INDEX_KEY,
    instanceKeyParts,
    TokenInstanceMetadata,
    undefined,
    MAX_METADATA_DOCUMENTS_PER_INSTANCE + 1
  );

  if (response.results.length > MAX_METADATA_DOCUMENTS_PER_INSTANCE) {
    throw new TooManyMetadataDocumentsError(tokenInstance.toStringKey(), MAX_METADATA_DOCUMENTS_PER_INSTANCE);
  }

  return response.results;
}

export interface FetchTokenInstanceMetadataWithPaginationParams {
  collection?: string;
  category?: string;
  type?: string;
  additionalKey?: string;
  instance?: string;
  project?: string;
  bookmark?: string;
  limit?: number;
}

export async function fetchTokenInstanceMetadataWithPagination(
  ctx: GalaChainContext,
  params: FetchTokenInstanceMetadataWithPaginationParams
): Promise<FetchTokenInstanceMetadataResponse> {
  const queryParams: string[] = takeUntilUndefined(
    params.collection,
    params.category,
    params.type,
    params.additionalKey,
    params.instance,
    params.project
  );

  const getObjectsResponse = await getObjectsByPartialCompositeKeyWithPagination(
    ctx,
    TokenInstanceMetadata.INDEX_KEY,
    queryParams,
    TokenInstanceMetadata,
    params.bookmark,
    params.limit ?? FetchTokenInstanceMetadataWithPaginationDto.DEFAULT_LIMIT
  );

  return new FetchTokenInstanceMetadataResponse({
    results: getObjectsResponse.results,
    nextPageBookmark: getObjectsResponse.metadata.bookmark
  });
}

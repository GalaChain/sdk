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
  FetchTokenClassesResponse,
  FetchTokenClassesWithPaginationDto,
  TokenClass,
  TokenClassKey,
  TokenInstanceKey,
  createValidDTO
} from "@gala-chain/api";
import { plainToInstance } from "class-transformer";

import { GalaChainContext } from "../types";
import { getObjectByKey, getObjectsByPartialCompositeKeyWithPagination, takeUntilUndefined } from "../utils";
import { TokenClassNotFoundError } from "./TokenError";

export async function fetchTokenClasses(
  ctx: GalaChainContext,
  tokenClasses: TokenClassKey[]
): Promise<TokenClass[]> {
  const fetchOps = tokenClasses.map((c) =>
    getObjectByKey(ctx, TokenClass, TokenClass.buildTokenClassCompositeKey(c)).catch(() => {
      throw new TokenClassNotFoundError(c.toStringKey());
    })
  );
  return await Promise.all(fetchOps);
}

export async function fetchTokenClass(
  ctx: GalaChainContext,
  tokenClassKey: TokenClassKey | TokenInstanceKey
): Promise<TokenClass> {
  const tokenClass = await getObjectByKey(
    ctx,
    TokenClass,
    TokenClass.buildTokenClassCompositeKey(tokenClassKey)
  ).catch(() => {
    throw new TokenClassNotFoundError(tokenClassKey.toStringKey());
  });
  return tokenClass;
}

export async function fetchTokenClassesWithPagination(
  ctx: GalaChainContext,
  dto: FetchTokenClassesWithPaginationDto
): Promise<FetchTokenClassesResponse> {
  const queryParams: string[] = takeUntilUndefined(dto.collection, dto.category, dto.type, dto.additionalKey);

  const getObjectsResponse = await getObjectsByPartialCompositeKeyWithPagination(
    ctx,
    TokenClass.INDEX_KEY,
    queryParams,
    TokenClass,
    dto.bookmark,
    dto.limit ?? FetchTokenClassesWithPaginationDto.DEFAULT_LIMIT
  );

  const response = await createValidDTO(FetchTokenClassesResponse, {
    results: getObjectsResponse.results,
    nextPageBookmark: getObjectsResponse.metadata.bookmark
  });

  return response;
}

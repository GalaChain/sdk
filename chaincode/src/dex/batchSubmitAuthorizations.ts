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
  AuthorizeBatchSubmitterDto,
  BatchSubmitAuthorities,
  BatchSubmitAuthoritiesResDto,
  ChainError,
  DeauthorizeBatchSubmitterDto,
  ErrorCode,
  FetchBatchSubmitAuthoritiesDto,
  UnauthorizedError,
  ValidationFailedError
} from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { getObjectByKey, putChainObject } from "../utils";

/**
 * Fetches the batch submit authorities from the chain.
 */
export async function fetchBatchSubmitAuthorities(ctx: GalaChainContext): Promise<BatchSubmitAuthorities> {
  const key = ctx.stub.createCompositeKey(BatchSubmitAuthorities.INDEX_KEY, []);

  return await getObjectByKey(ctx, BatchSubmitAuthorities, key);
}

/**
 * Authorizes users to call BatchSubmit operations.
 * Only existing authorized users can add new authorizations.
 */
export async function authorizeBatchSubmitter(
  ctx: GalaChainContext,
  dto: AuthorizeBatchSubmitterDto
): Promise<BatchSubmitAuthoritiesResDto> {
  const key = ctx.stub.createCompositeKey(BatchSubmitAuthorities.INDEX_KEY, []);
  const authorities = await getObjectByKey(ctx, BatchSubmitAuthorities, key).catch((e) => {
    const chainError = ChainError.from(e);
    if (chainError.matches(ErrorCode.NOT_FOUND)) {
      return new BatchSubmitAuthorities([]);
    } else {
      throw chainError;
    }
  });

  // Add new authorities
  for (const authority of dto.authorities) {
    authorities.addAuthority(authority);
  }

  await putChainObject(ctx, authorities);

  const result = new BatchSubmitAuthoritiesResDto();
  result.authorities = authorities.getAuthorities();
  return result;
}

/**
 * Deauthorizes a user from calling BatchSubmit operations.
 */
export async function deauthorizeBatchSubmitter(
  ctx: GalaChainContext,
  dto: DeauthorizeBatchSubmitterDto
): Promise<BatchSubmitAuthoritiesResDto> {
  const authorities = await fetchBatchSubmitAuthorities(ctx);

  authorities.removeAuthority(dto.authority);
  await putChainObject(ctx, authorities);

  const result = new BatchSubmitAuthoritiesResDto();
  result.authorities = authorities.getAuthorities();
  return result;
}

/**
 * Fetches the current batch submit authorizations.
 */
export async function getBatchSubmitAuthorities(
  ctx: GalaChainContext,
  dto: FetchBatchSubmitAuthoritiesDto
): Promise<BatchSubmitAuthoritiesResDto> {
  const authorities = await fetchBatchSubmitAuthorities(ctx);
  const result = new BatchSubmitAuthoritiesResDto();

  result.authorities = authorities.getAuthorities();
  return result;
}

/**
 * Checks if the calling user is authorized to perform batch submit operations.
 */
export async function isAuthorizedForBatchSubmit(ctx: GalaChainContext): Promise<boolean> {
  const authorities = await fetchBatchSubmitAuthorities(ctx);
  return authorities.isAuthorized(ctx.callingUser);
}

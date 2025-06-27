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
  BatchSubmitAuthorizations,
  BatchSubmitAuthorizationsResDto,
  DeauthorizeBatchSubmitterDto,
  FetchBatchSubmitAuthorizationsDto,
  UnauthorizedError,
  ValidationFailedError
} from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { getObjectByKey, putChainObject } from "../utils";

/**
 * Fetches the batch submit authorizations from the chain.
 * Creates a new authorization object if none exists.
 */
export async function fetchBatchSubmitAuthorizations(ctx: GalaChainContext): Promise<BatchSubmitAuthorizations> {
  const key = ctx.stub.createCompositeKey(BatchSubmitAuthorizations.INDEX_KEY, []);
  
  try {
    return await getObjectByKey(ctx, BatchSubmitAuthorizations, key);
  } catch (error) {
    // If not found, create a new authorization object with the calling user as the first authority
    const defaultAuthorizations = new BatchSubmitAuthorizations([ctx.callingUser]);
    await putChainObject(ctx, defaultAuthorizations);
    return defaultAuthorizations;
  }
}

/**
 * Authorizes users to call BatchSubmit operations.
 * Only existing authorized users can add new authorizations.
 */
export async function authorizeBatchSubmitter(
  ctx: GalaChainContext,
  dto: AuthorizeBatchSubmitterDto
): Promise<BatchSubmitAuthorizationsResDto> {
  const authorizations = await fetchBatchSubmitAuthorizations(ctx);
  
  if (!authorizations.isAuthorized(ctx.callingUser)) {
    throw new UnauthorizedError(
      `CallingUser ${ctx.callingUser} is not authorized to manage batch submit authorizations. ` +
      `Authorized users: ${authorizations.getAuthorizedAuthorities().join(", ")}`
    );
  }

  // Add new authorizers
  for (const authorizer of dto.authorizers) {
    authorizations.addAuthority(authorizer);
  }

  await putChainObject(ctx, authorizations);
  
  const result = new BatchSubmitAuthorizationsResDto();
  result.authorities = authorizations.getAuthorizedAuthorities();
  return result;
}

/**
 * Deauthorizes a user from calling BatchSubmit operations.
 * Only existing authorized users can remove authorizations.
 */
export async function deauthorizeBatchSubmitter(
  ctx: GalaChainContext,
  dto: DeauthorizeBatchSubmitterDto
): Promise<BatchSubmitAuthorizationsResDto> {
  const authorizations = await fetchBatchSubmitAuthorizations(ctx);
  
  if (!authorizations.isAuthorized(ctx.callingUser)) {
    throw new UnauthorizedError(
      `CallingUser ${ctx.callingUser} is not authorized to manage batch submit authorizations. ` +
      `Authorized users: ${authorizations.getAuthorizedAuthorities().join(", ")}`
    );
  }

  // Prevent removing the last authorized user
  if (authorizations.authorities.length === 1 && authorizations.isAuthorized(dto.authorizer)) {
    throw new ValidationFailedError("Cannot remove the last authorized user for batch submit operations");
  }

  authorizations.removeAuthority(dto.authorizer);
  await putChainObject(ctx, authorizations);
  
  const result = new BatchSubmitAuthorizationsResDto();
  result.authorities = authorizations.getAuthorizedAuthorities();
  return result;
}

/**
 * Fetches the current batch submit authorizations.
 */
export async function getBatchSubmitAuthorizations(
  ctx: GalaChainContext,
  dto: FetchBatchSubmitAuthorizationsDto
): Promise<BatchSubmitAuthorizationsResDto> {
  const authorizations = await fetchBatchSubmitAuthorizations(ctx);
  const result = new BatchSubmitAuthorizationsResDto();
  result.authorities = authorizations.getAuthorizedAuthorities();
  return result;
}

/**
 * Checks if the calling user is authorized to perform batch submit operations.
 */
export async function isAuthorizedForBatchSubmit(ctx: GalaChainContext): Promise<boolean> {
  const authorizations = await fetchBatchSubmitAuthorizations(ctx);
  return authorizations.isAuthorized(ctx.callingUser);
} 
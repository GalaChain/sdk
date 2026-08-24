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
import { ForbiddenError, NotFoundError, ValidationFailedError } from "@gala-chain/api";

export class TokenInstanceNotFoundError extends NotFoundError {
  constructor(tokenInstanceKey: string) {
    super(`Token instance not found: ${tokenInstanceKey}`, { tokenInstanceKey });
  }
}

export class TokenInstanceMetadataNotFoundError extends NotFoundError {
  constructor(tokenInstanceKey: string, project: string) {
    super(`Token instance metadata of project ${project} not found: ${tokenInstanceKey}`, {
      tokenInstanceKey,
      project
    });
  }
}

export class NftInstanceRequiredError extends ValidationFailedError {
  constructor(tokenInstanceKey: string) {
    super(`Token instance metadata is supported for NFT instances only (got: ${tokenInstanceKey})`, {
      tokenInstanceKey
    });
  }
}

export class TooManyMetadataDocumentsError extends ValidationFailedError {
  constructor(tokenInstanceKey: string, limit: number) {
    super(
      `Token instance ${tokenInstanceKey} has more than ${limit} metadata documents. ` +
        `Use FetchTokenInstanceMetadataWithPagination to page through them, ` +
        `or provide a project to fetch a single document.`,
      { tokenInstanceKey, limit }
    );
  }
}

export class UserNotAuthorizedForProjectError extends ForbiddenError {
  constructor(user: string, project: string) {
    super(
      `User ${user} is not authorized for project name "${project}". Project names are ` +
        `claimed in the NFT collection name registry (GrantNftCollectionAuthorization).`,
      { user, project }
    );
  }
}

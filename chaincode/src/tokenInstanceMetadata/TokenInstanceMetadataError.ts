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

export class NotProjectMetadataOwnerError extends ForbiddenError {
  constructor(user: string, project: string, tokenClassKey: string, owner: string) {
    super(
      `User ${user} is not the owner of metadata of project ${project} ` +
        `for token class ${tokenClassKey}. Owner: ${owner}`,
      { user, project, tokenClassKey, owner }
    );
  }
}

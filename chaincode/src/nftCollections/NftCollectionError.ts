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
import { ForbiddenError, NotFoundError } from "@gala-chain/api";

export class NftCollectionAuthorizationNotFoundError extends NotFoundError {
  constructor(collection: string) {
    super(`NFT collection authorization for collection "${collection}" does not exist`, {
      collection
    });
  }
}

export class UserNotAuthorizedForCollectionError extends ForbiddenError {
  constructor(user: string, collection: string) {
    super(`User ${user} is not authorized to create NFT collections for collection "${collection}"`, {
      user,
      collection
    });
  }
}

export class CollectionNameMismatchError extends ForbiddenError {
  constructor(requestedCollection: string, authorizedCollection: string) {
    super(
      `Collection name mismatch: requested "${requestedCollection}" but authorization is for "${authorizedCollection}"`,
      {
        requestedCollection,
        authorizedCollection
      }
    );
  }
}

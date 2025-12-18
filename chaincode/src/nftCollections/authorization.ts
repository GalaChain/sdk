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
import { NftCollectionAuthorization, UserAlias } from "@gala-chain/api";
import { GalaChainContext, getObjectByKey, objectExists, putChainObject, UserNotAuthorizedForCollectionError } from "@gala-chain/chaincode";

export async function grantNftCollectionAuthorization(
  ctx: GalaChainContext,
  collection: string,
  authorizedUser: UserAlias
): Promise<NftCollectionAuthorization> {
  const authorizationKey = NftCollectionAuthorization.getCompositeKeyFromParts(
    NftCollectionAuthorization.INDEX_KEY,
    [collection]
  );

  let authorization: NftCollectionAuthorization;

  const exists = await objectExists(ctx, authorizationKey);
  if (exists) {
    authorization = await getObjectByKey(ctx, NftCollectionAuthorization, authorizationKey);

    // Add user if not already in the list
    if (!authorization.authorizedUsers.includes(authorizedUser)) {
      authorization.authorizedUsers.push(authorizedUser);
      authorization.authorizedUsers.sort(); // Keep sorted for consistency
    }
  } else {
    // Create new authorization object
    authorization = new NftCollectionAuthorization();
    authorization.collection = collection;
    authorization.authorizedUsers = [authorizedUser];
  }

  await putChainObject(ctx, authorization);
  return authorization;
}

export async function revokeNftCollectionAuthorization(
  ctx: GalaChainContext,
  collection: string,
  authorizedUser: UserAlias
): Promise<NftCollectionAuthorization> {
  const authorizationKey = NftCollectionAuthorization.getCompositeKeyFromParts(
    NftCollectionAuthorization.INDEX_KEY,
    [collection]
  );

  const authorization = await getObjectByKey(ctx, NftCollectionAuthorization, authorizationKey);

  // only authorized users can revoke authorization
  if (!authorization.authorizedUsers.includes(ctx.callingUser)) {
    throw new UserNotAuthorizedForCollectionError(ctx.callingUser, collection);
  }

  const index = authorization.authorizedUsers.indexOf(authorizedUser);
  if (index === -1) {
    // User not in list, return authorization as-is (idempotent)
    // Don't write if nothing changed
    return authorization;
  }

  authorization.authorizedUsers.splice(index, 1);
  await putChainObject(ctx, authorization);
  return authorization;
}

export async function fetchNftCollectionAuthorization(
  ctx: GalaChainContext,
  collection: string
): Promise<NftCollectionAuthorization> {
  const authorizationKey = NftCollectionAuthorization.getCompositeKeyFromParts(
    NftCollectionAuthorization.INDEX_KEY,
    [collection]
  );

  return await getObjectByKey(ctx, NftCollectionAuthorization, authorizationKey);
}

export async function isUserAuthorizedForCollection(
  ctx: GalaChainContext,
  collection: string,
  user: UserAlias
): Promise<boolean> {
  try {
    const authorization = await fetchNftCollectionAuthorization(ctx, collection);
    return authorization.authorizedUsers.includes(user);
  } catch (e) {
    // If authorization doesn't exist, user is not authorized
    return false;
  }
}

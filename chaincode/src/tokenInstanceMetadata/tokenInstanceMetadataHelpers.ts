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
  ChainObject,
  TokenClass,
  TokenInstance,
  TokenInstanceKey,
  TokenInstanceMetadata,
  TokenInstanceMetadataProject
} from "@gala-chain/api";

import { TokenClassNotFoundError } from "../token/TokenError";
import { GalaChainContext } from "../types";
import { getObjectByKey, objectExists } from "../utils/state";
import { NftInstanceRequiredError } from "./TokenInstanceMetadataError";

export async function ensureNftInstance(
  ctx: GalaChainContext,
  tokenInstance: TokenInstanceKey
): Promise<TokenClass> {
  const classKey = TokenClass.buildTokenClassCompositeKey(tokenInstance);

  const tokenClass = await getObjectByKey(ctx, TokenClass, classKey).catch(() => {
    throw new TokenClassNotFoundError(tokenInstance.getTokenClassKey().toStringKey());
  });

  if (!tokenClass.isNonFungible || tokenInstance.isFungible()) {
    throw new NftInstanceRequiredError(tokenInstance.toStringKey());
  }

  return tokenClass;
}

export function buildTokenInstanceMetadataCompositeKey(
  tokenInstance: TokenInstanceKey,
  project: string
): string {
  const compositeKeyParts = [...TokenInstance.buildInstanceKeyList(tokenInstance), project];
  return ChainObject.getCompositeKeyFromParts(TokenInstanceMetadata.INDEX_KEY, compositeKeyParts);
}

export function buildTokenInstanceMetadataProjectCompositeKey(
  tokenInstance: TokenInstanceKey,
  project: string
): string {
  const compositeKeyParts = [
    tokenInstance.collection,
    tokenInstance.category,
    tokenInstance.type,
    tokenInstance.additionalKey,
    project
  ];
  return ChainObject.getCompositeKeyFromParts(TokenInstanceMetadataProject.INDEX_KEY, compositeKeyParts);
}

export async function fetchTokenInstanceMetadataProject(
  ctx: GalaChainContext,
  tokenInstance: TokenInstanceKey,
  project: string
): Promise<TokenInstanceMetadataProject | undefined> {
  const key = buildTokenInstanceMetadataProjectCompositeKey(tokenInstance, project);

  // deliberately not a .catch() on the read: only a missing record may resolve to undefined,
  // since callers treat undefined as "unowned" and claim ownership for the calling user
  const exists = await objectExists(ctx, key);

  return exists ? await getObjectByKey(ctx, TokenInstanceMetadataProject, key) : undefined;
}

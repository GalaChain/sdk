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
import { TokenClass, TokenInstanceKey, TokenInstanceMetadata } from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { deleteChainObject, getObjectByKey } from "../utils/state";
import {
  NotProjectMetadataOwnerError,
  TokenInstanceMetadataNotFoundError
} from "./TokenInstanceMetadataError";
import {
  buildTokenInstanceMetadataCompositeKey,
  ensureNftInstance,
  fetchTokenInstanceMetadataProject
} from "./tokenInstanceMetadataHelpers";

export interface DeleteTokenInstanceMetadataParams {
  tokenInstance: TokenInstanceKey;
  project: string;
}

export async function deleteTokenInstanceMetadata(
  ctx: GalaChainContext,
  params: DeleteTokenInstanceMetadataParams
): Promise<TokenInstanceKey> {
  const { tokenInstance, project } = params;

  await ensureNftInstance(ctx, tokenInstance);

  const ownership = await fetchTokenInstanceMetadataProject(ctx, tokenInstance, project);

  if (ownership === undefined) {
    throw new TokenInstanceMetadataNotFoundError(tokenInstance.toStringKey(), project);
  }

  if (ownership.owner !== ctx.callingUser) {
    const classKey = TokenClass.buildTokenClassCompositeKey(tokenInstance);
    throw new NotProjectMetadataOwnerError(ctx.callingUser, project, classKey, ownership.owner);
  }

  const metadataKey = buildTokenInstanceMetadataCompositeKey(tokenInstance, project);

  const existing = await getObjectByKey(ctx, TokenInstanceMetadata, metadataKey).catch(() => {
    throw new TokenInstanceMetadataNotFoundError(tokenInstance.toStringKey(), project);
  });

  await deleteChainObject(ctx, existing);

  return tokenInstance;
}

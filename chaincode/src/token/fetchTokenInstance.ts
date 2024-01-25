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
import { ChainObject, TokenInstance, TokenInstanceKey, TokenInstanceKeyProperties } from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { getObjectByKey } from "../utils/state";

export async function fetchTokenInstance(
  ctx: GalaChainContext,
  tokenKeyObj: TokenInstanceKeyProperties
): Promise<TokenInstance> {
  const compositeKeyParts = TokenInstance.buildInstanceKeyList(tokenKeyObj);

  const chainKey = ChainObject.getCompositeKeyFromParts(TokenInstance.INDEX_KEY, compositeKeyParts);

  const fetchedInstance = await getObjectByKey(ctx, TokenInstance, chainKey);

  return fetchedInstance;
}

export async function fetchTokenInstances(
  ctx: GalaChainContext,
  tokenInstances: TokenInstanceKey[]
): Promise<TokenInstance[]> {
  const ops = tokenInstances.map((i) => fetchTokenInstance(ctx, i));
  return Promise.all(ops);
}

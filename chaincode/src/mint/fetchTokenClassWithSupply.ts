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
import { TokenClass, TokenClassKey } from "@gala-chain/api";

import { fetchKnownBurnCount } from "../burns/fetchBurns";
import { TokenClassNotFoundError } from "../token/TokenError";
import { GalaChainContext } from "../types";
import { getObjectByKey } from "../utils";
import { fetchMintAllowanceSupply } from "./fetchMintAllowanceSupply";
import { fetchMintSupply } from "./fetchMintSupply";

export async function fetchTokenClassesWithSupply(
  ctx: GalaChainContext,
  tokenClasses: TokenClassKey[]
): Promise<TokenClass[]> {
  const fetchOps = tokenClasses.map((c) => fetchTokenClassWithKnownSupply(ctx, c));

  return await Promise.all(fetchOps);
}

export async function fetchTokenClassWithKnownSupply(
  ctx: GalaChainContext,
  tokenClassKey: TokenClassKey
): Promise<TokenClass> {
  const tokenClass = await getObjectByKey(
    ctx,
    TokenClass,
    TokenClass.buildTokenClassCompositeKey(tokenClassKey)
  ).catch(() => {
    throw new TokenClassNotFoundError(tokenClassKey.toStringKey());
  });

  const knownMintAllowanceSupply = await fetchMintAllowanceSupply(ctx, tokenClass, 0);

  tokenClass.knownMintAllowanceSupply = knownMintAllowanceSupply;

  const knownMintSupply = await fetchMintSupply(ctx, tokenClass, 0);

  tokenClass.knownMintSupply = knownMintSupply;

  const totalBurned = await fetchKnownBurnCount(ctx, tokenClass);

  tokenClass.totalBurned = totalBurned;

  return tokenClass;
}

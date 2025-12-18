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
import { TokenClass, TokenClassKey, UserAlias } from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { getObjectByKey, putChainObject } from "../utils/state";
import { NotATokenAuthorityError, TokenClassNotFoundError } from "./TokenError";

export interface UpdateTokenClassParams {
  tokenClass: TokenClassKey;
  name?: string;
  symbol?: string;
  description?: string;
  contractAddress?: string;
  metadataAddress?: string;
  rarity?: string;
  authorities?: UserAlias[];
  overwriteAuthorities?: boolean;
}

export async function updateTokenClass(
  ctx: GalaChainContext,
  params: UpdateTokenClassParams
): Promise<TokenClassKey> {
  // dto is valid, create an instance from the dto and validate the conversion
  const tokenKeyCheck = new TokenClass();
  tokenKeyCheck.collection = params.tokenClass.collection;
  tokenKeyCheck.category = params.tokenClass.category;
  tokenKeyCheck.type = params.tokenClass.type;
  tokenKeyCheck.additionalKey = params.tokenClass.additionalKey;

  const compositeKey = tokenKeyCheck.getCompositeKey();

  const existingToken = await getObjectByKey(ctx, TokenClass, compositeKey).catch(async () => {
    const keyString = (await tokenKeyCheck.getKey()).toStringKey();
    throw new TokenClassNotFoundError(keyString);
  });

  if (!existingToken.authorities.includes(ctx.callingUser)) {
    throw new NotATokenAuthorityError(ctx.callingUser, compositeKey, existingToken.authorities);
  }

  const updatedToken = existingToken.updatedWith(params);
  await updatedToken.validateOrReject();

  await putChainObject(ctx, updatedToken);

  const tokenId = await TokenClass.buildClassKeyObject(updatedToken);
  return tokenId;
}

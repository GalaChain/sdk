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
import { TokenClass, TokenMintConfiguration, UnauthorizedError } from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { deleteChainObject, getObjectByKey } from "../utils";

export interface IDeleteMintConfiguration {
  collection: string;
  category: string;
  type: string;
  additionalKey: string;
}

const curatorOrgMsp = process.env.CURATOR_ORG_MSP ?? "CuratorOrg";

export async function deleteTokenMintConfiguration(ctx: GalaChainContext, data: IDeleteMintConfiguration) {
  const { collection, category, type, additionalKey } = data;

  const configuration = await getObjectByKey(
    ctx,
    TokenMintConfiguration,
    TokenMintConfiguration.getCompositeKeyFromParts(TokenMintConfiguration.INDEX_KEY, [
      collection,
      category,
      type,
      additionalKey
    ])
  );

  const tokenClass = await getObjectByKey(
    ctx,
    TokenClass,
    TokenClass.getCompositeKeyFromParts(TokenClass.INDEX_KEY, [collection, category, type, additionalKey])
  );

  if (ctx.clientIdentity.getMSPID() !== curatorOrgMsp && !tokenClass.authorities.includes(ctx.callingUser)) {
    throw new UnauthorizedError(
      `callingUser ${ctx.callingUser} attempted to delete ` +
        `TokenMintConfiguration for TokenClass ${[collection, category, type, additionalKey].join("|")}, ` +
        `but is not listed as a token authority: ${tokenClass.authorities.join(", ")}`
    );
  }

  await deleteChainObject(ctx, configuration);

  return configuration;
}

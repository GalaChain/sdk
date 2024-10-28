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
  ChainError,
  ErrorCode,
  TokenClass,
  TokenMintConfiguration,
  UnauthorizedError
} from "@gala-chain/api";
import { plainToInstance } from "class-transformer";

import { GalaChainContext } from "../types";
import { getObjectByKey, putChainObject } from "../utils";

export interface IMintConfiguration {
  collection: string;
  category: string;
  type: string;
  additionalKey: string;
  postMintBurn?: boolean;
  postMintLock?: boolean;
}

const curatorOrgMsp = process.env.CURATOR_ORG_MSP ?? "CuratorOrg";

export async function saveTokenMintConfiguration(
  ctx: GalaChainContext,
  data: IMintConfiguration
): Promise<TokenMintConfiguration> {
  const { collection, category, type, additionalKey, postMintBurn, postMintLock } = data;

  const existingConfiguration = await getObjectByKey(
    ctx,
    TokenMintConfiguration,
    TokenMintConfiguration.getCompositeKeyFromParts(TokenMintConfiguration.INDEX_KEY, [
      collection,
      category,
      type,
      additionalKey
    ])
  ).catch((e) => {
    const chainError = ChainError.from(e);
    if (chainError.matches(ErrorCode.NOT_FOUND)) {
      return undefined;
    } else {
      throw chainError;
    }
  });

  const existingTokenClass = await getObjectByKey(
    ctx,
    TokenClass,
    TokenClass.getCompositeKeyFromParts(TokenClass.INDEX_KEY, [collection, category, type, additionalKey])
  );

  if (ctx.clientIdentity.getMSPID() !== curatorOrgMsp) {
    if (!existingTokenClass || !existingTokenClass.authorities.includes(ctx.callingUser)) {
      throw new UnauthorizedError(
        `CallingUser ${ctx.callingUser} is not authorized to create or update ` +
          `TokenMintConfiguration for ${[collection, category, type, additionalKey].join("|")} ` +
          `${existingTokenClass ? "Authorities: " + existingTokenClass.authorities.join(", ") : ""}`
      );
    }
  }

  const newConfiguration = plainToInstance(TokenMintConfiguration, {
    collection,
    category,
    type,
    additionalKey,
    postMintBurn,
    postMintLock
  });

  await putChainObject(ctx, newConfiguration);

  return newConfiguration;
}

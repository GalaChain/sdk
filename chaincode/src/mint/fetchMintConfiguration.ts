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
import { ChainError, ErrorCode, TokenMintConfiguration } from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { getObjectByKey } from "../utils";

export interface IFetchMintConfiguration {
  collection: string;
  category: string;
  type: string;
  additionalKey: string;
}

export async function fetchTokenMintConfiguration(ctx: GalaChainContext, data: IFetchMintConfiguration) {
  const { collection, category, type, additionalKey } = data;

  const mintConfiguration: TokenMintConfiguration | undefined = await getObjectByKey(
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

  return mintConfiguration;
}

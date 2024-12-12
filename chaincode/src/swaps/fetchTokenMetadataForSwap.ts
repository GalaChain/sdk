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
import { ChainObject, TokenClass, TokenSwapRequest } from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { getObjectByKey } from "../utils";

export async function fetchTokenMetadataForSwap(ctx: GalaChainContext, swap: TokenSwapRequest) {
  for (const tokenQuantity of swap.offered) {
    const keyList = [
      tokenQuantity.tokenInstance.collection,
      tokenQuantity.tokenInstance.category,
      tokenQuantity.tokenInstance.type,
      tokenQuantity.tokenInstance.additionalKey
    ];

    const compositeKey = ChainObject.getCompositeKeyFromParts(TokenClass.INDEX_KEY, keyList);
    const tokenClass: TokenClass = await getObjectByKey(ctx, TokenClass, compositeKey);

    tokenQuantity.tokenMetadata = tokenClass;
  }

  for (const tokenQuantity of swap.wanted) {
    const keyList = [
      tokenQuantity.tokenInstance.collection,
      tokenQuantity.tokenInstance.category,
      tokenQuantity.tokenInstance.type,
      tokenQuantity.tokenInstance.additionalKey
    ];

    const compositeKey = ChainObject.getCompositeKeyFromParts(TokenClass.INDEX_KEY, keyList);
    const tokenClass: TokenClass = await getObjectByKey(ctx, TokenClass, compositeKey);

    tokenQuantity.tokenMetadata = tokenClass;
  }
}

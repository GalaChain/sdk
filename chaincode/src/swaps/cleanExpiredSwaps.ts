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
  CleanTokenSwapsResponse,
  TokenSwapRequest,
  TokenSwapRequestInstanceOffered,
  TokenSwapRequestInstanceWanted,
  TokenSwapRequestOfferedBy,
  TokenSwapRequestOfferedTo
} from "@gala-chain/api";
import { plainToInstance } from "class-transformer";

import { GalaChainContext } from "../types";
import {
  deleteChainObject,
  getObjectByKey,
  getObjectsByKeys,
  getObjectsByPartialCompositeKey
} from "../utils";

export interface CleanTokenSwapsParams {
  swapRequestIds?: string[] | undefined;
}

export async function cleanTokenSwaps(
  ctx: GalaChainContext,
  data: CleanTokenSwapsParams
): Promise<CleanTokenSwapsResponse> {
  let results: TokenSwapRequest[] = [];

  if (data.swapRequestIds === undefined) {
    results = await getObjectsByPartialCompositeKey(ctx, TokenSwapRequest.INDEX_KEY, [], TokenSwapRequest);
  } else {
    results = await getObjectsByKeys(ctx, TokenSwapRequest, data.swapRequestIds);
  }

  const deletes: TokenSwapRequest[] = [];

  for (const swap of results) {
    if ((swap.expires !== 0 && swap.expires <= ctx.txUnixTime) || swap.uses <= swap.usesSpent) {
      await deindexTokenSwapRequest(ctx, swap);

      deletes.push(swap);
    }
  }

  const response = plainToInstance(CleanTokenSwapsResponse, {
    deletes
  });

  return response;
}

export async function deindexTokenSwapRequest(ctx: GalaChainContext, swap: TokenSwapRequest) {
  const { offeredBy, offeredTo, offered, wanted, swapRequestId } = swap;

  const offeredByIndexKey = ChainObject.getCompositeKeyFromParts(TokenSwapRequestOfferedBy.INDEX_KEY, [
    offeredBy,
    swapRequestId
  ]);

  const offeredByIndex = await getObjectByKey(ctx, TokenSwapRequestOfferedBy, offeredByIndexKey);

  await deleteChainObject(ctx, offeredByIndex);

  if (offeredTo) {
    const offeredToIndexKey = ChainObject.getCompositeKeyFromParts(TokenSwapRequestOfferedTo.INDEX_KEY, [
      offeredTo,
      swapRequestId
    ]);

    const offeredToIndex = await getObjectByKey(ctx, TokenSwapRequestOfferedTo, offeredToIndexKey);

    await deleteChainObject(ctx, offeredToIndex);
  }

  for (const offeredTokenQty of offered) {
    const { collection, category, type, additionalKey, instance } = offeredTokenQty.tokenInstance;

    const offeredInstanceIndexKey = ChainObject.getCompositeKeyFromParts(
      TokenSwapRequestInstanceOffered.INDEX_KEY,
      [collection, category, type, additionalKey, instance.toString(), swapRequestId]
    );

    const offeredInstanceIndex = await getObjectByKey(
      ctx,
      TokenSwapRequestInstanceOffered,
      offeredInstanceIndexKey
    );

    await deleteChainObject(ctx, offeredInstanceIndex);
  }

  for (const wantedTokenQty of wanted) {
    const { collection, category, type, additionalKey, instance } = wantedTokenQty.tokenInstance;

    const wantedInstanceIndexKey = ChainObject.getCompositeKeyFromParts(
      TokenSwapRequestInstanceWanted.INDEX_KEY,
      [collection, category, type, additionalKey, instance.toString(), swapRequestId]
    );

    const wantedInstanceIndex = await getObjectByKey(
      ctx,
      TokenSwapRequestInstanceWanted,
      wantedInstanceIndexKey
    );

    await deleteChainObject(ctx, wantedInstanceIndex);
  }

  await deleteChainObject(ctx, swap);

  return swap;
}

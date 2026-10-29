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
  Inferred,
  TokenSwapRequest,
  TokenSwapRequestInstanceOffered,
  TokenSwapRequestInstanceWanted,
  TokenSwapRequestOfferedBy,
  TokenSwapRequestOfferedTo
} from "@gala-chain/api";
import { ClassConstructor, plainToInstance } from "class-transformer";

import { GalaChainContext } from "../types";
import {
  ObjectNotFoundError,
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
    const usesExhausted = swap.uses.isLessThanOrEqualTo(swap.usesSpent);
    if ((swap.expires !== 0 && swap.expires <= ctx.txUnixTime) || usesExhausted) {
      await deindexTokenSwapRequest(ctx, swap);

      deletes.push(swap);
    }
  }

  const response = plainToInstance(CleanTokenSwapsResponse, {
    deletes
  });

  return response;
}

// An index entry may already be gone, e.g. when a swap lists the same token twice.
// Skip it, so that one such record does not block the cleanup.
async function deleteIndexIfExists<T extends ChainObject>(
  ctx: GalaChainContext,
  constructor: ClassConstructor<Inferred<T, ChainObject>>,
  key: string
): Promise<void> {
  const index = await getObjectByKey(ctx, constructor, key).catch((e) => {
    if (e instanceof ObjectNotFoundError) {
      return undefined;
    }
    throw e;
  });

  if (index !== undefined) {
    await deleteChainObject(ctx, index);
  }
}

export async function deindexTokenSwapRequest(ctx: GalaChainContext, swap: TokenSwapRequest) {
  const { offeredBy, offeredTo, offered, wanted, swapRequestId } = swap;

  const offeredByIndexKey = ChainObject.getCompositeKeyFromParts(TokenSwapRequestOfferedBy.INDEX_KEY, [
    offeredBy,
    swapRequestId
  ]);

  await deleteIndexIfExists(ctx, TokenSwapRequestOfferedBy, offeredByIndexKey);

  if (offeredTo) {
    const offeredToIndexKey = ChainObject.getCompositeKeyFromParts(TokenSwapRequestOfferedTo.INDEX_KEY, [
      offeredTo,
      swapRequestId
    ]);

    await deleteIndexIfExists(ctx, TokenSwapRequestOfferedTo, offeredToIndexKey);
  }

  for (const offeredTokenQty of offered) {
    const { collection, category, type, additionalKey, instance } = offeredTokenQty.tokenInstance;

    const offeredInstanceIndexKey = ChainObject.getCompositeKeyFromParts(
      TokenSwapRequestInstanceOffered.INDEX_KEY,
      [collection, category, type, additionalKey, instance.toString(), swapRequestId]
    );

    await deleteIndexIfExists(ctx, TokenSwapRequestInstanceOffered, offeredInstanceIndexKey);
  }

  for (const wantedTokenQty of wanted) {
    const { collection, category, type, additionalKey, instance } = wantedTokenQty.tokenInstance;

    const wantedInstanceIndexKey = ChainObject.getCompositeKeyFromParts(
      TokenSwapRequestInstanceWanted.INDEX_KEY,
      [collection, category, type, additionalKey, instance.toString(), swapRequestId]
    );

    await deleteIndexIfExists(ctx, TokenSwapRequestInstanceWanted, wantedInstanceIndexKey);
  }

  await deleteChainObject(ctx, swap);

  return swap;
}

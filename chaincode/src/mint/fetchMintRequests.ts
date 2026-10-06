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
import { ChainObject, RuntimeError, TokenClassKey, TokenMintRequest } from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { blockTimeout, generateInverseTimeKey, inverseKeyLength } from "../utils";

export async function mintRequestsByTimeRange(
  ctx: GalaChainContext,
  tokenClass: TokenClassKey,
  startTimestamp?: number | undefined,
  endTimestamp?: number | undefined
): Promise<TokenMintRequest[]> {
  // assuming start/end timestamps are more intuitive for a client constructing a dto,
  // we redefine here in code as recent / oldest to work with our inverted index:
  // In our leveldb table, start keys are generated from the more recent timestamps, and end keys are the oldest,
  // effectively the reverse of the dto property defintions.
  const mostRecentTime: number = endTimestamp ?? ctx.txUnixTime - blockTimeout;
  const oldestTime: number = startTimestamp ?? 0;

  const recentTimeKey = generateInverseTimeKey(mostRecentTime);
  const oldestTimeKey = generateInverseTimeKey(oldestTime);

  const requestEntries = await mintRequestsByTimeKeys(ctx, tokenClass, recentTimeKey, oldestTimeKey);

  return requestEntries;
}

export async function mintRequestsByTimeKeys(
  ctx: GalaChainContext,
  tokenClass: TokenClassKey,
  recentTimeKey: string,
  oldestTimeKey: string
): Promise<TokenMintRequest[]> {
  const startKey = [
    TokenMintRequest.INDEX_KEY,
    tokenClass.collection,
    tokenClass.category,
    tokenClass.type,
    tokenClass.additionalKey,
    recentTimeKey,
    "".padStart(inverseKeyLength, "0")
  ].join(ChainObject.MIN_UNICODE_RUNE_VALUE);

  const endKey = [
    TokenMintRequest.INDEX_KEY,
    tokenClass.collection,
    tokenClass.category,
    tokenClass.type,
    tokenClass.additionalKey,
    oldestTimeKey,
    "".padStart(inverseKeyLength, "z")
  ].join(ChainObject.MIN_UNICODE_RUNE_VALUE);

  const iterator = ctx.stub.getStateByRange(startKey, endKey);

  const requestEntries: TokenMintRequest[] = [];

  try {
    for await (const kv of iterator) {
      if (kv.value) {
        const stringResult = Buffer.from(kv.value).toString("utf8");
        const entry: TokenMintRequest = TokenMintRequest.deserialize(TokenMintRequest, stringResult);

        // Inverted time keys order our entries most recent first in the LevelDB key space.
        // By using unshift(), we are filling our working array with the oldest results first,
        // in order to iterate minting/fulfillment in the order received.
        requestEntries.unshift(entry);
      }
    }
  } catch (e) {
    throw new RuntimeError(
      `Error encountered while processing ctx.stub.getStateByRange Async Iterator for ` +
        `startKey ${startKey}, endKey ${endKey}: ${e?.message ?? e}`
    );
  }

  return requestEntries;
}

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
import { ChainObject, RangedChainObject, TokenBurn, TokenBurnCounter } from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { GalaChainContext } from "../types";
import {
  blockTimeout,
  getObjectsByPartialCompositeKey,
  inverseKeyLength,
  inverseTime,
  lookbackTxCount,
  takeUntilUndefined
} from "../utils";

export interface FetchBurnParams {
  collection?: string;
  category?: string;
  type?: string;
  additionalKey?: string;
  instance?: string;
  created?: number;
  burnedBy: string;
}

// This will return the list sorted by creation date ascending (oldest first)
export async function fetchBurns(ctx: GalaChainContext, data: FetchBurnParams): Promise<TokenBurn[]> {
  const queryParams: string[] = takeUntilUndefined(
    data.burnedBy,
    data.collection,
    data.category,
    data.type,
    data.additionalKey,
    data.instance,
    data.created?.toString()
  );

  let results = await getObjectsByPartialCompositeKey(ctx, TokenBurn.INDEX_KEY, queryParams, TokenBurn);

  // Sort the items ascending by date
  results = results.sort((a: TokenBurn, b: TokenBurn): number => (a.created < b.created ? -1 : 1));

  return results;
}

export interface FetchBurnCounterParams {
  collection: string;
  category: string;
  type: string;
  additionalKey: string;
}

export async function fetchKnownBurnCount(
  ctx: GalaChainContext,
  token: FetchBurnCounterParams
): Promise<BigNumber> {
  const startTimeOffset = inverseTime(ctx, blockTimeout);
  const keyLen = inverseKeyLength;

  const startKey = [
    TokenBurnCounter.INDEX_KEY,
    token.collection,
    token.category,
    token.type,
    token.additionalKey,
    startTimeOffset,
    "".padStart(keyLen, "0")
  ].join(ChainObject.MIN_UNICODE_RUNE_VALUE);

  const endKey = [
    TokenBurnCounter.INDEX_KEY,
    token.collection,
    token.category,
    token.type,
    token.additionalKey,
    "".padStart(keyLen, "z"),
    "".padStart(keyLen, "z")
  ].join(ChainObject.MIN_UNICODE_RUNE_VALUE);

  const iterator = ctx.stub.getStateByRange(startKey, endKey);

  let seekingFirstResult = true;
  let resultsCount = 0;
  const minResults = lookbackTxCount;

  const previousRequests: TokenBurnCounter[] = [];

  try {
    for await (const kv of iterator) {
      if (!seekingFirstResult && resultsCount >= minResults) {
        break;
      }
      if (kv.value) {
        const stringResult = Buffer.from(kv.value).toString("utf8");
        const entry = RangedChainObject.deserialize(TokenBurnCounter, stringResult);

        seekingFirstResult = false;

        resultsCount++;

        // inverted timeKeys read most recent first; using unshift sorts a new array as oldest first.
        // essentially, we rewind the tape and then play it forward.
        // covering the following possible scenarios:
        //     a) no results yet - empty array, start with zero below.
        //     b) no recent results. continue back toward the beginning of the ledger until we find at least one.
        //     c) recent results. Get all results within two past block spans to cover any missing timestamp gaps from concurrent recent transactions.
        previousRequests.unshift(entry);
      }
    }
  } catch (e) {
    throw new Error(`Failed to get iterator for getStateByRange with key: ${startKey}, ${iterator}, ${e}`);
  } finally {
    (await iterator).close;
  }

  let startingKnownBurnsCount: BigNumber = new BigNumber("0");
  let updatedKnownBurnsCount: BigNumber = new BigNumber("0");

  let firstResult = true;

  for (const entry of previousRequests) {
    if (firstResult && entry.totalKnownBurnsCount.isGreaterThan(startingKnownBurnsCount)) {
      // establish base line for first result
      startingKnownBurnsCount = entry.totalKnownBurnsCount;
      updatedKnownBurnsCount = new BigNumber(entry.totalKnownBurnsCount);
    }

    firstResult = false;

    updatedKnownBurnsCount = updatedKnownBurnsCount.plus(entry.quantity);
  }

  return updatedKnownBurnsCount;
}

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
import { ChainObject, RangedChainObject, TokenClassKeyProperties, TokenMintRequest } from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { GalaChainContext } from "../types";
import { inverseKeyLength, inverseTime, lookbackTimeOffset, lookbackTxCount } from "../utils";

export async function fetchMintSupply(
  ctx: GalaChainContext,
  tokenClass: TokenClassKeyProperties,
  offsetCurrentTimeMs?: number | undefined
): Promise<BigNumber> {
  // The block timeout times 2 is the default offset, rather than zero, because querying requests from
  // the current time could cause concurrent minting to fail with MVCC_READ_CONFLICTs.
  // Consumers must explicitly override this with a 0 value to read with no offset.
  const startTimeOffset: number = offsetCurrentTimeMs ?? lookbackTimeOffset;

  const startTimeKey: string = inverseTime(ctx, startTimeOffset);
  const keyLen = inverseKeyLength;

  const startKey = [
    TokenMintRequest.INDEX_KEY,
    tokenClass.collection,
    tokenClass.category,
    tokenClass.type,
    tokenClass.additionalKey,
    startTimeKey,
    "".padStart(keyLen, "0")
  ].join(ChainObject.MIN_UNICODE_RUNE_VALUE);

  const endKey = [
    TokenMintRequest.INDEX_KEY,
    tokenClass.collection,
    tokenClass.category,
    tokenClass.type,
    tokenClass.additionalKey,
    "".padStart(keyLen, "z"),
    "".padStart(keyLen, "z")
  ].join(ChainObject.MIN_UNICODE_RUNE_VALUE);

  const iterator = ctx.stub.getStateByRange(startKey, endKey);

  let seekingFirstResult = true;
  let resultsCount = 0;
  const minResults = lookbackTxCount;

  const previousRequests: TokenMintRequest[] = [];

  try {
    for await (const kv of iterator) {
      if (!seekingFirstResult && resultsCount >= minResults) {
        break;
      }
      if (kv.value) {
        const stringResult = Buffer.from(kv.value).toString("utf8");
        const entry = RangedChainObject.deserialize(TokenMintRequest, stringResult);

        // timeKey is a string padded with leading zeros. BigNumber will parse into an integer.
        const entryTime = new BigNumber(entry.timeKey);

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
  }

  let startingKnownMintsCount: BigNumber = new BigNumber("0");
  let updatedKnownMintsCount: BigNumber = new BigNumber("0");

  let firstResult = true;

  for (const entry of previousRequests) {
    if (firstResult && entry.totalKnownMintsCount.isGreaterThan(startingKnownMintsCount)) {
      // establish baseline for first result
      startingKnownMintsCount = entry.totalKnownMintsCount;
      updatedKnownMintsCount = new BigNumber(entry.totalKnownMintsCount);
    }

    firstResult = false;

    updatedKnownMintsCount = updatedKnownMintsCount.plus(entry.quantity);
  }

  return updatedKnownMintsCount;
}

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
import { ChainError, ChainObject, GalaChainResponse, RuntimeError } from "@gala-chain/api";
import {
  MintRequestDto,
  TokenAllowance,
  TokenClass,
  TokenInstance,
  TokenMintAllowance,
  TokenMintAllowanceRequest
} from "@gala-chain/api";
import { FulfillMintAllowanceDto } from "@gala-chain/api";
import BigNumber from "bignumber.js";
import { inspect } from "util";

import { ensureQuantityCanBeMinted } from "../allowances";
import { fetchKnownBurnCount } from "../burns/fetchBurns";
import { GalaChainContext } from "../types";
import { getObjectByKey, lookbackTimeOffset, putChainObject } from "../utils";
import { inverseKeyLength, inversionHeight } from "../utils";
import { indexMintRequests } from "./indexMintRequests";

// Sequence operations, such as RequestMintAllowance immediately followed by FulfillMintAllowance,
// require that the input to the second function be the output of the first function.
// Within chaincode, we don't yet have a way to sign the dto output by the result of
// RequestMintAllowance. For now, the DTO input to FulfillMintAllowance does not
// require a signature, and instead must rely on inputs from the chain's prior blocks
// being valid and securely verified before write.

export async function fulfillMintAllowanceRequest(
  ctx: GalaChainContext,
  dto: FulfillMintAllowanceDto
): Promise<TokenAllowance[]> {
  // A requested mint allowance from a previous block gets validated as falling within
  // supply and capacity restraints and a valid allowance is written to chain for use.
  const requests = dto.requests;
  const requestIds = requests.map((r) => r.id);

  const reqIdx: Record<string, MintRequestDto[]> = indexMintRequests(requests);

  const successful: [TokenMintAllowance, TokenAllowance][] = [];
  // todo: type this failures array and work it into response
  const failures: any[] = [];

  for (const [_, values] of Object.entries(reqIdx)) {
    // Entries in the Request Index represent
    // some number of mint requests for the same token, at the same running total height.
    // Because our original GrantAllowance implementation allowed (potentially large) arrays,
    // especially used for granting allowances for fungible tokens, we maintain that support here.
    // The tradeoff in supporting this backwards compatibility comes at the cost of greater complexity.
    //
    // *Warning*: while this code could technically support the following input scenarios, the combined transaction
    // would most likely be too expensive in terms of compute resources and/or timeout if a request comes in for
    //     a) multiple different tokens
    //     b) MintRequests generated from various blocks with differing running totals

    // indexMintRequests() ensures every value indexed will have equivalent values for these
    // five properties and that at least one value will exist.
    const { collection, category, type, additionalKey } = values[0];

    const tokenKey = ChainObject.getCompositeKeyFromParts(TokenClass.INDEX_KEY, [
      collection,
      category,
      type,
      additionalKey
    ]);

    const tokenClass: TokenClass = await getObjectByKey(ctx, TokenClass, tokenKey);

    let mostRecentTimeInversion = new BigNumber(inversionHeight),
      oldestTimeInversion = new BigNumber("0");

    for (const req of values) {
      // timeKeys are inverted timestamps, lowest = most recent, highest = oldest
      if (req.isTimeKeyValid() === false) {
        throw new Error(
          `FulfillMintAllowance failure: Invalid timeKey value: ${
            req.timeKey
          }. The value of timeKey should be a valid BigNumber, ${inspect(req, {
            depth: 4,
            breakLength: Infinity,
            compact: true
          })}`
        );
      }

      const reqTime = new BigNumber(req.timeKey);
      if (reqTime.isLessThan(mostRecentTimeInversion)) {
        mostRecentTimeInversion = reqTime;
      }
      // no else/if here. we check for both, to prevent a single result causing an unbounded range query.
      if (reqTime.isGreaterThan(oldestTimeInversion)) {
        oldestTimeInversion = reqTime;
      }
    }

    // working with an inverted time, adding to the inverted timestamp makes it older, not newer
    oldestTimeInversion = oldestTimeInversion.plus(lookbackTimeOffset);

    const recentTimeKey = mostRecentTimeInversion.toString().padStart(inverseKeyLength, "0");
    const oldestTimeKey = oldestTimeInversion.toString().padStart(inverseKeyLength, "0");

    const startKey = [
      TokenMintAllowanceRequest.INDEX_KEY,
      tokenClass.collection,
      tokenClass.category,
      tokenClass.type,
      tokenClass.additionalKey,
      recentTimeKey,
      "".padStart(inverseKeyLength, "0")
    ].join(ChainObject.MIN_UNICODE_RUNE_VALUE);

    const endKey = [
      TokenMintAllowanceRequest.INDEX_KEY,
      tokenClass.collection,
      tokenClass.category,
      tokenClass.type,
      tokenClass.additionalKey,
      oldestTimeKey,
      "".padStart(inverseKeyLength, "z")
    ].join(ChainObject.MIN_UNICODE_RUNE_VALUE);

    const iterator = ctx.stub.getStateByRange(startKey, endKey);

    const requestEntries: TokenMintAllowanceRequest[] = [];

    try {
      for await (const kv of iterator) {
        if (kv.value) {
          const stringResult = Buffer.from(kv.value).toString("utf8");
          const entry: TokenMintAllowanceRequest = TokenMintAllowanceRequest.deserialize(
            TokenMintAllowanceRequest,
            stringResult
          );

          // Inverted time keys order our results most recent first.
          // By using unshift(), we are filling a result array with oldest first,
          // for minting/fulfillment in the order received.
          requestEntries.unshift(entry);
        }
      }
    } catch (e) {
      throw new RuntimeError(
        `Error encountered while processing ctx.stub.getStateByRange Async Iterator for ` +
          `startKey ${startKey}, endKey ${endKey}: ${e?.message ?? e}`
      );
    } finally {
      (await iterator).close;
    }

    if (requestEntries.length < 1) {
      throw GalaChainResponse.Error(
        new Error(
          `FulfillMintAllowance failure: No TokenMintRequest(s) found on chain. ` +
            `${inspect(tokenClass, {
              depth: 4,
              breakLength: Infinity,
              compact: true
            })}, startKey: ${startKey}, endKey: ${endKey}`
        )
      );
    }

    if (requestEntries.length < 1) {
      throw new Error(
        `FulfillMintAllowance failure: No TokenMintAllowanceRequest(s) found on chain. ` +
          `${inspect(tokenClass, {
            depth: 4,
            breakLength: Infinity,
            compact: true
          })}, startKey: ${startKey}, endKey: ${endKey}`
      );
    }
    let runningQuantityCheckTotal = new BigNumber("0");

    // check mintable qty here, supply and capacity, then process scenarios:
    // a) grant all allowances, nothing is exceeded by total
    // b) threshold block; some amount of requests are within limits, some not
    // c) threshold exceeded; token is maxed out and none of these requests go through
    //    it should be unlikely that c) could occur, because most likely requests would be denied.
    for (let i = 0; i < requestEntries.length; i++) {
      const req: TokenMintAllowanceRequest = requestEntries[i];

      // we increment this value mid-loop so it will only ever be 0 on first iteration.
      if (runningQuantityCheckTotal.isEqualTo("0")) {
        runningQuantityCheckTotal = req.totalKnownMintAllowancesCount;
      }

      if (!requestIds.includes(req.id)) {
        runningQuantityCheckTotal = runningQuantityCheckTotal.plus(req.quantity);
        continue;
      }

      let mintableQty = false;
      let qtyError: ChainError | undefined;

      try {
        const knownBurnsCount = await fetchKnownBurnCount(ctx, tokenClass);
        mintableQty = ensureQuantityCanBeMinted(
          tokenClass,
          req.quantity,
          runningQuantityCheckTotal,
          knownBurnsCount
        );
      } catch (e) {
        qtyError = e;
      }

      runningQuantityCheckTotal = runningQuantityCheckTotal.plus(req.quantity);

      if (!mintableQty) {
        failures.push({ message: qtyError?.message, data: { qty: mintableQty, req: req } });
      } else {
        const [mintAllowanceEntry, allowance]: [TokenMintAllowance, TokenAllowance] = req.fulfill(
          TokenInstance.FUNGIBLE_TOKEN_INSTANCE
        );

        const writes = [putChainObject(ctx, mintAllowanceEntry), putChainObject(ctx, allowance)];

        try {
          await Promise.all(writes);
        } catch (e) {
          failures.push({
            message: `Failed to write mintAllowance, allowance: ${e}`,
            data: [mintAllowanceEntry, allowance]
          });

          continue;
        }

        successful.push([mintAllowanceEntry, allowance]);
      }
    }
  }

  // todo: when available, map above partial success / failure / errors into
  // single unified response.
  const allowances: TokenAllowance[] = successful.map(([, allowance]) => allowance);

  if (failures.length >= 1) {
    throw new Error(
      `FulfillMintAllowance failure(s): ${inspect(failures, {
        depth: 4,
        breakLength: Infinity,
        compact: true
      })}`
    );
  }

  return allowances;
}

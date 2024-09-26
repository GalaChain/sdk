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
  AllowanceType,
  ChainCallDTO,
  ChainError,
  ChainObject,
  FulfillMintDto,
  GalaChainResponse,
  MintRequestDto,
  MintTokenDto,
  RuntimeError,
  TokenAllowance,
  TokenClass,
  TokenClassKey,
  TokenInstance,
  TokenInstanceKey,
  TokenMintFulfillment,
  TokenMintRequest,
  createValidSubmitDTO
} from "@gala-chain/api";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";
import { inspect } from "util";

import { ensureQuantityCanBeMinted, useAllowances } from "../allowances";
import { fetchKnownBurnCount } from "../burns/fetchBurns";
import { GalaChainContext } from "../types";
import {
  blockTimeout,
  generateInverseTimeKey,
  getObjectByKey,
  inverseKeyLength,
  inversionHeight,
  lookbackTimeOffset,
  putChainObject
} from "../utils";
import { constructVerifiedMints } from "./constructVerifiedMints";
import { indexMintRequests } from "./indexMintRequests";
import { validateMintRequest } from "./validateMintRequest";

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

export async function fulfillMintRequest(
  ctx: GalaChainContext,
  dto: FulfillMintDto
): Promise<Array<TokenInstanceKey>> {
  const requests = dto.requests;
  const requestIds = requests.map((r) => r.id);

  const reqIdx: Record<string, MintRequestDto[]> = indexMintRequests(requests);

  let resultInstanceKeys: TokenInstanceKey[] = [];

  const successful: TokenMintFulfillment[] = [];
  // todo: type this failures array and work it into response
  const failures: unknown[] = [];

  for (const [, values] of Object.entries(reqIdx)) {
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
    const { collection, category, type, additionalKey, totalKnownMintsCount } = values[0];

    const tokenKey = ChainObject.getCompositeKeyFromParts(TokenClass.INDEX_KEY, [
      collection,
      category,
      type,
      additionalKey
    ]);

    const tokenClass: TokenClass = await getObjectByKey(ctx, TokenClass, tokenKey);

    const tokenClassKey = await TokenClass.buildClassKeyObject({
      collection,
      category,
      type,
      additionalKey
    });

    const dtoInstanceKey = ChainCallDTO.deserialize<TokenInstanceKey>(TokenInstanceKey, {
      ...tokenClassKey,
      instance: TokenInstance.FUNGIBLE_TOKEN_INSTANCE
    });

    let mostRecentTimeInversion = new BigNumber(inversionHeight),
      oldestTimeInversion = new BigNumber("0");

    for (const req of values) {
      // timeKeys are inverted timestamps, lowest = most recent, highest = oldest
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

    const requestEntries: TokenMintRequest[] = await mintRequestsByTimeKeys(
      ctx,
      tokenClassKey,
      recentTimeKey,
      oldestTimeKey
    );

    if (requestEntries.length < 1) {
      throw GalaChainResponse.Error(
        new Error(
          `FulfillMint failure: No TokenMintRequest(s) found on chain. ` +
            `${inspect(tokenClass, {
              depth: 4,
              breakLength: Infinity,
              compact: true
            })}, startKey: ${recentTimeKey}, endKey: ${oldestTimeKey}`
        )
      );
    }

    let runningQuantityCheckTotal = new BigNumber(totalKnownMintsCount);
    let instanceCounter = new BigNumber(totalKnownMintsCount);

    // check mintable qty here, supply and capacity, then process scenarios:
    // a) grant all allowances, nothing is exceeded by total
    // b) threshold block; some amount of requests are within limits, some not
    // c) threshold exceeded; token is maxed out and none of these requests go through
    //    it should be unlikely that c) could occur,
    //    because most likely RequestMint contract method have already been denied.
    for (let i = 0; i < requestEntries.length; i++) {
      const req: TokenMintRequest = requestEntries[i];

      if (!requestIds.includes(req.id)) {
        runningQuantityCheckTotal = runningQuantityCheckTotal.plus(req.quantity);
        instanceCounter = instanceCounter.plus(req.quantity);
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

      // todo: get back remainder from CheckMintableQuantity (now renamed ensureQuantityCanBeMinted),
      // and handle PartiallyMinted request states
      // i.e. I requested to mint 5, but only two were left.
      if (!mintableQty) {
        failures.push({ message: qtyError?.message, data: { qty: mintableQty, req: req } });
      } else {
        const mintFulfillmentEntry: TokenMintFulfillment = req.fulfill(req.quantity);

        const mintDto: MintTokenDto = await createValidSubmitDTO(MintTokenDto, {
          tokenClass: plainToInstance(TokenClassKey, { collection, category, type, additionalKey }),
          owner: req.owner,
          quantity: req.quantity,
          allowanceKey: req.allowanceKey
        });

        // todo: bridging support. refactor FulfillMint and/or validateMintRequest
        // functionality to replace the hard-coded `undefined`
        // below with bridgeUserType handling.
        const applicableAllowances: TokenAllowance[] = await validateMintRequest(
          ctx,
          mintDto,
          tokenClass,
          undefined
        );

        const actionDescription =
          `${AllowanceType.Mint} ${req.quantity.toString()} ` +
          `token ${dtoInstanceKey.toStringKey()} to ${req.owner}`;

        const allowancesUsed: boolean = await useAllowances(
          ctx,
          new BigNumber(req.quantity),
          applicableAllowances,
          AllowanceType.Mint
        );

        if (!allowancesUsed) {
          failures.push({
            req: req,
            allowancesUsed: allowancesUsed,
            message: `Failed to use allowances to ${actionDescription}`
          });

          continue;
        }

        try {
          const [instances, balance] = await constructVerifiedMints(
            ctx,
            mintFulfillmentEntry,
            tokenClass,
            instanceCounter
          );

          const returnKeys: Array<TokenInstanceKey> = [];

          for (const instance of instances) {
            if (tokenClass.isNonFungible) {
              await putChainObject(ctx, instance);
            }
            returnKeys.push(await TokenInstance.buildInstanceKeyObject(instance));
          }

          await putChainObject(ctx, balance);

          resultInstanceKeys = resultInstanceKeys.concat(returnKeys);
        } catch (e) {
          failures.push({
            req: req,
            message: e?.message ?? "ConstructVerifiedMints failed"
          });

          continue;
        }

        successful.push(mintFulfillmentEntry);
      }
    }
  }

  await Promise.all(successful.map((mintFulfillment) => putChainObject(ctx, mintFulfillment)));

  if (resultInstanceKeys.length < dto.requests.length) {
    throw new Error(
      JSON.stringify({
        success: resultInstanceKeys,
        errors: failures
      })
    );
  }
  return resultInstanceKeys;
}

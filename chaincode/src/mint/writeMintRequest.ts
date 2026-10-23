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
import { TokenClassKeyProperties, TokenMintRequest, TokenMintStatus, UserAlias } from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { GalaChainContext } from "../types";
import { inverseEpoch, inverseTime, putRangedChainObject } from "../utils";
import { fetchMintSupply } from "./fetchMintSupply";

export interface WriteMintRequestParams {
  tokenClassKey: TokenClassKeyProperties;
  callingUser: UserAlias;
  owner: UserAlias;
  quantity: BigNumber;
  knownTotalSupply?: BigNumber | undefined;
}

export async function writeMintRequest(
  ctx: GalaChainContext,
  { tokenClassKey, callingUser, owner, quantity, knownTotalSupply }: WriteMintRequestParams
): Promise<TokenMintRequest> {
  // for batch operations, support a way to pass in the knownTotalSupply to avoid repeated range queries
  // knownTotalSupply should never be exposed in a dto,
  // it should only ever be determined by application code logic.
  let totalKnownMintsCount: BigNumber;
  if (knownTotalSupply === undefined) {
    totalKnownMintsCount = await fetchMintSupply(ctx, tokenClassKey).catch((e) => {
      throw new Error(`fetchMintSupply failure: ${e.message}`);
    });
  } else {
    totalKnownMintsCount = knownTotalSupply;
  }

  const epochKey = inverseEpoch(ctx, 0);
  const timeKey = inverseTime(ctx, 0);

  const mintRequest = new TokenMintRequest();

  mintRequest.collection = tokenClassKey.collection;
  mintRequest.category = tokenClassKey.category;
  mintRequest.type = tokenClassKey.type;
  mintRequest.additionalKey = tokenClassKey.additionalKey;
  mintRequest.timeKey = timeKey;
  mintRequest.totalKnownMintsCount = totalKnownMintsCount;
  mintRequest.requestor = callingUser;
  mintRequest.owner = owner;
  mintRequest.created = ctx.txUnixTime;
  mintRequest.quantity = quantity;
  mintRequest.state = TokenMintStatus.Unknown;
  mintRequest.id = mintRequest.requestId();
  mintRequest.created = ctx.txUnixTime;
  mintRequest.epoch = epochKey;

  await putRangedChainObject(ctx, mintRequest).catch((e) => {
    throw new Error(`MintRequest putState failure: ${e.message}`);
  });

  return mintRequest;
}

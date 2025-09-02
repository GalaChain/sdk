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
import { NotImplementedError, RuntimeError, TokenBalance, TokenInstanceKey } from "@gala-chain/api";

import { fetchOrCreateBalance } from "../balances";
import { fetchTokenInstance } from "../token";
import { fetchTokenClass } from "../token/fetchTokenClasses";
import { GalaChainContext } from "../types";
import { putChainObject } from "../utils";
import { ReleaseForbiddenUserError } from "./UseError";

export interface ReleaseTokenParams {
  tokenInstanceKey: TokenInstanceKey;
}

export async function releaseToken(
  ctx: GalaChainContext,
  { tokenInstanceKey }: ReleaseTokenParams
): Promise<TokenBalance> {
  if (tokenInstanceKey.isFungible()) {
    throw new NotImplementedError("RealeaseToken is not supported for fungible tokens", {
      instanceKey: tokenInstanceKey.toStringKey()
    });
  }

  const tokenInstance = await fetchTokenInstance(ctx, tokenInstanceKey);
  const owner = tokenInstance.owner;

  // owner is always present for NFT instances - throwing to detect potential issues
  if (owner === undefined) {
    throw new RuntimeError(`Token instance ${tokenInstanceKey.toStringKey()} has no owner`);
  }

  const balance = await fetchOrCreateBalance(ctx, owner, tokenInstanceKey.getTokenClassKey());
  const applicableHold = balance.findInUseHold(tokenInstanceKey.instance, ctx.txUnixTime);

  // determine if user is authorized to release
  const authorized = applicableHold?.createdBy === ctx.callingUser || balance.owner === ctx.callingUser;

  // if calling user is not authorized, always token class authority can release
  if (!authorized) {
    const tokenClass = await fetchTokenClass(ctx, tokenInstanceKey);
    const isTokenAuthority = tokenClass.authorities.includes(ctx.callingUser);

    if (!isTokenAuthority) {
      throw new ReleaseForbiddenUserError(ctx.callingUser, tokenInstanceKey.toStringKey());
    }
  }

  if (applicableHold === undefined) {
    // we assume use may have expired or been released already
    return balance;
  }

  balance.releaseInstance(applicableHold.instanceId, undefined, ctx.txUnixTime);

  await putChainObject(ctx, balance);

  return balance;
}

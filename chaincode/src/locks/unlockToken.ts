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
import { NotImplementedError, TokenBalance, TokenInstanceKey } from "@gala-chain/api";

import { fetchOrCreateBalance } from "../balances";
import { fetchTokenInstance } from "../token";
import { fetchTokenClass } from "../token/fetchTokenClasses";
import { GalaChainContext } from "../types";
import { putChainObject } from "../utils";
import { UnlockForbiddenUserError } from "./LockError";

export interface UnlockTokenParams {
  tokenInstanceKey: TokenInstanceKey;
  name: string | undefined;
}

export async function unlockToken(
  ctx: GalaChainContext,
  { tokenInstanceKey, name }: UnlockTokenParams
): Promise<TokenBalance> {
  if (tokenInstanceKey.isFungible()) {
    throw new NotImplementedError("UnlockToken is not supported for fungible tokens", {
      instanceKey: tokenInstanceKey.toStringKey()
    });
  }

  // owner is always present for NFT instances
  const tokenInstance = await fetchTokenInstance(ctx, tokenInstanceKey);
  const owner = tokenInstance.owner as string;

  const balance = await fetchOrCreateBalance(ctx, owner, tokenInstanceKey.getTokenClassKey());
  const applicableHold = balance.findLockedHold(tokenInstanceKey.instance, name, ctx.txUnixTime);

  // determine if user is authorized to unlock
  let authorized = false;

  if (applicableHold?.lockAuthority !== undefined) {
    // there is lock authority, so only lock authority can unlock
    authorized = applicableHold.lockAuthority === ctx.callingUser;
  } else {
    // there is no lock authority, so only lock creator or balance owner can unlock
    authorized = applicableHold?.createdBy === ctx.callingUser || balance.owner === ctx.callingUser;
  }

  // if calling user is not authorized, always token class authority can unlock
  if (!authorized) {
    const tokenClass = await fetchTokenClass(ctx, tokenInstanceKey);
    const isTokenAuthority = tokenClass.authorities.includes(ctx.callingUser);

    if (!isTokenAuthority) {
      throw new UnlockForbiddenUserError(ctx.callingUser, tokenInstanceKey.toStringKey());
    }
  }

  if (applicableHold === undefined) {
    // we assume lock may have expired or been unlocked already
    return balance;
  }

  balance.ensureCanUnlockInstance(applicableHold.instanceId, name, ctx.txUnixTime).unlock();

  await putChainObject(ctx, balance);

  return balance;
}

export async function unlockTokens(
  ctx: GalaChainContext,
  params: UnlockTokenParams[]
): Promise<TokenBalance[]> {
  const balances: TokenBalance[] = [];

  for (const p of params) {
    const balance = await unlockToken(ctx, p);
    balances.push(balance);
  }

  return balances;
}

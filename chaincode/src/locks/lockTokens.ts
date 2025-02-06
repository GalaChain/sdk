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
  AuthorizedOnBehalf,
  NotImplementedError,
  TokenBalance,
  TokenClassKey,
  TokenHold,
  TokenInstanceKey
} from "@gala-chain/api";
import { BigNumber } from "bignumber.js";

import { verifyAndUseAllowances } from "../allowances";
import { fetchOrCreateBalance } from "../balances";
import { InvalidDecimalError, fetchTokenClass, fetchTokenInstance } from "../token";
import { GalaChainContext } from "../types";
import { putChainObject } from "../utils";
import { InvalidExpirationError, NftInvalidQuantityLockError } from "./LockError";

export interface TokenQuantity {
  tokenInstanceKey: TokenInstanceKey;
  quantity: BigNumber;
  owner?: string;
}

export interface LockTokenParams {
  owner: string | undefined;
  lockAuthority: string | undefined;
  tokenInstanceKey: TokenInstanceKey;
  quantity: BigNumber;
  allowancesToUse: string[];
  expires: number;
  name: string | undefined;
  starts: number | undefined;
  verifyAuthorizedOnBehalf: (c: TokenClassKey) => Promise<AuthorizedOnBehalf | undefined>;
}

export async function lockToken(
  ctx: GalaChainContext,
  {
    owner: optionalOwner,
    lockAuthority,
    tokenInstanceKey,
    quantity,
    allowancesToUse,
    name,
    expires,
    starts,
    verifyAuthorizedOnBehalf
  }: LockTokenParams
): Promise<TokenBalance> {
  const msg =
    `LockToken ${tokenInstanceKey.toStringKey()} of ${optionalOwner ?? "?"}, ` +
    `lockAuthority: ${lockAuthority}, allowancesToUse: ${allowancesToUse.length}`;
  ctx.logger.info(msg);

  if (!tokenInstanceKey.isFungible() && !quantity.isEqualTo(1)) {
    throw new NftInvalidQuantityLockError(quantity, tokenInstanceKey.toStringKey());
  }

  if (expires > 0 && expires < ctx.txUnixTime) {
    throw new InvalidExpirationError(expires);
  }

  // Get the token class
  const tokenClass = await fetchTokenClass(ctx, tokenInstanceKey);

  const decimalPlaces = quantity.decimalPlaces() ?? 0;
  if (decimalPlaces > tokenClass.decimals) {
    throw new InvalidDecimalError(quantity, tokenClass.decimals);
  }

  // Get the token instance
  const tokenInstance = await fetchTokenInstance(ctx, tokenInstanceKey);

  // Determine if user acts as a bridge
  const authorizedOnBehalf = await verifyAuthorizedOnBehalf(tokenInstanceKey.getTokenClassKey());
  const callingOnBehalf = authorizedOnBehalf?.callingOnBehalf ?? ctx.callingUser;

  // Determine actual owner of the token
  const owner = optionalOwner ?? callingOnBehalf;

  // If a user is trying to lock tokens on someone else's behalf, we need to verify and use allowances
  if (owner !== callingOnBehalf) {
    const msg = `LockToken executed on behalf of another user (fromPerson: ${owner}, callingUser: ${callingOnBehalf})`;
    ctx.logger.info(msg);

    // for initial support of fungible tokens, require owner to be the caller.
    if (tokenInstanceKey.isFungible()) {
      throw new NotImplementedError("LockToken is not supported for fungible tokens", {
        instanceKey: tokenInstanceKey.toStringKey()
      });
    }

    await verifyAndUseAllowances(
      ctx,
      owner,
      tokenInstanceKey,
      quantity,
      tokenInstance,
      callingOnBehalf,
      AllowanceType.Lock,
      allowancesToUse
    );
  }

  // Do the locking
  const balance = await fetchOrCreateBalance(ctx, owner, tokenInstanceKey);
  const hold = await TokenHold.createValid({
    createdBy: callingOnBehalf,
    instanceId: tokenInstance.instance,
    quantity: quantity,
    created: ctx.txUnixTime,
    expires: expires,
    name: name,
    lockAuthority,
    starts
  });

  if (tokenInstanceKey.isFungible()) {
    balance.ensureCanLockQuantity(hold).lock();
  } else {
    balance.ensureCanLockInstance(hold, ctx.txUnixTime).lock();
  }

  await putChainObject(ctx, balance);

  return balance;
}

export interface LockTokensParams {
  tokenInstances: TokenQuantity[];
  allowancesToUse: string[];
  name: string | undefined;
  lockAuthority: string | undefined;
  expires: number;
  verifyAuthorizedOnBehalf: (c: TokenClassKey) => Promise<AuthorizedOnBehalf | undefined>;
}

export async function lockTokens(
  ctx: GalaChainContext,
  {
    tokenInstances,
    allowancesToUse,
    name,
    lockAuthority,
    expires,
    verifyAuthorizedOnBehalf
  }: LockTokensParams
): Promise<TokenBalance[]> {
  const responses: Array<TokenBalance> = [];

  for (const { quantity, tokenInstanceKey, owner } of tokenInstances) {
    const updatedBalance = await lockToken(ctx, {
      owner,
      lockAuthority,
      tokenInstanceKey,
      quantity,
      allowancesToUse,
      name,
      expires,
      starts: undefined, // don't allow vesting locks on batch locking
      verifyAuthorizedOnBehalf: verifyAuthorizedOnBehalf
    });
    responses.push(updatedBalance);
  }

  return responses;
}

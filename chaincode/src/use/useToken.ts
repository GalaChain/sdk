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
  TokenHold,
  TokenInstanceKey,
  UserAlias
} from "@gala-chain/api";
import { BigNumber } from "bignumber.js";

import { verifyAndUseAllowances } from "../allowances";
import { fetchOrCreateBalance } from "../balances";
import { fetchTokenInstance } from "../token";
import { GalaChainContext } from "../types";
import { putChainObject } from "../utils";
import { NftInvalidQuantityUseError } from "./UseError";

export interface UseTokenParams {
  owner: UserAlias;
  inUseBy: UserAlias;
  tokenInstanceKey: TokenInstanceKey;
  quantity: BigNumber;
  allowancesToUse: string[];
  authorizedOnBehalf: AuthorizedOnBehalf | undefined;
}

export async function useToken(
  ctx: GalaChainContext,
  { owner, inUseBy, tokenInstanceKey, quantity, allowancesToUse, authorizedOnBehalf }: UseTokenParams
): Promise<TokenBalance> {
  const msg =
    `UseToken ${tokenInstanceKey.toStringKey()} of ${owner ?? "?"}, ` +
    `inUseBy: ${inUseBy}, allowancesToUse: ${allowancesToUse.length}`;
  ctx.logger.info(msg);

  if (tokenInstanceKey.isFungible()) {
    throw new NotImplementedError("UseToken is not supported for fungible tokens", {
      tokenInstanceKey: tokenInstanceKey.toStringKey()
    });
  }

  if (!quantity.isEqualTo(1)) {
    throw new NftInvalidQuantityUseError(quantity, tokenInstanceKey.toStringKey());
  }

  // Get the token instance
  const tokenInstance = await fetchTokenInstance(ctx, tokenInstanceKey);

  // Determine if user acts as a bridge
  const callingOnBehalf = authorizedOnBehalf?.callingOnBehalf ?? ctx.callingUser;

  // If a user is trying to use tokens on someone else's behalf, we need to verify and use allowances
  if (owner !== callingOnBehalf) {
    const msg = `UseToken executed on behalf of another user (fromPerson: ${owner}, callingUser: ${callingOnBehalf})`;
    ctx.logger.info(msg);

    await verifyAndUseAllowances(
      ctx,
      owner,
      tokenInstanceKey,
      quantity,
      tokenInstance,
      callingOnBehalf,
      AllowanceType.Use,
      allowancesToUse
    );
  }

  // Use token
  const balance = await fetchOrCreateBalance(ctx, owner, tokenInstanceKey.getTokenClassKey());
  const hold = await TokenHold.createValid({
    createdBy: callingOnBehalf,
    instanceId: tokenInstance.instance,
    quantity: quantity,
    created: ctx.txUnixTime,
    expires: 0,
    name: undefined,
    lockAuthority: undefined
  });

  balance.useInstance(hold, ctx.txUnixTime);

  await putChainObject(ctx, balance);

  return balance;
}

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
  TokenBalance,
  TokenInstanceKey,
  UserAlias
} from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { verifyAndUseAllowances } from "../allowances";
import { fetchOrCreateBalance } from "../balances";
import { InvalidDecimalError, fetchTokenClass, fetchTokenInstance } from "../token";
import { GalaChainContext } from "../types";
import { putChainObject } from "../utils";
import { SameSenderAndRecipientError } from "./TransferError";

export interface TransferTokenParams {
  from: UserAlias;
  to: UserAlias;
  tokenInstanceKey: TokenInstanceKey;
  quantity: BigNumber;
  allowancesToUse: string[];
  authorizedOnBehalf: AuthorizedOnBehalf | undefined;
}

export async function transferToken(
  ctx: GalaChainContext,
  { from, to, tokenInstanceKey, quantity, allowancesToUse, authorizedOnBehalf }: TransferTokenParams
): Promise<TokenBalance[]> {
  const msg =
    `TransferToken ${tokenInstanceKey.toStringKey()} from ${from ?? "?"} to ${to}, ` +
    `quantity: ${quantity.toFixed()}, allowancesToUse: ${allowancesToUse.length}.`;
  ctx.logger.info(msg);

  if (from === to) {
    throw new SameSenderAndRecipientError(from, to);
  }

  const tokenInstance = await fetchTokenInstance(ctx, tokenInstanceKey);
  const tokenClass = await fetchTokenClass(ctx, tokenInstanceKey);

  const decimalPlaces = quantity.decimalPlaces() ?? 0;
  if (decimalPlaces > tokenClass.decimals) {
    throw new InvalidDecimalError(quantity, tokenClass.decimals);
  }

  // Determine if user acts as a bridge
  const callingOnBehalf = authorizedOnBehalf?.callingOnBehalf ?? ctx.callingUser;

  // If a user is trying to transfer tokens on someone else's behalf, we need to verify and use allowances
  if (from !== callingOnBehalf) {
    const msg = `Transfer executed on behalf of another user (fromPerson: ${from}, callingUser: ${callingOnBehalf})`;
    ctx.logger.info(msg);

    await verifyAndUseAllowances(
      ctx,
      from,
      tokenInstanceKey,
      quantity,
      tokenInstance,
      callingOnBehalf,
      AllowanceType.Transfer,
      allowancesToUse
    );
  }

  const fromPersonBalance = await fetchOrCreateBalance(ctx, from, tokenInstanceKey);
  const toPersonBalance = await fetchOrCreateBalance(ctx, to, tokenInstanceKey);

  if (tokenInstance.isNonFungible) {
    fromPersonBalance.removeInstance(tokenInstance.instance, ctx.txUnixTime);
    toPersonBalance.addInstance(tokenInstance.instance);
  } else {
    fromPersonBalance.subtractQuantity(quantity, ctx.txUnixTime);
    toPersonBalance.addQuantity(quantity);
  }

  await putChainObject(ctx, fromPersonBalance);
  await putChainObject(ctx, toPersonBalance);

  if (tokenInstance.isNonFungible) {
    tokenInstance.owner = to;
    await putChainObject(ctx, tokenInstance);
  }

  return [fromPersonBalance, toPersonBalance];
}

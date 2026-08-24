/*
 * Copyright (c) Gala Games Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { TokenBalance, TokenClassKey, UserAlias } from "@gala-chain/api";

import { fetchTokenClass } from "../token";
import { GalaChainContext } from "../types";
import { putChainObject } from "../utils";
import { fetchOrCreateBalance } from "./fetchOrCreateBalance";

export interface TokenBalanceTargetsParams {
  user: UserAlias;
  tokenClass: TokenClassKey;
}

export interface RestrictTokenBalanceTargetsParams extends TokenBalanceTargetsParams {
  targets: UserAlias[];
}

async function loadBalance(
  ctx: GalaChainContext,
  { user, tokenClass }: TokenBalanceTargetsParams
): Promise<TokenBalance> {
  await fetchTokenClass(ctx, tokenClass);
  return fetchOrCreateBalance(ctx, user, tokenClass);
}

export async function restrictTokenBalanceTargets(
  ctx: GalaChainContext,
  { user, tokenClass, targets }: RestrictTokenBalanceTargetsParams
): Promise<TokenBalance> {
  const balance = await loadBalance(ctx, { user, tokenClass });
  balance.restrictTargets(targets, ctx.txUnixTime);
  await putChainObject(ctx, balance);
  return balance;
}

export async function allowAllTokenBalanceTargets(
  ctx: GalaChainContext,
  params: TokenBalanceTargetsParams
): Promise<TokenBalance> {
  const balance = await loadBalance(ctx, params);
  balance.allowAllTargets(ctx.txUnixTime);
  await putChainObject(ctx, balance);
  return balance;
}

export async function freezeTokenBalance(
  ctx: GalaChainContext,
  params: TokenBalanceTargetsParams
): Promise<TokenBalance> {
  const balance = await loadBalance(ctx, params);
  balance.freezeTargets();
  await putChainObject(ctx, balance);
  return balance;
}

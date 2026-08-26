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
import { TokenBalance, TokenClassKey } from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { fetchTokenClass } from "../token";
import { GalaChainContext } from "../types";
import { putChainObject } from "../utils";
import { fetchOrCreateBalance } from "./fetchOrCreateBalance";

export interface UpdateBalanceQuantityLimitParams {
  tokenClass: TokenClassKey;
  quantityLimit: BigNumber;
}

export async function updateBalanceQuantityLimit(
  ctx: GalaChainContext,
  { tokenClass, quantityLimit }: UpdateBalanceQuantityLimitParams
): Promise<TokenBalance> {
  const token = await fetchTokenClass(ctx, tokenClass);
  const balance = await fetchOrCreateBalance(ctx, ctx.callingUser, tokenClass);

  balance.setQuantityLimit(quantityLimit, ctx.txUnixTime, token.quantityLimit);

  await putChainObject(ctx, balance);

  return balance;
}

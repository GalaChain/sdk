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
import { ChainError, ErrorCode, TokenBalance, UserAlias } from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { getObjectsByPartialCompositeKey, takeUntilUndefined } from "../utils";
import { BalanceNotFoundError } from "./BalanceError";

export interface FetchBalancesParams {
  collection?: string;
  category?: string;
  type?: string;
  additionalKey?: string;
  owner: UserAlias;
}

/**
 * @description
 *
 * Query balances from on-chain World State using the provided parameters.
 * This function does not support pagination.
 *
 * Also see the `TokenBalance` definition, where its `ChainKey` properties
 * are defined.
 *
 * The `@ChainKeys` that make up the World State composite key are ordered,
 * and cannot be skipped when making partial composite key queries.
 * Be advised that broad queries can lead
 * to performance issues for large result sets.
 *
 * @param ctx
 * @param data
 * @returns Promise<TokenBalance[]>
 */
export async function fetchBalances(
  ctx: GalaChainContext,
  data: FetchBalancesParams
): Promise<TokenBalance[]> {
  const queryParams: Array<string> = takeUntilUndefined(
    data.owner,
    data.collection,
    data.category,
    data.type,
    data.additionalKey
  );

  const results = await getObjectsByPartialCompositeKey(
    ctx,
    TokenBalance.INDEX_KEY,
    queryParams,
    TokenBalance
  ).catch((e) => {
    throw ChainError.map(e, ErrorCode.NOT_FOUND, new BalanceNotFoundError(data.owner));
  });
  return results;
}

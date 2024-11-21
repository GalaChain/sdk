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
  ChainError,
  ChainObject,
  ErrorCode,
  FetchBalancesWithTokenMetadataResponse,
  TokenBalance,
  TokenBalanceWithMetadata,
  TokenClass,
  UserAlias,
  createValidDTO
} from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { getObjectByKey, getObjectsByPartialCompositeKeyWithPagination, takeUntilUndefined } from "../utils";
import { BalanceNotFoundError } from "./BalanceError";

export interface FetchBalancesWithTokenMetadataParams {
  collection?: string;
  category?: string;
  type?: string;
  additionalKey?: string;
  owner: UserAlias;
  bookmark?: string;
  limit?: number;
}

/**
 * @description
 *
 * Using the provided parameters, this function will first
 * query TokenBalance entries from on-chain World State.
 *
 * Next, for each `TokenBalance`, the corresponding `TokenClass`
 * will be fetched from the ledger.
 *
 * The `TokenBalance` and corresponding `TokenClass` for each
 * result will be combined into a results set, yielding a
 * response defined by the `FetchBalancesWithTokenMetadataResponse`
 * DTO class.
 *
 * This method supports pagination. For large results sets,
 * use the `bookmark` and `limit` parameters for subsequent
 * calls.
 *
 * @param ctx
 * @param data
 * @returns Promise<FetchBalancesWithTokenMetadataResponse>
 */
export async function fetchBalancesWithTokenMetadata(
  ctx: GalaChainContext,
  data: FetchBalancesWithTokenMetadataParams
): Promise<FetchBalancesWithTokenMetadataResponse> {
  const queryParams: Array<string> = takeUntilUndefined(
    data.owner,
    data.collection,
    data.category,
    data.type,
    data.additionalKey
  );

  const balancesLookup = await getObjectsByPartialCompositeKeyWithPagination(
    ctx,
    TokenBalance.INDEX_KEY,
    queryParams,
    TokenBalance,
    data.bookmark,
    data.limit
  ).catch((e) => {
    throw ChainError.map(e, ErrorCode.NOT_FOUND, new BalanceNotFoundError(data.owner));
  });

  const results: TokenBalanceWithMetadata[] = [];

  const balances = balancesLookup.results;

  for (const balance of balances) {
    const keyList = [balance.collection, balance.category, balance.type, balance.additionalKey];

    const compositeKey = ChainObject.getCompositeKeyFromParts(TokenClass.INDEX_KEY, keyList);
    const tokenClass: TokenClass = await getObjectByKey(ctx, TokenClass, compositeKey);

    const balanceWithTokenMetadata = await createValidDTO(TokenBalanceWithMetadata, {
      balance: balance,
      token: tokenClass
    });

    results.push(balanceWithTokenMetadata);
  }

  const response = await createValidDTO(FetchBalancesWithTokenMetadataResponse, {
    nextPageBookmark: balancesLookup.metadata.bookmark,
    results: results
  });

  return response;
}

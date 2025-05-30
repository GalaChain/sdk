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
  ErrorCode,
  NonFunctionProperties,
  TokenBalance,
  TokenClassKey,
  UserAlias
} from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { getObjectByKey } from "../utils";

/**
 * @description
 *
 * Query a single `TokenBalance` from on-chain World State
 * belonging to the provided `owner` for the specified
 * `tokenClassKey` argument.
 *
 * If the `TokenBalance` does not yet exist on-chain, a
 * new `TokenBalance` class instance will be instantiated
 * and returned.
 *
 * @param ctx
 * @param owner
 * @param tokenClassKey
 * @returns Promise<TokenBalance>
 */
export async function fetchOrCreateBalance(
  ctx: GalaChainContext,
  owner: UserAlias,
  tokenClassKey: NonFunctionProperties<TokenClassKey>
): Promise<TokenBalance> {
  const emptyBalance = new TokenBalance({ owner, ...tokenClassKey });

  const fetchedBalance = await getObjectByKey(ctx, TokenBalance, emptyBalance.getCompositeKey()).catch((e) =>
    ChainError.recover(e, ErrorCode.NOT_FOUND, emptyBalance)
  );

  await fetchedBalance.validateOrReject();

  return fetchedBalance;
}

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
import { ChainError, ErrorCode, NonFunctionProperties, TokenBalance, TokenClassKey } from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { getObjectByKey } from "../utils";

export async function fetchOrCreateBalance(
  ctx: GalaChainContext,
  owner: string,
  tokenClassKey: NonFunctionProperties<TokenClassKey>
): Promise<TokenBalance> {
  const emptyBalance = new TokenBalance({ owner, ...tokenClassKey });

  const fetchedBalance = await getObjectByKey(ctx, TokenBalance, emptyBalance.getCompositeKey()).catch((e) =>
    ChainError.ignore(e, ErrorCode.NOT_FOUND, emptyBalance)
  );

  await fetchedBalance.validateOrReject();

  return fetchedBalance;
}

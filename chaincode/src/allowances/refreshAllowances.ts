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
import { AllowanceKey, ChainObject, TokenAllowance } from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { GalaChainContext } from "../types";
import { getObjectByKey, putChainObject } from "../utils";
import { UnauthorizedAllowanceRefreshError } from "./AllowanceError";

interface AllowanceType {
  allowanceKey: AllowanceKey;
  uses: BigNumber;
  expires: number;
}

async function refreshAllowanceProperties(
  ctx: GalaChainContext,
  allowanceKey: AllowanceKey,
  uses: BigNumber,
  expires: number
): Promise<TokenAllowance> {
  const allowanceKeys: Array<string> = [
    allowanceKey.grantedTo,
    allowanceKey.collection,
    allowanceKey.category,
    allowanceKey.type,
    allowanceKey.additionalKey,
    allowanceKey.instance.toFixed(),
    allowanceKey.allowanceType.toString(),
    allowanceKey.grantedBy,
    allowanceKey.created.toString()
  ];

  const allowance: TokenAllowance = await getObjectByKey(
    ctx,
    TokenAllowance,
    ChainObject.getCompositeKeyFromParts(TokenAllowance.INDEX_KEY, allowanceKeys)
  );

  // This method supports update of uses or expiration date,
  // but not quantity, which would require more complex checks of
  // user TokenBalance for Lock/Use etc., and Token supply/capacity etc. for Mints.
  allowance.uses = uses;
  allowance.expires = expires;

  await putChainObject(ctx, allowance);

  return allowance;
}

export async function refreshAllowances(
  ctx: GalaChainContext,
  allowances: AllowanceType[]
): Promise<TokenAllowance[]> {
  const results: TokenAllowance[] = [];

  for (const allowance of allowances) {
    if (allowance.allowanceKey.grantedBy !== ctx.callingUser) {
      throw new UnauthorizedAllowanceRefreshError(ctx.callingUser, allowance.allowanceKey.grantedBy);
    }

    const update = await refreshAllowanceProperties(
      ctx,
      allowance.allowanceKey,
      allowance.uses,
      allowance.expires
    );

    results.push(update);
  }

  return results;
}

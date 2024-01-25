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
import { AllowanceType, FullAllowanceCheckResDto, TokenAllowance, TokenInstanceKey } from "@gala-chain/api";
import { TokenBalance } from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { getObjectsByPartialCompositeKey, takeUntilUndefined } from "../utils";

interface FullAllowanceCheckParams {
  owner: string;
  grantedTo: string;
  allowanceType: AllowanceType;
  collection?: string;
  category?: string;
  type?: string;
  additionalKey?: string;
}

export async function fullAllowanceCheck(
  ctx: GalaChainContext,
  data: FullAllowanceCheckParams
): Promise<FullAllowanceCheckResDto> {
  // PartialCompositeKey params in order for TokenBalance
  const queryParams: string[] = takeUntilUndefined(
    data.owner,
    data.collection,
    data.category,
    data.type,
    data.additionalKey
  );

  const balances: TokenBalance[] = await getObjectsByPartialCompositeKey(
    ctx,
    TokenBalance.INDEX_KEY,
    queryParams,
    TokenBalance,
    true // TODO: may lead to incomplete results
  );

  // For each relevant balance, fetch relevant allowance(s)
  const missing: TokenInstanceKey[] = [];

  for (const balance of balances) {
    for (const instanceId of balance.getNftInstanceIds()) {
      const allowanceParams: Array<string> = [
        data.grantedTo,
        balance.collection,
        balance.category,
        balance.type,
        balance.additionalKey,
        instanceId.toFixed(),
        data.allowanceType.toString(),
        data.owner
      ];

      const allowanceResults = await getObjectsByPartialCompositeKey(
        ctx,
        TokenAllowance.INDEX_KEY,
        allowanceParams,
        TokenAllowance,
        true // TODO: may lead to incomplete results
      );

      const expiredAllowances = allowanceResults.filter((allowance) => {
        return (
          allowance.usesSpent.isGreaterThanOrEqualTo(allowance.uses) ||
          allowance.quantitySpent.isGreaterThanOrEqualTo(allowance.quantity) ||
          (allowance.expires !== 0 && allowance.expires && allowance.expires <= ctx.txUnixTime)
        );
      });

      if (expiredAllowances.length === allowanceResults.length) {
        // i.e. no active, useable allowances. Record TokenInstanceKey.
        const tokenMissingAllowance = new TokenInstanceKey();
        tokenMissingAllowance.collection = balance.collection;
        tokenMissingAllowance.category = balance.category;
        tokenMissingAllowance.type = balance.type;
        tokenMissingAllowance.additionalKey = balance.additionalKey;
        tokenMissingAllowance.instance = instanceId;

        missing.push(tokenMissingAllowance);
      }
    }
  }

  const result = new FullAllowanceCheckResDto();

  if (missing.length > 0) {
    result.all = false;
    result.missing = missing;
  } else {
    result.all = true;
  }

  return result;
}

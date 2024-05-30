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
import { AllowanceType, TokenAllowance, TokenInstanceKey } from "@gala-chain/api";
import { BigNumber } from "bignumber.js";

import { FetchBalancesParams, fetchBalances } from "../balances";
import { GalaChainContext } from "../types";
import { DeleteOneAllowanceParams, deleteOneAllowance } from "./deleteAllowances";

function isAllowanceSpent(allowance: TokenAllowance): boolean {
  return (
    allowance.usesSpent.isGreaterThanOrEqualTo(allowance.uses) ||
    allowance.quantitySpent.isGreaterThanOrEqualTo(allowance.quantity)
  );
}

export function isAllowanceExpired(ctx: GalaChainContext, allowance: TokenAllowance): boolean {
  return allowance.expires !== 0 && allowance.expires !== undefined && allowance.expires <= ctx.txUnixTime;
}

async function doesGrantorHaveToken(ctx: GalaChainContext, allowance: TokenAllowance): Promise<boolean> {
  // This check is only for non-mint allowance types
  if (allowance.allowanceType === AllowanceType.Mint) return true;

  const balancesData: FetchBalancesParams = {
    owner: allowance.grantedBy,
    collection: allowance.collection,
    category: allowance.category,
    type: allowance.type,
    additionalKey: allowance.additionalKey
  };
  const balances = await fetchBalances(ctx, balancesData);
  return balances.length > 0;
}

async function isAllowanceInvalid(ctx: GalaChainContext, allowance: TokenAllowance): Promise<boolean> {
  return (
    isAllowanceSpent(allowance) ||
    isAllowanceExpired(ctx, allowance) ||
    !(await doesGrantorHaveToken(ctx, allowance))
  );
}

export async function cleanAllowances(
  ctx: GalaChainContext,
  allowancesToClean: TokenAllowance[],
  authorizedOnBehalf: string
): Promise<Array<TokenAllowance>> {
  const deleteActions: Array<Promise<void>> = [];

  for (let i = allowancesToClean.length - 1; i >= 0; i--) {
    const allowance = allowancesToClean[i];
    const isInvalid = await isAllowanceInvalid(ctx, allowance);
    if (isInvalid) {
      const deleteAllowanceParams: DeleteOneAllowanceParams = {
        grantedTo: allowance.grantedTo,
        grantedBy: allowance.grantedBy,
        collection: allowance.collection,
        category: allowance.category,
        type: allowance.type,
        additionalKey: allowance.additionalKey,
        instance: allowance.instance.toString(),
        allowanceType: allowance.allowanceType,
        created: allowance.created
      };

      deleteActions.push(deleteOneAllowance(ctx, deleteAllowanceParams, authorizedOnBehalf));
      deleteActions.push(ctx.stub.deleteState(allowance.getCompositeKey()));

      allowancesToClean.splice(i, 1);
    }
  }

  await Promise.all(deleteActions);

  return allowancesToClean;
}

// Check if a user has enough allowance to do a certain thing
export async function checkAllowances(
  ctx: GalaChainContext,
  applicableAllowances: TokenAllowance[],
  tokenInstanceKey: TokenInstanceKey,
  action: AllowanceType,
  callingOnBehalf: string
): Promise<BigNumber> {
  let totalAllowance: BigNumber = new BigNumber(0);

  const validAllowances = await cleanAllowances(ctx, applicableAllowances, callingOnBehalf);

  validAllowances.forEach((allowance: TokenAllowance) => {
    // Check if the token instance matches
    // Check if the action matches
    // Check if allowance is expired
    if (
      allowance.collection === tokenInstanceKey.collection &&
      allowance.category === tokenInstanceKey.category &&
      allowance.type === tokenInstanceKey.type &&
      allowance.additionalKey === tokenInstanceKey.additionalKey &&
      allowance.instance.isEqualTo(tokenInstanceKey.instance) &&
      allowance.allowanceType === action &&
      !isAllowanceExpired(ctx, allowance)
    ) {
      totalAllowance = totalAllowance.plus(allowance.quantity).minus(allowance.quantitySpent);
    }
  });

  // return a comparison of total allowance and the requested quantity
  return totalAllowance;
}

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
import { AllowanceType, TokenAllowance, TokenInstance, TokenInstanceKey } from "@gala-chain/api";
import { BigNumber } from "bignumber.js";

import { GalaChainContext } from "../types";
import { getObjectsByKeys } from "../utils";
import { AllowanceUsersMismatchError, InsufficientAllowanceError } from "./AllowanceError";
import { checkAllowances } from "./checkAllowances";
import { fetchAllowances } from "./fetchAllowances";
import { useAllowances } from "./useAllowances";

export async function verifyAndUseAllowances(
  ctx: GalaChainContext,
  grantedBy: string,
  tokenInstanceKey: TokenInstanceKey,
  quantity: BigNumber,
  tokenInstance: TokenInstance,
  authorizedOnBehalf: string,
  actionType: AllowanceType,
  useAllowancesArr: Array<string>
): Promise<boolean> {
  let applicableAllowances: TokenAllowance[];

  if (useAllowancesArr.length) {
    const fetchedAllowances = await getObjectsByKeys(ctx, TokenAllowance, useAllowancesArr);
    applicableAllowances = fetchedAllowances.filter(
      (a) =>
        a.allowanceType === actionType &&
        a.collection === tokenInstance.collection &&
        a.category === tokenInstance.category &&
        a.type === tokenInstance.type &&
        a.additionalKey === tokenInstance.additionalKey
    );

    // Verify grantedBy and grantedTo
    applicableAllowances.forEach((allowance) => {
      if (allowance.grantedBy !== grantedBy) {
        throw new AllowanceUsersMismatchError(allowance, grantedBy, authorizedOnBehalf);
      } else if (allowance.grantedTo !== authorizedOnBehalf) {
        throw new AllowanceUsersMismatchError(allowance, grantedBy, authorizedOnBehalf);
      }
    });
  } else {
    const applicableAllowanceResponse = await fetchAllowances(ctx, {
      grantedBy: grantedBy,
      grantedTo: authorizedOnBehalf,
      collection: tokenInstance.collection,
      category: tokenInstance.category,
      type: tokenInstance.type,
      additionalKey: tokenInstance.additionalKey,
      instance: tokenInstance.instance.toFixed(),
      allowanceType: actionType
    });

    applicableAllowances = applicableAllowanceResponse ?? [];
  }

  // verify allowance quantity
  const allowedQuantity = await checkAllowances(
    ctx,
    applicableAllowances,
    tokenInstanceKey,
    actionType,
    authorizedOnBehalf
  );

  if (quantity.isGreaterThan(allowedQuantity)) {
    throw new InsufficientAllowanceError(
      authorizedOnBehalf,
      allowedQuantity,
      actionType,
      quantity,
      tokenInstanceKey,
      grantedBy
    );
  }

  // Use allowances (which also creates claims)
  const useResult = await useAllowances(ctx, quantity, applicableAllowances);
  return useResult;
}

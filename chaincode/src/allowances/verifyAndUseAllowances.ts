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
import { InsufficientAllowanceError } from "./AllowanceError";
import { checkAllowances } from "./checkAllowances";
import { fetchAllowances } from "./fetchAllowances";
import { useAllowances } from "./useAllowances";

/**
 * @description
 *
 * Query allowances from World State using either composite keys or a
 * partial compomsite key query constructed from the provided paraemters,
 * ensuring that the provided `grantedBy` and `authorizedOnBehalf` paraemters
 * match the `TokenAllowance` `grantedBy` and `grantedTo` properties.
 *
 * Apply the remaining quantity of each applicable allowance to the total quantity.
 *
 * Return `true` after accounting for the full spend. Write a `TokenClaim` entry
 * for each allowance used.
 *
 * Throws an exception if the full quantity cannot be
 * met by the provided allowances.
 * @param ctx
 * @param grantedBy
 * @param tokenInstanceKey
 * @param quantity
 * @param tokenInstance
 * @param authorizedOnBehalf
 * @param actionType
 * @returns Promise<boolean>
 */
export async function verifyAndUseAllowances(
  ctx: GalaChainContext,
  grantedBy: string,
  tokenInstanceKey: TokenInstanceKey,
  quantity: BigNumber,
  tokenInstance: TokenInstance,
  authorizedOnBehalf: string,
  actionType: AllowanceType
): Promise<boolean> {
  // Auto-fetch allowances
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

  const applicableAllowances: TokenAllowance[] = applicableAllowanceResponse ?? [];

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
  const useResult = await useAllowances(ctx, quantity, applicableAllowances, actionType);
  return useResult;
}

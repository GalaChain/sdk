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
import { AllowanceType, TokenAllowance } from "@gala-chain/api";
import { ForbiddenError } from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { deleteChainObject } from "../utils";
import { fetchAllowances } from "./fetchAllowances";

export interface DeleteAllowancesParams {
  grantedTo: string;
  grantedBy?: string;
  collection?: string;
  category?: string;
  type?: string;
  additionalKey?: string;
  instance?: string;
  allowanceType?: AllowanceType;
}

class InvalidAllowanceUsersError extends ForbiddenError {
  constructor(grantedBy: string | undefined, grantedTo: string, callingUser: string) {
    const message = `Only the user who granted the allowance (${grantedBy}) or the user who is granted the allowance (${grantedTo}) can delete it. Called by ${callingUser}`;
    super(message, { grantedBy, grantedTo, callingUser });
  }
}

/**
 * @description
 *
 * Fetch all `TokenAllowance` chain objects that match the provided parameters, and
 * delete them from World State.
 *
 * Does not support paginated queries.
 *
 * @param ctx
 * @param params
 * @returns `Promise<number>`
 */
export async function deleteAllowances(
  ctx: GalaChainContext,
  params: DeleteAllowancesParams
): Promise<number> {
  if (params.grantedBy !== ctx.callingUser && params.grantedTo !== ctx.callingUser) {
    throw new InvalidAllowanceUsersError(params.grantedBy, params.grantedTo, ctx.callingUser);
  }

  const allowances = await fetchAllowances(ctx, params);

  await Promise.all(allowances.map((allowance) => deleteChainObject(ctx, allowance)));

  return allowances.length;
}

/**
 * @description
 *
 * Delete a single allowance specified by all `@ChainKey` properties.
 *
 * Fails if the `authorizedOnBehalf` agrument is neither the grantedBy nor grantedTo identity.
 *
 * @param ctx
 * @param allowance
 * @param authorizedOnBehalf
 */
export async function deleteOneAllowance(
  ctx: GalaChainContext,
  allowance: TokenAllowance,
  authorizedOnBehalf: string
): Promise<void> {
  if (allowance.grantedBy !== authorizedOnBehalf && allowance.grantedTo !== authorizedOnBehalf) {
    throw new InvalidAllowanceUsersError(allowance.grantedBy, allowance.grantedTo, authorizedOnBehalf);
  }

  await deleteChainObject(ctx, allowance);
}

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
import { ChainObject } from "@gala-chain/api";
import { ForbiddenError } from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { deleteChainObject, getObjectByKey } from "../utils";
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
  constructor(grantedBy: string | undefined, grantedTo: string) {
    super("Only the user who granted the allowance or the user who is granted the allowance can delete it", {
      grantedBy,
      grantedTo
    });
  }
}

export async function deleteAllowances(
  ctx: GalaChainContext,
  params: DeleteAllowancesParams
): Promise<number> {
  if (params.grantedBy !== ctx.callingUser && params.grantedTo !== ctx.callingUser) {
    throw new InvalidAllowanceUsersError(params.grantedBy, params.grantedTo);
  }

  const allowances = await fetchAllowances(ctx, params);

  await Promise.all(allowances.map((allowance) => deleteChainObject(ctx, allowance)));

  return allowances.length;
}

export interface DeleteOneAllowanceParams {
  grantedTo: string;
  grantedBy: string;
  collection: string;
  category: string;
  type: string;
  additionalKey: string;
  instance: string;
  allowanceType: AllowanceType;
  created: number;
}

export async function deleteOneAllowance(
  ctx: GalaChainContext,
  params: DeleteOneAllowanceParams,
  authorizedOnBehalf: string
): Promise<void> {
  if (params.grantedBy !== authorizedOnBehalf && params.grantedTo !== authorizedOnBehalf) {
    throw new InvalidAllowanceUsersError(params.grantedBy, params.grantedTo);
  }

  const allowance: TokenAllowance = await getObjectByKey(
    ctx,
    TokenAllowance,
    ChainObject.getCompositeKeyFromParts(TokenAllowance.INDEX_KEY, [
      params.grantedTo,
      params.collection,
      params.category,
      params.type,
      params.additionalKey,
      params.instance,
      params.allowanceType.toString(),
      params.grantedBy,
      params.created.toString()
    ])
  );

  await deleteChainObject(ctx, allowance);
}

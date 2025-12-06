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
import { ChainError, ErrorCode, FeeExemption, FeeGateCodes } from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { getObjectByKey } from "../utils";

export interface IExemptionForUser {
  user: string;
  feeCode: FeeGateCodes;
}

/**
 * @description
 *
 * Returns true if a given user is exempt from the given fee code.
 *
 * @param ctx
 * @param data
 * @returns Promise<boolean>
 */
export async function userExemptFromFees(ctx: GalaChainContext, data: IExemptionForUser): Promise<boolean> {
  const { user, feeCode } = data;

  const exemption: FeeExemption | ChainError = await getObjectByKey(
    ctx,
    FeeExemption,
    FeeExemption.getCompositeKeyFromParts(FeeExemption.INDEX_KEY, [user])
  ).catch((e) => ChainError.from(e));

  if (exemption instanceof ChainError && exemption.code !== ErrorCode.NOT_FOUND) {
    throw exemption;
  }

  if (exemption instanceof FeeExemption) {
    if (exemption.limitedTo === undefined || exemption.limitedTo?.includes(feeCode)) {
      // user is exempt from this fee, end any further fee gate processing
      return true;
    }
  }

  return false;
}

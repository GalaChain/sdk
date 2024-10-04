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
import { FeeThresholdUses } from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { GalaChainContext } from "../types";
import { getObjectsByKeys, putChainObject } from "../utils";

export interface ResetFeeThresholdUsesParams {
  chainKeys: string[];
}

/**
 * Use in conjucntion with `fetchFeeThresholdUses` to reset usage
 * thresholds recorded on-chain for indvidual identities.
 *
 * @remarks
 *
 * Designed for flexibility - channel oeprators might page through
 * results retrieved wtih `fetchFeeThresholdUses`, submit each
 * page's keys to this method, and effectively reset all
 * usage thresholds at a regular interval, say daily. Or specific
 * entry index keys can be provided to reset individual user
 * usage counts, as needed.
 *
 * @param ctx
 * @param data
 * @returns
 */
export async function resetFeeThresholdUses(
  ctx: GalaChainContext,
  data: ResetFeeThresholdUsesParams
): Promise<FeeThresholdUses[]> {
  const results = await getObjectsByKeys(ctx, FeeThresholdUses, data.chainKeys);

  for (const result of results) {
    result.cumulativeFeeQuantity = new BigNumber("0");
    result.cumulativeUses = new BigNumber("0");
    await putChainObject(ctx, result);
  }

  return results;
}

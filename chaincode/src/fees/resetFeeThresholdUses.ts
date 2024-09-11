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
import { GalaChainContext } from "../types";
import { getObjectsByKeys, putChainObject } from "../utils";
import BigNumber from "bignumber.js";

export interface ResetFeeThresholdUsesParams {
  chainKeys: string[];
}

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

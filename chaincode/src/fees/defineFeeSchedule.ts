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
import { GalaChainContext } from "../types";
import { putChainObject } from "../utils";
import { plainToInstance } from "class-transformer";

import { FeeCodeDefinition, FeeCodeDefinitionDto } from "@gala-chain/api";

export async function defineFeeSchedule(
  ctx: GalaChainContext,
  dto: FeeCodeDefinitionDto
): Promise<FeeCodeDefinition> {
  const {
    feeCode,
    feeThresholdUses,
    feeThresholdTimePeriod,
    baseQuantity,
    maxQuantity,
    feeAccelerationRateType,
    feeAccelerationRate,
    isCrossChannel
  } = dto;

  const feeCodeDef = plainToInstance(FeeCodeDefinition, {
    feeCode,
    feeThresholdUses,
    feeThresholdTimePeriod,
    baseQuantity,
    maxQuantity,
    feeAccelerationRateType,
    feeAccelerationRate,
    isCrossChannel
  });

  await putChainObject(ctx, feeCodeDef);

  return feeCodeDef;
}

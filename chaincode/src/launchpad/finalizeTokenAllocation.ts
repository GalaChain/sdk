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
import {
  FinalizeTokenAllocationDto,
  LaunchpadFinalizeFeeAllocation,
  PreConditionFailedError,
  UnauthorizedError
} from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { fetchLaunchpadFeeAddress, getObjectByKey, putChainObject } from "../utils";

export async function finalizeTokenAllocation(
  ctx: GalaChainContext,
  dto: FinalizeTokenAllocationDto
): Promise<LaunchpadFinalizeFeeAllocation> {
  const platformFeeAddress = await fetchLaunchpadFeeAddress(ctx);
  if (!platformFeeAddress) {
    throw new PreConditionFailedError(
      "Platform fee configuration has yet to be defined. Platform fee configuration is not defined."
    );
  } else if (!platformFeeAddress.authorities.includes(ctx.callingUser)) {
    throw new UnauthorizedError(`CallingUser ${ctx.callingUser} is not authorized to create or update`);
  }

  const key = ctx.stub.createCompositeKey(LaunchpadFinalizeFeeAllocation.INDEX_KEY, []);
  let feeAllocation = await getObjectByKey(ctx, LaunchpadFinalizeFeeAllocation, key).catch(() => undefined);

  if (!feeAllocation) {
    feeAllocation = new LaunchpadFinalizeFeeAllocation(dto.platformFeePercentage, dto.ownerFeePercentage);
  } else {
    feeAllocation.setAllocation(dto.platformFeePercentage, dto.ownerFeePercentage);
  }

  await putChainObject(ctx, feeAllocation);
  return feeAllocation;
}

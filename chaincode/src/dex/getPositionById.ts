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
import { DexPositionData, GetPositionByIdDto } from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { getObjectByKey } from "../utils";

/**
 * @dev Fetches the DexPositionData object using the provided positionId.
 * @param ctx - GalaChainContext – The execution context providing access to the GalaChain environment.
 * @param dto  GetPositionByIdDto - A data transfer object containing:
 - poolHash: The identifier of the liquidity pool.
 - tickUpper: The upper tick boundary of the position.
 - tickLower: The lower tick boundary of the position.
 - positionId: The unique identifier for the user's position.
 * @returns A Promise resolving to the DexPositionData instance.
 */

export async function getPositionById(
  ctx: GalaChainContext,
  dto: GetPositionByIdDto
): Promise<DexPositionData> {
  const Key = ctx.stub.createCompositeKey(DexPositionData.INDEX_KEY, [
    dto.poolHash,
    dto.tickUpper.toString(),
    dto.tickLower.toString(),
    dto.positionId
  ]);

  const position = getObjectByKey(ctx, DexPositionData, Key);

  return position;
}

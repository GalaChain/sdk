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
  ConflictError,
  NotFoundError,
  Pool,
  SetProtocolFeeDto,
  SetProtocolFeeResDto,
  UnauthorizedError
} from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { fetchPlatformFeeAddress, getObjectByKey, putChainObject, validateTokenOrder } from "../utils";

/**
 * @dev The setProtocolFee function updates the protocol fee percentage for a Uniswap V3 pool within the GalaChain ecosystem.
 * @param ctx GalaChainContext – The execution context providing access to the GalaChain environment.
 * @param dto SetProtocolFeeDto – A data transfer object containing:
  - Pool identifier – The specific pool where the protocol fee is being updated.
- fee value – The new protocol fee percentage, ranging from 0 to 1 (0% to 100%).
 * @returns New fee for the pool
 */
export async function setProtocolFee(
  ctx: GalaChainContext,
  dto: SetProtocolFeeDto
): Promise<SetProtocolFeeResDto> {
  const platformFeeAddress = await fetchPlatformFeeAddress(ctx);
  if (!platformFeeAddress) {
    throw new NotFoundError(
      "Protocol fee configuration has yet to be defined. Platform fee configuration is not defined."
    );
  } else if (!platformFeeAddress.authorities.includes(ctx.callingUser)) {
    throw new UnauthorizedError(`CallingUser ${ctx.callingUser} is not authorized to create or update`);
  }
  const [token0, token1] = validateTokenOrder(dto.token0, dto.token1);
  const key = ctx.stub.createCompositeKey(Pool.INDEX_KEY, [token0, token1, dto.fee.toString()]);
  const pool = await getObjectByKey(ctx, Pool, key);
  //If pool does not exist
  if (pool == undefined) throw new ConflictError("Pool does not exist");
  const newFee = pool.configureProtocolFee(dto.protocolFee);
  await putChainObject(ctx, pool);
  return new SetProtocolFeeResDto(newFee);
}

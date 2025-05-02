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
  ChainError,
  DexNftBatchLimit,
  DexNftBatchLimitDto,
  ErrorCode,
  UnauthorizedError
} from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { getObjectByKey, putChainObject } from "../utils";

/**
 * @description Updates and sets the maximum supply limit for Liquidity NFT batches.
 *              Only users from the curator organization are authorized to perform this action.
 *
 * @param {GalaChainContext} ctx - The blockchain context containing user identity and state access.
 * @param {DexNftBatchLimitDto} dto - The data transfer object containing the new maximum supply limit.
 *
 * @returns {Promise<DexNftBatchLimit>} - The updated NFT batch limit.
 */
export async function configureDexNftBatchLimit(
  ctx: GalaChainContext,
  dto: DexNftBatchLimitDto
): Promise<DexNftBatchLimit> {
  const curatorOrgMsp = process.env.CURATOR_ORG_MSP ?? "CuratorOrg";

  if (ctx.clientIdentity.getMSPID() !== curatorOrgMsp) {
    throw new UnauthorizedError(`CallingUser ${ctx.callingUser} is not authorized to create or update`);
  }

  const key = ctx.stub.createCompositeKey(DexNftBatchLimit.INDEX_KEY, []);
  let nftBatchLimit = await getObjectByKey(ctx, DexNftBatchLimit, key).catch((e) => {
    const chainError = ChainError.from(e);
    if (chainError.matches(ErrorCode.NOT_FOUND)) {
      return undefined;
    } else {
      throw chainError;
    }
  });

  if (!nftBatchLimit) {
    nftBatchLimit = new DexNftBatchLimit(dto.newMaxSupply);
  } else {
    nftBatchLimit.setMaxSupply(dto.newMaxSupply);
  }

  await putChainObject(ctx, nftBatchLimit);

  return nftBatchLimit;
}

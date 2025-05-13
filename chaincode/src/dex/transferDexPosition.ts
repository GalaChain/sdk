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
import { DexPositionOwner, NotFoundError, Pool, TransferDexPositionDto } from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { getObjectByKey, putChainObject } from "../utils";
import { getUserPositionIds } from "./dexUtils";

export async function transferDexPosition(
  ctx: GalaChainContext,
  dto: TransferDexPositionDto
): Promise<DexPositionOwner> {
  const key = ctx.stub.createCompositeKey(Pool.INDEX_KEY, [
    dto.token0.toString(),
    dto.token1.toString(),
    dto.fee.toString()
  ]);

  const pool = await getObjectByKey(ctx, Pool, key);
  const poolHash = pool.genPoolHash();

  const senderpositionsID = await getUserPositionIds(ctx, ctx.callingUser, poolHash);
  const fetchedTickRange = senderpositionsID.getTickRangeByPositionId(dto.positionId);

  if (!fetchedTickRange) {
    throw new NotFoundError(
      `${ctx.callingUser} does not hold hold any position for given ${dto.positionId} for this pool`
    );
  }

  senderpositionsID.removePosition(fetchedTickRange, dto.positionId);

  await putChainObject(ctx, senderpositionsID);

  //Add Recepients position
  const recipientPositions = await getObjectByKey(
    ctx,
    DexPositionOwner,
    new DexPositionOwner(dto.toAddress, poolHash).getCompositeKey()
  ).catch(() => new DexPositionOwner(dto.toAddress, poolHash));

  recipientPositions.addPosition(fetchedTickRange, dto.positionId);

  await putChainObject(ctx, recipientPositions);

  return recipientPositions;
}

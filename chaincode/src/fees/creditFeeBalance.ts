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
  ChainCallDTO,
  ChainObject,
  FeeAuthorizationDto,
  FeeAuthorizationResDto,
  FeePendingBalance,
  FeeVerificationDto,
  UnauthorizedError,
  ValidationFailedError
} from "@gala-chain/api";
import BigNumber from "bignumber.js";
import { plainToClass as plainToInstance } from "class-transformer";

import { ensureIsAuthenticatedBy } from "../contracts";
import { GalaChainContext } from "../types";
import { getObjectByKey, putChainObject } from "../utils";

/**
 * @description
 *
 * For Cross-Channel Fees. Executed by an authorized channel identity.
 * This action records a pending authorization of $GALA to cover
 * in-channel fees. The pending balance represent a previously-burned
 * quantity of $GALA authorized on GalaChain's asset channel.
 *
 * This method is intended to be executed on secondary/external channels,
 * where users do not hold a $GALA balance within the channel's on-chain
 * World State. An authoriative channel identity is expected to
 * call this method, effectively verifying the burn from the asset channel
 * and asserting that validation on-chain within the secondary channel.
 *
 * This is the second phase in the two phase cross-channel flow. The
 * first phase is executed by an end user identity on GalaChain's asset
 * channel, using the `AuthorizeFee` method defined
 * on the `GalaChainFeeContract`.
 *
 * @param ctx
 * @param dto
 * @returns
 */
export async function creditFeeBalance(
  ctx: GalaChainContext,
  dto: FeeVerificationDto
): Promise<FeeAuthorizationResDto> {
  const { authorization, authority, quantity, feeAuthorizationKey } = dto;

  const authzDto: FeeAuthorizationDto = ChainCallDTO.deserialize(FeeAuthorizationDto, authorization);

  await ensureIsAuthenticatedBy(ctx, authzDto, authzDto.authority, undefined);

  if (authority !== authzDto.authority) {
    throw new UnauthorizedError(
      `FeeVerificationDto.authority (${authority} !== FeeAuthorizationDto.authority (${authzDto.authority}))`
    );
  }

  if (!quantity.isEqualTo(authzDto.quantity)) {
    throw new ValidationFailedError(
      `FeeVerificationDto.quantity ${quantity.toString()} !== FeeAuthorizationDto.quantity (${authzDto.quantity.toString()})`
    );
  }

  const userPendingAuthorizationBalanceChainKeys = [authority];

  const userPendingAuthorizationBalanceChainKey = ChainObject.getCompositeKeyFromParts(
    FeePendingBalance.INDEX_KEY,
    userPendingAuthorizationBalanceChainKeys
  );

  const existingBalance = await getObjectByKey(
    ctx,
    FeePendingBalance,
    userPendingAuthorizationBalanceChainKey
  ).catch(() => undefined);

  const userPendingAuthorizationBalance =
    existingBalance ??
    plainToInstance(FeePendingBalance, {
      owner: authority,
      quantity: new BigNumber("0"),
      created: ctx.txUnixTime
    });

  const existingQuantity = userPendingAuthorizationBalance.quantity;

  userPendingAuthorizationBalance.quantity = quantity.plus(existingQuantity);

  await putChainObject(ctx, userPendingAuthorizationBalance);

  const created = ctx.txUnixTime;
  const txId = ctx.stub.getTxID();

  const res = plainToInstance(FeeAuthorizationResDto, {
    authority,
    authorization,
    created,
    txId,
    quantity,
    feeAuthorizationKey
  });

  return res;
}

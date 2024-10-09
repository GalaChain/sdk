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
  BurnTokenQuantity,
  ChainError,
  ErrorCode,
  FeeAuthorization,
  FeeAuthorizationDto,
  FeeAuthorizationResDto,
  FeeProperties,
  TokenInstanceKey,
  UnauthorizedError,
  createValidDTO
} from "@gala-chain/api";
import { plainToClass as plainToInstance } from "class-transformer";

import { burnTokens } from "../burns";
import { GalaChainContext } from "../types";
import { putChainObject } from "../utils";
import { txUnixTimeToDateIndexKeys } from "../utils";
import { fetchGalaFeeProperties } from "./galaFeeProperties";

/**
 * @description
 *
 * For Cross-Channel Fees. Executed by an end user in GalaChain's
 * asset channel where the $GALA token is defined. This action
 * burns $GALA on the assets channel and writes a `FeeAuthorization` record
 * to chain.
 *
 * `FeeAuthorization` entries recorded in the ledger of the assets channel
 * represent a burn intended to cover a fee in a different channel.
 *
 * This is the first phase in the two phase cross-channel flow. The second phase
 * invovles an authorized channel authority executing `CreditFeeBalance` on the
 * cross-channel with the resulting details of a successful `authorizeFee` call.
 *
 * @param ctx
 * @param dto
 * @returns Promise<FeeAuthorizationResDto>
 */
export async function authorizeFee(
  ctx: GalaChainContext,
  dto: FeeAuthorizationDto
): Promise<FeeAuthorizationResDto> {
  const authorizingUser = ctx.callingUser;

  if (authorizingUser !== dto.authority) {
    throw new UnauthorizedError(
      `ctx.callingUser (${authorizingUser} !== FeeAuthorizationDto.authority (${dto.authority}))`
    );
  }

  const feeTokenProperties = await fetchGalaFeeProperties(ctx);

  if (feeTokenProperties instanceof ChainError && feeTokenProperties.code === ErrorCode.NOT_FOUND) {
    // if the feeToken is not defined, no fee can be charged
    throw feeTokenProperties;
  }

  const { collection, category, type, additionalKey, instance } = feeTokenProperties as FeeProperties;
  const galaCurrencyKey: TokenInstanceKey = plainToInstance(TokenInstanceKey, {
    collection,
    category,
    type,
    additionalKey,
    instance
  });

  const burnQuantity: BurnTokenQuantity = {
    quantity: dto.quantity,
    tokenInstanceKey: galaCurrencyKey
  };

  await burnTokens(ctx, {
    owner: authorizingUser,
    toBurn: [burnQuantity]
  });

  const authority = authorizingUser;
  const { quantity } = dto;
  const created = ctx.txUnixTime;
  const txId = ctx.stub.getTxID();

  const { year, month, day } = txUnixTimeToDateIndexKeys(ctx.txUnixTime);

  const authorizationRecord: FeeAuthorization = plainToInstance(FeeAuthorization, {
    authority,
    year,
    month,
    day,
    txId,
    quantity
  });

  await putChainObject(ctx, authorizationRecord);

  const feeAuthorizationKey = FeeAuthorization.getStringKeyFromParts([authority, year, month, day, txId]);

  const authorization = dto.serialize();

  const res: FeeAuthorizationResDto = await createValidDTO(FeeAuthorizationResDto, {
    authorization,
    authority,
    created,
    txId,
    quantity,
    feeAuthorizationKey
  });

  return res;
}

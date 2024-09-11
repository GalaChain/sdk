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
import { GalaChainContext } from "../types";
import { burnTokens } from "../burns";
import { putChainObject } from "../utils";
import { plainToClass as plainToInstance } from "class-transformer";

import { txUnixTimeToDateIndexKeys } from "../utils";
import { fetchGalaFeeProperties } from "./galaFeeProperties";

export async function authorizeFee(ctx: GalaChainContext, dto: FeeAuthorizationDto) {
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

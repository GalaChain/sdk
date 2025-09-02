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
  FeeAuthorization,
  FeeAuthorizationDto,
  FeeAuthorizationResDto,
  FeeProperties,
  GalaChainResponse,
  TokenBalance,
  TokenClass,
  TokenInstance,
  createValidDTO
} from "@gala-chain/api";
import { currency, fixture, randomUser, users } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";
import { randomUUID } from "crypto";

import { GalaChainFeeContract } from "../__test__/GalaChainFeeContract";
import { txUnixTimeToDateIndexKeys } from "../utils";

describe("authorizeFee", () => {
  it("should allow users to authorize fee exenditures in $GALA", async () => {
    // Given
    const currencyInstance: TokenInstance = currency.tokenInstance();
    const currencyClass: TokenClass = currency.tokenClass();
    const userBalance: TokenBalance = currency.tokenBalance();
    const authorizedFeeQuantity = new BigNumber("100");

    const { collection, category, type, additionalKey, instance } = currencyInstance;
    const feeProperties: FeeProperties = plainToInstance(FeeProperties, {
      id: "galachain",
      collection,
      category,
      type,
      additionalKey,
      instance
    });

    const { ctx, contract } = fixture(GalaChainFeeContract)
      .registeredUsers(users.testUser1)
      .savedState(feeProperties, currencyInstance, currencyClass, userBalance);

    const dto = await createValidDTO(FeeAuthorizationDto, {
      authority: users.testUser1.identityKey,
      quantity: authorizedFeeQuantity,
      uniqueKey: randomUUID()
    }).signed(users.testUser1.privateKey);

    // When
    const response = await contract.AuthorizeFee(ctx, dto);

    // Then
    const { year, month, day } = txUnixTimeToDateIndexKeys(ctx.txUnixTime);
    const txId = ctx.stub.getTxID();
    const feeAuthorizationKey = FeeAuthorization.getStringKeyFromParts([
      users.testUser1.identityKey,
      year,
      month,
      day,
      txId
    ]);
    const resDto = plainToInstance(FeeAuthorizationResDto, {
      authority: dto.authority,
      quantity: dto.quantity,
      authorization: dto.signed(users.testUser1.privateKey, false).serialize(),
      feeAuthorizationKey: feeAuthorizationKey,
      created: ctx.txUnixTime,
      txId: txId
    });

    expect(response).toEqual(GalaChainResponse.Success(resDto));
  });
});

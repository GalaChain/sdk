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
  ChainKey,
  ChainObject,
  FeeAuthorization,
  FeeAuthorizationDto,
  FeeAuthorizationResDto,
  FeeVerificationDto,
  GalaChainResponse,
  TokenBalance,
  TokenClass,
  TokenInstance,
  createValidDTO
} from "@gala-chain/api";
import { currency, fixture, users } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToClass as plainToInstance } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";
import { randomUUID } from "crypto";
import { Wallet } from "ethers";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { GalaChainContext } from "../types";
import { txUnixTimeToDateIndexKeys } from "../utils";

// todo: temporarily defining this here, because .savedState() fails with:
// `getCompositeKey failed because of no INDEX_KEY on {"publicKey":"<value>"}
// PublicKey does not define INDEX_KEY on the class in @galachain/common-api,
// nor ChainKeys, so our fixture / mocks are not setup yet to mock these as savedState.
// see mockDirectState added to fixture... needs a way to intuit the key still.
class TestPublicKey extends ChainObject {
  public static INDEX_KEY = "GCPK";

  @ChainKey({ position: 0 })
  public userId: string;

  @IsString()
  @IsNotEmpty()
  public publicKey: string;
}

describe("creditFeeBalance", () => {
  it("should record fee authorizations to a FeePendingBalance", async () => {
    // Given
    const currencyInstance: TokenInstance = currency.tokenInstance();
    const currencyClass: TokenClass = currency.tokenClass();
    const userBalance: TokenBalance = currency.tokenBalance();
    const authorizedFeeQuantity = new BigNumber("100");

    const { privateKey, publicKey } = Wallet.createRandom();

    const authDto = await createValidDTO(FeeAuthorizationDto, {
      authority: users.testUser1Id,
      quantity: authorizedFeeQuantity,
      uniqueKey: randomUUID()
    });

    authDto.sign(privateKey, true);

    const savedPublicKey = new TestPublicKey();
    savedPublicKey.publicKey = publicKey; // PublicKeyService.normalizePublicKey(publicKey)
    savedPublicKey.userId = users.testUser1Id;
    const priorTimeStamp = 1693003573844;

    const { year, month, day } = txUnixTimeToDateIndexKeys(priorTimeStamp);
    const txId = "testTxId";

    const feeAuth = plainToInstance(FeeAuthorization, {
      authority: users.testUser1Id,
      year,
      month,
      day,
      quantity: authorizedFeeQuantity,
      txId: txId
    });

    const { ctx, contract, writes, callingChainUser } = fixture<GalaChainContext, GalaChainTokenContract>(
      GalaChainTokenContract
    )
      .callingUser(users.testUser1Id)
      .savedState(currencyInstance, currencyClass, userBalance, feeAuth, savedPublicKey)
      .savedRangeState([]);

    const feeAuthorizationKey = FeeAuthorization.getStringKeyFromParts([
      users.testUser1Id,
      year,
      month,
      day,
      txId
    ]);

    const verificationDto = await createValidDTO(FeeVerificationDto, {
      authorization: authDto.serialize(),
      ...authDto,
      created: priorTimeStamp,
      txId: txId,
      quantity: authorizedFeeQuantity,
      feeAuthorizationKey: feeAuthorizationKey,
      uniqueKey: randomUUID()
    });

    verificationDto.sign(callingChainUser.privateKey, false);

    // When
    const response = await contract.CreditFeeBalance(ctx, verificationDto);

    // Then
    const resDto = await createValidDTO(FeeAuthorizationResDto, {
      authority: users.testUser1Id,
      authorization: authDto.serialize(),
      created: ctx.txUnixTime,
      txId: ctx.stub.getTxID(),
      quantity: authorizedFeeQuantity,
      feeAuthorizationKey: feeAuthorizationKey
    });

    expect(response).toEqual(GalaChainResponse.Success(resDto));
  });
});

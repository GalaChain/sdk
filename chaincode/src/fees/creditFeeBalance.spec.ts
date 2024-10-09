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
  createValidChainObject,
  createValidDTO,
  createValidSubmitDTO
} from "@gala-chain/api";
import { currency, fixture, randomUser, users } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { IsNotEmpty, IsString } from "class-validator";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
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

    const feeAuthority = randomUser("client|fee-authority");

    const authDto = await createValidSubmitDTO(FeeAuthorizationDto, {
      authority: feeAuthority.identityKey,
      quantity: authorizedFeeQuantity,
      signerPublicKey: feeAuthority.publicKey
    });
    authDto.sign(feeAuthority.privateKey, true);

    const savedPublicKey = new TestPublicKey();
    savedPublicKey.publicKey = feeAuthority.publicKey;
    savedPublicKey.userId = feeAuthority.identityKey;

    const priorTimeStamp = 1693003573844;

    const { year, month, day } = txUnixTimeToDateIndexKeys(priorTimeStamp);
    const txId = "testTxId";

    const feeAuth = await createValidChainObject(FeeAuthorization, {
      authority: feeAuthority.identityKey,
      year,
      month,
      day,
      quantity: authorizedFeeQuantity,
      txId: txId
    });

    const { ctx, contract } = fixture(GalaChainTokenContract)
      .caClientIdentity("client|admin", "CuratorOrg")
      .registeredUsers(users.testUser1, feeAuthority)
      .savedState(currencyInstance, currencyClass, userBalance, feeAuth, savedPublicKey);

    const feeAuthorizationKey = FeeAuthorization.getStringKeyFromParts([
      users.testUser1.identityKey,
      year,
      month,
      day,
      txId
    ]);

    const verificationDto = await createValidSubmitDTO(FeeVerificationDto, {
      authorization: authDto.serialize(),
      authority: feeAuthority.identityKey,
      created: priorTimeStamp,
      txId: txId,
      quantity: authorizedFeeQuantity,
      feeAuthorizationKey: feeAuthorizationKey
    }).signed(users.testUser1.privateKey);

    // When
    const response = await contract.CreditFeeBalance(ctx, verificationDto);

    // Then
    const resDto = await createValidDTO(FeeAuthorizationResDto, {
      authority: feeAuthority.identityKey,
      authorization: authDto.serialize(),
      created: ctx.txUnixTime,
      txId: ctx.stub.getTxID(),
      quantity: authorizedFeeQuantity,
      feeAuthorizationKey: feeAuthorizationKey
    });

    expect(response).toEqual(GalaChainResponse.Success(resDto));
  });
});

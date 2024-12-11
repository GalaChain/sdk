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
  AcceptLoanOfferDto,
  AllowanceType,
  GalaChainResponse,
  Loan,
  LoanAgreement,
  LoanClosedBy,
  LoanOffer,
  LoanStatus,
  TokenAllowance,
  TokenBalance,
  TokenHold,
  asValidUserAlias,
  createValidChainObject,
  createValidSubmitDTO
} from "@gala-chain/api";
import { fixture, nft, users, writesMap } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToClass as plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";

describe("AcceptLoanOffer", () => {
  test("AcceptLoanOffer permits registrar to facilitate Loan on behalf of borrower", async () => {
    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();

    const tokenBalance = nft.tokenBalance((b) => ({ ...b, owner: users.admin.identityKey }));

    const offer = plainToInstance(LoanOffer, {
      ...nftInstanceKey,
      instance: new BigNumber("1"),
      owner: users.admin.identityKey,
      created: 1,
      id: 0,
      registrar: users.admin.identityKey,
      reward: undefined,
      status: LoanStatus.Open,
      uses: new BigNumber("10"),
      usesSpent: new BigNumber("0"),
      expires: 0
    });

    const registrarLockAllowance = plainToInstance(TokenAllowance, {
      quantitySpent: new BigNumber("1"),
      usesSpent: new BigNumber("1"),
      expires: 0,
      grantedTo: users.admin.identityKey,
      ...nftInstanceKey,
      instance: new BigNumber("23"),
      allowanceType: AllowanceType.Lock,
      quantity: new BigNumber("1"),
      grantedBy: users.tokenHolder.identityKey,
      created: 1,
      uses: new BigNumber("10")
    });

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.admin, users.tokenHolder, users.testUser1)
      .savedState(nftClass, nftInstance, tokenBalance, offer, registrarLockAllowance);

    const dto = (
      await createValidSubmitDTO(AcceptLoanOfferDto, {
        offer: offer.getCompositeKey(),
        borrower: asValidUserAlias(users.testUser1.identityKey),
        token: nftInstanceKey
      })
    ).signed(users.admin.privateKey);

    const registrarLockHold = new TokenHold({
      createdBy: users.admin.identityKey,
      instanceId: new BigNumber("1"),
      quantity: new BigNumber("1"),
      created: ctx.txUnixTime,
      lockAuthority: users.admin.identityKey,
      expires: 0
    });

    const loan = await createValidChainObject(Loan, {
      registrar: users.admin.identityKey,
      ...nftInstanceKey,
      instance: new BigNumber("1"),
      start: ctx.txUnixTime,
      end: 0,
      owner: users.admin.identityKey,
      borrower: users.testUser1.identityKey,
      status: LoanStatus.Open,
      closedBy: LoanClosedBy.Unspecified
    });

    const loanAgreement = await createValidChainObject(LoanAgreement, {
      borrower: users.testUser1.identityKey,
      created: ctx.txUnixTime,
      loan: loan.getCompositeKey(),
      offer: offer.getCompositeKey(),
      owner: users.admin.identityKey
    });

    const expectedOwnerBalance: TokenBalance = plainToInstance(TokenBalance, {
      ...tokenBalance,
      lockedHolds: [registrarLockHold]
    });

    const expectedOffer: LoanOffer = await createValidChainObject(LoanOffer, {
      ...offer,
      usesSpent: new BigNumber(1)
    });
    const expectedLoan: Loan = await createValidChainObject(Loan, { ...loan, status: LoanStatus.Contracted });

    // When
    const response = await contract.AcceptLoanOffer(ctx, dto);

    // Then
    expect(response).toEqual(GalaChainResponse.Success(expectedLoan));
    expect(getWrites()).toEqual(writesMap(expectedOwnerBalance, expectedOffer, expectedLoan, loanAgreement));
  });
});

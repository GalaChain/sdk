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
  CloseLoanDto,
  GalaChainResponse,
  InvalidClosingStatusError,
  Loan,
  LoanCloseForbiddenUserError,
  LoanClosedBy,
  LoanStatus,
  MissingLoanError,
  createValidChainObject,
  createValidDTO
} from "@gala-chain/api";
import { fixture, nft, users, writesMap } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToClass as plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";

describe("CloseLoan", () => {
  test("Registrar can close Fulfilled loan on behalf of borrower.", async () => {
    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();

    const tokenBalance = nft.tokenBalance((b) => ({
      ...b,
      owner: users.tokenHolder.identityKey
    }));

    const loan = plainToInstance(Loan, {
      registrar: users.admin.identityKey,
      ...nftInstanceKey,
      instance: new BigNumber("1"),
      start: 1,
      end: 0,
      owner: users.tokenHolder.identityKey,
      borrower: users.testUser1.identityKey,
      status: LoanStatus.Open,
      closedBy: LoanClosedBy.Registrar
    });

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.admin)
      .savedState(nftClass, nftInstance, tokenBalance, loan);

    const dto = (
      await createValidDTO(CloseLoanDto, {
        loan: loan.getCompositeKey(),
        status: LoanStatus.Fulfilled,
        uniqueKey: "unique-key"
      })
    ).signed(users.admin.privateKey);

    // When
    const res = await contract.CloseLoan(ctx, dto);

    // Then
    const fulfilledLoan = plainToInstance(Loan, { ...loan, status: LoanStatus.Fulfilled });
    expect(res).toEqual(GalaChainResponse.Success(fulfilledLoan));
    expect(getWrites()).toEqual(writesMap(fulfilledLoan));
  });

  test("Owner can close Fulfilled loan that they offered.", async () => {
    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();

    const tokenBalance = nft.tokenBalance((b) => ({
      ...b,
      owner: users.tokenHolder.identityKey
    }));

    const loan = plainToInstance(Loan, {
      registrar: users.admin.identityKey,
      ...nftInstanceKey,
      instance: new BigNumber("1"),
      start: 1,
      end: 0,
      owner: users.tokenHolder.identityKey,
      borrower: users.testUser1.identityKey,
      status: LoanStatus.Open,
      closedBy: LoanClosedBy.Owner
    });

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.admin, users.tokenHolder, users.testUser1)
      .savedState(nftClass, nftInstance, tokenBalance, loan);

    const dto = (
      await createValidDTO(CloseLoanDto, {
        loan: loan.getCompositeKey(),
        status: LoanStatus.Fulfilled,
        uniqueKey: "unique-key"
      })
    ).signed(users.tokenHolder.privateKey);

    // When
    const res = await contract.CloseLoan(ctx, dto);

    // Then
    expect(res).toEqual(
      GalaChainResponse.Success(plainToInstance(Loan, { ...loan, status: LoanStatus.Fulfilled }))
    );
    expect(getWrites()).toEqual(writesMap(plainToInstance(Loan, { ...loan, status: LoanStatus.Fulfilled })));
  });

  test("users.attacker cannot close a loan without authority.", async () => {
    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();

    const tokenBalance = nft.tokenBalance((b) => ({
      ...b,
      owner: users.tokenHolder.identityKey
    }));

    const loan = plainToInstance(Loan, {
      registrar: users.admin.identityKey,
      ...nftInstanceKey,
      instance: new BigNumber("1"),
      start: 1,
      end: 0,
      owner: users.admin.identityKey,
      borrower: users.testUser1.identityKey,
      status: LoanStatus.Open,
      closedBy: LoanClosedBy.Unspecified
    });

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.attacker, users.admin, users.testUser1)
      .savedState(nftClass, nftInstance, tokenBalance, loan);

    const dto = (
      await createValidDTO(CloseLoanDto, {
        loan: loan.getCompositeKey(),
        status: LoanStatus.Fulfilled,
        uniqueKey: "unique-key"
      })
    ).signed(users.attacker.privateKey);

    // When
    const res = await contract.CloseLoan(ctx, dto);

    // Then
    expect(res).toEqual(
      GalaChainResponse.Error(
        new LoanCloseForbiddenUserError(users.attacker.identityKey, dto.loan, loan.owner, loan.registrar)
      )
    );
    expect(getWrites()).toEqual({});
  });

  test("CloseLoan errors if loan is not found on chain", async () => {
    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();

    const tokenBalance = nft.tokenBalance((b) => ({
      ...b,
      owner: users.tokenHolder.identityKey
    }));

    const loan = plainToInstance(Loan, {
      registrar: users.admin.identityKey,
      ...nftInstanceKey,
      instance: new BigNumber("1"),
      start: 1,
      end: 0,
      owner: users.admin.identityKey,
      borrower: users.testUser1.identityKey,
      status: LoanStatus.Open,
      closedBy: LoanClosedBy.Unspecified
    });

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.admin, users.attacker, users.testUser1)
      .savedState(nftClass, nftInstance, tokenBalance);

    const dto = (
      await createValidDTO(CloseLoanDto, {
        loan: loan.getCompositeKey(),
        status: LoanStatus.Fulfilled,
        uniqueKey: "unique-key"
      })
    ).signed(users.attacker.privateKey);

    // When
    const res = await contract.CloseLoan(ctx, dto).catch((e) => e);

    // Then
    expect(res).toEqual(GalaChainResponse.Error(new MissingLoanError(users.attacker.identityKey, dto.loan)));
    expect(getWrites()).toEqual({});
  });

  test("CloseLoan errors if dto requests Open or Any LoanStatus", async () => {
    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();

    const tokenBalance = nft.tokenBalance((b) => ({
      ...b,
      owner: users.tokenHolder.identityKey
    }));

    const loan = await createValidChainObject(Loan, {
      registrar: users.admin.identityKey,
      ...nftInstanceKey,
      instance: new BigNumber("1"),
      start: 1,
      end: 0,
      owner: users.admin.identityKey,
      borrower: users.testUser1.identityKey,
      status: LoanStatus.Open,
      closedBy: LoanClosedBy.Unspecified
    });

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.admin, users.testUser1)
      .savedState(nftClass, nftInstance, tokenBalance, loan);

    const dto: CloseLoanDto = (
      await createValidDTO(CloseLoanDto, {
        loan: loan.getCompositeKey(),
        status: LoanStatus.Open,
        uniqueKey: "unique-key"
      })
    ).signed(users.admin.privateKey);

    // When
    const res = await contract.CloseLoan(ctx, dto);

    // Then
    expect(res).toEqual(GalaChainResponse.Error(new InvalidClosingStatusError(LoanStatus.Open)));
    expect(getWrites()).toEqual({});
  });
});

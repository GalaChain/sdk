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
  FungibleLoan,
  LendingClosedBy,
  LendingStatus,
  RepayLoanDto,
  TokenBalance,
  TokenClass,
  TokenClassKey,
  asValidUserAlias,
  createValidSubmitDTO
} from "@gala-chain/api";
import { currency, fixture, users } from "@gala-chain/test";
import { BigNumber } from "bignumber.js";
import { plainToInstance } from "class-transformer";
import Long from "long";

import GalaChainTokenContract from "../../__test__/GalaChainTokenContract";

describe("RepayLoan", () => {
  const goldTokenKey: TokenClassKey = plainToInstance(TokenClassKey, {
    collection: "TEST",
    category: "Currency",
    type: "GOLD",
    additionalKey: "none"
  });

  const silverTokenKey: TokenClassKey = plainToInstance(TokenClassKey, {
    collection: "TEST",
    category: "Currency",
    type: "SILVER",
    additionalKey: "none"
  });

  const createLoan = (params: {
    lender: string;
    borrower: string;
    offerKey: string;
    principalAmount: string;
    interestRate: string;
    startTime: number;
    endTime: number;
    collateralAmount: string;
    status?: LendingStatus;
    interestAccrued?: string;
    lastInterestUpdate?: number;
  }): FungibleLoan => {
    const loan = new FungibleLoan();
    loan.lender = params.lender;
    loan.borrower = params.borrower;
    loan.offerKey = params.offerKey;
    loan.startTime = params.startTime;
    loan.principalToken = goldTokenKey;
    loan.principalAmount = new BigNumber(params.principalAmount);
    loan.interestRate = new BigNumber(params.interestRate);
    loan.collateralToken = silverTokenKey;
    loan.collateralAmount = new BigNumber(params.collateralAmount);
    loan.collateralRatio = new BigNumber(params.collateralAmount).dividedBy(params.principalAmount);
    loan.healthFactor = new BigNumber("1.0");
    loan.endTime = params.endTime;
    loan.status = params.status ?? LendingStatus.LoanActive;
    loan.closedBy = LendingClosedBy.Unspecified;
    loan.interestAccrued = new BigNumber(params.interestAccrued ?? "0");
    loan.lastInterestUpdate = params.lastInterestUpdate ?? params.startTime;
    return loan;
  };

  const createTokenClass = (tokenKey: TokenClassKey, isNonFungible = false): TokenClass => {
    const tokenClass = new TokenClass();
    tokenClass.collection = tokenKey.collection;
    tokenClass.category = tokenKey.category;
    tokenClass.type = tokenKey.type;
    tokenClass.additionalKey = tokenKey.additionalKey;
    tokenClass.isNonFungible = isNonFungible;
    tokenClass.decimals = 8;
    tokenClass.name = `${tokenKey.type} Token`;
    tokenClass.symbol = tokenKey.type;
    tokenClass.description = `Test ${tokenKey.type} token`;
    return tokenClass;
  };

  const createTokenBalance = (owner: string, tokenKey: TokenClassKey, quantity: string): TokenBalance => {
    return currency.tokenBalance((b) => ({
      ...b,
      owner: asValidUserAlias(owner),
      collection: tokenKey.collection,
      category: tokenKey.category,
      type: tokenKey.type,
      additionalKey: tokenKey.additionalKey,
      quantity: new BigNumber(quantity)
    }));
  };

  describe("repayLoan", () => {
    it("should repay loan in full and unlock collateral", async () => {
      // Given
      const startTime = 1000000;
      const currentTime = startTime + 365 * 24 * 60 * 60; // 1 year later

      const loan = createLoan({
        lender: users.testUser1.identityKey,
        borrower: users.testUser2.identityKey,
        offerKey: "test-offer-key",
        principalAmount: "1000",
        interestRate: "500", // 5% annual
        startTime,
        endTime: currentTime + 30 * 24 * 60 * 60,
        collateralAmount: "1500"
      });

      // Create token classes and instances
      const goldTokenClass = currency.tokenClass((tc) => ({
        ...tc,
        collection: "TEST",
        category: "Currency",
        type: "GOLD",
        additionalKey: "none"
      }));
      const goldTokenInstance = currency.tokenInstance((ti) => ({
        ...ti,
        collection: "TEST",
        category: "Currency",
        type: "GOLD",
        additionalKey: "none"
      }));

      const silverTokenClass = createTokenClass(silverTokenKey);
      const silverTokenInstance = currency.tokenInstance((ti) => ({
        ...ti,
        collection: "TEST",
        category: "Currency",
        type: "SILVER",
        additionalKey: "none"
      }));

      // Borrower has gold to repay
      const borrowerBalance = createTokenBalance(users.testUser2.identityKey, goldTokenKey, "2000");
      const lenderBalance = createTokenBalance(users.testUser1.identityKey, goldTokenKey, "0");

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2)
        .savedState(
          loan,
          goldTokenClass,
          goldTokenInstance,
          silverTokenClass,
          silverTokenInstance,
          borrowerBalance,
          lenderBalance
        );

      // Set the current time for interest calculation
      const seconds = Long.fromNumber(currentTime / 1000);
      (ctx.stub as any).txTimestamp = {
        seconds,
        nanos: 0,
        getSeconds: () => seconds,
        getNanos: () => 0
      };

      const dto = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: loan.getCompositeKey()
        // repaymentAmount not specified = full repayment
      });

      dto.sign(users.testUser2.privateKey);

      // When
      const result = await contract.RepayLoan(ctx, dto);

      // Then
      expect(result.Status).toBe(1);
      expect(result.Data).toHaveProperty("loan");
      expect(result.Data).toHaveProperty("principalRepaid");
      expect(result.Data).toHaveProperty("interestRepaid");
      expect(result.Data).toHaveProperty("collateralReturned");

      // Verify loan is closed
      expect(result.Data?.loan).toMatchObject({
        status: LendingStatus.LoanRepaid,
        closedBy: LendingClosedBy.Borrower
      });

      // Verify repayment amounts (1000 principal + ~50 interest for 1 year at 5%)
      expect(result.Data?.principalRepaid).toEqual(new BigNumber("1000"));
      expect(result.Data?.interestRepaid.toFixed(0)).toBe("50"); // Accept minor precision differences
      expect(result.Data?.collateralReturned).toEqual(new BigNumber("1500"));
    });

    it("should handle partial repayment (interest only)", async () => {
      // Given
      const startTime = 1000000;
      const currentTime = startTime + 365 * 24 * 60 * 60; // 1 year later

      const loan = createLoan({
        lender: users.testUser1.identityKey,
        borrower: users.testUser2.identityKey,
        offerKey: "test-offer-key",
        principalAmount: "1000",
        interestRate: "500", // 5% annual
        startTime,
        endTime: currentTime + 30 * 24 * 60 * 60,
        collateralAmount: "1500"
      });

      const goldTokenClass = currency.tokenClass((tc) => ({
        ...tc,
        collection: "TEST",
        category: "Currency",
        type: "GOLD",
        additionalKey: "none"
      }));
      const goldTokenInstance = currency.tokenInstance((ti) => ({
        ...ti,
        collection: "TEST",
        category: "Currency",
        type: "GOLD",
        additionalKey: "none"
      }));

      const borrowerBalance = createTokenBalance(users.testUser2.identityKey, goldTokenKey, "100");
      const lenderBalance = createTokenBalance(users.testUser1.identityKey, goldTokenKey, "0");

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2)
        .savedState(loan, goldTokenClass, goldTokenInstance, borrowerBalance, lenderBalance);

      // Set the current time for interest calculation
      const seconds = Long.fromNumber(currentTime / 1000);
      (ctx.stub as any).txTimestamp = {
        seconds,
        nanos: 0,
        getSeconds: () => seconds,
        getNanos: () => 0
      };

      const dto = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: loan.getCompositeKey(),
        repaymentAmount: new BigNumber("40") // Partial payment (less than interest)
      });

      dto.sign(users.testUser2.privateKey);

      // When
      const result = await contract.RepayLoan(ctx, dto);

      // Then
      expect(result.Status).toBe(1);

      // Verify loan is still active (partial repayment)
      expect(result.Data?.loan).toMatchObject({
        status: LendingStatus.LoanActive
      });

      // Verify repayment amounts
      expect(result.Data?.principalRepaid).toEqual(new BigNumber("0"));
      expect(result.Data?.interestRepaid).toEqual(new BigNumber("40"));
      expect(result.Data?.collateralReturned).toEqual(new BigNumber("0")); // No collateral returned for partial repayment
    });

    it("should fail when loan is not active", async () => {
      // Given
      const loan = createLoan({
        lender: users.testUser1.identityKey,
        borrower: users.testUser2.identityKey,
        offerKey: "test-offer-key",
        principalAmount: "1000",
        interestRate: "500",
        startTime: 1000000,
        endTime: 2000000,
        collateralAmount: "1500",
        status: LendingStatus.LoanRepaid // Already repaid
      });

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2)
        .savedState(loan);

      const dto = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: loan.getCompositeKey()
      });

      dto.sign(users.testUser2.privateKey);

      // When
      const result = await contract.RepayLoan(ctx, dto);

      // Then
      expect(result.Status).toBe(0);
      expect(result.Message).toContain("is not active");
    });

    it("should fail when unauthorized user tries to repay", async () => {
      // Given
      const loan = createLoan({
        lender: users.testUser1.identityKey,
        borrower: users.testUser2.identityKey,
        offerKey: "test-offer-key",
        principalAmount: "1000",
        interestRate: "500",
        startTime: 1000000,
        endTime: 2000000,
        collateralAmount: "1500"
      });

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2, users.testUser3)
        .savedState(loan);

      const dto = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: loan.getCompositeKey()
      });

      dto.sign(users.testUser3.privateKey);

      // When
      const result = await contract.RepayLoan(ctx, dto);

      // Then
      expect(result.Status).toBe(0);
      expect(result.ErrorKey).toBe("UNAUTHORIZED_LOAN_OPERATION");
    });

    it("should fail when borrower has insufficient balance", async () => {
      // Given
      const loan = createLoan({
        lender: users.testUser1.identityKey,
        borrower: users.testUser2.identityKey,
        offerKey: "test-offer-key",
        principalAmount: "1000",
        interestRate: "500",
        startTime: 1000000,
        endTime: 2000000,
        collateralAmount: "1500"
      });

      const goldTokenClass = currency.tokenClass((tc) => ({
        ...tc,
        collection: "TEST",
        category: "Currency",
        type: "GOLD",
        additionalKey: "none"
      }));
      const goldTokenInstance = currency.tokenInstance((ti) => ({
        ...ti,
        collection: "TEST",
        category: "Currency",
        type: "GOLD",
        additionalKey: "none"
      }));

      // Borrower has insufficient balance
      const borrowerBalance = createTokenBalance(users.testUser2.identityKey, goldTokenKey, "500");

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2)
        .savedState(loan, goldTokenClass, goldTokenInstance, borrowerBalance);

      const dto = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: loan.getCompositeKey(),
        repaymentAmount: new BigNumber("1000") // More than borrower has
      });

      dto.sign(users.testUser2.privateKey);

      // When
      const result = await contract.RepayLoan(ctx, dto);

      // Then
      expect(result.Status).toBe(0);
      expect(result.Message).toContain("insufficient balance");
    });

    it("should fail when repayment amount exceeds debt", async () => {
      // Given
      const startTime = 1000000;
      const currentTime = startTime + 30 * 24 * 60 * 60; // 30 days later for some interest

      const loan = createLoan({
        lender: users.testUser1.identityKey,
        borrower: users.testUser2.identityKey,
        offerKey: "test-offer-key",
        principalAmount: "1000",
        interestRate: "500",
        startTime,
        endTime: currentTime + 365 * 24 * 60 * 60,
        collateralAmount: "1500"
      });

      const goldTokenClass = currency.tokenClass((tc) => ({
        ...tc,
        collection: "TEST",
        category: "Currency",
        type: "GOLD",
        additionalKey: "none"
      }));
      const goldTokenInstance = currency.tokenInstance((ti) => ({
        ...ti,
        collection: "TEST",
        category: "Currency",
        type: "GOLD",
        additionalKey: "none"
      }));

      const borrowerBalance = createTokenBalance(users.testUser2.identityKey, goldTokenKey, "5000");

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2)
        .savedState(loan, goldTokenClass, goldTokenInstance, borrowerBalance);

      // Set the current time for interest calculation
      const seconds = Long.fromNumber(currentTime / 1000);
      (ctx.stub as any).txTimestamp = {
        seconds,
        nanos: 0,
        getSeconds: () => seconds,
        getNanos: () => 0
      };

      const dto = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: loan.getCompositeKey(),
        repaymentAmount: new BigNumber("2000") // More than total debt
      });

      dto.sign(users.testUser2.privateKey);

      // When
      const result = await contract.RepayLoan(ctx, dto);

      // Then
      expect(result.Status).toBe(0);
      expect(result.Message).toContain("exceeds total debt");
    });
  });
});

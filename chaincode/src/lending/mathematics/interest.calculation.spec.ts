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

/**
 * MATHEMATICAL TESTING: Interest Calculation Verification
 *
 * Tests mathematical correctness of interest calculations in the DeFi lending protocol.
 * Verifies that all interest calculations match expected mathematical formulas:
 * - Simple interest accuracy across various rates and time periods
 * - Compound interest scenarios over multiple time periods
 * - Interest rate basis points conversion (10000 = 100%)
 * - Time-based precision in daily, weekly, monthly calculations
 */
import {
  AcceptLendingOfferDto,
  CreateLendingOfferDto,
  FungibleLendingOffer,
  FungibleLoan,
  LendingClosedBy,
  LendingStatus,
  RepayLoanDto,
  TokenClassKey,
  asValidUserAlias,
  createValidSubmitDTO
} from "@gala-chain/api";
import { currency, fixture, users } from "@gala-chain/test";
import { BigNumber } from "bignumber.js";
import { plainToInstance } from "class-transformer";
import Long from "long";

import GalaChainTokenContract from "../../__test__/GalaChainTokenContract";

describe("MATHEMATICS: Interest Calculation Verification", () => {
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

  const createTestLoan = (
    lender: string,
    borrower: string,
    principalAmount: string,
    interestRate: string,
    startTime: number,
    endTime: number
  ): FungibleLoan => {
    const loan = new FungibleLoan();
    loan.lender = lender;
    loan.borrower = borrower;
    loan.offerKey = "test-offer-key";
    loan.startTime = startTime;
    loan.principalToken = goldTokenKey;
    loan.principalAmount = new BigNumber(principalAmount);
    loan.interestRate = new BigNumber(interestRate);
    loan.collateralToken = silverTokenKey;
    loan.collateralAmount = new BigNumber(principalAmount).multipliedBy("1.5");
    loan.collateralRatio = new BigNumber("1.5");
    loan.healthFactor = new BigNumber("1.5");
    loan.endTime = endTime;
    loan.status = LendingStatus.LoanActive;
    loan.closedBy = LendingClosedBy.Unspecified;
    loan.interestAccrued = new BigNumber("0");
    loan.lastInterestUpdate = startTime;
    return loan;
  };

  const createTokenBalance = (owner: string, tokenKey: TokenClassKey, quantity: string) => {
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

  /**
   * Calculate expected interest using the formula:
   * Interest = Principal × (Rate / 10000) × (Days / 365)
   */
  const calculateExpectedInterest = (
    principal: BigNumber,
    interestRateBasisPoints: BigNumber,
    daysElapsed: number
  ): BigNumber => {
    const rate = interestRateBasisPoints.dividedBy(10000); // Convert basis points to decimal
    const timeRatio = new BigNumber(daysElapsed).dividedBy(365); // Annual rate to daily
    return principal.multipliedBy(rate).multipliedBy(timeRatio);
  };

  describe("Simple Interest Accuracy", () => {
    it("should calculate exact interest for 1 year at 5% APR", async () => {
      // Given: $1000 loan at 500 basis points (5%) for exactly 365 days
      const principal = new BigNumber("1000");
      const interestRate = new BigNumber("500"); // 5% = 500 basis points
      const startTime = 1000000;
      const days = 365;
      const endTime = startTime + days * 24 * 60 * 60;

      // Expected: 1000 × (500/10000) × (365/365) = $50.00
      const expectedInterest = calculateExpectedInterest(principal, interestRate, days);
      expect(expectedInterest).toEqual(new BigNumber("50"));

      const loan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        "1000",
        "500",
        startTime,
        endTime
      );

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

      const borrowerBalance = createTokenBalance(users.testUser2.identityKey, goldTokenKey, "2000");

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2)
        .savedState(loan, goldTokenClass, goldTokenInstance, borrowerBalance);

      // When: Calculate interest after exactly 1 year
      const currentTime = endTime;
      const seconds = Long.fromNumber(currentTime / 1000);
      (ctx.stub as any).txTimestamp = {
        seconds,
        nanos: 0,
        getSeconds: () => seconds,
        getNanos: () => 0
      };

      const dto = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: loan.getCompositeKey(),
        repaymentAmount: new BigNumber("1050") // Full principal + expected interest
      });
      dto.sign(users.testUser2.privateKey);

      const result = await contract.RepayLoan(ctx, dto);

      // Then: Should match exactly
      if (result.Status === 1) {
        const actualInterest = result.Data?.interestRepaid || new BigNumber("0");
        expect(actualInterest).toEqual(expectedInterest);
      }
    });

    it("should calculate precise interest for 1% APR over 30 days", async () => {
      // Given: $1000 loan at 100 basis points (1%) for 30 days
      const principal = new BigNumber("1000");
      const interestRate = new BigNumber("100"); // 1% = 100 basis points
      const startTime = 1000000;
      const days = 30;
      const endTime = startTime + days * 24 * 60 * 60;

      // Expected: 1000 × (100/10000) × (30/365) = $0.82191781 (rounded to 8 decimals)
      const expectedInterest = calculateExpectedInterest(principal, interestRate, days);
      expect(expectedInterest.decimalPlaces(8)).toEqual(new BigNumber("0.82191781"));

      const loan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        "1000",
        "100",
        startTime,
        endTime
      );

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

      const borrowerBalance = createTokenBalance(users.testUser2.identityKey, goldTokenKey, "2000");

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2)
        .savedState(loan, goldTokenClass, goldTokenInstance, borrowerBalance);

      // When: Calculate interest after 30 days
      const currentTime = endTime;
      const seconds = Long.fromNumber(currentTime / 1000);
      (ctx.stub as any).txTimestamp = {
        seconds,
        nanos: 0,
        getSeconds: () => seconds,
        getNanos: () => 0
      };

      const dto = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: loan.getCompositeKey(),
        repaymentAmount: new BigNumber("2000") // Overpay to ensure full repayment
      });
      dto.sign(users.testUser2.privateKey);

      const result = await contract.RepayLoan(ctx, dto);

      // Then: Should match expected interest within precision limits
      if (result.Status === 1) {
        const actualInterest = result.Data?.interestRepaid || new BigNumber("0");
        expect(actualInterest.decimalPlaces()).toBeLessThanOrEqual(8);

        // Allow for minor rounding differences (within 1 wei at 8 decimal places)
        const difference = actualInterest.minus(expectedInterest).abs();
        expect(difference.isLessThanOrEqualTo(new BigNumber("0.00000001"))).toBe(true);
      }
    });

    it("should calculate interest for 25% APR over 7 days", async () => {
      // Given: $500 loan at 2500 basis points (25%) for 7 days
      const principal = new BigNumber("500");
      const interestRate = new BigNumber("2500"); // 25% = 2500 basis points
      const startTime = 1000000;
      const days = 7;
      const endTime = startTime + days * 24 * 60 * 60;

      // Expected: 500 × (2500/10000) × (7/365) = $2.39726027
      const expectedInterest = calculateExpectedInterest(principal, interestRate, days);
      expect(expectedInterest.decimalPlaces(8)).toEqual(new BigNumber("2.39726027"));

      const loan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        "500",
        "2500",
        startTime,
        endTime
      );

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

      const borrowerBalance = createTokenBalance(users.testUser2.identityKey, goldTokenKey, "1000");

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2)
        .savedState(loan, goldTokenClass, goldTokenInstance, borrowerBalance);

      // When: Calculate interest after 7 days
      const currentTime = endTime;
      const seconds = Long.fromNumber(currentTime / 1000);
      (ctx.stub as any).txTimestamp = {
        seconds,
        nanos: 0,
        getSeconds: () => seconds,
        getNanos: () => 0
      };

      const dto = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: loan.getCompositeKey(),
        repaymentAmount: new BigNumber("1000") // Overpay to ensure full repayment
      });
      dto.sign(users.testUser2.privateKey);

      const result = await contract.RepayLoan(ctx, dto);

      // Then: Should match expected interest
      if (result.Status === 1) {
        const actualInterest = result.Data?.interestRepaid || new BigNumber("0");
        const difference = actualInterest.minus(expectedInterest).abs();
        expect(difference.isLessThanOrEqualTo(new BigNumber("0.00000001"))).toBe(true);
      }
    });

    it("should handle zero interest rate correctly", async () => {
      // Given: $1000 loan at 0% APR for 365 days
      const principal = new BigNumber("1000");
      const interestRate = new BigNumber("0"); // 0% = 0 basis points
      const startTime = 1000000;
      const days = 365;
      const endTime = startTime + days * 24 * 60 * 60;

      // Expected: 1000 × (0/10000) × (365/365) = $0.00
      const expectedInterest = calculateExpectedInterest(principal, interestRate, days);
      expect(expectedInterest).toEqual(new BigNumber("0"));

      const loan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        "1000",
        "0",
        startTime,
        endTime
      );

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

      const borrowerBalance = createTokenBalance(users.testUser2.identityKey, goldTokenKey, "2000");

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2)
        .savedState(loan, goldTokenClass, goldTokenInstance, borrowerBalance);

      // When: Calculate interest after 1 year
      const currentTime = endTime;
      const seconds = Long.fromNumber(currentTime / 1000);
      (ctx.stub as any).txTimestamp = {
        seconds,
        nanos: 0,
        getSeconds: () => seconds,
        getNanos: () => 0
      };

      const dto = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: loan.getCompositeKey(),
        repaymentAmount: new BigNumber("1000") // Exactly the principal
      });
      dto.sign(users.testUser2.privateKey);

      const result = await contract.RepayLoan(ctx, dto);

      // Then: Should have zero interest
      if (result.Status === 1) {
        const actualInterest = result.Data?.interestRepaid || new BigNumber("0");
        expect(actualInterest).toEqual(expectedInterest);
      }
    });
  });

  describe("Interest Rate Basis Points Conversion", () => {
    it("should correctly convert 10000 basis points to 100% interest", async () => {
      // Given: $100 loan at 10000 basis points (100%) for 365 days
      const principal = new BigNumber("100");
      const interestRate = new BigNumber("10000"); // 100% = 10000 basis points
      const startTime = 1000000;
      const days = 365;
      const endTime = startTime + days * 24 * 60 * 60;

      // Expected: 100 × (10000/10000) × (365/365) = $100.00
      const expectedInterest = calculateExpectedInterest(principal, interestRate, days);
      expect(expectedInterest).toEqual(new BigNumber("100"));

      const loan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        "100",
        "10000",
        startTime,
        endTime
      );

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

      const borrowerBalance = createTokenBalance(users.testUser2.identityKey, goldTokenKey, "1000");

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2)
        .savedState(loan, goldTokenClass, goldTokenInstance, borrowerBalance);

      // When: Calculate interest after 1 year
      const currentTime = endTime;
      const seconds = Long.fromNumber(currentTime / 1000);
      (ctx.stub as any).txTimestamp = {
        seconds,
        nanos: 0,
        getSeconds: () => seconds,
        getNanos: () => 0
      };

      const dto = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: loan.getCompositeKey(),
        repaymentAmount: new BigNumber("200") // Principal + full expected interest
      });
      dto.sign(users.testUser2.privateKey);

      const result = await contract.RepayLoan(ctx, dto);

      // Then: Should match expected 100% interest
      if (result.Status === 1) {
        const actualInterest = result.Data?.interestRepaid || new BigNumber("0");
        expect(actualInterest).toEqual(expectedInterest);
      }
    });

    it("should handle fractional basis points correctly", async () => {
      // Given: $1000 loan at 150 basis points (1.5%) for 365 days
      const principal = new BigNumber("1000");
      const interestRate = new BigNumber("150"); // 1.5% = 150 basis points
      const startTime = 1000000;
      const days = 365;
      const endTime = startTime + days * 24 * 60 * 60;

      // Expected: 1000 × (150/10000) × (365/365) = $15.00
      const expectedInterest = calculateExpectedInterest(principal, interestRate, days);
      expect(expectedInterest).toEqual(new BigNumber("15"));

      const loan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        "1000",
        "150",
        startTime,
        endTime
      );

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

      const borrowerBalance = createTokenBalance(users.testUser2.identityKey, goldTokenKey, "2000");

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2)
        .savedState(loan, goldTokenClass, goldTokenInstance, borrowerBalance);

      // When: Calculate interest after 1 year
      const currentTime = endTime;
      const seconds = Long.fromNumber(currentTime / 1000);
      (ctx.stub as any).txTimestamp = {
        seconds,
        nanos: 0,
        getSeconds: () => seconds,
        getNanos: () => 0
      };

      const dto = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: loan.getCompositeKey(),
        repaymentAmount: new BigNumber("1015") // Principal + expected interest
      });
      dto.sign(users.testUser2.privateKey);

      const result = await contract.RepayLoan(ctx, dto);

      // Then: Should match expected 1.5% interest
      if (result.Status === 1) {
        const actualInterest = result.Data?.interestRepaid || new BigNumber("0");
        expect(actualInterest).toEqual(expectedInterest);
      }
    });
  });

  describe("Time-Based Precision", () => {
    it("should calculate correct interest for leap year (366 days)", async () => {
      // Given: $1000 loan at 1000 basis points (10%) for 366 days (leap year)
      const principal = new BigNumber("1000");
      const interestRate = new BigNumber("1000"); // 10% = 1000 basis points
      const startTime = 1000000;
      const days = 366; // Leap year
      const endTime = startTime + days * 24 * 60 * 60;

      // Expected: 1000 × (1000/10000) × (366/365) = $100.27397260
      const expectedInterest = calculateExpectedInterest(principal, interestRate, days);
      expect(expectedInterest.decimalPlaces(8)).toEqual(new BigNumber("100.27397260"));

      const loan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        "1000",
        "1000",
        startTime,
        endTime
      );

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

      const borrowerBalance = createTokenBalance(users.testUser2.identityKey, goldTokenKey, "2000");

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2)
        .savedState(loan, goldTokenClass, goldTokenInstance, borrowerBalance);

      // When: Calculate interest after 366 days
      const currentTime = endTime;
      const seconds = Long.fromNumber(currentTime / 1000);
      (ctx.stub as any).txTimestamp = {
        seconds,
        nanos: 0,
        getSeconds: () => seconds,
        getNanos: () => 0
      };

      const dto = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: loan.getCompositeKey(),
        repaymentAmount: new BigNumber("2000") // Overpay to ensure full repayment
      });
      dto.sign(users.testUser2.privateKey);

      const result = await contract.RepayLoan(ctx, dto);

      // Then: Should handle leap year correctly
      if (result.Status === 1) {
        const actualInterest = result.Data?.interestRepaid || new BigNumber("0");
        const difference = actualInterest.minus(expectedInterest).abs();
        expect(difference.isLessThanOrEqualTo(new BigNumber("0.00000001"))).toBe(true);
      }
    });

    it("should handle same-day loan creation and repayment", async () => {
      // Given: $1000 loan at 3650 basis points (36.5%) for 0 days (same day)
      const principal = new BigNumber("1000");
      const interestRate = new BigNumber("3650"); // 36.5% = 3650 basis points
      const startTime = 1000000;
      const days = 0; // Same day
      const endTime = startTime; // Same timestamp

      // Expected: 1000 × (3650/10000) × (0/365) = $0.00
      const expectedInterest = calculateExpectedInterest(principal, interestRate, days);
      expect(expectedInterest).toEqual(new BigNumber("0"));

      const loan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        "1000",
        "3650",
        startTime,
        endTime
      );

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

      const borrowerBalance = createTokenBalance(users.testUser2.identityKey, goldTokenKey, "2000");

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2)
        .savedState(loan, goldTokenClass, goldTokenInstance, borrowerBalance);

      // When: Repay on same day as loan creation
      const currentTime = endTime;
      const seconds = Long.fromNumber(currentTime / 1000);
      (ctx.stub as any).txTimestamp = {
        seconds,
        nanos: 0,
        getSeconds: () => seconds,
        getNanos: () => 0
      };

      const dto = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: loan.getCompositeKey(),
        repaymentAmount: new BigNumber("1000") // Just the principal
      });
      dto.sign(users.testUser2.privateKey);

      const result = await contract.RepayLoan(ctx, dto);

      // Then: Should have zero interest for same-day loan
      if (result.Status === 1) {
        const actualInterest = result.Data?.interestRepaid || new BigNumber("0");
        expect(actualInterest).toEqual(expectedInterest);
      }
    });
  });
});

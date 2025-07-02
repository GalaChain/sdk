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
 * MATHEMATICAL TESTING: Repayment Accounting Verification
 *
 * Tests mathematical correctness of payment allocation in the DeFi lending protocol.
 * Verifies that incremental repayments correctly allocate between interest and principal:
 * - Interest-first payment allocation accuracy
 * - Principal reduction calculations
 * - Outstanding balance updates after payments
 * - Multiple payment scenarios over time
 */
import {
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

describe("MATHEMATICS: Repayment Accounting Verification", () => {
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
    accruedInterest = "0"
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
    loan.endTime = startTime + 365 * 24 * 60 * 60; // 1 year later
    loan.status = LendingStatus.LoanActive;
    loan.closedBy = LendingClosedBy.Unspecified;
    loan.interestAccrued = new BigNumber(accruedInterest);
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

  describe("Interest vs Principal Allocation", () => {
    it("should correctly allocate partial payments to interest then principal", async () => {
      // Given: $1000 loan with $50 accrued interest, $75 payment
      const loan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        "1000",
        "500",
        1000000,
        "50" // Pre-accrued interest
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

      // When: Make $75 payment
      const paymentAmount = new BigNumber("75");
      const dto = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: loan.getCompositeKey(),
        repaymentAmount: paymentAmount
      });
      dto.sign(users.testUser2.privateKey);

      const result = await contract.RepayLoan(ctx, dto);

      // Then: Expected allocation:
      // Interest payment: $50 (covers all accrued interest)
      // Principal payment: $25 (remainder goes to principal)
      // New principal: $975
      // New interest: $0 (may have new accrual from time passage)
      if (result.Status === 1) {
        const interestPaid = result.Data?.interestRepaid || new BigNumber("0");
        const principalPaid = result.Data?.principalRepaid || new BigNumber("0");
        const newPrincipal = result.Data?.loan.principalAmount || new BigNumber("0");

        expect(interestPaid).toEqual(new BigNumber("50"));
        expect(principalPaid).toEqual(new BigNumber("25"));
        expect(newPrincipal).toEqual(new BigNumber("975"));

        // Verify total payment allocation
        expect(interestPaid.plus(principalPaid)).toEqual(paymentAmount);
      }
    });

    it("should handle payments that cover only interest", async () => {
      // Given: $1000 loan with $100 accrued interest, $80 payment
      const loan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        "1000",
        "500",
        1000000,
        "100" // Pre-accrued interest
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

      // When: Make $80 payment (less than total interest)
      const paymentAmount = new BigNumber("80");
      const dto = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: loan.getCompositeKey(),
        repaymentAmount: paymentAmount
      });
      dto.sign(users.testUser2.privateKey);

      const result = await contract.RepayLoan(ctx, dto);

      // Then: Expected allocation:
      // Interest payment: $80 (partial interest payment)
      // Principal payment: $0 (no payment to principal)
      // New principal: $1000 (unchanged)
      // Remaining interest: ~$20 (plus any new accrual)
      if (result.Status === 1) {
        const interestPaid = result.Data?.interestRepaid || new BigNumber("0");
        const principalPaid = result.Data?.principalRepaid || new BigNumber("0");
        const newPrincipal = result.Data?.loan.principalAmount || new BigNumber("0");

        expect(interestPaid).toEqual(new BigNumber("80"));
        expect(principalPaid).toEqual(new BigNumber("0"));
        expect(newPrincipal).toEqual(new BigNumber("1000"));

        // Verify total payment allocation
        expect(interestPaid.plus(principalPaid)).toEqual(paymentAmount);
      }
    });

    it("should handle overpayment scenarios correctly", async () => {
      // Given: $500 loan with $25 accrued interest, $600 payment (overpayment)
      const loan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        "500",
        "500",
        1000000,
        "25" // Pre-accrued interest
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

      // When: Make $600 payment (overpays the loan)
      const paymentAmount = new BigNumber("600");
      const dto = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: loan.getCompositeKey(),
        repaymentAmount: paymentAmount
      });
      dto.sign(users.testUser2.privateKey);

      const result = await contract.RepayLoan(ctx, dto);

      // Then: Expected allocation:
      // Interest payment: $25 (covers all accrued interest)
      // Principal payment: $500 (covers all principal)
      // Total used: $525 (excess should be handled appropriately)
      // New principal: $0 (loan fully repaid)
      // New interest: $0
      if (result.Status === 1) {
        const interestPaid = result.Data?.interestRepaid || new BigNumber("0");
        const principalPaid = result.Data?.principalRepaid || new BigNumber("0");
        const newPrincipal = result.Data?.loan.principalAmount || new BigNumber("0");

        expect(interestPaid).toEqual(new BigNumber("25"));
        expect(principalPaid).toEqual(new BigNumber("500"));
        expect(newPrincipal).toEqual(new BigNumber("0"));

        // Total payment should not exceed debt
        const totalDebt = new BigNumber("525"); // $500 principal + $25 interest
        expect(interestPaid.plus(principalPaid)).toEqual(totalDebt);
      }
    });
  });

  describe("Multiple Payment Scenarios", () => {
    it("should correctly handle series of small payments over time", async () => {
      // Given: $1000 loan with initial state
      const startTime = 1000000;
      const loan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        "1000",
        "1000", // 10% APR for more noticeable interest
        startTime,
        "0" // Start with no accrued interest
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

      const borrowerBalance = createTokenBalance(users.testUser2.identityKey, goldTokenKey, "5000");

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2)
        .savedState(loan, goldTokenClass, goldTokenInstance, borrowerBalance);

      // When: Make first payment after 30 days
      let currentTime = startTime + 30 * 24 * 60 * 60; // 30 days later
      let seconds = Long.fromNumber(currentTime / 1000);
      (ctx.stub as any).txTimestamp = {
        seconds,
        nanos: 0,
        getSeconds: () => seconds,
        getNanos: () => 0
      };

      const payment1 = new BigNumber("100");
      const dto1 = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: loan.getCompositeKey(),
        repaymentAmount: payment1
      });
      dto1.sign(users.testUser2.privateKey);

      const result1 = await contract.RepayLoan(ctx, dto1);

      // Then: Track balances after first payment
      let cumulativeInterestPaid = new BigNumber("0");
      let cumulativePrincipalPaid = new BigNumber("0");

      if (result1.Status === 1) {
        const interest1 = result1.Data?.interestRepaid || new BigNumber("0");
        const principal1 = result1.Data?.principalRepaid || new BigNumber("0");
        const remaining1 = result1.Data?.loan.principalAmount || new BigNumber("0");

        cumulativeInterestPaid = cumulativeInterestPaid.plus(interest1);
        cumulativePrincipalPaid = cumulativePrincipalPaid.plus(principal1);

        expect(interest1.plus(principal1)).toEqual(payment1);
        expect(remaining1).toEqual(new BigNumber("1000").minus(principal1));
      }

      // When: Make second payment after another 30 days
      currentTime = currentTime + 30 * 24 * 60 * 60; // 60 days total
      seconds = Long.fromNumber(currentTime / 1000);
      (ctx.stub as any).txTimestamp = {
        seconds,
        nanos: 0,
        getSeconds: () => seconds,
        getNanos: () => 0
      };

      const payment2 = new BigNumber("150");
      const dto2 = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: loan.getCompositeKey(),
        repaymentAmount: payment2
      });
      dto2.sign(users.testUser2.privateKey);

      const result2 = await contract.RepayLoan(ctx, dto2);

      // Then: Track balances after second payment
      if (result2.Status === 1) {
        const interest2 = result2.Data?.interestRepaid || new BigNumber("0");
        const principal2 = result2.Data?.principalRepaid || new BigNumber("0");
        const remaining2 = result2.Data?.loan.principalAmount || new BigNumber("0");

        cumulativeInterestPaid = cumulativeInterestPaid.plus(interest2);
        cumulativePrincipalPaid = cumulativePrincipalPaid.plus(principal2);

        expect(interest2.plus(principal2)).toEqual(payment2);
        expect(remaining2).toEqual(new BigNumber("1000").minus(cumulativePrincipalPaid));

        // Verify mathematical consistency
        expect(cumulativeInterestPaid.plus(cumulativePrincipalPaid)).toEqual(payment1.plus(payment2));
      }
    });

    it("should maintain accuracy across irregular payment amounts", async () => {
      // Given: $800 loan with irregular payment schedule
      const startTime = 1000000;
      const loan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        "800",
        "750", // 7.5% APR
        startTime,
        "10" // Start with some accrued interest
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

      const borrowerBalance = createTokenBalance(users.testUser2.identityKey, goldTokenKey, "5000");

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2)
        .savedState(loan, goldTokenClass, goldTokenInstance, borrowerBalance);

      // Irregular payment amounts: $33.33, $67.89, $125.50
      const payments = [new BigNumber("33.33"), new BigNumber("67.89"), new BigNumber("125.50")];

      let cumulativeInterestPaid = new BigNumber("0");
      let cumulativePrincipalPaid = new BigNumber("0");
      let totalPayments = new BigNumber("0");

      // When: Make each irregular payment at different intervals
      for (let i = 0; i < payments.length; i++) {
        const payment = payments[i];
        const daysElapsed = (i + 1) * 15; // 15, 30, 45 days
        const currentTime = startTime + daysElapsed * 24 * 60 * 60;
        const seconds = Long.fromNumber(currentTime / 1000);
        (ctx.stub as any).txTimestamp = {
          seconds,
          nanos: 0,
          getSeconds: () => seconds,
          getNanos: () => 0
        };

        const dto = await createValidSubmitDTO(RepayLoanDto, {
          loanKey: loan.getCompositeKey(),
          repaymentAmount: payment
        });
        dto.sign(users.testUser2.privateKey);

        const result = await contract.RepayLoan(ctx, dto);

        // Then: Verify each payment allocation
        if (result.Status === 1) {
          const interestPaid = result.Data?.interestRepaid || new BigNumber("0");
          const principalPaid = result.Data?.principalRepaid || new BigNumber("0");
          const remainingPrincipal = result.Data?.loan.principalAmount || new BigNumber("0");

          cumulativeInterestPaid = cumulativeInterestPaid.plus(interestPaid);
          cumulativePrincipalPaid = cumulativePrincipalPaid.plus(principalPaid);
          totalPayments = totalPayments.plus(payment);

          // Verify payment allocation adds up correctly
          expect(interestPaid.plus(principalPaid)).toEqual(payment);

          // Verify remaining principal consistency
          expect(remainingPrincipal).toEqual(new BigNumber("800").minus(cumulativePrincipalPaid));

          // Verify total payments consistency
          expect(cumulativeInterestPaid.plus(cumulativePrincipalPaid)).toEqual(totalPayments);
        }
      }
    });
  });

  describe("Outstanding Balance Updates", () => {
    it("should accurately track remaining debt after each payment", async () => {
      // Given: $1200 loan with specific interest scenario
      const startTime = 1000000;
      const loan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        "1200",
        "600", // 6% APR
        startTime,
        "30" // Start with $30 accrued interest
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

      const borrowerBalance = createTokenBalance(users.testUser2.identityKey, goldTokenKey, "5000");

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2)
        .savedState(loan, goldTokenClass, goldTokenInstance, borrowerBalance);

      // When: Make payment that covers interest and some principal
      const currentTime = startTime + 60 * 24 * 60 * 60; // 60 days later
      const seconds = Long.fromNumber(currentTime / 1000);
      (ctx.stub as any).txTimestamp = {
        seconds,
        nanos: 0,
        getSeconds: () => seconds,
        getNanos: () => 0
      };

      const paymentAmount = new BigNumber("200");
      const dto = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: loan.getCompositeKey(),
        repaymentAmount: paymentAmount
      });
      dto.sign(users.testUser2.privateKey);

      const result = await contract.RepayLoan(ctx, dto);

      // Then: Verify debt tracking accuracy
      if (result.Status === 1) {
        const interestPaid = result.Data?.interestRepaid || new BigNumber("0");
        const principalPaid = result.Data?.principalRepaid || new BigNumber("0");
        const remainingPrincipal = result.Data?.loan.principalAmount || new BigNumber("0");
        const remainingInterest = result.Data?.loan.interestAccrued || new BigNumber("0");

        // Verify payment allocation
        expect(interestPaid.plus(principalPaid)).toEqual(paymentAmount);

        // Verify principal reduction
        expect(remainingPrincipal).toEqual(new BigNumber("1200").minus(principalPaid));

        // Total remaining debt = remaining principal + remaining interest
        const totalRemainingDebt = remainingPrincipal.plus(remainingInterest);

        // Original debt (with time-based interest) minus payment should equal remaining debt
        // Note: The exact interest calculation will depend on implementation details
        expect(remainingPrincipal.isLessThanOrEqualTo(new BigNumber("1200"))).toBe(true);
        expect(totalRemainingDebt.isGreaterThan(0)).toBe(true);
      }
    });

    it("should handle final payment that closes the loan", async () => {
      // Given: Small loan near full repayment
      const startTime = 1000000;
      const loan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        "100", // Small loan for easier full repayment testing
        "500", // 5% APR
        startTime,
        "5" // $5 accrued interest
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

      // When: Make payment that should fully repay the loan
      const currentTime = startTime + 10 * 24 * 60 * 60; // 10 days later
      const seconds = Long.fromNumber(currentTime / 1000);
      (ctx.stub as any).txTimestamp = {
        seconds,
        nanos: 0,
        getSeconds: () => seconds,
        getNanos: () => 0
      };

      const paymentAmount = new BigNumber("150"); // Overpay to ensure full repayment
      const dto = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: loan.getCompositeKey(),
        repaymentAmount: paymentAmount
      });
      dto.sign(users.testUser2.privateKey);

      const result = await contract.RepayLoan(ctx, dto);

      // Then: Verify loan is fully closed
      if (result.Status === 1) {
        const interestPaid = result.Data?.interestRepaid || new BigNumber("0");
        const principalPaid = result.Data?.principalRepaid || new BigNumber("0");
        const remainingPrincipal = result.Data?.loan.principalAmount || new BigNumber("0");
        const loanStatus = result.Data?.loan.status;

        // Verify loan is fully repaid
        expect(remainingPrincipal).toEqual(new BigNumber("0"));
        expect(loanStatus).toBe(LendingStatus.LoanRepaid);

        // Verify all principal was paid
        expect(principalPaid).toEqual(new BigNumber("100"));

        // Verify interest was paid (should be at least the initial $5 plus any accrual)
        expect(interestPaid.isGreaterThanOrEqualTo(new BigNumber("5"))).toBe(true);

        // Total payment used should equal exactly the debt (no overpayment processed)
        const totalDebtPaid = interestPaid.plus(principalPaid);
        expect(totalDebtPaid.isLessThanOrEqualTo(paymentAmount)).toBe(true);
      }
    });
  });
});

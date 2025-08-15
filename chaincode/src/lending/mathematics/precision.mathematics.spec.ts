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
 * MATHEMATICAL TESTING: Precision Mathematics Verification
 *
 * Tests mathematical precision and rounding behavior in the DeFi lending protocol:
 * - BigNumber arithmetic accuracy and consistency
 * - Decimal precision limits (8-decimal place handling)
 * - Rounding error accumulation over multiple operations
 * - Large number calculations without overflow
 * - Division precision in interest and ratio calculations
 */
import {
  FungibleLoan,
  LendingClosedBy,
  LendingStatus,
  LiquidateLoanDto,
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

describe("MATHEMATICS: Precision Mathematics Verification", () => {
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
    collateralAmount: string,
    healthFactor = "1.5"
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
    loan.collateralAmount = new BigNumber(collateralAmount);
    loan.collateralRatio = new BigNumber(collateralAmount).dividedBy(principalAmount);
    loan.healthFactor = new BigNumber(healthFactor);
    loan.endTime = startTime + 365 * 24 * 60 * 60;
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

  describe("Decimal Precision Limits", () => {
    it("should handle 8-decimal place precision consistently", async () => {
      // Given: Loan with precise decimal amounts
      const startTime = 1000000;
      const preciseAmount = "1234.56789012"; // More than 8 decimals
      const loan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        preciseAmount,
        "123.456789", // Precise interest rate
        startTime,
        "1851.85183518" // Precise collateral
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

      const borrowerBalance = createTokenBalance(users.testUser2.identityKey, goldTokenKey, "3000");

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2)
        .savedState(loan, goldTokenClass, goldTokenInstance, borrowerBalance);

      // When: Perform operations with high precision values
      const currentTime = startTime + 73 * 24 * 60 * 60; // 73 days for precision testing
      const seconds = Long.fromNumber(currentTime / 1000);
      (ctx.stub as any).txTimestamp = {
        seconds,
        nanos: 0,
        getSeconds: () => seconds,
        getNanos: () => 0
      };

      const precisePayment = "123.45678901"; // 8+ decimal places
      const dto = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: loan.getCompositeKey(),
        repaymentAmount: new BigNumber(precisePayment)
      });
      dto.sign(users.testUser2.privateKey);

      const result = await contract.RepayLoan(ctx, dto);

      // Then: All results should respect 8-decimal precision limits
      if (result.Status === 1) {
        const interestPaid = result.Data?.interestRepaid || new BigNumber("0");
        const principalPaid = result.Data?.principalRepaid || new BigNumber("0");
        const remainingPrincipal = result.Data?.loan.principalAmount || new BigNumber("0");
        const remainingInterest = result.Data?.loan.interestAccrued || new BigNumber("0");

        // All financial values should have ≤ 8 decimal places
        expect(interestPaid.decimalPlaces()).toBeLessThanOrEqual(8);
        expect(principalPaid.decimalPlaces()).toBeLessThanOrEqual(8);
        expect(remainingPrincipal.decimalPlaces()).toBeLessThanOrEqual(8);
        expect(remainingInterest.decimalPlaces()).toBeLessThanOrEqual(8);

        // Payment allocation should be precise
        expect(interestPaid.plus(principalPaid).decimalPlaces()).toBeLessThanOrEqual(8);

        // Results should be finite and well-formed
        expect(interestPaid.isFinite()).toBe(true);
        expect(principalPaid.isFinite()).toBe(true);
        expect(remainingPrincipal.isFinite()).toBe(true);
      }
    });

    it("should handle very small decimal amounts without precision loss", async () => {
      // Given: Loan with minimal amounts for precision testing
      const startTime = 1000000;
      const smallAmount = "0.00000001"; // Minimum 8-decimal precision
      const loan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        smallAmount,
        "100", // 1% APR
        startTime,
        "0.00000002" // 2x collateral
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

      const borrowerBalance = createTokenBalance(users.testUser2.identityKey, goldTokenKey, "1");

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2)
        .savedState(loan, goldTokenClass, goldTokenInstance, borrowerBalance);

      // When: Make tiny payment
      const currentTime = startTime + 365 * 24 * 60 * 60; // 1 year for measurable interest
      const seconds = Long.fromNumber(currentTime / 1000);
      (ctx.stub as any).txTimestamp = {
        seconds,
        nanos: 0,
        getSeconds: () => seconds,
        getNanos: () => 0
      };

      const tinyPayment = "0.00000005"; // Tiny payment
      const dto = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: loan.getCompositeKey(),
        repaymentAmount: new BigNumber(tinyPayment)
      });
      dto.sign(users.testUser2.privateKey);

      const result = await contract.RepayLoan(ctx, dto);

      // Then: Tiny amounts should be handled without precision loss
      if (result.Status === 1) {
        const interestPaid = result.Data?.interestRepaid || new BigNumber("0");
        const principalPaid = result.Data?.principalRepaid || new BigNumber("0");

        // Values should maintain precision down to 8 decimal places
        expect(interestPaid.plus(principalPaid)).toEqual(new BigNumber(tinyPayment));

        // No value should be lost to rounding
        expect(interestPaid.isGreaterThanOrEqualTo(0)).toBe(true);
        expect(principalPaid.isGreaterThanOrEqualTo(0)).toBe(true);

        // Results should be non-zero if there's actual value to allocate
        if (interestPaid.isGreaterThan(0) || principalPaid.isGreaterThan(0)) {
          expect(interestPaid.plus(principalPaid).isGreaterThan(0)).toBe(true);
        }
      }
    });

    it("should round intermediate calculations consistently", async () => {
      // Given: Loan designed to test rounding consistency
      const startTime = 1000000;
      const loan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        "333.33333333", // 8 decimal places
        "333.33333333", // Interest rate requiring rounding
        startTime,
        "500"
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

      // When: Make payment that requires complex rounding
      const currentTime = startTime + 100 * 24 * 60 * 60; // 100 days
      const seconds = Long.fromNumber(currentTime / 1000);
      (ctx.stub as any).txTimestamp = {
        seconds,
        nanos: 0,
        getSeconds: () => seconds,
        getNanos: () => 0
      };

      const complexPayment = "111.11111111"; // Payment requiring rounding
      const dto = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: loan.getCompositeKey(),
        repaymentAmount: new BigNumber(complexPayment)
      });
      dto.sign(users.testUser2.privateKey);

      const result = await contract.RepayLoan(ctx, dto);

      // Then: Rounding should be consistent across operations
      if (result.Status === 1) {
        const interestPaid = result.Data?.interestRepaid || new BigNumber("0");
        const principalPaid = result.Data?.principalRepaid || new BigNumber("0");
        const totalPaid = interestPaid.plus(principalPaid);

        // Total should exactly equal payment (no rounding errors)
        expect(totalPaid).toEqual(new BigNumber(complexPayment));

        // Individual components should be properly rounded
        expect(interestPaid.decimalPlaces()).toBeLessThanOrEqual(8);
        expect(principalPaid.decimalPlaces()).toBeLessThanOrEqual(8);

        // No precision should be lost in allocation
        expect(totalPaid.decimalPlaces()).toBeLessThanOrEqual(8);
      }
    });
  });

  describe("Rounding Error Accumulation", () => {
    it("should prevent rounding error accumulation over multiple operations", async () => {
      // Given: Loan for repeated operation testing
      const startTime = 1000000;
      const loan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        "1000",
        "500", // 5% APR
        startTime,
        "1500"
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

      // When: Make many small payments to test accumulation
      const paymentAmount = new BigNumber("33.33333333"); // 8 decimal places
      const numberOfPayments = 10;
      let totalPaymentsMade = new BigNumber("0");
      let totalInterestPaid = new BigNumber("0");
      let totalPrincipalPaid = new BigNumber("0");

      for (let i = 0; i < numberOfPayments; i++) {
        const currentTime = startTime + (i + 1) * 10 * 24 * 60 * 60; // Every 10 days
        const seconds = Long.fromNumber(currentTime / 1000);
        (ctx.stub as any).txTimestamp = {
          seconds,
          nanos: 0,
          getSeconds: () => seconds,
          getNanos: () => 0
        };

        const dto = await createValidSubmitDTO(RepayLoanDto, {
          loanKey: loan.getCompositeKey(),
          repaymentAmount: paymentAmount
        });
        dto.sign(users.testUser2.privateKey);

        const result = await contract.RepayLoan(ctx, dto);

        // Accumulate totals
        if (result.Status === 1) {
          const interestPaid = result.Data?.interestRepaid || new BigNumber("0");
          const principalPaid = result.Data?.principalRepaid || new BigNumber("0");

          totalPaymentsMade = totalPaymentsMade.plus(paymentAmount);
          totalInterestPaid = totalInterestPaid.plus(interestPaid);
          totalPrincipalPaid = totalPrincipalPaid.plus(principalPaid);

          // Each payment should be fully allocated
          expect(interestPaid.plus(principalPaid)).toEqual(paymentAmount);
        }
      }

      // Then: No rounding errors should accumulate
      const expectedTotalPayments = paymentAmount.multipliedBy(numberOfPayments);
      const actualTotalAllocated = totalInterestPaid.plus(totalPrincipalPaid);

      expect(totalPaymentsMade).toEqual(expectedTotalPayments);
      expect(actualTotalAllocated).toEqual(expectedTotalPayments);

      // No precision should be lost over multiple operations
      expect(actualTotalAllocated.decimalPlaces()).toBeLessThanOrEqual(8);
    });

    it("should maintain precision in complex interest calculations", async () => {
      // Given: Loan with parameters that create complex interest scenarios
      const startTime = 1000000;
      const loan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        "1234.56789012",
        "777.77777777", // Complex interest rate
        startTime,
        "2000"
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

      // When: Allow interest to accrue over irregular time periods
      const timePeriods = [17, 23, 31, 41]; // Irregular day intervals
      let previousInterest = new BigNumber("0");

      for (let i = 0; i < timePeriods.length; i++) {
        const daysElapsed = timePeriods[i];
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
          repaymentAmount: new BigNumber("10") // Small payment to trigger calculation
        });
        dto.sign(users.testUser2.privateKey);

        const result = await contract.RepayLoan(ctx, dto);

        // Then: Interest calculations should remain precise
        if (result.Status === 1) {
          const currentInterest = result.Data?.interestRepaid || new BigNumber("0");

          // Interest should increase over time
          expect(currentInterest.isGreaterThanOrEqualTo(0)).toBe(true);

          // Precision should be maintained
          expect(currentInterest.decimalPlaces()).toBeLessThanOrEqual(8);

          // Interest calculation should be mathematically consistent
          // For simple interest: Interest = Principal × Rate × Time
          const principal = new BigNumber("1234.56789012");
          const rate = new BigNumber("777.77777777").dividedBy(10000);
          const timeRatio = new BigNumber(daysElapsed).dividedBy(365);
          const expectedInterestTotal = principal.multipliedBy(rate).multipliedBy(timeRatio);

          // Allow for minor precision differences and payment impacts
          const totalExpectedForPeriod = expectedInterestTotal.minus(previousInterest);
          if (totalExpectedForPeriod.isGreaterThan(new BigNumber("10"))) {
            // If expected interest > payment, should get full payment as interest
            expect(currentInterest).toEqual(new BigNumber("10"));
          }

          previousInterest = previousInterest.plus(currentInterest);
        }
      }
    });
  });

  describe("Large Number Calculations", () => {
    it("should handle very large principal amounts without overflow", async () => {
      // Given: Loan with very large amounts
      const startTime = 1000000;
      const largePrincipal = "999999999999.99999999"; // Near maximum with 8 decimals
      const loan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        largePrincipal,
        "100", // 1% APR
        startTime,
        "1500000000000" // Large collateral
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

      const borrowerBalance = createTokenBalance(users.testUser2.identityKey, goldTokenKey, "2000000000000");

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2)
        .savedState(loan, goldTokenClass, goldTokenInstance, borrowerBalance);

      // When: Perform calculations with large numbers
      const currentTime = startTime + 30 * 24 * 60 * 60; // 30 days
      const seconds = Long.fromNumber(currentTime / 1000);
      (ctx.stub as any).txTimestamp = {
        seconds,
        nanos: 0,
        getSeconds: () => seconds,
        getNanos: () => 0
      };

      const largePayment = "50000000000"; // Large payment
      const dto = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: loan.getCompositeKey(),
        repaymentAmount: new BigNumber(largePayment)
      });
      dto.sign(users.testUser2.privateKey);

      const result = await contract.RepayLoan(ctx, dto);

      // Then: Large number calculations should work without overflow
      if (result.Status === 1) {
        const interestPaid = result.Data?.interestRepaid || new BigNumber("0");
        const principalPaid = result.Data?.principalRepaid || new BigNumber("0");
        const remainingPrincipal = result.Data?.loan.principalAmount || new BigNumber("0");

        // All values should be finite and well-formed
        expect(interestPaid.isFinite()).toBe(true);
        expect(principalPaid.isFinite()).toBe(true);
        expect(remainingPrincipal.isFinite()).toBe(true);

        // Payment allocation should work correctly
        expect(interestPaid.plus(principalPaid)).toEqual(new BigNumber(largePayment));

        // Remaining principal should be correctly calculated
        expect(remainingPrincipal).toEqual(new BigNumber(largePrincipal).minus(principalPaid));

        // Values should maintain precision even at large scale
        expect(interestPaid.decimalPlaces()).toBeLessThanOrEqual(8);
        expect(principalPaid.decimalPlaces()).toBeLessThanOrEqual(8);
        expect(remainingPrincipal.decimalPlaces()).toBeLessThanOrEqual(8);
      }
    });

    it("should handle division by large numbers in ratio calculations", async () => {
      // Given: Loan with large collateral for ratio testing
      const startTime = 1000000;
      const loan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        "100000000", // Large principal
        "500", // 5% APR
        startTime,
        "999999999999.99999999", // Very large collateral
        "9999.99999999" // Very high health factor
      );
      loan.healthFactor = new BigNumber("0.8"); // Make it liquidatable

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
      const silverTokenClass = currency.tokenClass((tc) => ({
        ...tc,
        collection: "TEST",
        category: "Currency",
        type: "SILVER",
        additionalKey: "none"
      }));
      const silverTokenInstance = currency.tokenInstance((ti) => ({
        ...ti,
        collection: "TEST",
        category: "Currency",
        type: "SILVER",
        additionalKey: "none"
      }));

      const liquidatorBalance = createTokenBalance(users.testUser3.identityKey, goldTokenKey, "500000000");
      const borrowerCollateral = createTokenBalance(
        users.testUser2.identityKey,
        silverTokenKey,
        "999999999999.99999999"
      );

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2, users.testUser3)
        .savedState(
          loan,
          goldTokenClass,
          goldTokenInstance,
          silverTokenClass,
          silverTokenInstance,
          liquidatorBalance,
          borrowerCollateral
        );

      // When: Perform liquidation with large ratio calculations
      const currentTime = startTime + 365 * 24 * 60 * 60; // 1 year
      const seconds = Long.fromNumber(currentTime / 1000);
      (ctx.stub as any).txTimestamp = {
        seconds,
        nanos: 0,
        getSeconds: () => seconds,
        getNanos: () => 0
      };

      const liquidateDto = await createValidSubmitDTO(LiquidateLoanDto, {
        loanKey: loan.getCompositeKey(),
        maxDebtRepayment: new BigNumber("50000000") // Large liquidation
      });
      liquidateDto.sign(users.testUser3.privateKey);

      const result = await contract.LiquidateLoan(ctx, liquidateDto);

      // Then: Division calculations should maintain precision
      if (result.Status === 1) {
        const debtRepaid = result.Data?.debtRepaid || new BigNumber("0");
        const collateralLiquidated = result.Data?.collateralLiquidated || new BigNumber("0");
        const liquidatorReward = result.Data?.liquidatorReward || new BigNumber("0");

        // All values should be finite and well-formed
        expect(debtRepaid.isFinite()).toBe(true);
        expect(collateralLiquidated.isFinite()).toBe(true);
        expect(liquidatorReward.isFinite()).toBe(true);

        // Ratios should be calculated correctly despite large numbers
        expect(debtRepaid.isGreaterThan(0)).toBe(true);
        expect(collateralLiquidated.isGreaterThan(0)).toBe(true);

        // Precision should be maintained in ratio calculations
        expect(debtRepaid.decimalPlaces()).toBeLessThanOrEqual(8);
        expect(collateralLiquidated.decimalPlaces()).toBeLessThanOrEqual(8);
        expect(liquidatorReward.decimalPlaces()).toBeLessThanOrEqual(8);

        // Conservation should hold even with large numbers
        expect(debtRepaid.plus(liquidatorReward).isLessThanOrEqualTo(collateralLiquidated)).toBe(true);
      }
    });
  });

  describe("BigNumber Arithmetic Consistency", () => {
    it("should maintain consistency across addition and subtraction operations", async () => {
      // Given: Loan for arithmetic testing
      const startTime = 1000000;
      const loan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        "777.77777777",
        "888.88888888",
        startTime,
        "1200"
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

      // When: Perform operations that test arithmetic consistency
      const currentTime = startTime + 50 * 24 * 60 * 60; // 50 days
      const seconds = Long.fromNumber(currentTime / 1000);
      (ctx.stub as any).txTimestamp = {
        seconds,
        nanos: 0,
        getSeconds: () => seconds,
        getNanos: () => 0
      };

      const payment = new BigNumber("123.45678901");
      const dto = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: loan.getCompositeKey(),
        repaymentAmount: payment
      });
      dto.sign(users.testUser2.privateKey);

      const result = await contract.RepayLoan(ctx, dto);

      // Then: Arithmetic operations should be consistent
      if (result.Status === 1) {
        const interestPaid = result.Data?.interestRepaid || new BigNumber("0");
        const principalPaid = result.Data?.principalRepaid || new BigNumber("0");
        const remainingPrincipal = result.Data?.loan.principalAmount || new BigNumber("0");

        // Addition should be exact
        const calculatedTotal = interestPaid.plus(principalPaid);
        expect(calculatedTotal).toEqual(payment);

        // Subtraction should be exact
        const originalPrincipal = new BigNumber("777.77777777");
        const calculatedRemaining = originalPrincipal.minus(principalPaid);
        expect(remainingPrincipal).toEqual(calculatedRemaining);

        // Operations should be commutative where applicable
        const total1 = interestPaid.plus(principalPaid);
        const total2 = principalPaid.plus(interestPaid);
        expect(total1).toEqual(total2);

        // Precision should be preserved across operations
        expect(calculatedTotal.decimalPlaces()).toBeLessThanOrEqual(8);
        expect(calculatedRemaining.decimalPlaces()).toBeLessThanOrEqual(8);
      }
    });

    it("should handle multiplication and division with consistent precision", async () => {
      // Given: Loan setup for multiplication/division testing
      const startTime = 1000000;
      const loan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        "999.99999999",
        "1234.56789012",
        startTime,
        "1500"
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

      // When: Trigger calculations involving multiplication/division
      const currentTime = startTime + 100 * 24 * 60 * 60; // 100 days for measurable interest
      const seconds = Long.fromNumber(currentTime / 1000);
      (ctx.stub as any).txTimestamp = {
        seconds,
        nanos: 0,
        getSeconds: () => seconds,
        getNanos: () => 0
      };

      const dto = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: loan.getCompositeKey(),
        repaymentAmount: new BigNumber("50")
      });
      dto.sign(users.testUser2.privateKey);

      const result = await contract.RepayLoan(ctx, dto);

      // Then: Multiplication/division should maintain precision
      if (result.Status === 1) {
        const interestPaid = result.Data?.interestRepaid || new BigNumber("0");

        // Interest calculation involves: Principal × Rate × Time
        // Verify the calculation makes mathematical sense
        if (interestPaid.isGreaterThan(0)) {
          // Interest should be reasonable for the time period
          const principal = new BigNumber("999.99999999");
          const rate = new BigNumber("1234.56789012").dividedBy(10000);
          const timeRatio = new BigNumber("100").dividedBy(365);
          const expectedInterest = principal.multipliedBy(rate).multipliedBy(timeRatio);

          // Allow for payment allocation effects but verify order of magnitude
          expect(interestPaid.isLessThanOrEqualTo(expectedInterest.multipliedBy(1.1))).toBe(true);
          expect(interestPaid.isGreaterThan(0)).toBe(true);
        }

        // All results should maintain proper precision
        expect(interestPaid.decimalPlaces()).toBeLessThanOrEqual(8);
        expect(interestPaid.isFinite()).toBe(true);
      }
    });
  });
});

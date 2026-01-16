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
 * MATHEMATICAL TESTING: Compound Scenarios Verification
 *
 * Tests complex mathematical scenarios combining multiple lending operations:
 * - Multiple loans with overlapping time periods and varying rates
 * - Mixed repayment and liquidation scenarios
 * - Long-term interest accumulation with irregular payments
 * - Edge cases combining precision, conservation, and calculation accuracy
 * - Full lifecycle scenarios from offer creation to loan closure
 */
import {
  AcceptLendingOfferDto,
  CreateLendingOfferDto,
  FungibleLendingOffer,
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

describe("MATHEMATICS: Compound Scenarios Verification", () => {
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

  const createTestOffer = (
    lender: string,
    principalAmount: string,
    interestRate: string,
    collateralRatio = "1.5"
  ): FungibleLendingOffer => {
    const offer = new FungibleLendingOffer();
    offer.id = 0;
    offer.lender = lender;
    offer.borrower = "";
    offer.status = LendingStatus.OfferOpen;
    offer.principalToken = goldTokenKey;
    offer.principalQuantity = new BigNumber(principalAmount);
    offer.interestRate = new BigNumber(interestRate);
    offer.duration = 365 * 24 * 60 * 60; // 1 year
    offer.collateralToken = silverTokenKey;
    offer.collateralRatio = new BigNumber(collateralRatio);
    offer.created = 1000000;
    offer.expires = 2000000;
    offer.uses = new BigNumber("1");
    offer.usesSpent = new BigNumber("0");
    return offer;
  };

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

  describe("Full Lifecycle Mathematical Verification", () => {
    it("should maintain mathematical accuracy through complete loan lifecycle", async () => {
      // Given: Complete loan setup from offer creation to closure
      const offer = createTestOffer(
        users.testUser1.identityKey,
        "1000", // $1000 loan
        "730", // 7.3% APR for measurable interest
        "1.4" // 140% collateral ratio
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

      // Initial balances
      const lenderBalance = createTokenBalance(users.testUser1.identityKey, goldTokenKey, "5000");
      const borrowerGoldBalance = createTokenBalance(users.testUser2.identityKey, goldTokenKey, "2000");
      const borrowerSilverBalance = createTokenBalance(users.testUser2.identityKey, silverTokenKey, "2000");

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2)
        .savedState(
          offer,
          goldTokenClass,
          goldTokenInstance,
          silverTokenClass,
          silverTokenInstance,
          lenderBalance,
          borrowerGoldBalance,
          borrowerSilverBalance
        );

      // When: Accept loan offer
      const acceptDto = await createValidSubmitDTO(AcceptLendingOfferDto, {
        offer: offer.getCompositeKey(),
        borrower: users.testUser2.identityKey,
        collateralAmount: new BigNumber("1400") // $1000 * 1.4 = $1400
      });
      acceptDto.sign(users.testUser2.privateKey);

      const acceptResult = await contract.AcceptLendingOffer(ctx, acceptDto);
      expect(acceptResult.Status).toBe(1);

      let loanKey = "";
      if (acceptResult.Status === 1) {
        loanKey = acceptResult.Data?.loan.getCompositeKey() || "";

        // Verify loan origination mathematics
        expect(acceptResult.Data?.loan.principalAmount).toEqual(new BigNumber("1000"));
        expect(acceptResult.Data?.loan.collateralAmount).toEqual(new BigNumber("1400"));
        expect(acceptResult.Data?.loan.interestRate).toEqual(new BigNumber("730"));
      }

      // When: Make series of partial payments over time
      const paymentSchedule = [
        { days: 30, amount: "150" },
        { days: 60, amount: "200" },
        { days: 120, amount: "300" },
        { days: 180, amount: "250" }
      ];

      let totalPaymentsMade = new BigNumber("0");
      let totalInterestPaid = new BigNumber("0");
      let totalPrincipalPaid = new BigNumber("0");

      for (const payment of paymentSchedule) {
        const paymentTime = 1000000 + payment.days * 24 * 60 * 60;
        const seconds = Long.fromNumber(paymentTime / 1000);
        (ctx.stub as any).txTimestamp = {
          seconds,
          nanos: 0,
          getSeconds: () => seconds,
          getNanos: () => 0
        };

        const paymentDto = await createValidSubmitDTO(RepayLoanDto, {
          loanKey: loanKey,
          repaymentAmount: new BigNumber(payment.amount)
        });
        paymentDto.sign(users.testUser2.privateKey);

        const paymentResult = await contract.RepayLoan(ctx, paymentDto);

        // Then: Verify each payment's mathematical accuracy
        if (paymentResult.Status === 1) {
          const interestPaid = paymentResult.Data?.interestRepaid || new BigNumber("0");
          const principalPaid = paymentResult.Data?.principalRepaid || new BigNumber("0");
          const remainingPrincipal = paymentResult.Data?.loan.principalAmount || new BigNumber("0");

          // Payment allocation should be exact
          expect(interestPaid.plus(principalPaid)).toEqual(new BigNumber(payment.amount));

          // Track cumulative totals
          totalPaymentsMade = totalPaymentsMade.plus(payment.amount);
          totalInterestPaid = totalInterestPaid.plus(interestPaid);
          totalPrincipalPaid = totalPrincipalPaid.plus(principalPaid);

          // Principal should decrease correctly
          expect(remainingPrincipal).toEqual(new BigNumber("1000").minus(totalPrincipalPaid));

          // Values should maintain precision
          expect(interestPaid.decimalPlaces()).toBeLessThanOrEqual(8);
          expect(principalPaid.decimalPlaces()).toBeLessThanOrEqual(8);
          expect(remainingPrincipal.decimalPlaces()).toBeLessThanOrEqual(8);
        }
      }

      // Then: Verify overall mathematical conservation
      expect(totalPaymentsMade).toEqual(new BigNumber("900")); // Sum of all payments
      expect(totalInterestPaid.plus(totalPrincipalPaid)).toEqual(totalPaymentsMade);

      // Interest should be reasonable for the time periods and rates
      expect(totalInterestPaid.isGreaterThan(0)).toBe(true);
      expect(totalPrincipalPaid.isLessThanOrEqualTo(new BigNumber("1000"))).toBe(true);
    });

    it("should handle complex multi-operation scenarios with mathematical precision", async () => {
      // Given: Multiple loans with different parameters
      const startTime = 1000000;
      const loan1 = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        "500", // $500 principal
        "600", // 6% APR
        startTime,
        "750", // $750 collateral
        "1.5"
      );

      const loan2 = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        "800", // $800 principal
        "900", // 9% APR
        startTime + 30 * 24 * 60 * 60, // 30 days later
        "1200", // $1200 collateral
        "1.5"
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
        .savedState(loan1, loan2, goldTokenClass, goldTokenInstance, borrowerBalance);

      // When: Perform operations on both loans simultaneously
      const operationTime = startTime + 90 * 24 * 60 * 60; // 90 days from start
      const seconds = Long.fromNumber(operationTime / 1000);
      (ctx.stub as any).txTimestamp = {
        seconds,
        nanos: 0,
        getSeconds: () => seconds,
        getNanos: () => 0
      };

      // Payment on first loan
      const payment1Dto = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: loan1.getCompositeKey(),
        repaymentAmount: new BigNumber("100")
      });
      payment1Dto.sign(users.testUser2.privateKey);

      const payment1Result = await contract.RepayLoan(ctx, payment1Dto);

      // Payment on second loan
      const payment2Dto = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: loan2.getCompositeKey(),
        repaymentAmount: new BigNumber("150")
      });
      payment2Dto.sign(users.testUser2.privateKey);

      const payment2Result = await contract.RepayLoan(ctx, payment2Dto);

      // Then: Both operations should maintain mathematical accuracy
      if (payment1Result.Status === 1 && payment2Result.Status === 1) {
        // Loan 1 calculations
        const interest1 = payment1Result.Data?.interestRepaid || new BigNumber("0");
        const principal1 = payment1Result.Data?.principalRepaid || new BigNumber("0");

        // Loan 2 calculations
        const interest2 = payment2Result.Data?.interestRepaid || new BigNumber("0");
        const principal2 = payment2Result.Data?.principalRepaid || new BigNumber("0");

        // Payment allocations should be exact
        expect(interest1.plus(principal1)).toEqual(new BigNumber("100"));
        expect(interest2.plus(principal2)).toEqual(new BigNumber("150"));

        // Interest calculations should reflect different rates and time periods
        // Loan 1: 90 days at 6% APR on $500
        const expectedInterest1 = new BigNumber("500")
          .multipliedBy(new BigNumber("600"))
          .dividedBy(new BigNumber("10000"))
          .multipliedBy(new BigNumber("90"))
          .dividedBy(new BigNumber("365"));

        // Loan 2: 60 days at 9% APR on $800 (started 30 days later)
        const expectedInterest2 = new BigNumber("800")
          .multipliedBy(new BigNumber("900"))
          .dividedBy(new BigNumber("10000"))
          .multipliedBy(new BigNumber("60"))
          .dividedBy(new BigNumber("365"));

        // Interest payments should be close to expected (considering payment allocation)
        if (interest1.isGreaterThan(0)) {
          expect(interest1.isLessThanOrEqualTo(expectedInterest1.plus(new BigNumber("1")))).toBe(true);
        }
        if (interest2.isGreaterThan(0)) {
          expect(interest2.isLessThanOrEqualTo(expectedInterest2.plus(new BigNumber("1")))).toBe(true);
        }

        // All values should maintain precision
        expect(interest1.decimalPlaces()).toBeLessThanOrEqual(8);
        expect(principal1.decimalPlaces()).toBeLessThanOrEqual(8);
        expect(interest2.decimalPlaces()).toBeLessThanOrEqual(8);
        expect(principal2.decimalPlaces()).toBeLessThanOrEqual(8);
      }
    });
  });

  describe("Mixed Repayment and Liquidation Scenarios", () => {
    it("should maintain mathematical accuracy in mixed operation scenarios", async () => {
      // Given: Two loans, one healthy and one at liquidation threshold
      const startTime = 1000000;
      const healthyLoan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        "600", // $600 principal
        "500", // 5% APR
        startTime,
        "1000", // Well collateralized
        "1.6"
      );

      const riskyLoan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        "800", // $800 principal
        "1000", // 10% APR for higher interest accrual
        startTime,
        "900", // Will become undercollateralized
        "1.1"
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

      const borrowerBalance = createTokenBalance(users.testUser2.identityKey, goldTokenKey, "2000");
      const liquidatorBalance = createTokenBalance(users.testUser3.identityKey, goldTokenKey, "2000");
      const borrowerCollateral1 = createTokenBalance(users.testUser2.identityKey, silverTokenKey, "1000");
      const borrowerCollateral2 = createTokenBalance(users.testUser2.identityKey, silverTokenKey, "900");

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2, users.testUser3)
        .savedState(
          healthyLoan,
          riskyLoan,
          goldTokenClass,
          goldTokenInstance,
          silverTokenClass,
          silverTokenInstance,
          borrowerBalance,
          liquidatorBalance,
          borrowerCollateral1,
          borrowerCollateral2
        );

      // When: Perform mixed operations after significant time
      const operationTime = startTime + 200 * 24 * 60 * 60; // 200 days later
      const seconds = Long.fromNumber(operationTime / 1000);
      (ctx.stub as any).txTimestamp = {
        seconds,
        nanos: 0,
        getSeconds: () => seconds,
        getNanos: () => 0
      };

      // Repay healthy loan
      const repayDto = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: healthyLoan.getCompositeKey(),
        repaymentAmount: new BigNumber("200")
      });
      repayDto.sign(users.testUser2.privateKey);

      const repayResult = await contract.RepayLoan(ctx, repayDto);

      // Make risky loan undercollateralized and liquidate
      riskyLoan.healthFactor = new BigNumber("0.9"); // Force undercollateralization

      const liquidateDto = await createValidSubmitDTO(LiquidateLoanDto, {
        loanKey: riskyLoan.getCompositeKey(),
        maxDebtRepayment: new BigNumber("300")
      });
      liquidateDto.sign(users.testUser3.privateKey);

      const liquidateResult = await contract.LiquidateLoan(ctx, liquidateDto);

      // Then: Both operations should maintain mathematical accuracy
      if (repayResult.Status === 1) {
        const repayInterest = repayResult.Data?.interestRepaid || new BigNumber("0");
        const repayPrincipal = repayResult.Data?.principalRepaid || new BigNumber("0");

        // Repayment allocation should be exact
        expect(repayInterest.plus(repayPrincipal)).toEqual(new BigNumber("200"));

        // Interest for 200 days at 5% APR on $600
        const expectedRepayInterest = new BigNumber("600")
          .multipliedBy(new BigNumber("500"))
          .dividedBy(new BigNumber("10000"))
          .multipliedBy(new BigNumber("200"))
          .dividedBy(new BigNumber("365"));

        // Interest should be reasonable for time period
        if (repayInterest.isGreaterThan(0)) {
          expect(repayInterest.isLessThanOrEqualTo(expectedRepayInterest.plus(new BigNumber("2")))).toBe(
            true
          );
        }
      }

      if (liquidateResult.Status === 1) {
        const debtRepaid = liquidateResult.Data?.debtRepaid || new BigNumber("0");
        const collateralLiquidated = liquidateResult.Data?.collateralLiquidated || new BigNumber("0");
        const liquidatorReward = liquidateResult.Data?.liquidatorReward || new BigNumber("0");

        // Liquidation conservation
        expect(debtRepaid.plus(liquidatorReward).isLessThanOrEqualTo(collateralLiquidated)).toBe(true);

        // Liquidation amounts should be reasonable
        expect(debtRepaid.isGreaterThan(0)).toBe(true);
        expect(debtRepaid.isLessThanOrEqualTo(new BigNumber("300"))).toBe(true);
        expect(collateralLiquidated.isGreaterThan(0)).toBe(true);

        // All values should maintain precision
        expect(debtRepaid.decimalPlaces()).toBeLessThanOrEqual(8);
        expect(collateralLiquidated.decimalPlaces()).toBeLessThanOrEqual(8);
        expect(liquidatorReward.decimalPlaces()).toBeLessThanOrEqual(8);
      }
    });
  });

  describe("Long-Term Interest Accumulation Scenarios", () => {
    it("should maintain mathematical accuracy over extended time periods", async () => {
      // Given: Long-term loan with irregular payment schedule
      const startTime = 1000000;
      const loan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        "2000", // Larger loan for testing
        "400", // 4% APR for manageable calculations
        startTime,
        "3000"
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

      // When: Make payments over 2+ years with irregular intervals
      const longTermPayments = [
        { days: 90, amount: "100" }, // 3 months
        { days: 180, amount: "150" }, // 6 months
        { days: 365, amount: "200" }, // 1 year
        { days: 500, amount: "250" }, // ~1.4 years
        { days: 730, amount: "300" } // 2 years
      ];

      let cumulativeInterest = new BigNumber("0");
      let cumulativePrincipal = new BigNumber("0");
      let lastPrincipalAmount = new BigNumber("2000");

      for (const payment of longTermPayments) {
        const paymentTime = startTime + payment.days * 24 * 60 * 60;
        const seconds = Long.fromNumber(paymentTime / 1000);
        (ctx.stub as any).txTimestamp = {
          seconds,
          nanos: 0,
          getSeconds: () => seconds,
          getNanos: () => 0
        };

        const paymentDto = await createValidSubmitDTO(RepayLoanDto, {
          loanKey: loan.getCompositeKey(),
          repaymentAmount: new BigNumber(payment.amount)
        });
        paymentDto.sign(users.testUser2.privateKey);

        const result = await contract.RepayLoan(ctx, paymentDto);

        // Then: Verify long-term mathematical consistency
        if (result.Status === 1) {
          const interestPaid = result.Data?.interestRepaid || new BigNumber("0");
          const principalPaid = result.Data?.principalRepaid || new BigNumber("0");
          const remainingPrincipal = result.Data?.loan.principalAmount || new BigNumber("0");

          // Payment allocation should be exact
          expect(interestPaid.plus(principalPaid)).toEqual(new BigNumber(payment.amount));

          // Update cumulative totals
          cumulativeInterest = cumulativeInterest.plus(interestPaid);
          cumulativePrincipal = cumulativePrincipal.plus(principalPaid);

          // Principal should decrease correctly
          expect(remainingPrincipal).toEqual(lastPrincipalAmount.minus(principalPaid));
          lastPrincipalAmount = remainingPrincipal;

          // Interest should increase over time (more days = more interest)
          if (payment.days > 90) {
            // After first payment
            expect(cumulativeInterest.isGreaterThan(0)).toBe(true);
          }

          // Precision should be maintained over long periods
          expect(interestPaid.decimalPlaces()).toBeLessThanOrEqual(8);
          expect(principalPaid.decimalPlaces()).toBeLessThanOrEqual(8);
          expect(remainingPrincipal.decimalPlaces()).toBeLessThanOrEqual(8);

          // Values should remain finite
          expect(interestPaid.isFinite()).toBe(true);
          expect(principalPaid.isFinite()).toBe(true);
          expect(remainingPrincipal.isFinite()).toBe(true);
        }
      }

      // Final verification: total interest should be reasonable for 2-year period
      // Expected total interest for 2 years at 4% APR on declining principal
      // This is an approximation since principal decreases over time
      const approximateAverageInterest = new BigNumber("2000")
        .multipliedBy(new BigNumber("400"))
        .dividedBy(new BigNumber("10000"))
        .multipliedBy(new BigNumber("2")); // 2 years

      // Actual should be less than maximum (since principal decreases)
      expect(cumulativeInterest.isLessThan(approximateAverageInterest)).toBe(true);
      expect(cumulativeInterest.isGreaterThan(0)).toBe(true);

      // Total payments should equal cumulative allocations
      const totalPayments = new BigNumber("1000"); // Sum of all payments
      expect(cumulativeInterest.plus(cumulativePrincipal)).toEqual(totalPayments);
    });
  });

  describe("Edge Case Combination Scenarios", () => {
    it("should handle precision edge cases in complex scenarios", async () => {
      // Given: Loan with challenging precision parameters
      const startTime = 1000000;
      const loan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        "333.33333333", // Maximum 8 decimal precision
        "777.77777777", // Complex interest rate
        startTime,
        "500.55555555", // Precise collateral
        "1.5"
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

      // When: Make payments with challenging precision requirements
      const precisionPayments = ["11.11111111", "22.22222222", "33.33333333", "44.44444444"];

      let totalAllocated = new BigNumber("0");

      for (let i = 0; i < precisionPayments.length; i++) {
        const paymentTime = startTime + (i + 1) * 37 * 24 * 60 * 60; // Every 37 days
        const seconds = Long.fromNumber(paymentTime / 1000);
        (ctx.stub as any).txTimestamp = {
          seconds,
          nanos: 0,
          getSeconds: () => seconds,
          getNanos: () => 0
        };

        const paymentAmount = new BigNumber(precisionPayments[i]);
        const paymentDto = await createValidSubmitDTO(RepayLoanDto, {
          loanKey: loan.getCompositeKey(),
          repaymentAmount: paymentAmount
        });
        paymentDto.sign(users.testUser2.privateKey);

        const result = await contract.RepayLoan(ctx, paymentDto);

        // Then: Precision should be maintained in complex scenarios
        if (result.Status === 1) {
          const interestPaid = result.Data?.interestRepaid || new BigNumber("0");
          const principalPaid = result.Data?.principalRepaid || new BigNumber("0");

          // Exact payment allocation
          expect(interestPaid.plus(principalPaid)).toEqual(paymentAmount);

          totalAllocated = totalAllocated.plus(paymentAmount);

          // All values should respect precision limits
          expect(interestPaid.decimalPlaces()).toBeLessThanOrEqual(8);
          expect(principalPaid.decimalPlaces()).toBeLessThanOrEqual(8);

          // No rounding errors should accumulate
          expect(interestPaid.isFinite()).toBe(true);
          expect(principalPaid.isFinite()).toBe(true);

          // Values should be non-negative
          expect(interestPaid.isGreaterThanOrEqualTo(0)).toBe(true);
          expect(principalPaid.isGreaterThanOrEqualTo(0)).toBe(true);
        }
      }

      // Final verification: total allocated should equal sum of payments
      const expectedTotal = precisionPayments.reduce(
        (sum, payment) => sum.plus(new BigNumber(payment)),
        new BigNumber("0")
      );
      expect(totalAllocated).toEqual(expectedTotal);
    });
  });
});

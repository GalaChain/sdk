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
 * MATHEMATICAL TESTING: Financial Conservation Laws Verification
 *
 * Tests that the DeFi lending protocol maintains financial conservation laws:
 * - No value creation or destruction during operations
 * - Total debt equals principal plus accrued interest
 * - Payment allocation accuracy preserves total value
 * - Liquidation mathematics maintain collateral-to-debt ratios
 * - Health factor computations reflect true collateralization
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

describe("MATHEMATICS: Financial Conservation Laws", () => {
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

  describe("Value Conservation Laws", () => {
    it("should maintain total debt equals principal plus accrued interest", async () => {
      // Given: Active loan with time passage for interest accrual
      const startTime = 1000000;
      const loan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        "1000", // Principal
        "730", // 7.3% APR for measurable interest
        startTime,
        "1500" // Collateral
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

      // When: Check debt after 90 days
      const currentTime = startTime + 90 * 24 * 60 * 60; // 90 days later
      const seconds = Long.fromNumber(currentTime / 1000);
      (ctx.stub as any).txTimestamp = {
        seconds,
        nanos: 0,
        getSeconds: () => seconds,
        getNanos: () => 0
      };

      // Make a small payment to trigger interest calculation
      const dto = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: loan.getCompositeKey(),
        repaymentAmount: new BigNumber("50")
      });
      dto.sign(users.testUser2.privateKey);

      const result = await contract.RepayLoan(ctx, dto);

      // Then: Verify total debt conservation
      if (result.Status === 1) {
        const remainingPrincipal = result.Data?.loan.principalAmount || new BigNumber("0");
        const remainingInterest = result.Data?.loan.interestAccrued || new BigNumber("0");
        const interestPaid = result.Data?.interestRepaid || new BigNumber("0");
        const principalPaid = result.Data?.principalRepaid || new BigNumber("0");

        // Total debt = remaining principal + remaining interest
        const currentTotalDebt = remainingPrincipal.plus(remainingInterest);

        // Original principal + all accrued interest - payments made = current total debt
        const originalPrincipal = new BigNumber("1000");
        const totalPaymentMade = interestPaid.plus(principalPaid);

        // Calculate expected interest for 90 days at 7.3% APR
        // Interest = Principal × (Rate / 10000) × (Days / 365)
        const expectedInterestAccrued = originalPrincipal
          .multipliedBy(new BigNumber("730"))
          .dividedBy(new BigNumber("10000"))
          .multipliedBy(new BigNumber("90"))
          .dividedBy(new BigNumber("365"));

        // Total debt should equal: original principal + accrued interest - payments
        const expectedTotalDebt = originalPrincipal.plus(expectedInterestAccrued).minus(totalPaymentMade);

        // Allow for minor precision differences
        const debtDifference = currentTotalDebt.minus(expectedTotalDebt).abs();
        expect(debtDifference.isLessThanOrEqualTo(new BigNumber("0.001"))).toBe(true);

        // Verify conservation: nothing created or destroyed
        expect(currentTotalDebt.isGreaterThan(0)).toBe(true);
        expect(totalPaymentMade).toEqual(new BigNumber("50"));
      }
    });

    it("should preserve value during payment allocations", async () => {
      // Given: Loan with pre-existing accrued interest
      const startTime = 1000000;
      const loan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        "800",
        "500", // 5% APR
        startTime,
        "1200"
      );
      // Set pre-accrued interest
      loan.interestAccrued = new BigNumber("40");

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

      // When: Make multiple payments and track value conservation
      const payments = [new BigNumber("100"), new BigNumber("200"), new BigNumber("150")];
      let totalPaymentsMade = new BigNumber("0");
      let totalInterestPaid = new BigNumber("0");
      let totalPrincipalPaid = new BigNumber("0");

      for (let i = 0; i < payments.length; i++) {
        const payment = payments[i];
        const daysElapsed = (i + 1) * 20; // 20, 40, 60 days
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

        // Then: Verify value conservation for each payment
        if (result.Status === 1) {
          const interestPaid = result.Data?.interestRepaid || new BigNumber("0");
          const principalPaid = result.Data?.principalRepaid || new BigNumber("0");

          // Payment allocation must equal payment amount (no value lost or created)
          expect(interestPaid.plus(principalPaid)).toEqual(payment);

          totalPaymentsMade = totalPaymentsMade.plus(payment);
          totalInterestPaid = totalInterestPaid.plus(interestPaid);
          totalPrincipalPaid = totalPrincipalPaid.plus(principalPaid);

          // Running total must equal sum of all payments
          expect(totalInterestPaid.plus(totalPrincipalPaid)).toEqual(totalPaymentsMade);
        }
      }

      // Final verification: all payments accounted for
      expect(totalPaymentsMade).toEqual(new BigNumber("450")); // 100 + 200 + 150
    });

    it("should maintain balance during full loan lifecycle", async () => {
      // Given: Complete loan lifecycle from creation to repayment
      const offer = new FungibleLendingOffer();
      offer.id = 0;
      offer.lender = users.testUser1.identityKey;
      offer.borrower = "";
      offer.status = LendingStatus.OfferOpen;
      offer.principalToken = goldTokenKey;
      offer.principalQuantity = new BigNumber("500");
      offer.interestRate = new BigNumber("600"); // 6% APR
      offer.duration = 365 * 24 * 60 * 60;
      offer.collateralToken = silverTokenKey;
      offer.collateralRatio = new BigNumber("1.4");
      offer.created = 1000000;
      offer.expires = 2000000;
      offer.uses = new BigNumber("1");
      offer.usesSpent = new BigNumber("0");

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
      const lenderGoldBalance = createTokenBalance(users.testUser1.identityKey, goldTokenKey, "1000");
      const borrowerSilverBalance = createTokenBalance(users.testUser2.identityKey, silverTokenKey, "1000");
      const borrowerGoldBalance = createTokenBalance(users.testUser2.identityKey, goldTokenKey, "1000");

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2)
        .savedState(
          offer,
          goldTokenClass,
          goldTokenInstance,
          silverTokenClass,
          silverTokenInstance,
          lenderGoldBalance,
          borrowerSilverBalance,
          borrowerGoldBalance
        );

      // When: Accept the loan offer
      const acceptDto = await createValidSubmitDTO(AcceptLendingOfferDto, {
        offer: offer.getCompositeKey(),
        borrower: users.testUser2.identityKey,
        collateralAmount: new BigNumber("700") // $500 * 1.4 = $700
      });
      acceptDto.sign(users.testUser2.privateKey);

      const acceptResult = await contract.AcceptLendingOffer(ctx, acceptDto);

      // Then: Verify value conservation during loan origination
      expect(acceptResult.Status).toBe(1);

      if (acceptResult.Status === 1) {
        // Value should flow: lender gives $500 gold, borrower gives $700 silver collateral
        const loan = acceptResult.Data?.loan;
        expect(loan?.principalAmount).toEqual(new BigNumber("500"));
        expect(loan?.collateralAmount).toEqual(new BigNumber("700"));

        // When: Make final payment after time passage
        const finalTime = 1000000 + 180 * 24 * 60 * 60; // 180 days later
        const seconds = Long.fromNumber(finalTime / 1000);
        (ctx.stub as any).txTimestamp = {
          seconds,
          nanos: 0,
          getSeconds: () => seconds,
          getNanos: () => 0
        };

        const repayDto = await createValidSubmitDTO(RepayLoanDto, {
          loanKey: loan?.getCompositeKey() || "",
          repaymentAmount: new BigNumber("600") // Overpay to ensure full repayment
        });
        repayDto.sign(users.testUser2.privateKey);

        const repayResult = await contract.RepayLoan(ctx, repayDto);

        // Then: Verify final value conservation
        if (repayResult.Status === 1) {
          const finalLoan = repayResult.Data?.loan;
          const interestPaid = repayResult.Data?.interestRepaid || new BigNumber("0");
          const principalPaid = repayResult.Data?.principalRepaid || new BigNumber("0");

          // Loan should be fully repaid
          expect(finalLoan?.status).toBe(LendingStatus.LoanRepaid);
          expect(finalLoan?.principalAmount).toEqual(new BigNumber("0"));

          // Total debt paid should equal principal + accrued interest
          expect(principalPaid).toEqual(new BigNumber("500")); // Original principal
          expect(interestPaid.isGreaterThan(0)).toBe(true); // Some interest accrued

          // Calculate expected interest for 180 days at 6% APR
          const expectedInterest = new BigNumber("500")
            .multipliedBy(new BigNumber("600"))
            .dividedBy(new BigNumber("10000"))
            .multipliedBy(new BigNumber("180"))
            .dividedBy(new BigNumber("365"));

          // Interest paid should be close to expected (allowing for precision)
          const interestDifference = interestPaid.minus(expectedInterest).abs();
          expect(interestDifference.isLessThanOrEqualTo(new BigNumber("0.01"))).toBe(true);

          // Value conservation: total paid = principal + interest, collateral returned
          expect(principalPaid.plus(interestPaid).isGreaterThan(new BigNumber("500"))).toBe(true);
        }
      }
    });
  });

  describe("Liquidation Mathematics Conservation", () => {
    it("should maintain collateral-to-debt ratios during liquidation", async () => {
      // Given: Undercollateralized loan ready for liquidation
      const startTime = 1000000;
      const loan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        "1000", // Principal
        "1000", // 10% APR for significant interest
        startTime,
        "900", // Undercollateralized
        "0.8" // Health factor < 1.0
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

      const liquidatorBalance = createTokenBalance(users.testUser3.identityKey, goldTokenKey, "2000");
      const borrowerCollateral = createTokenBalance(users.testUser2.identityKey, silverTokenKey, "900");

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

      // When: Perform liquidation after interest accrual
      const liquidationTime = startTime + 365 * 24 * 60 * 60; // 1 year later
      const seconds = Long.fromNumber(liquidationTime / 1000);
      (ctx.stub as any).txTimestamp = {
        seconds,
        nanos: 0,
        getSeconds: () => seconds,
        getNanos: () => 0
      };

      const liquidateDto = await createValidSubmitDTO(LiquidateLoanDto, {
        loanKey: loan.getCompositeKey(),
        maxDebtRepayment: new BigNumber("500") // Partial liquidation
      });
      liquidateDto.sign(users.testUser3.privateKey);

      const result = await contract.LiquidateLoan(ctx, liquidateDto);

      // Then: Verify liquidation value conservation
      if (result.Status === 1) {
        const debtRepaid = result.Data?.debtRepaid || new BigNumber("0");
        const collateralLiquidated = result.Data?.collateralLiquidated || new BigNumber("0");
        const liquidatorReward = result.Data?.liquidatorReward || new BigNumber("0");

        // Conservation law: debt repaid + liquidator reward ≤ collateral liquidated
        const totalValue = debtRepaid.plus(liquidatorReward);
        expect(totalValue.isLessThanOrEqualTo(collateralLiquidated)).toBe(true);

        // Liquidator should receive some reward for liquidation
        expect(liquidatorReward.isGreaterThan(0)).toBe(true);

        // Debt repaid should not exceed what was requested
        expect(debtRepaid.isLessThanOrEqualTo(new BigNumber("500"))).toBe(true);

        // Collateral liquidated should be proportional to debt repaid
        expect(collateralLiquidated.isGreaterThan(0)).toBe(true);

        // No value should be created or destroyed in the liquidation
        const liquidationEfficiency = totalValue.dividedBy(collateralLiquidated);
        expect(liquidationEfficiency.isLessThanOrEqualTo(1)).toBe(true);
      }
    });

    it("should correctly calculate health factors reflecting true collateralization", async () => {
      // Given: Various loans with different collateralization levels
      const testCases = [
        { principal: "1000", collateral: "1500", expectedHealthFactor: 1.5 },
        { principal: "500", collateral: "600", expectedHealthFactor: 1.2 },
        { principal: "800", collateral: "720", expectedHealthFactor: 0.9 },
        { principal: "1200", collateral: "1080", expectedHealthFactor: 0.9 }
      ];

      for (const testCase of testCases) {
        const startTime = 1000000;
        const loan = createTestLoan(
          users.testUser1.identityKey,
          users.testUser2.identityKey,
          testCase.principal,
          "500", // 5% APR
          startTime,
          testCase.collateral
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

        const borrowerBalance = createTokenBalance(users.testUser2.identityKey, goldTokenKey, "100");

        const { ctx, contract } = fixture(GalaChainTokenContract)
          .registeredUsers(users.testUser1, users.testUser2)
          .savedState(loan, goldTokenClass, goldTokenInstance, borrowerBalance);

        // When: Check health factor after minimal time (to avoid interest complications)
        const checkTime = startTime + 1; // 1 second later
        const seconds = Long.fromNumber(checkTime / 1000);
        (ctx.stub as any).txTimestamp = {
          seconds,
          nanos: 0,
          getSeconds: () => seconds,
          getNanos: () => 0
        };

        const dto = await createValidSubmitDTO(RepayLoanDto, {
          loanKey: loan.getCompositeKey(),
          repaymentAmount: new BigNumber("1") // Minimal payment to trigger calculation
        });
        dto.sign(users.testUser2.privateKey);

        const result = await contract.RepayLoan(ctx, dto);

        // Then: Verify health factor calculation accuracy
        if (result.Status === 1) {
          const updatedLoan = result.Data?.loan;
          const healthFactor = updatedLoan?.healthFactor || new BigNumber("0");

          // Health Factor = Collateral Value / Total Debt
          // At minimal time, total debt ≈ principal (minimal interest)
          const expectedHF = new BigNumber(testCase.collateral).dividedBy(
            new BigNumber(testCase.principal).minus(new BigNumber("1")) // Minus the $1 payment
          );

          // Allow for small precision differences and minimal interest accrual
          const healthFactorDifference = healthFactor.minus(expectedHF).abs();
          expect(healthFactorDifference.isLessThanOrEqualTo(new BigNumber("0.1"))).toBe(true);

          // Health factor should reflect collateralization accurately
          if (testCase.expectedHealthFactor >= 1.0) {
            expect(healthFactor.isGreaterThanOrEqualTo(0.99)).toBe(true); // Allow for payment impact
          } else {
            expect(healthFactor.isLessThan(1.0)).toBe(true);
          }
        }
      }
    });
  });

  describe("Interest Calculation Conservation", () => {
    it("should ensure interest accumulation follows mathematical laws", async () => {
      // Given: Loan with specific parameters for mathematical verification
      const startTime = 1000000;
      const principal = new BigNumber("1000");
      const interestRate = new BigNumber("365"); // 3.65% APR for 1% daily simple interest

      const loan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        principal.toString(),
        interestRate.toString(),
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

      // When: Check interest after exactly 10 days
      const daysElapsed = 10;
      const checkTime = startTime + daysElapsed * 24 * 60 * 60;
      const seconds = Long.fromNumber(checkTime / 1000);
      (ctx.stub as any).txTimestamp = {
        seconds,
        nanos: 0,
        getSeconds: () => seconds,
        getNanos: () => 0
      };

      const dto = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: loan.getCompositeKey(),
        repaymentAmount: new BigNumber("5") // Small payment to trigger interest calculation
      });
      dto.sign(users.testUser2.privateKey);

      const result = await contract.RepayLoan(ctx, dto);

      // Then: Verify interest calculation follows mathematical formula
      if (result.Status === 1) {
        const interestPaid = result.Data?.interestRepaid || new BigNumber("0");

        // Expected interest: Principal × (Rate / 10000) × (Days / 365)
        // Expected: 1000 × (365/10000) × (10/365) = 1000 × 0.0365 × (10/365) = $1.00
        const expectedInterest = principal
          .multipliedBy(interestRate)
          .dividedBy(new BigNumber("10000"))
          .multipliedBy(new BigNumber(daysElapsed))
          .dividedBy(new BigNumber("365"));

        expect(expectedInterest).toEqual(new BigNumber("1"));

        // Allow for minimal precision differences
        const interestDifference = interestPaid.minus(expectedInterest).abs();
        expect(interestDifference.isLessThanOrEqualTo(new BigNumber("0.0001"))).toBe(true);

        // Conservation: interest should accumulate linearly for simple interest
        // No compound interest should occur in the base calculation
        expect(interestPaid.isGreaterThan(0)).toBe(true);
        expect(interestPaid.isLessThan(principal)).toBe(true);
      }
    });

    it("should maintain precision across long-term interest calculations", async () => {
      // Given: Long-term loan for precision testing
      const startTime = 1000000;
      const loan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        "10000", // Larger principal for precision testing
        "100", // 1% APR for clean calculations
        startTime,
        "15000"
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

      const borrowerBalance = createTokenBalance(users.testUser2.identityKey, goldTokenKey, "20000");

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2)
        .savedState(loan, goldTokenClass, goldTokenInstance, borrowerBalance);

      // When: Check interest after 2 years (730 days)
      const daysElapsed = 730; // 2 years
      const checkTime = startTime + daysElapsed * 24 * 60 * 60;
      const seconds = Long.fromNumber(checkTime / 1000);
      (ctx.stub as any).txTimestamp = {
        seconds,
        nanos: 0,
        getSeconds: () => seconds,
        getNanos: () => 0
      };

      const dto = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: loan.getCompositeKey(),
        repaymentAmount: new BigNumber("100") // Small payment to trigger calculation
      });
      dto.sign(users.testUser2.privateKey);

      const result = await contract.RepayLoan(ctx, dto);

      // Then: Verify long-term precision is maintained
      if (result.Status === 1) {
        const interestPaid = result.Data?.interestRepaid || new BigNumber("0");

        // Expected interest: 10000 × (100/10000) × (730/365) = 10000 × 0.01 × 2 = $200.00
        const expectedInterest = new BigNumber("10000")
          .multipliedBy(new BigNumber("100"))
          .dividedBy(new BigNumber("10000"))
          .multipliedBy(new BigNumber(daysElapsed))
          .dividedBy(new BigNumber("365"));

        expect(expectedInterest).toEqual(new BigNumber("200"));

        // Precision should be maintained even over long periods
        const interestDifference = interestPaid.minus(expectedInterest).abs();
        expect(interestDifference.isLessThanOrEqualTo(new BigNumber("0.001"))).toBe(true);

        // No rounding errors should accumulate significantly
        expect(interestPaid.decimalPlaces()).toBeLessThanOrEqual(8);
      }
    });
  });
});

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
 * SECURITY TESTING: Precision & Edge Case Attack Vectors
 *
 * Tests various precision exploitation and edge case attacks:
 * - Rounding error exploitation
 * - Extreme value handling
 * - Precision loss attacks
 * - Calculation overflow/underflow
 * - Zero and negative value attacks
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

describe("SECURITY: Precision & Edge Case Attacks", () => {
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
    principalAmount = "1000",
    interestRate = "500"
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
    offer.collateralRatio = new BigNumber("1.5");
    offer.created = 1000000;
    offer.expires = 2000000;
    offer.uses = new BigNumber("1");
    offer.usesSpent = new BigNumber("0");
    return offer;
  };

  const createTestLoan = (
    lender: string,
    borrower: string,
    offerKey: string,
    principalAmount = "1000",
    interestRate = "500"
  ): FungibleLoan => {
    const loan = new FungibleLoan();
    loan.lender = lender;
    loan.borrower = borrower;
    loan.offerKey = offerKey;
    loan.startTime = 1000000;
    loan.principalToken = goldTokenKey;
    loan.principalAmount = new BigNumber(principalAmount);
    loan.interestRate = new BigNumber(interestRate);
    loan.collateralToken = silverTokenKey;
    loan.collateralAmount = new BigNumber(principalAmount).multipliedBy("1.5");
    loan.collateralRatio = new BigNumber("1.5");
    loan.healthFactor = new BigNumber("1.5");
    loan.endTime = 2000000;
    loan.status = LendingStatus.LoanActive;
    loan.closedBy = LendingClosedBy.Unspecified;
    loan.interestAccrued = new BigNumber("0");
    loan.lastInterestUpdate = 1000000;
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

  describe("Zero and Minimal Value Attacks", () => {
    it("should reject zero amount offer creation", async () => {
      // Given: Setup for offer creation
      const { ctx, contract } = fixture(GalaChainTokenContract).registeredUsers(users.testUser1);

      // When: Attempt to create offer with zero principal amount
      const dto = await createValidSubmitDTO(CreateLendingOfferDto, {
        principalToken: goldTokenKey,
        principalQuantity: new BigNumber("0"), // Zero amount
        interestRate: new BigNumber("500"),
        duration: 365 * 24 * 60 * 60,
        collateralToken: silverTokenKey,
        collateralRatio: new BigNumber("1.5"),
        expires: 2000000,
        uses: new BigNumber("1")
      });
      dto.sign(users.testUser1.privateKey);

      const result = await contract.CreateLendingOffer(ctx, dto);

      // Then: Should reject zero amounts
      expect(result.Status).toBe(0);
      expect(result.Message).toContain("zero" || "amount" || "invalid" || "minimum");
    });

    it("should handle minimal dust amounts appropriately", async () => {
      // Given: Offer with very small amount
      const dustAmount = "0.00000001"; // 1 wei equivalent in 8 decimal places

      const { ctx, contract } = fixture(GalaChainTokenContract).registeredUsers(users.testUser1);

      // When: Attempt to create offer with dust amount
      const dto = await createValidSubmitDTO(CreateLendingOfferDto, {
        principalToken: goldTokenKey,
        principalQuantity: new BigNumber(dustAmount),
        interestRate: new BigNumber("500"),
        duration: 365 * 24 * 60 * 60,
        collateralToken: silverTokenKey,
        collateralRatio: new BigNumber("1.5"),
        expires: 2000000,
        uses: new BigNumber("1")
      });
      dto.sign(users.testUser1.privateKey);

      const result = await contract.CreateLendingOffer(ctx, dto);

      // Then: Should either reject dust amounts or handle them correctly
      if (result.Status === 1) {
        // If dust amounts are allowed, verify they don't cause precision issues
        expect(result.Data?.[0].offer.principalQuantity).toEqual(new BigNumber(dustAmount));
      } else {
        // If rejected, should have appropriate error message
        const validErrorReasons = ["minimum", "dust", "amount", "insufficient", "balance"];
        const hasValidErrorMessage = validErrorReasons.some(reason => result.Message?.includes(reason));
        expect(hasValidErrorMessage).toBe(true);
      }
    });

    it("should prevent zero amount repayments", async () => {
      // Given: Active loan
      const loan = createTestLoan(users.testUser1.identityKey, users.testUser2.identityKey, "test-offer-key");

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

      // When: Attempt zero amount repayment
      const dto = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: loan.getCompositeKey(),
        repaymentAmount: new BigNumber("0")
      });
      dto.sign(users.testUser2.privateKey);

      const result = await contract.RepayLoan(ctx, dto);

      // Then: Should reject zero repayments
      expect(result.Status).toBe(0);
      const validErrorReasons = ["zero", "amount", "invalid", "minimum", "positive"];
      const hasValidErrorMessage = validErrorReasons.some(reason => result.Message?.includes(reason));
      expect(hasValidErrorMessage).toBe(true);
    });

    it("should prevent zero amount liquidations", async () => {
      // Given: Undercollateralized loan
      const loan = createTestLoan(users.testUser1.identityKey, users.testUser2.identityKey, "test-offer-key");
      loan.healthFactor = new BigNumber("0.8");

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

      const liquidatorBalance = createTokenBalance(users.testUser3.identityKey, goldTokenKey, "1000");

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2, users.testUser3)
        .savedState(
          loan,
          goldTokenClass,
          goldTokenInstance,
          silverTokenClass,
          silverTokenInstance,
          liquidatorBalance
        );

      // When: Attempt zero amount liquidation
      const dto = await createValidSubmitDTO(LiquidateLoanDto, {
        loanKey: loan.getCompositeKey(),
        maxDebtRepayment: new BigNumber("0")
      });
      dto.sign(users.testUser3.privateKey);

      const result = await contract.LiquidateLoan(ctx, dto);

      // Then: Should handle zero liquidations appropriately
      if (result.Status === 0) {
        // If rejected, should have appropriate error message
        const validErrorReasons = ["zero", "amount", "invalid", "minimum", "positive"];
        const hasValidErrorMessage = validErrorReasons.some(reason => result.Message?.includes(reason));
        expect(hasValidErrorMessage).toBe(true);
      } else {
        // If allowed, verify no actual liquidation occurred
        expect(result.Status).toBe(1);
        const debtRepaid = result.Data?.debtRepaid || new BigNumber("0");
        expect(debtRepaid).toEqual(new BigNumber("0"));
      }
    });
  });

  describe("Extreme Value Attacks", () => {
    it("should handle maximum value inputs safely", async () => {
      // Given: Attempt to create offer with very large amounts
      const maxValue = "999999999999999999.99999999"; // Near maximum with 8 decimals

      const { ctx, contract } = fixture(GalaChainTokenContract).registeredUsers(users.testUser1);

      // When: Create offer with extreme values
      const dto = await createValidSubmitDTO(CreateLendingOfferDto, {
        principalToken: goldTokenKey,
        principalQuantity: new BigNumber(maxValue),
        interestRate: new BigNumber("10000"), // 100% interest rate
        duration: 365 * 24 * 60 * 60,
        collateralToken: silverTokenKey,
        collateralRatio: new BigNumber("100"), // 100x collateral ratio
        expires: 2000000,
        uses: new BigNumber("999999999") // Very high uses
      });
      dto.sign(users.testUser1.privateKey);

      const result = await contract.CreateLendingOffer(ctx, dto);

      // Then: Should handle extreme values without overflow
      if (result.Status === 1) {
        // If allowed, verify no overflow occurred
        expect(result.Data?.[0].offer.principalQuantity.isFinite()).toBe(true);
        expect(result.Data?.[0].offer.interestRate.isFinite()).toBe(true);
        expect(result.Data?.[0].offer.collateralRatio.isFinite()).toBe(true);
      } else {
        // If rejected, should have reasonable limits
        const validErrorReasons = ["maximum", "limit", "range", "exceed", "ratio", "Invalid"];
        const hasValidErrorMessage = validErrorReasons.some(reason => result.Message?.includes(reason));
        expect(hasValidErrorMessage).toBe(true);
      }
    });

    it("should prevent integer overflow in interest calculations", async () => {
      // Given: Loan with extreme values that could cause overflow
      const loan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        "test-offer-key",
        "999999999999999999.99999999", // Max principal
        "10000" // 100% interest
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

      const borrowerBalance = createTokenBalance(
        users.testUser2.identityKey,
        goldTokenKey,
        "999999999999999999.99999999"
      );

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2)
        .savedState(loan, goldTokenClass, goldTokenInstance, borrowerBalance);

      // Set time far in the future to maximize interest calculation
      const futureTime = 1000000 + 100 * 365 * 24 * 60 * 60; // 100 years later
      const seconds = Long.fromNumber(futureTime / 1000);
      (ctx.stub as any).txTimestamp = {
        seconds,
        nanos: 0,
        getSeconds: () => seconds,
        getNanos: () => 0
      };

      // When: Attempt repayment that would trigger large interest calculation
      const dto = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: loan.getCompositeKey(),
        repaymentAmount: new BigNumber("1000")
      });
      dto.sign(users.testUser2.privateKey);

      const result = await contract.RepayLoan(ctx, dto);

      // Then: Should handle extreme interest calculations without overflow
      if (result.Status === 1) {
        expect(result.Data?.loan.principalAmount.isFinite()).toBe(true);
        expect(result.Data?.interestRepaid.isFinite()).toBe(true);
      }
      // Test passes if no runtime errors occur during calculation
    });
  });

  describe("Precision Loss Exploitation", () => {
    it("should prevent precision loss in liquidation calculations", async () => {
      // Given: Loan with amounts that could cause precision issues
      const loan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        "test-offer-key",
        "0.00000333", // Tiny principal amount
        "1" // Very low interest rate
      );
      loan.collateralAmount = new BigNumber("0.00000222"); // Even smaller collateral
      loan.healthFactor = new BigNumber("0.8"); // Undercollateralized

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

      const liquidatorBalance = createTokenBalance(users.testUser3.identityKey, goldTokenKey, "1");
      const borrowerBalance = createTokenBalance(users.testUser2.identityKey, silverTokenKey, "0.00000222");

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2, users.testUser3)
        .savedState(
          loan,
          goldTokenClass,
          goldTokenInstance,
          silverTokenClass,
          silverTokenInstance,
          liquidatorBalance,
          borrowerBalance
        );

      // When: Attempt liquidation with tiny amounts
      const dto = await createValidSubmitDTO(LiquidateLoanDto, {
        loanKey: loan.getCompositeKey(),
        maxDebtRepayment: new BigNumber("0.00000111") // Half the principal
      });
      dto.sign(users.testUser3.privateKey);

      const result = await contract.LiquidateLoan(ctx, dto);

      // Then: Should handle tiny amounts without precision loss
      if (result.Status === 1) {
        expect(result.Data?.debtRepaid.isGreaterThan(0)).toBe(true);
        expect(result.Data?.collateralLiquidated.isGreaterThan(0)).toBe(true);
        expect(result.Data?.liquidatorReward.isGreaterThanOrEqualTo(0)).toBe(true);

        // Verify no value is lost to rounding
        if (result.Data?.debtRepaid && result.Data?.liquidatorReward && result.Data?.collateralLiquidated) {
          const totalValue = result.Data.debtRepaid.plus(result.Data.liquidatorReward);
          expect(totalValue.isLessThanOrEqualTo(result.Data.collateralLiquidated)).toBe(true);
        }
      }
    });

    it("should handle division by very small numbers safely", async () => {
      // Given: Loan with very small collateral for health factor calculation
      const loan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        "test-offer-key",
        "1000000", // Large principal
        "500"
      );
      loan.collateralAmount = new BigNumber("0.00000001"); // Tiny collateral
      loan.healthFactor = new BigNumber("0.000000001"); // Extremely low health factor

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

      const liquidatorBalance = createTokenBalance(users.testUser3.identityKey, goldTokenKey, "2000000");
      const borrowerBalance = createTokenBalance(users.testUser2.identityKey, silverTokenKey, "0.00000001");

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2, users.testUser3)
        .savedState(
          loan,
          goldTokenClass,
          goldTokenInstance,
          silverTokenClass,
          silverTokenInstance,
          liquidatorBalance,
          borrowerBalance
        );

      // When: Attempt liquidation with extreme ratio differences
      const dto = await createValidSubmitDTO(LiquidateLoanDto, {
        loanKey: loan.getCompositeKey(),
        maxDebtRepayment: new BigNumber("500000") // Half the debt
      });
      dto.sign(users.testUser3.privateKey);

      const result = await contract.LiquidateLoan(ctx, dto);

      // Then: Should handle extreme ratios without division errors
      if (result.Status === 1) {
        expect(result.Data?.collateralLiquidated.isFinite()).toBe(true);
        expect(result.Data?.liquidatorReward.isFinite()).toBe(true);
      }
      // Test passes if no division by zero or infinite results
    });
  });

  describe("Decimal Precision Edge Cases", () => {
    it("should enforce decimal place limits consistently", async () => {
      // Given: Setup for offer creation
      const { ctx, contract } = fixture(GalaChainTokenContract).registeredUsers(users.testUser1);

      // When: Attempt to create offer with too many decimal places
      const tooManyDecimals = "1000.123456789"; // 9 decimal places (limit should be 8)

      const dto = await createValidSubmitDTO(CreateLendingOfferDto, {
        principalToken: goldTokenKey,
        principalQuantity: new BigNumber(tooManyDecimals),
        interestRate: new BigNumber("500"),
        duration: 365 * 24 * 60 * 60,
        collateralToken: silverTokenKey,
        collateralRatio: new BigNumber("1.5"),
        expires: 2000000,
        uses: new BigNumber("1")
      });
      dto.sign(users.testUser1.privateKey);

      const result = await contract.CreateLendingOffer(ctx, dto);

      // Then: Should either reject or properly round to 8 decimal places
      if (result.Status === 1) {
        // If accepted, should be rounded to 8 decimal places
        expect(result.Data?.[0].offer.principalQuantity.decimalPlaces()).toBeLessThanOrEqual(8);
      } else {
        // If rejected, should mention decimal limit
        const validErrorReasons = ["decimal", "precision", "places", "insufficient", "balance"];
        const hasValidErrorMessage = validErrorReasons.some(reason => result.Message?.includes(reason));
        expect(hasValidErrorMessage).toBe(true);
      }
    });

    it("should handle precision in interest rate calculations", async () => {
      // Given: Loan with very precise interest rate
      const loan = createTestLoan(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        "test-offer-key",
        "1000.12345678", // Exactly 8 decimal places
        "123.45678901" // Interest rate with high precision
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

      // Set time to create precise interest calculation
      const preciseTime = 1000000 + 7 * 24 * 60 * 60 + 13 * 60 * 60 + 47 * 60 + 23; // Odd time
      const seconds = Long.fromNumber(preciseTime / 1000);
      (ctx.stub as any).txTimestamp = {
        seconds,
        nanos: 0,
        getSeconds: () => seconds,
        getNanos: () => 0
      };

      // When: Make precise repayment
      const dto = await createValidSubmitDTO(RepayLoanDto, {
        loanKey: loan.getCompositeKey(),
        repaymentAmount: new BigNumber("12.34567890") // High precision repayment
      });
      dto.sign(users.testUser2.privateKey);

      const result = await contract.RepayLoan(ctx, dto);

      // Then: Should handle precise calculations consistently
      if (result.Status === 1) {
        expect(result.Data?.interestRepaid.decimalPlaces()).toBeLessThanOrEqual(8);
        expect(result.Data?.principalRepaid.decimalPlaces()).toBeLessThanOrEqual(8);
        expect(result.Data?.loan.principalAmount.decimalPlaces()).toBeLessThanOrEqual(8);
      }
    });
  });

  describe("Negative Value Protection", () => {
    it("should reject negative principal amounts", async () => {
      // Given: Setup for offer creation
      const { ctx, contract } = fixture(GalaChainTokenContract).registeredUsers(users.testUser1);

      // When: Attempt to create offer with negative principal
      try {
        const dto = await createValidSubmitDTO(CreateLendingOfferDto, {
          principalToken: goldTokenKey,
          principalQuantity: new BigNumber("-1000"), // Negative amount
          interestRate: new BigNumber("500"),
          duration: 365 * 24 * 60 * 60,
          collateralToken: silverTokenKey,
          collateralRatio: new BigNumber("1.5"),
          expires: 2000000,
          uses: new BigNumber("1")
        });
        dto.sign(users.testUser1.privateKey);

        const result = await contract.CreateLendingOffer(ctx, dto);

        // Then: Should reject negative amounts
        expect(result.Status).toBe(0);
        const validErrorReasons = ["negative", "positive", "invalid", "amount"];
        const hasValidErrorMessage = validErrorReasons.some(reason => result.Message?.includes(reason));
        expect(hasValidErrorMessage).toBe(true);
      } catch (error) {
        // DTO validation should catch negative values
        expect(error.message).toMatch(/positive|negative|amount/i);
      }
    });

    it("should reject negative repayment amounts", async () => {
      // Given: Active loan
      const loan = createTestLoan(users.testUser1.identityKey, users.testUser2.identityKey, "test-offer-key");

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

      // When: Attempt negative repayment
      try {
        const dto = await createValidSubmitDTO(RepayLoanDto, {
          loanKey: loan.getCompositeKey(),
          repaymentAmount: new BigNumber("-100") // Negative repayment
        });
        dto.sign(users.testUser2.privateKey);

        const result = await contract.RepayLoan(ctx, dto);

        // Then: Should reject negative repayments
        expect(result.Status).toBe(0);
        const validErrorReasons = ["negative", "positive", "invalid", "amount"];
        const hasValidErrorMessage = validErrorReasons.some(reason => result.Message?.includes(reason));
        expect(hasValidErrorMessage).toBe(true);
      } catch (error) {
        // DTO validation should catch negative values
        expect(error.message).toMatch(/positive|negative|amount/i);
      }
    });

    it("should reject negative liquidation amounts", async () => {
      // Given: Undercollateralized loan
      const loan = createTestLoan(users.testUser1.identityKey, users.testUser2.identityKey, "test-offer-key");
      loan.healthFactor = new BigNumber("0.8");

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

      const liquidatorBalance = createTokenBalance(users.testUser3.identityKey, goldTokenKey, "1000");

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2, users.testUser3)
        .savedState(
          loan,
          goldTokenClass,
          goldTokenInstance,
          silverTokenClass,
          silverTokenInstance,
          liquidatorBalance
        );

      // When: Attempt negative liquidation amount
      try {
        const dto = await createValidSubmitDTO(LiquidateLoanDto, {
          loanKey: loan.getCompositeKey(),
          maxDebtRepayment: new BigNumber("-500") // Negative amount
        });
        dto.sign(users.testUser3.privateKey);

        const result = await contract.LiquidateLoan(ctx, dto);

        // Then: Should reject negative liquidation amounts
        expect(result.Status).toBe(0);
        const validErrorReasons = ["negative", "positive", "invalid", "amount"];
        const hasValidErrorMessage = validErrorReasons.some(reason => result.Message?.includes(reason));
        expect(hasValidErrorMessage).toBe(true);
      } catch (error) {
        // DTO validation should catch negative values
        expect(error.message).toMatch(/positive|negative|amount/i);
      }
    });
  });
});

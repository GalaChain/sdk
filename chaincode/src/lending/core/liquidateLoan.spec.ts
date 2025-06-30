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
  LiquidateLoanDto,
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

describe("LiquidateLoan", () => {
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

  const createUndercollateralizedLoan = (params: {
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
    // Set health factor to simulate undercollateralization (< 1.0)
    loan.healthFactor = new BigNumber("0.8");
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

  describe("liquidateLoan", () => {
    it("should liquidate undercollateralized loan and distribute collateral", async () => {
      // Given
      const startTime = 1000000;
      const currentTime = startTime + 365 * 24 * 60 * 60; // 1 year later for significant interest

      const loan = createUndercollateralizedLoan({
        lender: users.testUser1.identityKey,
        borrower: users.testUser2.identityKey,
        offerKey: "test-offer-key",
        principalAmount: "1000",
        interestRate: "1000", // 10% annual to create significant interest
        startTime,
        endTime: currentTime + 30 * 24 * 60 * 60,
        collateralAmount: "900" // After 1 year at 10%, debt = 1000 + 100 = 1100, so 900 < 1100
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

      // Liquidator (testUser3) has gold to pay debt
      const liquidatorBalance = createTokenBalance(users.testUser3.identityKey, goldTokenKey, "2000");
      // Borrower has silver collateral
      const borrowerBalance = createTokenBalance(users.testUser2.identityKey, silverTokenKey, "900");
      const lenderBalance = createTokenBalance(users.testUser1.identityKey, goldTokenKey, "0");

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2, users.testUser3)
        .savedState(
          loan,
          goldTokenClass,
          goldTokenInstance,
          silverTokenClass,
          silverTokenInstance,
          liquidatorBalance,
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

      const dto = await createValidSubmitDTO(LiquidateLoanDto, {
        loanKey: loan.getCompositeKey(),
        maxDebtRepayment: new BigNumber("600") // Partial liquidation
      });

      dto.sign(users.testUser3.privateKey);

      // When
      const result = await contract.LiquidateLoan(ctx, dto);

      // Then
      if (result.Status !== 1) {
        console.log("Liquidation failed with message:", result.Message);
        console.log("Error key:", result.ErrorKey);
      }
      expect(result.Status).toBe(1);
      expect(result.Data).toHaveProperty("loan");
      expect(result.Data).toHaveProperty("debtRepaid");
      expect(result.Data).toHaveProperty("collateralLiquidated");
      expect(result.Data).toHaveProperty("liquidatorReward");
      expect(result.Data).toHaveProperty("collateralReturned");

      // Verify liquidation amounts (50% max liquidation rule applies)
      // With 1 year at 10% interest: debt ≈ 1000 + 100 = 1100
      // 50% of debt ≈ 550, so actual liquidation is ~550 (not 600)
      expect(result.Data?.debtRepaid.toFixed(0)).toBe("550"); // Accept minor precision differences
      // Collateral liquidated = ~550 * 1.05 ≈ 577.5 (with 5% bonus)
      expect(result.Data?.collateralLiquidated.toFixed(0)).toBe("577");
      // Liquidator reward = collateral liquidated - debt repaid ≈ 577.5 - 550 = 27.5
      expect(result.Data?.liquidatorReward.toFixed(0)).toBe("27");
      // Remaining collateral = 900 - 577.5 ≈ 322.5
      expect(result.Data?.collateralReturned.toFixed(0)).toBe("323");

      // Verify loan is still active (partial liquidation)
      expect(result.Data?.loan).toMatchObject({
        status: LendingStatus.LoanActive
      });
      // Collateral amount should be reduced by liquidated amount
      expect(result.Data?.loan.collateralAmount.toFixed(0)).toBe("323");
    });

    it("should fully liquidate and close loan when debt is fully repaid", async () => {
      // Given
      const startTime = 1000000;
      const currentTime = startTime + 30 * 24 * 60 * 60; // 30 days later

      const loan = createUndercollateralizedLoan({
        lender: users.testUser1.identityKey,
        borrower: users.testUser2.identityKey,
        offerKey: "test-offer-key",
        principalAmount: "1000",
        interestRate: "500", // 5% annual
        startTime,
        endTime: currentTime + 335 * 24 * 60 * 60,
        collateralAmount: "500" // Small collateral that will be fully liquidated
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

      const silverTokenClass = createTokenClass(silverTokenKey);
      const silverTokenInstance = currency.tokenInstance((ti) => ({
        ...ti,
        collection: "TEST",
        category: "Currency",
        type: "SILVER",
        additionalKey: "none"
      }));

      const liquidatorBalance = createTokenBalance(users.testUser3.identityKey, goldTokenKey, "2000");
      const borrowerBalance = createTokenBalance(users.testUser2.identityKey, silverTokenKey, "500");

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

      // Set the current time for interest calculation
      const seconds = Long.fromNumber(currentTime / 1000);
      (ctx.stub as any).txTimestamp = {
        seconds,
        nanos: 0,
        getSeconds: () => seconds,
        getNanos: () => 0
      };

      const dto = await createValidSubmitDTO(LiquidateLoanDto, {
        loanKey: loan.getCompositeKey(),
        maxDebtRepayment: new BigNumber("2000") // Try to liquidate more than available collateral
      });

      dto.sign(users.testUser3.privateKey);

      // When
      const result = await contract.LiquidateLoan(ctx, dto);

      // Then
      expect(result.Status).toBe(1);

      // Verify loan is closed (all collateral liquidated triggers closure)
      expect(result.Data?.loan).toMatchObject({
        status: LendingStatus.LoanLiquidated,
        closedBy: LendingClosedBy.Liquidator
      });

      // All collateral should be liquidated
      expect(result.Data?.collateralLiquidated).toEqual(new BigNumber("500"));
      expect(result.Data?.collateralReturned).toEqual(new BigNumber("0"));
    });

    it("should fail when loan is not undercollateralized", async () => {
      // Given
      const loan = createUndercollateralizedLoan({
        lender: users.testUser1.identityKey,
        borrower: users.testUser2.identityKey,
        offerKey: "test-offer-key",
        principalAmount: "1000",
        interestRate: "0", // No interest to avoid complications
        startTime: 1000000,
        endTime: 2000000,
        collateralAmount: "5000" // Very well collateralized - 5x overcollateralized
      });
      // Override health factor to be > 1.0 (well collateralized)
      loan.healthFactor = new BigNumber("5.0");

      // Add required token classes and balances
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

      // Add silver token class and instance (needed for collateral token)
      const silverTokenClass = createTokenClass(silverTokenKey);
      const silverTokenInstance = currency.tokenInstance((ti) => ({
        ...ti,
        collection: "TEST",
        category: "Currency",
        type: "SILVER",
        additionalKey: "none"
      }));

      const liquidatorBalance = createTokenBalance(users.testUser3.identityKey, goldTokenKey, "2000");

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

      const dto = await createValidSubmitDTO(LiquidateLoanDto, {
        loanKey: loan.getCompositeKey(),
        maxDebtRepayment: new BigNumber("500")
      });

      dto.sign(users.testUser3.privateKey);

      // When
      const result = await contract.LiquidateLoan(ctx, dto);

      // Then
      expect(result.Status).toBe(0);
      expect(result.Message).toContain("not undercollateralized");
    });

    it("should fail when loan is not active", async () => {
      // Given
      const loan = createUndercollateralizedLoan({
        lender: users.testUser1.identityKey,
        borrower: users.testUser2.identityKey,
        offerKey: "test-offer-key",
        principalAmount: "1000",
        interestRate: "500",
        startTime: 1000000,
        endTime: 2000000,
        collateralAmount: "800",
        status: LendingStatus.LoanRepaid // Already repaid
      });

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2, users.testUser3)
        .savedState(loan);

      const dto = await createValidSubmitDTO(LiquidateLoanDto, {
        loanKey: loan.getCompositeKey(),
        maxDebtRepayment: new BigNumber("500")
      });

      dto.sign(users.testUser3.privateKey);

      // When
      const result = await contract.LiquidateLoan(ctx, dto);

      // Then
      expect(result.Status).toBe(0);
      expect(result.Message).toContain("is not active");
    });

    it("should fail when liquidator has insufficient balance", async () => {
      // Given
      const startTime = 1000000;
      const currentTime = startTime + 365 * 24 * 60 * 60; // 1 year later

      const loan = createUndercollateralizedLoan({
        lender: users.testUser1.identityKey,
        borrower: users.testUser2.identityKey,
        offerKey: "test-offer-key",
        principalAmount: "1000",
        interestRate: "500",
        startTime,
        endTime: currentTime + 30 * 24 * 60 * 60,
        collateralAmount: "800"
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

      // Liquidator has insufficient balance
      const liquidatorBalance = createTokenBalance(users.testUser3.identityKey, goldTokenKey, "100");

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2, users.testUser3)
        .savedState(loan, goldTokenClass, goldTokenInstance, liquidatorBalance);

      // Set the current time
      const seconds = Long.fromNumber(currentTime / 1000);
      (ctx.stub as any).txTimestamp = {
        seconds,
        nanos: 0,
        getSeconds: () => seconds,
        getNanos: () => 0
      };

      const dto = await createValidSubmitDTO(LiquidateLoanDto, {
        loanKey: loan.getCompositeKey(),
        maxDebtRepayment: new BigNumber("500") // More than liquidator has
      });

      dto.sign(users.testUser3.privateKey);

      // When
      const result = await contract.LiquidateLoan(ctx, dto);

      // Then
      expect(result.Status).toBe(0);
      expect(result.Message).toContain("insufficient balance");
    });

    it("should handle edge case of exact collateral liquidation", async () => {
      // Given
      const startTime = 1000000;
      const currentTime = startTime + 30 * 24 * 60 * 60; // 30 days later

      const loan = createUndercollateralizedLoan({
        lender: users.testUser1.identityKey,
        borrower: users.testUser2.identityKey,
        offerKey: "test-offer-key",
        principalAmount: "1000",
        interestRate: "500",
        startTime,
        endTime: currentTime + 335 * 24 * 60 * 60,
        collateralAmount: "500" // Exactly enough for partial liquidation with bonus
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

      const silverTokenClass = createTokenClass(silverTokenKey);
      const silverTokenInstance = currency.tokenInstance((ti) => ({
        ...ti,
        collection: "TEST",
        category: "Currency",
        type: "SILVER",
        additionalKey: "none"
      }));

      const liquidatorBalance = createTokenBalance(users.testUser3.identityKey, goldTokenKey, "1000");
      const borrowerBalance = createTokenBalance(users.testUser2.identityKey, silverTokenKey, "500");

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

      // Set the current time
      const seconds = Long.fromNumber(currentTime / 1000);
      (ctx.stub as any).txTimestamp = {
        seconds,
        nanos: 0,
        getSeconds: () => seconds,
        getNanos: () => 0
      };

      const dto = await createValidSubmitDTO(LiquidateLoanDto, {
        loanKey: loan.getCompositeKey(),
        maxDebtRepayment: new BigNumber("600") // More than available collateral can cover with bonus
      });

      dto.sign(users.testUser3.privateKey);

      // When
      const result = await contract.LiquidateLoan(ctx, dto);

      // Then
      expect(result.Status).toBe(1);

      // Should liquidate all available collateral
      expect(result.Data?.collateralLiquidated).toEqual(new BigNumber("500"));
      expect(result.Data?.collateralReturned).toEqual(new BigNumber("0"));

      // Verify loan is closed (all collateral liquidated)
      expect(result.Data?.loan).toMatchObject({
        status: LendingStatus.LoanLiquidated,
        closedBy: LendingClosedBy.Liquidator,
        collateralAmount: new BigNumber("0")
      });
    });
  });
});

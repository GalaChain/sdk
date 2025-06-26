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
  FungibleLendingOffer,
  InsufficientPrincipalBalanceError,
  InvalidLendingParametersError,
  LendingOfferLenderCallerMismatchError,
  LendingStatus,
  TokenBalance,
  TokenClass,
  TokenClassKey
} from "@gala-chain/api";
import { BigNumber } from "bignumber.js";
import { fixture, transactionSuccess, users } from "@gala-chain/test";

import { createLendingOffer } from "./createLendingOffer";

describe("createLendingOffer", () => {
  const tokenClassKey: TokenClassKey = {
    collection: "TEST",
    category: "Currency",
    type: "GOLD",
    additionalKey: "none"
  };

  const collateralTokenKey: TokenClassKey = {
    collection: "TEST",
    category: "Currency", 
    type: "SILVER",
    additionalKey: "none"
  };

  const createTokenClass = (key: TokenClassKey, isNonFungible = false): TokenClass => {
    const tokenClass = new TokenClass();
    tokenClass.collection = key.collection;
    tokenClass.category = key.category;
    tokenClass.type = key.type;
    tokenClass.additionalKey = key.additionalKey;
    tokenClass.network = "TEST";
    tokenClass.decimals = 8;
    tokenClass.maxSupply = new BigNumber("1000000");
    tokenClass.isNonFungible = isNonFungible;
    tokenClass.maxCapacity = new BigNumber("1000000");
    tokenClass.authorities = [users.testAdminUser.identityKey];
    tokenClass.name = "Test Token";
    tokenClass.symbol = "TEST";
    tokenClass.description = "Test token for lending";
    tokenClass.image = "test.png";
    tokenClass.totalBurned = new BigNumber("0");
    tokenClass.totalMintAllowance = new BigNumber("0");
    tokenClass.totalSupply = new BigNumber("0");
    return tokenClass;
  };

  const createTokenBalance = (owner: string, tokenKey: TokenClassKey, quantity: string): TokenBalance => {
    const balance = new TokenBalance();
    balance.owner = owner;
    balance.collection = tokenKey.collection;
    balance.category = tokenKey.category;
    balance.type = tokenKey.type;
    balance.additionalKey = tokenKey.additionalKey;
    balance.instance = new BigNumber("0");
    balance.quantity = new BigNumber(quantity);
    balance.inUseQuantity = new BigNumber("0");
    balance.lockedQuantity = new BigNumber("0");
    return balance;
  };

  it("should create a lending offer successfully", async () => {
    // Given
    const { ctx, contract, getWrites } = fixture(FungibleLendingOffer)
      .callingUser(users.testUser1.identityKey)
      .savedState(
        createTokenClass(tokenClassKey),
        createTokenClass(collateralTokenKey),
        createTokenBalance(users.testUser1.identityKey, tokenClassKey, "1000")
      );

    const params = {
      lender: users.testUser1.identityKey,
      principalToken: tokenClassKey,
      principalQuantity: new BigNumber("100"),
      interestRate: new BigNumber("500"), // 5%
      duration: 30 * 24 * 60 * 60, // 30 days
      collateralToken: collateralTokenKey,
      collateralRatio: new BigNumber("1.5"),
      uses: new BigNumber("1"),
      expires: 0
    };

    // When
    const response = await createLendingOffer(ctx, params);

    // Then
    expect(response).toHaveLength(1);
    expect(response[0].offer.lender).toBe(users.testUser1.identityKey);
    expect(response[0].offer.principalQuantity.toString()).toBe("100");
    expect(response[0].offer.interestRate.toString()).toBe("500");
    expect(response[0].offer.status).toBe(LendingStatus.OfferOpen);
    
    const writes = getWrites();
    expect(writes).toHaveLength(3); // Offer + Lender + Allowance
  });

  it("should create multiple offers for specific borrowers", async () => {
    // Given
    const { ctx } = fixture(FungibleLendingOffer)
      .callingUser(users.testUser1.identityKey)
      .savedState(
        createTokenClass(tokenClassKey),
        createTokenClass(collateralTokenKey),
        createTokenBalance(users.testUser1.identityKey, tokenClassKey, "1000")
      );

    const params = {
      lender: users.testUser1.identityKey,
      principalToken: tokenClassKey,
      principalQuantity: new BigNumber("100"),
      interestRate: new BigNumber("500"),
      duration: 30 * 24 * 60 * 60,
      collateralToken: collateralTokenKey,
      collateralRatio: new BigNumber("1.5"),
      borrowers: [users.testUser2.identityKey, users.testUser3.identityKey],
      uses: new BigNumber("1"),
      expires: 0
    };

    // When
    const response = await createLendingOffer(ctx, params);

    // Then
    expect(response).toHaveLength(2);
    expect(response[0].offer.borrower).toBe(users.testUser2.identityKey);
    expect(response[1].offer.borrower).toBe(users.testUser3.identityKey);
    expect(response[0].offer.id).toBe(0);
    expect(response[1].offer.id).toBe(1);
  });

  it("should throw error when caller is not the lender", async () => {
    // Given
    const { ctx } = fixture(FungibleLendingOffer)
      .callingUser(users.testUser2.identityKey) // Different from lender
      .savedState(
        createTokenClass(tokenClassKey),
        createTokenClass(collateralTokenKey),
        createTokenBalance(users.testUser1.identityKey, tokenClassKey, "1000")
      );

    const params = {
      lender: users.testUser1.identityKey,
      principalToken: tokenClassKey,
      principalQuantity: new BigNumber("100"),
      interestRate: new BigNumber("500"),
      duration: 30 * 24 * 60 * 60,
      collateralToken: collateralTokenKey,
      collateralRatio: new BigNumber("1.5"),
      uses: new BigNumber("1"),
      expires: 0
    };

    // When & Then
    await expect(createLendingOffer(ctx, params))
      .rejects.toThrow(LendingOfferLenderCallerMismatchError);
  });

  it("should throw error for insufficient balance", async () => {
    // Given
    const { ctx } = fixture(FungibleLendingOffer)
      .callingUser(users.testUser1.identityKey)
      .savedState(
        createTokenClass(tokenClassKey),
        createTokenClass(collateralTokenKey),
        createTokenBalance(users.testUser1.identityKey, tokenClassKey, "50") // Less than required
      );

    const params = {
      lender: users.testUser1.identityKey,
      principalToken: tokenClassKey,
      principalQuantity: new BigNumber("100"), // More than balance
      interestRate: new BigNumber("500"),
      duration: 30 * 24 * 60 * 60,
      collateralToken: collateralTokenKey,
      collateralRatio: new BigNumber("1.5"),
      uses: new BigNumber("1"),
      expires: 0
    };

    // When & Then
    await expect(createLendingOffer(ctx, params))
      .rejects.toThrow(InsufficientPrincipalBalanceError);
  });

  describe("parameter validation", () => {
    const baseParams = {
      lender: users.testUser1.identityKey,
      principalToken: tokenClassKey,
      principalQuantity: new BigNumber("100"),
      interestRate: new BigNumber("500"),
      duration: 30 * 24 * 60 * 60,
      collateralToken: collateralTokenKey,
      collateralRatio: new BigNumber("1.5"),
      uses: new BigNumber("1"),
      expires: 0
    };

    const setupContext = () => fixture(FungibleLendingOffer)
      .callingUser(users.testUser1.identityKey)
      .savedState(
        createTokenClass(tokenClassKey),
        createTokenClass(collateralTokenKey),
        createTokenBalance(users.testUser1.identityKey, tokenClassKey, "1000")
      );

    it("should reject zero principal quantity", async () => {
      // Given
      const { ctx } = setupContext();
      const params = { ...baseParams, principalQuantity: new BigNumber("0") };

      // When & Then
      await expect(createLendingOffer(ctx, params))
        .rejects.toThrow(InvalidLendingParametersError);
    });

    it("should reject negative interest rate", async () => {
      // Given
      const { ctx } = setupContext();
      const params = { ...baseParams, interestRate: new BigNumber("-100") };

      // When & Then
      await expect(createLendingOffer(ctx, params))
        .rejects.toThrow(InvalidLendingParametersError);
    });

    it("should accept zero interest rate", async () => {
      // Given
      const { ctx } = setupContext();
      const params = { ...baseParams, interestRate: new BigNumber("0") };

      // When
      const response = await createLendingOffer(ctx, params);

      // Then
      expect(response[0].offer.interestRate.toString()).toBe("0");
    });

    it("should reject zero duration", async () => {
      // Given
      const { ctx } = setupContext();
      const params = { ...baseParams, duration: 0 };

      // When & Then
      await expect(createLendingOffer(ctx, params))
        .rejects.toThrow(InvalidLendingParametersError);
    });

    it("should reject collateral ratio <= 1", async () => {
      // Given
      const { ctx } = setupContext();
      const params = { ...baseParams, collateralRatio: new BigNumber("1.0") };

      // When & Then
      await expect(createLendingOffer(ctx, params))
        .rejects.toThrow(InvalidLendingParametersError);
    });

    it("should reject zero uses", async () => {
      // Given
      const { ctx } = setupContext();
      const params = { ...baseParams, uses: new BigNumber("0") };

      // When & Then
      await expect(createLendingOffer(ctx, params))
        .rejects.toThrow(InvalidLendingParametersError);
    });

    it("should reject fractional uses", async () => {
      // Given
      const { ctx } = setupContext();
      const params = { ...baseParams, uses: new BigNumber("1.5") };

      // When & Then
      await expect(createLendingOffer(ctx, params))
        .rejects.toThrow(InvalidLendingParametersError);
    });

    it("should reject negative expiration", async () => {
      // Given
      const { ctx } = setupContext();
      const params = { ...baseParams, expires: -1 };

      // When & Then
      await expect(createLendingOffer(ctx, params))
        .rejects.toThrow(InvalidLendingParametersError);
    });

    it("should reject excessive duration", async () => {
      // Given
      const { ctx } = setupContext();
      const params = { ...baseParams, duration: 11 * 365 * 24 * 60 * 60 }; // 11 years

      // When & Then
      await expect(createLendingOffer(ctx, params))
        .rejects.toThrow(InvalidLendingParametersError);
    });

    it("should reject excessive interest rate", async () => {
      // Given
      const { ctx } = setupContext();
      const params = { ...baseParams, interestRate: new BigNumber("200000") }; // 2000%

      // When & Then
      await expect(createLendingOffer(ctx, params))
        .rejects.toThrow(InvalidLendingParametersError);
    });

    it("should reject excessive collateral ratio", async () => {
      // Given
      const { ctx } = setupContext();
      const params = { ...baseParams, collateralRatio: new BigNumber("20") }; // 2000%

      // When & Then
      await expect(createLendingOffer(ctx, params))
        .rejects.toThrow(InvalidLendingParametersError);
    });
  });

  it("should handle multiple token balances correctly", async () => {
    // Given
    const { ctx } = fixture(FungibleLendingOffer)
      .callingUser(users.testUser1.identityKey)
      .savedState(
        createTokenClass(tokenClassKey),
        createTokenClass(collateralTokenKey),
        createTokenBalance(users.testUser1.identityKey, tokenClassKey, "50"),
        createTokenBalance(users.testUser1.identityKey, tokenClassKey, "60") // Total = 110
      );

    const params = {
      lender: users.testUser1.identityKey,
      principalToken: tokenClassKey,
      principalQuantity: new BigNumber("100"), // Less than total balance
      interestRate: new BigNumber("500"),
      duration: 30 * 24 * 60 * 60,
      collateralToken: collateralTokenKey,
      collateralRatio: new BigNumber("1.5"),
      uses: new BigNumber("1"),
      expires: 0
    };

    // When
    const response = await createLendingOffer(ctx, params);

    // Then
    expect(response).toHaveLength(1);
    expect(response[0].offer.principalQuantity.toString()).toBe("100");
  });
});
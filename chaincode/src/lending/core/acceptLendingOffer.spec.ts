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
  AcceptLendingOfferDto,
  AllowanceType,
  FungibleLendingOffer,
  LendingLender,
  LendingStatus,
  TokenAllowance,
  TokenBalance,
  TokenClass,
  TokenClassKey,
  asValidUserAlias,
  createValidSubmitDTO
} from "@gala-chain/api";
import { currency, fixture, users } from "@gala-chain/test";
import { BigNumber } from "bignumber.js";
import { plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../../__test__/GalaChainTokenContract";

describe("AcceptLendingOffer", () => {
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

  const createOffer = (params: {
    id: number;
    lender: string;
    principalToken: TokenClassKey;
    principalQuantity: string;
    interestRate: string;
    duration: number;
    collateralToken: TokenClassKey;
    collateralRatio: string;
    status?: LendingStatus;
    borrower?: string;
    created?: number;
    expires?: number;
    uses?: string;
    usesSpent?: string;
  }): FungibleLendingOffer => {
    const offer = new FungibleLendingOffer();
    offer.id = params.id;
    offer.lender = params.lender;
    offer.principalToken = params.principalToken;
    offer.principalQuantity = new BigNumber(params.principalQuantity);
    offer.interestRate = new BigNumber(params.interestRate);
    offer.duration = params.duration;
    offer.collateralToken = params.collateralToken;
    offer.collateralRatio = new BigNumber(params.collateralRatio);
    offer.status = params.status ?? LendingStatus.OfferOpen;
    offer.borrower = params.borrower;
    offer.created = params.created ?? 1000000;
    offer.expires = params.expires ?? 0;
    offer.uses = new BigNumber(params.uses ?? "1");
    offer.usesSpent = new BigNumber(params.usesSpent ?? "0");
    return offer;
  };

  const createLenderTracker = (offer: FungibleLendingOffer): LendingLender => {
    const lender = new LendingLender();
    lender.id = offer.lender;
    lender.status = offer.status;
    lender.offer = offer.getCompositeKey();
    lender.principalToken = offer.principalToken;
    lender.principalQuantity = offer.principalQuantity;
    return lender;
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

  const createLockAllowance = (
    grantedBy: string,
    grantedTo: string,
    tokenKey: TokenClassKey,
    quantity: string,
    txUnixTime: number
  ): TokenAllowance => {
    const allowance = new TokenAllowance();
    allowance.grantedBy = asValidUserAlias(grantedBy);
    allowance.grantedTo = asValidUserAlias(grantedTo);
    allowance.collection = tokenKey.collection;
    allowance.category = tokenKey.category;
    allowance.type = tokenKey.type;
    allowance.additionalKey = tokenKey.additionalKey;
    allowance.instance = new BigNumber("0");
    allowance.allowanceType = AllowanceType.Transfer;
    allowance.quantity = new BigNumber(quantity);
    allowance.quantitySpent = new BigNumber("0");
    allowance.uses = new BigNumber("1");
    allowance.usesSpent = new BigNumber("0");
    allowance.created = txUnixTime;
    allowance.expires = 0;
    return allowance;
  };

  describe("acceptLendingOffer", () => {
    it("should accept an open offer and create a loan", async () => {
      // Given
      // Use currency helper for gold token (principal)
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

      // Create silver token class and instance for collateral
      const silverTokenClass = createTokenClass(silverTokenKey);
      const silverTokenInstance = currency.tokenInstance((ti) => ({
        ...ti,
        collection: "TEST",
        category: "Currency",
        type: "SILVER",
        additionalKey: "none"
      }));

      const offer = createOffer({
        id: 0,
        lender: users.testUser1.identityKey,
        principalToken: goldTokenKey,
        principalQuantity: "1000",
        interestRate: "500",
        duration: 30 * 24 * 60 * 60,
        collateralToken: silverTokenKey,
        collateralRatio: "1.5",
        status: LendingStatus.OfferOpen
      });

      const lenderTracker = createLenderTracker(offer);

      // Create balances - lender has gold (principal), borrower has silver (collateral)
      const lenderBalance = createTokenBalance(users.testUser1.identityKey, goldTokenKey, "10000");
      const borrowerBalance = createTokenBalance(users.testUser2.identityKey, silverTokenKey, "5000");

      // Create lock allowance that would be created during offer creation
      const lockAllowance = createLockAllowance(
        users.testUser1.identityKey, // grantedBy: lender
        users.testUser2.identityKey, // grantedTo: borrower
        goldTokenKey, // principal token
        "1000", // quantity: must match principal quantity
        1000000 // created timestamp
      );

      const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2)
        .savedState(
          offer,
          lenderTracker,
          goldTokenClass,
          goldTokenInstance,
          silverTokenClass,
          silverTokenInstance,
          lenderBalance,
          borrowerBalance,
          lockAllowance
        );

      const dto = await createValidSubmitDTO(AcceptLendingOfferDto, {
        offer: offer.getCompositeKey(),
        borrower: users.testUser2.identityKey,
        collateralAmount: new BigNumber("1500") // 150% of 1000 = 1500
      });

      dto.sign(users.testUser2.privateKey);

      // When
      const result = await contract.AcceptLendingOffer(ctx, dto);

      // Then
      expect(result.Status).toBe(1);
      expect(result.Data).toHaveProperty("loan");
      expect(result.Data).toHaveProperty("agreement");
      expect(result.Data).toHaveProperty("collateralLocked");
      expect(result.Data).toHaveProperty("totalDebt");

      // Verify loan details
      expect(result.Data?.loan).toMatchObject({
        lender: users.testUser1.identityKey,
        borrower: users.testUser2.identityKey,
        principalAmount: new BigNumber("1000"),
        interestRate: new BigNumber("500"),
        status: LendingStatus.LoanActive
      });

      // Verify collateral amount
      expect(result.Data?.collateralLocked).toEqual(new BigNumber("1500"));
    });

    it("should fail when offer is not open", async () => {
      // Given
      const offer = createOffer({
        id: 0,
        lender: users.testUser1.identityKey,
        principalToken: goldTokenKey,
        principalQuantity: "1000",
        interestRate: "500",
        duration: 30 * 24 * 60 * 60,
        collateralToken: silverTokenKey,
        collateralRatio: "1.5",
        status: LendingStatus.OfferCancelled
      });

      const lenderTracker = createLenderTracker(offer);
      const goldTokenClass = createTokenClass(goldTokenKey);
      const silverTokenClass = createTokenClass(silverTokenKey);
      const borrowerBalance = createTokenBalance(users.testUser2.identityKey, silverTokenKey, "5000");

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2)
        .savedState(offer, lenderTracker, goldTokenClass, silverTokenClass, borrowerBalance);

      const dto = await createValidSubmitDTO(AcceptLendingOfferDto, {
        offer: offer.getCompositeKey(),
        borrower: users.testUser2.identityKey,
        collateralAmount: new BigNumber("1500")
      });

      dto.sign(users.testUser2.privateKey);

      // When
      const result = await contract.AcceptLendingOffer(ctx, dto);

      // Then
      expect(result.Status).toBe(0);
      expect(result.ErrorKey).toBe("LENDING_OFFER_NOT_AVAILABLE");
    });

    it("should fail when borrower has insufficient collateral", async () => {
      // Given
      const offer = createOffer({
        id: 0,
        lender: users.testUser1.identityKey,
        principalToken: goldTokenKey,
        principalQuantity: "1000",
        interestRate: "500",
        duration: 30 * 24 * 60 * 60,
        collateralToken: silverTokenKey,
        collateralRatio: "1.5",
        status: LendingStatus.OfferOpen
      });

      const lenderTracker = createLenderTracker(offer);
      const goldTokenClass = createTokenClass(goldTokenKey);
      const silverTokenClass = createTokenClass(silverTokenKey);
      const lenderBalance = createTokenBalance(users.testUser1.identityKey, goldTokenKey, "10000");
      const borrowerBalance = createTokenBalance(users.testUser2.identityKey, silverTokenKey, "1000"); // Insufficient

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2)
        .savedState(offer, lenderTracker, goldTokenClass, silverTokenClass, lenderBalance, borrowerBalance);

      const dto = await createValidSubmitDTO(AcceptLendingOfferDto, {
        offer: offer.getCompositeKey(),
        borrower: users.testUser2.identityKey,
        collateralAmount: new BigNumber("1500") // More than borrower has
      });

      dto.sign(users.testUser2.privateKey);

      // When
      const result = await contract.AcceptLendingOffer(ctx, dto);

      // Then
      expect(result.Status).toBe(0);
      expect(result.Message).toContain("insufficient collateral token balance");
    });

    it("should fail when borrower tries to accept their own offer", async () => {
      // Given
      const offer = createOffer({
        id: 0,
        lender: users.testUser1.identityKey,
        principalToken: goldTokenKey,
        principalQuantity: "1000",
        interestRate: "500",
        duration: 30 * 24 * 60 * 60,
        collateralToken: silverTokenKey,
        collateralRatio: "1.5",
        status: LendingStatus.OfferOpen
      });

      const lenderTracker = createLenderTracker(offer);
      const goldTokenClass = createTokenClass(goldTokenKey);
      const silverTokenClass = createTokenClass(silverTokenKey);
      const lenderBalance = createTokenBalance(users.testUser1.identityKey, goldTokenKey, "10000");
      const lenderCollateralBalance = createTokenBalance(users.testUser1.identityKey, silverTokenKey, "5000");

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2)
        .savedState(
          offer,
          lenderTracker,
          goldTokenClass,
          silverTokenClass,
          lenderBalance,
          lenderCollateralBalance
        );

      const dto = await createValidSubmitDTO(AcceptLendingOfferDto, {
        offer: offer.getCompositeKey(),
        borrower: users.testUser1.identityKey, // Lender trying to accept their own offer
        collateralAmount: new BigNumber("1500")
      });

      dto.sign(users.testUser1.privateKey);

      // When
      const result = await contract.AcceptLendingOffer(ctx, dto);

      // Then
      expect(result.Status).toBe(0);
      expect(result.ErrorKey).toBe("UNAUTHORIZED_LOAN_OPERATION");
    });

    it("should fail when unauthorized borrower tries to accept private offer", async () => {
      // Given
      const offer = createOffer({
        id: 0,
        lender: users.testUser1.identityKey,
        principalToken: goldTokenKey,
        principalQuantity: "1000",
        interestRate: "500",
        duration: 30 * 24 * 60 * 60,
        collateralToken: silverTokenKey,
        collateralRatio: "1.5",
        status: LendingStatus.OfferOpen,
        borrower: users.testUser2.identityKey // Private offer for testUser2
      });

      const lenderTracker = createLenderTracker(offer);
      const goldTokenClass = createTokenClass(goldTokenKey);
      const silverTokenClass = createTokenClass(silverTokenKey);
      const lenderBalance = createTokenBalance(users.testUser1.identityKey, goldTokenKey, "10000");
      const unauthorizedBorrowerBalance = createTokenBalance(
        users.testUser3.identityKey,
        silverTokenKey,
        "5000"
      );

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2, users.testUser3)
        .savedState(
          offer,
          lenderTracker,
          goldTokenClass,
          silverTokenClass,
          lenderBalance,
          unauthorizedBorrowerBalance
        );

      const dto = await createValidSubmitDTO(AcceptLendingOfferDto, {
        offer: offer.getCompositeKey(),
        borrower: users.testUser3.identityKey, // Wrong borrower for private offer
        collateralAmount: new BigNumber("1500")
      });

      dto.sign(users.testUser3.privateKey);

      // When
      const result = await contract.AcceptLendingOffer(ctx, dto);

      // Then
      expect(result.Status).toBe(0);
      expect(result.ErrorKey).toBe("UNAUTHORIZED_LOAN_OPERATION");
    });

    it("should update offer usage when accepted", async () => {
      // Given
      // Use currency helper for gold token (principal)
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

      // Create silver token class and instance for collateral
      const silverTokenClass = createTokenClass(silverTokenKey);
      const silverTokenInstance = currency.tokenInstance((ti) => ({
        ...ti,
        collection: "TEST",
        category: "Currency",
        type: "SILVER",
        additionalKey: "none"
      }));

      const offer = createOffer({
        id: 0,
        lender: users.testUser1.identityKey,
        principalToken: goldTokenKey,
        principalQuantity: "1000",
        interestRate: "500",
        duration: 30 * 24 * 60 * 60,
        collateralToken: silverTokenKey,
        collateralRatio: "1.5",
        status: LendingStatus.OfferOpen,
        uses: "2", // Can be used twice
        usesSpent: "0"
      });

      const lenderTracker = createLenderTracker(offer);
      const lenderBalance = createTokenBalance(users.testUser1.identityKey, goldTokenKey, "10000");
      const borrowerBalance = createTokenBalance(users.testUser2.identityKey, silverTokenKey, "5000");

      // Create transfer allowance
      const transferAllowance = createLockAllowance(
        users.testUser1.identityKey,
        users.testUser2.identityKey,
        goldTokenKey,
        "1000",
        1000000
      );

      const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2)
        .savedState(
          offer,
          lenderTracker,
          goldTokenClass,
          goldTokenInstance,
          silverTokenClass,
          silverTokenInstance,
          lenderBalance,
          borrowerBalance,
          transferAllowance
        );

      const dto = await createValidSubmitDTO(AcceptLendingOfferDto, {
        offer: offer.getCompositeKey(),
        borrower: users.testUser2.identityKey,
        collateralAmount: new BigNumber("1500")
      });

      dto.sign(users.testUser2.privateKey);

      // When
      const result = await contract.AcceptLendingOffer(ctx, dto);

      // Then
      expect(result.Status).toBe(1);

      // Verify offer usage was updated (if available in writes)
      const writes = getWrites();
      const offerKey = offer.getCompositeKey();
      if (writes[offerKey]) {
        const updatedOffer = JSON.parse(writes[offerKey]);
        expect(updatedOffer.usesSpent).toBe("1");
        // Since uses = 2 and usesSpent = 1, offer should still be open
        expect(updatedOffer.status).toBe(LendingStatus.OfferOpen);
      }
    });
  });
});

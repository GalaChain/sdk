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
  FetchLendingOffersDto,
  FungibleLendingOffer,
  LendingLender,
  LendingStatus,
  TokenClassKey
} from "@gala-chain/api";
import { fixture, users } from "@gala-chain/test";
import { BigNumber } from "bignumber.js";
import { plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../../__test__/GalaChainTokenContract";

describe("FetchLendingOffers", () => {
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
    offer.uses = new BigNumber("1");
    offer.usesSpent = new BigNumber("0");
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

  describe("fetchLendingOffers", () => {
    it("should fetch all lending offers when no filters provided", async () => {
      // Given
      const offer1 = createOffer({
        id: 0,
        lender: users.testUser1.identityKey,
        principalToken: goldTokenKey,
        principalQuantity: "1000",
        interestRate: "500",
        duration: 30 * 24 * 60 * 60,
        collateralToken: silverTokenKey,
        collateralRatio: "1.5"
      });

      const offer2 = createOffer({
        id: 1,
        lender: users.testUser2.identityKey,
        principalToken: silverTokenKey,
        principalQuantity: "2000",
        interestRate: "750",
        duration: 60 * 24 * 60 * 60,
        collateralToken: goldTokenKey,
        collateralRatio: "2.0"
      });

      const lender1 = createLenderTracker(offer1);
      const lender2 = createLenderTracker(offer2);

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2)
        .savedState(offer1, offer2, lender1, lender2);

      const dto = plainToInstance(FetchLendingOffersDto, {});

      // When
      const response = await contract.FetchLendingOffers(ctx, dto);

      // Then
      expect(response).toHaveProperty("Status", 1);
      expect(response.Data!).toHaveLength(2);
      expect(response.Data!).toContainEqual(
        expect.objectContaining({
          id: 0,
          lender: users.testUser1.identityKey,
          principalQuantity: new BigNumber("1000")
        })
      );
      expect(response.Data!).toContainEqual(
        expect.objectContaining({
          id: 1,
          lender: users.testUser2.identityKey,
          principalQuantity: new BigNumber("2000")
        })
      );
    });

    it("should fetch offers filtered by lender", async () => {
      // Given
      const offer1 = createOffer({
        id: 0,
        lender: users.testUser1.identityKey,
        principalToken: goldTokenKey,
        principalQuantity: "1000",
        interestRate: "500",
        duration: 30 * 24 * 60 * 60,
        collateralToken: silverTokenKey,
        collateralRatio: "1.5"
      });

      const offer2 = createOffer({
        id: 0,
        lender: users.testUser2.identityKey,
        principalToken: silverTokenKey,
        principalQuantity: "2000",
        interestRate: "750",
        duration: 60 * 24 * 60 * 60,
        collateralToken: goldTokenKey,
        collateralRatio: "2.0"
      });

      const lender1 = createLenderTracker(offer1);
      const lender2 = createLenderTracker(offer2);

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2)
        .savedState(offer1, offer2, lender1, lender2);

      const dto = plainToInstance(FetchLendingOffersDto, {
        lender: users.testUser1.identityKey
      });

      // When
      const response = await contract.FetchLendingOffers(ctx, dto);

      // Then
      expect(response).toHaveProperty("Status", 1);
      expect(response.Data!).toHaveLength(1);
      expect(response.Data![0]).toMatchObject({
        lender: users.testUser1.identityKey,
        principalQuantity: new BigNumber("1000")
      });
    });

    it("should fetch offers filtered by principal token", async () => {
      // Given
      const offer1 = createOffer({
        id: 0,
        lender: users.testUser1.identityKey,
        principalToken: goldTokenKey,
        principalQuantity: "1000",
        interestRate: "500",
        duration: 30 * 24 * 60 * 60,
        collateralToken: silverTokenKey,
        collateralRatio: "1.5"
      });

      const offer2 = createOffer({
        id: 0,
        lender: users.testUser2.identityKey,
        principalToken: silverTokenKey,
        principalQuantity: "2000",
        interestRate: "750",
        duration: 60 * 24 * 60 * 60,
        collateralToken: goldTokenKey,
        collateralRatio: "2.0"
      });

      const lender1 = createLenderTracker(offer1);
      const lender2 = createLenderTracker(offer2);

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2)
        .savedState(offer1, offer2, lender1, lender2);

      const dto = plainToInstance(FetchLendingOffersDto, {
        principalToken: goldTokenKey
      });

      // When
      const response = await contract.FetchLendingOffers(ctx, dto);

      // Then
      expect(response).toHaveProperty("Status", 1);
      expect(response.Data!).toHaveLength(1);
      expect(response.Data![0]).toMatchObject({
        principalToken: goldTokenKey,
        principalQuantity: new BigNumber("1000")
      });
    });

    it("should fetch offers filtered by borrower", async () => {
      // Given
      const offer1 = createOffer({
        id: 0,
        lender: users.testUser1.identityKey,
        principalToken: goldTokenKey,
        principalQuantity: "1000",
        interestRate: "500",
        duration: 30 * 24 * 60 * 60,
        collateralToken: silverTokenKey,
        collateralRatio: "1.5",
        borrower: users.testUser2.identityKey
      });

      const offer2 = createOffer({
        id: 0,
        lender: users.testUser1.identityKey,
        principalToken: goldTokenKey,
        principalQuantity: "2000",
        interestRate: "600",
        duration: 30 * 24 * 60 * 60,
        collateralToken: silverTokenKey,
        collateralRatio: "1.5"
        // No specific borrower (open market)
      });

      const lender1 = createLenderTracker(offer1);
      const lender2 = createLenderTracker(offer2);

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2)
        .savedState(offer1, offer2, lender1, lender2);

      const dto = plainToInstance(FetchLendingOffersDto, {
        borrower: users.testUser2.identityKey
      });

      // When
      const response = await contract.FetchLendingOffers(ctx, dto);

      // Then
      expect(response).toHaveProperty("Status", 1);
      expect(response.Data!).toHaveLength(1);
      expect(response.Data![0]).toMatchObject({
        borrower: users.testUser2.identityKey,
        principalQuantity: new BigNumber("1000")
      });
    });

    it("should fetch offers filtered by status", async () => {
      // Given
      const offer1 = createOffer({
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

      const offer2 = createOffer({
        id: 1,
        lender: users.testUser1.identityKey,
        principalToken: goldTokenKey,
        principalQuantity: "2000",
        interestRate: "600",
        duration: 30 * 24 * 60 * 60,
        collateralToken: silverTokenKey,
        collateralRatio: "1.5",
        status: LendingStatus.OfferAccepted
      });

      const lender1 = createLenderTracker(offer1);
      const lender2 = createLenderTracker(offer2);

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1)
        .savedState(offer1, offer2, lender1, lender2);

      const dto = plainToInstance(FetchLendingOffersDto, {
        status: LendingStatus.OfferOpen
      });

      // When
      const response = await contract.FetchLendingOffers(ctx, dto);

      // Then
      expect(response).toHaveProperty("Status", 1);
      expect(response.Data!).toHaveLength(1);
      expect(response.Data![0]).toMatchObject({
        status: LendingStatus.OfferOpen,
        principalQuantity: new BigNumber("1000")
      });
    });

    it("should return empty array when no offers match filters", async () => {
      // Given
      const offer = createOffer({
        id: 0,
        lender: users.testUser1.identityKey,
        principalToken: goldTokenKey,
        principalQuantity: "1000",
        interestRate: "500",
        duration: 30 * 24 * 60 * 60,
        collateralToken: silverTokenKey,
        collateralRatio: "1.5"
      });

      const lender = createLenderTracker(offer);

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2)
        .savedState(offer, lender);

      const dto = plainToInstance(FetchLendingOffersDto, {
        lender: users.testUser2.identityKey
      });

      // When
      const response = await contract.FetchLendingOffers(ctx, dto);

      // Then
      expect(response).toHaveProperty("Status", 1);
      expect(response.Data!).toHaveLength(0);
    });

    it("should handle multiple filters combined", async () => {
      // Given
      const offer1 = createOffer({
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

      const offer2 = createOffer({
        id: 1,
        lender: users.testUser1.identityKey,
        principalToken: silverTokenKey,
        principalQuantity: "2000",
        interestRate: "600",
        duration: 30 * 24 * 60 * 60,
        collateralToken: goldTokenKey,
        collateralRatio: "1.5",
        status: LendingStatus.OfferOpen
      });

      const offer3 = createOffer({
        id: 0,
        lender: users.testUser2.identityKey,
        principalToken: goldTokenKey,
        principalQuantity: "3000",
        interestRate: "700",
        duration: 30 * 24 * 60 * 60,
        collateralToken: silverTokenKey,
        collateralRatio: "1.5",
        status: LendingStatus.OfferOpen
      });

      const lender1 = createLenderTracker(offer1);
      const lender2 = createLenderTracker(offer2);
      const lender3 = createLenderTracker(offer3);

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1, users.testUser2)
        .savedState(offer1, offer2, offer3, lender1, lender2, lender3);

      const dto = plainToInstance(FetchLendingOffersDto, {
        lender: users.testUser1.identityKey,
        principalToken: goldTokenKey,
        status: LendingStatus.OfferOpen
      });

      // When
      const response = await contract.FetchLendingOffers(ctx, dto);

      // Then
      expect(response).toHaveProperty("Status", 1);
      expect(response.Data!).toHaveLength(1);
      expect(response.Data![0]).toMatchObject({
        lender: users.testUser1.identityKey,
        principalToken: goldTokenKey,
        status: LendingStatus.OfferOpen,
        principalQuantity: new BigNumber("1000")
      });
    });
  });
});

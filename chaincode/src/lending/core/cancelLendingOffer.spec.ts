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
  CancelLendingOfferDto,
  FungibleLendingOffer,
  LendingLender,
  LendingStatus,
  TokenClassKey,
  UnauthorizedLoanOperationError,
  createValidSubmitDTO
} from "@gala-chain/api";
import { fixture, users } from "@gala-chain/test";
import { BigNumber } from "bignumber.js";
import { plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../../__test__/GalaChainTokenContract";

describe("CancelLendingOffer", () => {
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

  describe("cancelLendingOffer", () => {
    it("should cancel an open offer when called by lender", async () => {
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

      const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1)
        .savedState(offer, lenderTracker);

      const dto = await createValidSubmitDTO(CancelLendingOfferDto, {
        offerKey: offer.getCompositeKey()
      });

      dto.sign(users.testUser1.privateKey);

      // When
      const result = await contract.CancelLendingOffer(ctx, dto);

      // Then
      expect(result.Status).toBe(1);
      expect(result.Data).toMatchObject({
        id: 0,
        lender: users.testUser1.identityKey,
        status: LendingStatus.OfferCancelled
      });

      // Verify the offer was updated
      const updatedOffer = JSON.parse(getWrites()[offer.getCompositeKey()]);
      expect(updatedOffer).toMatchObject({
        status: LendingStatus.OfferCancelled
      });

      // Verify the lender tracker was updated (if found)
      const lenderTrackerData = getWrites()[lenderTracker.getCompositeKey()];
      if (lenderTrackerData) {
        const updatedLender = JSON.parse(lenderTrackerData);
        expect(updatedLender).toMatchObject({
          status: LendingStatus.OfferCancelled
        });
      }
    });

    it("should fail when non-lender tries to cancel offer", async () => {
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

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser2)
        .savedState(offer, lenderTracker);

      const dto = await createValidSubmitDTO(CancelLendingOfferDto, {
        offerKey: offer.getCompositeKey()
      });
      dto.sign(users.testUser2.privateKey);

      // When/Then
      const result = await contract.CancelLendingOffer(ctx, dto);
      expect(result.Status).toBe(0);
      expect(result.ErrorKey).toBe("UNAUTHORIZED_LOAN_OPERATION");
    });

    it("should fail when offer is already cancelled", async () => {
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

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1)
        .savedState(offer, lenderTracker);

      const dto = await createValidSubmitDTO(CancelLendingOfferDto, {
        offerKey: offer.getCompositeKey()
      });

      dto.sign(users.testUser1.privateKey);

      // When/Then
      const result = await contract.CancelLendingOffer(ctx, dto);
      expect(result.Status).toBe(0);
      expect(result.ErrorKey).toBe("LENDING_OFFER_NOT_AVAILABLE");
    });

    it("should fail when offer is active (has loans)", async () => {
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
        status: LendingStatus.OfferAccepted
      });

      const lenderTracker = createLenderTracker(offer);

      const { ctx, contract } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1)
        .savedState(offer, lenderTracker);

      const dto = await createValidSubmitDTO(CancelLendingOfferDto, {
        offerKey: offer.getCompositeKey()
      });

      dto.sign(users.testUser1.privateKey);

      // When/Then
      const result = await contract.CancelLendingOffer(ctx, dto);
      expect(result.Status).toBe(0);
      expect(result.ErrorKey).toBe("LENDING_OFFER_NOT_AVAILABLE");
    });

    it("should fail when offer does not exist", async () => {
      // Given
      const { ctx, contract } = fixture(GalaChainTokenContract).registeredUsers(users.testUser1);

      const dto = await createValidSubmitDTO(CancelLendingOfferDto, {
        offerKey: "nonexistent|offer|key"
      });

      dto.sign(users.testUser1.privateKey);

      // When/Then
      const result = await contract.CancelLendingOffer(ctx, dto);
      expect(result.Status).toBe(0);
      expect(result.ErrorKey).toBe("OBJECT_NOT_FOUND");
    });

    it("should handle offer with specific borrower", async () => {
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
        borrower: users.testUser2.identityKey
      });

      const lenderTracker = createLenderTracker(offer);

      const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1)
        .savedState(offer, lenderTracker);

      const dto = await createValidSubmitDTO(CancelLendingOfferDto, {
        offerKey: offer.getCompositeKey()
      });

      dto.sign(users.testUser1.privateKey);

      // When
      const result = await contract.CancelLendingOffer(ctx, dto);

      // Then
      expect(result.Status).toBe(1);
      expect(result.Data).toMatchObject({
        id: 0,
        lender: users.testUser1.identityKey,
        borrower: users.testUser2.identityKey,
        status: LendingStatus.OfferCancelled
      });

      // Verify the offer was updated
      const updatedOffer = JSON.parse(getWrites()[offer.getCompositeKey()]);
      expect(updatedOffer).toMatchObject({
        status: LendingStatus.OfferCancelled
      });
    });

    it("should preserve all offer properties when cancelling", async () => {
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
        expires: 2000000,
        created: 1000000
      });

      const lenderTracker = createLenderTracker(offer);

      const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
        .registeredUsers(users.testUser1)
        .savedState(offer, lenderTracker);

      const dto = await createValidSubmitDTO(CancelLendingOfferDto, {
        offerKey: offer.getCompositeKey()
      });

      dto.sign(users.testUser1.privateKey);

      // When
      const result = await contract.CancelLendingOffer(ctx, dto);

      // Then
      expect(result.Status).toBe(1);
      expect(result.Data).toMatchObject({
        id: 0,
        lender: users.testUser1.identityKey,
        principalToken: goldTokenKey,
        principalQuantity: new BigNumber("1000"),
        interestRate: new BigNumber("500"),
        duration: 30 * 24 * 60 * 60,
        collateralToken: silverTokenKey,
        collateralRatio: new BigNumber("1.5"),
        status: LendingStatus.OfferCancelled,
        expires: 2000000,
        created: 1000000,
        uses: new BigNumber("1"),
        usesSpent: new BigNumber("0")
      });
    });
  });
});

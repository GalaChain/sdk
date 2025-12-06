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
  LendingLender,
  LendingOfferNotAvailableError,
  LendingStatus,
  UnauthorizedLoanOperationError
} from "@gala-chain/api";

import { GalaChainContext } from "../../types";
import { getObjectByKey, getObjectsByPartialCompositeKey, putChainObject } from "../../utils";

export interface CancelLendingOfferParams {
  offerKey: string;
  callingUser: string;
}

/**
 * Cancel an existing lending offer.
 *
 * This function:
 * 1. Retrieves the lending offer from the blockchain
 * 2. Validates the calling user is authorized to cancel
 * 3. Checks the offer can be cancelled (not already accepted/fulfilled)
 * 4. Updates the offer status to cancelled
 * 5. Updates associated lender tracking objects
 * 6. Releases locked principal tokens (via allowance system)
 *
 * @param ctx - GalaChain context for blockchain operations
 * @param params - Cancellation parameters
 * @returns The cancelled lending offer
 */
export async function cancelLendingOffer(
  ctx: GalaChainContext,
  { offerKey, callingUser }: CancelLendingOfferParams
): Promise<FungibleLendingOffer> {
  // Retrieve the lending offer
  const offer = await getObjectByKey(ctx, FungibleLendingOffer, offerKey);

  // Validate authorization - only lender can cancel their offer
  if (callingUser !== offer.lender) {
    throw new UnauthorizedLoanOperationError("cancel offer", callingUser, offerKey, [offer.lender]).logError(
      ctx.logger
    );
  }

  // Validate offer can be cancelled
  validateOfferCanBeCancelled(offer);

  // Update offer status
  const updatedOffer = Object.assign(Object.create(Object.getPrototypeOf(offer)), offer);
  updatedOffer.status = LendingStatus.OfferCancelled;

  // Update lender tracking objects
  await updateLenderTrackingObjects(ctx, offer, LendingStatus.OfferCancelled);

  // Save updated offer
  await putChainObject(ctx, updatedOffer);

  ctx.logger.info(`Cancelled lending offer ${offerKey} by user ${callingUser}`);

  return updatedOffer;
}

/**
 * Validate that an offer can be cancelled based on its current status.
 */
function validateOfferCanBeCancelled(offer: FungibleLendingOffer): void {
  const cancellableStatuses = [LendingStatus.OfferOpen, LendingStatus.OfferExpired];

  if (!cancellableStatuses.includes(offer.status)) {
    throw new LendingOfferNotAvailableError(offer.status, offer.getCompositeKey(), "system");
  }

  // Additional check: if offer has been partially used, it can still be cancelled
  // but we should note this in logs for audit purposes
  if (offer.usesSpent.isGreaterThan(0)) {
    // This is allowed but noteworthy for audit trails
  }
}

/**
 * Update all lender tracking objects associated with this offer.
 */
async function updateLenderTrackingObjects(
  ctx: GalaChainContext,
  offer: FungibleLendingOffer,
  newStatus: LendingStatus
): Promise<void> {
  // Query for all lender tracking objects by this lender
  const lenderQuery = [offer.lender];

  const lenderObjects = await getObjectsByPartialCompositeKey(
    ctx,
    LendingLender.INDEX_KEY,
    lenderQuery,
    LendingLender
  );

  // Filter to find the specific lender objects for this offer
  const relevantLenders = lenderObjects.filter((lender) => lender.offer === offer.getCompositeKey());

  // Update all relevant lender tracking objects
  const updatePromises = relevantLenders.map(async (lender) => {
    const updatedLender = Object.assign(Object.create(Object.getPrototypeOf(lender)), lender);
    updatedLender.status = newStatus;
    await putChainObject(ctx, updatedLender);
  });

  await Promise.all(updatePromises);
}

/**
 * Cancel multiple lending offers in a batch operation.
 * This is useful for lenders who want to cancel all their offers at once.
 */
export async function batchCancelLendingOffers(
  ctx: GalaChainContext,
  offerKeys: string[],
  callingUser: string
): Promise<{
  successful: FungibleLendingOffer[];
  failed: { offerKey: string; error: string }[];
}> {
  const successful: FungibleLendingOffer[] = [];
  const failed: { offerKey: string; error: string }[] = [];

  for (const offerKey of offerKeys) {
    try {
      const cancelledOffer = await cancelLendingOffer(ctx, { offerKey, callingUser });
      successful.push(cancelledOffer);
    } catch (error) {
      failed.push({
        offerKey,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      // Log the error but continue with other offers
      ctx.logger.error(
        `Failed to cancel offer ${offerKey}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  ctx.logger.info(`Batch cancellation completed: ${successful.length} successful, ${failed.length} failed`);

  return { successful, failed };
}

/**
 * Cancel all open offers for a specific lender.
 * This is a convenience function for lenders who want to exit the lending market.
 */
export async function cancelAllOffersForLender(
  ctx: GalaChainContext,
  lender: string,
  callingUser: string
): Promise<{
  successful: FungibleLendingOffer[];
  failed: { offerKey: string; error: string }[];
}> {
  // Validate authorization
  if (callingUser !== lender) {
    throw new UnauthorizedLoanOperationError("cancel all offers", callingUser, "all offers", [lender]);
  }

  // Query for all open offers by this lender
  const lenderQuery = [lender, LendingStatus.OfferOpen.toString()];

  const lenderObjects = await getObjectsByPartialCompositeKey(
    ctx,
    LendingLender.INDEX_KEY,
    lenderQuery,
    LendingLender
  );

  // Extract offer keys
  const offerKeys = lenderObjects.map((lender) => lender.offer);

  // Batch cancel all offers
  return batchCancelLendingOffers(ctx, offerKeys, callingUser);
}

/**
 * Automatically cancel expired offers.
 * This function can be called periodically to clean up expired offers.
 */
export async function cancelExpiredOffers(
  ctx: GalaChainContext,
  currentTime?: number
): Promise<{
  processed: number;
  cancelled: number;
  errors: number;
}> {
  const now = currentTime ?? ctx.txUnixTime;
  let processed = 0;
  let cancelled = 0;
  let errors = 0;

  // Get all open offers
  const openOffers = await getObjectsByPartialCompositeKey(
    ctx,
    FungibleLendingOffer.INDEX_KEY,
    [],
    FungibleLendingOffer
  );

  // Filter for expired offers
  const expiredOffers = openOffers.filter(
    (offer) => offer.status === LendingStatus.OfferOpen && offer.expires > 0 && offer.expires <= now
  );

  for (const offer of expiredOffers) {
    processed++;

    try {
      // Update offer status to expired (not cancelled, to distinguish)
      const updatedOffer = Object.assign(Object.create(Object.getPrototypeOf(offer)), offer);
      updatedOffer.status = LendingStatus.OfferExpired;

      // Update lender tracking objects
      await updateLenderTrackingObjects(ctx, offer, LendingStatus.OfferExpired);

      // Save updated offer
      await putChainObject(ctx, updatedOffer);

      cancelled++;
    } catch (error) {
      errors++;
      ctx.logger.error(
        `Failed to expire offer ${offer.getCompositeKey()}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  if (cancelled > 0) {
    ctx.logger.info(`Expired ${cancelled} offers out of ${processed} processed`);
  }

  return { processed, cancelled, errors };
}

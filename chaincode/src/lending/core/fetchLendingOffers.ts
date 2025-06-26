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
  LendingStatus,
  TokenClassKey
} from "@gala-chain/api";
import { BigNumber } from "bignumber.js";

import { GalaChainContext } from "../../types";
import { getObjectByKey, getObjectsByPartialCompositeKey } from "../../utils";

export interface FetchLendingOffersParams {
  principalToken?: TokenClassKey;
  collateralToken?: TokenClassKey;
  lender?: string;
  borrower?: string;
  status?: LendingStatus;
  maxInterestRate?: BigNumber;
  minDuration?: number;
  maxDuration?: number;
}

/**
 * Fetch lending offers with optional filtering parameters.
 * 
 * This function supports multiple query strategies:
 * 1. Query by lender (most efficient)
 * 2. Query by token class properties
 * 3. Full scan with filtering (least efficient)
 * 
 * @param ctx - GalaChain context for blockchain operations
 * @param params - Filtering parameters for the query
 * @returns Array of lending offers matching the criteria
 */
export async function fetchLendingOffers(
  ctx: GalaChainContext,
  {
    principalToken,
    collateralToken,
    lender,
    borrower,
    status,
    maxInterestRate,
    minDuration,
    maxDuration
  }: FetchLendingOffersParams
): Promise<FungibleLendingOffer[]> {
  let offers: FungibleLendingOffer[] = [];

  if (lender) {
    // Most efficient: Query by lender using LendingLender index
    offers = await fetchOffersByLender(ctx, lender, status);
  } else if (principalToken) {
    // Moderately efficient: Query by principal token
    offers = await fetchOffersByPrincipalToken(ctx, principalToken);
  } else {
    // Least efficient: Full scan
    offers = await fetchAllOffers(ctx);
  }

  // Apply additional filters
  return filterOffers(offers, {
    principalToken,
    collateralToken,
    borrower,
    status,
    maxInterestRate,
    minDuration,
    maxDuration
  });
}

/**
 * Fetch offers by lender using the LendingLender index for efficiency.
 */
async function fetchOffersByLender(
  ctx: GalaChainContext,
  lender: string,
  status?: LendingStatus
): Promise<FungibleLendingOffer[]> {
  // Build query for LendingLender index
  const lenderQuery: string[] = [lender];
  
  if (status !== undefined) {
    lenderQuery.push(status.toString());
  }

  // Get lender tracking objects
  const lenders = await getObjectsByPartialCompositeKey(
    ctx,
    LendingLender.INDEX_KEY,
    lenderQuery,
    LendingLender
  );

  // Fetch the actual offers
  const offerPromises = lenders.map(lender => 
    getObjectByKey(ctx, FungibleLendingOffer, lender.offer)
  );

  return Promise.all(offerPromises);
}

/**
 * Fetch offers by principal token class.
 */
async function fetchOffersByPrincipalToken(
  ctx: GalaChainContext,
  principalToken: TokenClassKey
): Promise<FungibleLendingOffer[]> {
  // Build partial key for principal token
  const tokenQuery = [
    principalToken.collection,
    principalToken.category,
    principalToken.type,
    principalToken.additionalKey
  ];

  return getObjectsByPartialCompositeKey(
    ctx,
    FungibleLendingOffer.INDEX_KEY,
    tokenQuery,
    FungibleLendingOffer
  );
}

/**
 * Fetch all offers (full scan - use cautiously).
 */
async function fetchAllOffers(ctx: GalaChainContext): Promise<FungibleLendingOffer[]> {
  return getObjectsByPartialCompositeKey(
    ctx,
    FungibleLendingOffer.INDEX_KEY,
    [],
    FungibleLendingOffer
  );
}

/**
 * Apply client-side filtering to offers.
 */
function filterOffers(
  offers: FungibleLendingOffer[],
  filters: {
    principalToken?: TokenClassKey;
    collateralToken?: TokenClassKey;
    borrower?: string;
    status?: LendingStatus;
    maxInterestRate?: BigNumber;
    minDuration?: number;
    maxDuration?: number;
  }
): FungibleLendingOffer[] {
  return offers.filter(offer => {
    // Principal token filter
    if (filters.principalToken && !tokenClassMatches(offer.principalToken, filters.principalToken)) {
      return false;
    }

    // Collateral token filter
    if (filters.collateralToken && !tokenClassMatches(offer.collateralToken, filters.collateralToken)) {
      return false;
    }

    // Borrower filter (for specific borrower offers)
    if (filters.borrower && offer.borrower && offer.borrower !== filters.borrower) {
      return false;
    }

    // Status filter
    if (filters.status !== undefined && offer.status !== filters.status) {
      return false;
    }

    // Interest rate filter
    if (filters.maxInterestRate && offer.interestRate.isGreaterThan(filters.maxInterestRate)) {
      return false;
    }

    // Duration filters
    if (filters.minDuration !== undefined && offer.duration < filters.minDuration) {
      return false;
    }

    if (filters.maxDuration !== undefined && offer.duration > filters.maxDuration) {
      return false;
    }

    return true;
  });
}

/**
 * Check if two token class keys match.
 */
function tokenClassMatches(token1: TokenClassKey, token2: TokenClassKey): boolean {
  return (
    token1.collection === token2.collection &&
    token1.category === token2.category &&
    token1.type === token2.type &&
    token1.additionalKey === token2.additionalKey
  );
}

/**
 * Fetch active (non-expired, available) lending offers.
 * This is a convenience function for common use cases.
 */
export async function fetchActiveLendingOffers(
  ctx: GalaChainContext,
  filters: FetchLendingOffersParams = {}
): Promise<FungibleLendingOffer[]> {
  const currentTime = ctx.txUnixTime;
  
  // Get all offers matching basic filters
  const offers = await fetchLendingOffers(ctx, {
    ...filters,
    status: LendingStatus.OfferOpen
  });

  // Filter out expired offers and those with no remaining uses
  return offers.filter(offer => {
    // Check expiration
    if (offer.expires > 0 && offer.expires <= currentTime) {
      return false;
    }

    // Check remaining uses
    if (offer.usesSpent.isGreaterThanOrEqualTo(offer.uses)) {
      return false;
    }

    return true;
  });
}

/**
 * Fetch offers available to a specific borrower.
 * This includes both open market offers and offers specifically for this borrower.
 */
export async function fetchOffersForBorrower(
  ctx: GalaChainContext,
  borrower: string,
  filters: Omit<FetchLendingOffersParams, 'borrower'> = {}
): Promise<FungibleLendingOffer[]> {
  // Get open market offers
  const openOffers = await fetchActiveLendingOffers(ctx, {
    ...filters,
    borrower: undefined // Explicitly no specific borrower
  });

  // Get offers specific to this borrower
  const specificOffers = await fetchActiveLendingOffers(ctx, {
    ...filters,
    borrower
  });

  // Combine and deduplicate
  const allOffers = [...openOffers, ...specificOffers];
  const uniqueOffers = allOffers.filter((offer, index) => 
    allOffers.findIndex(o => o.getCompositeKey() === offer.getCompositeKey()) === index
  );

  return uniqueOffers;
}

/**
 * Fetch lending offers sorted by interest rate (ascending).
 * Useful for borrowers looking for the best rates.
 */
export async function fetchOffersByBestRates(
  ctx: GalaChainContext,
  filters: FetchLendingOffersParams = {},
  limit?: number
): Promise<FungibleLendingOffer[]> {
  const offers = await fetchActiveLendingOffers(ctx, filters);
  
  // Sort by interest rate (ascending - best rates first)
  const sortedOffers = offers.sort((a, b) => {
    const comparison = a.interestRate.comparedTo(b.interestRate);
    if (comparison !== 0) return comparison;
    
    // Secondary sort by duration (shorter first)
    return a.duration - b.duration;
  });

  return limit ? sortedOffers.slice(0, limit) : sortedOffers;
}

/**
 * Get statistics about available lending offers.
 * Useful for market analysis and UI display.
 */
export async function getLendingMarketStats(
  ctx: GalaChainContext,
  principalToken?: TokenClassKey
): Promise<{
  totalOffers: number;
  totalPrincipalAvailable: BigNumber;
  averageInterestRate: BigNumber;
  medianInterestRate: BigNumber;
  minInterestRate: BigNumber;
  maxInterestRate: BigNumber;
  averageDuration: number;
}> {
  const offers = await fetchActiveLendingOffers(ctx, { principalToken });
  
  if (offers.length === 0) {
    return {
      totalOffers: 0,
      totalPrincipalAvailable: new BigNumber("0"),
      averageInterestRate: new BigNumber("0"),
      medianInterestRate: new BigNumber("0"),
      minInterestRate: new BigNumber("0"),
      maxInterestRate: new BigNumber("0"),
      averageDuration: 0
    };
  }

  // Calculate total principal available
  const totalPrincipalAvailable = offers.reduce(
    (sum, offer) => sum.plus(offer.principalQuantity.multipliedBy(offer.uses.minus(offer.usesSpent))),
    new BigNumber("0")
  );

  // Interest rate statistics
  const interestRates = offers.map(offer => offer.interestRate).sort((a, b) => a.comparedTo(b));
  const averageInterestRate = interestRates.reduce((sum, rate) => sum.plus(rate), new BigNumber("0"))
    .dividedBy(interestRates.length);
  
  const medianIndex = Math.floor(interestRates.length / 2);
  const medianInterestRate = interestRates.length % 2 === 0
    ? interestRates[medianIndex - 1].plus(interestRates[medianIndex]).dividedBy(2)
    : interestRates[medianIndex];

  // Duration statistics
  const averageDuration = offers.reduce((sum, offer) => sum + offer.duration, 0) / offers.length;

  return {
    totalOffers: offers.length,
    totalPrincipalAvailable,
    averageInterestRate: averageInterestRate.decimalPlaces(2),
    medianInterestRate: medianInterestRate.decimalPlaces(2),
    minInterestRate: interestRates[0],
    maxInterestRate: interestRates[interestRates.length - 1],
    averageDuration: Math.round(averageDuration)
  };
}
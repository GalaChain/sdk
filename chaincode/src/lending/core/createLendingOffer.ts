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
  AllowanceType,
  FungibleLendingOffer,
  GrantAllowanceQuantity,
  InsufficientPrincipalBalanceError,
  InvalidLendingParametersError,
  InvalidTokenClassError,
  LendingLender,
  LendingOfferLenderCallerMismatchError,
  LendingOfferResDto,
  LendingStatus,
  TokenClass,
  TokenClassKey,
  TokenInstanceQueryKey,
  asValidUserAlias
} from "@gala-chain/api";
import { BigNumber } from "bignumber.js";
import { plainToInstance } from "class-transformer";

import { grantAllowance } from "../../allowances";
import { fetchBalances } from "../../balances";
import { GalaChainContext } from "../../types";
import { getObjectByKey, putChainObject } from "../../utils";

export interface CreateLendingOfferParams {
  lender: string;
  principalToken: TokenClassKey;
  principalQuantity: BigNumber;
  interestRate: BigNumber;
  duration: number;
  collateralToken: TokenClassKey;
  collateralRatio: BigNumber;
  borrowers?: Array<string>;
  uses: BigNumber;
  expires: number;
}

/**
 * Create a new fungible token lending offer.
 *
 * This function:
 * 1. Validates the lender has sufficient principal tokens
 * 2. Validates lending parameters (rates, duration, etc.)
 * 3. Locks the principal tokens for the offer
 * 4. Creates lending offer(s) for specific borrowers or open market
 * 5. Grants allowances for collateral management
 *
 * @param ctx - GalaChain context for blockchain operations
 * @param params - Lending offer creation parameters
 * @returns Array of created lending offers with their lender tracking objects
 */
export async function createLendingOffer(
  ctx: GalaChainContext,
  {
    lender,
    principalToken,
    principalQuantity,
    interestRate,
    duration,
    collateralToken,
    collateralRatio,
    borrowers,
    uses,
    expires
  }: CreateLendingOfferParams
): Promise<LendingOfferResDto[]> {
  // Validate caller authorization
  if (ctx.callingUser !== lender) {
    throw new LendingOfferLenderCallerMismatchError(ctx.callingUser, lender).logError(ctx.logger);
  }

  // Validate lending parameters
  await validateLendingParameters({
    principalToken,
    principalQuantity,
    interestRate,
    duration,
    collateralToken,
    collateralRatio,
    uses,
    expires
  });

  // Check lender has sufficient principal token balance
  await validateLenderBalance(ctx, lender, principalToken, principalQuantity);

  // Validate token classes exist and are fungible
  await validateTokenClasses(ctx, principalToken, collateralToken);

  // Create lending offers
  const offers: FungibleLendingOffer[] = [];
  let targetUsers: string[] = [];

  if (Array.isArray(borrowers) && borrowers.length > 0) {
    // Create specific offers for each borrower (P2P lending)
    targetUsers = borrowers;

    for (let i = 0; i < borrowers.length; i++) {
      const offer = createOfferObject({
        lender,
        principalToken,
        principalQuantity,
        interestRate,
        duration,
        collateralToken,
        collateralRatio,
        borrower: borrowers[i],
        uses,
        expires,
        id: i,
        created: ctx.txUnixTime
      });

      offers.push(offer);
    }
  } else {
    // Create open market offer
    const offer = createOfferObject({
      lender,
      principalToken,
      principalQuantity,
      interestRate,
      duration,
      collateralToken,
      collateralRatio,
      uses,
      expires,
      id: 0,
      created: ctx.txUnixTime
    });

    offers.push(offer);
  }

  // Grant allowances for principal token locking
  const allowanceQuantities =
    targetUsers.length > 0
      ? targetUsers.map((user) =>
          plainToInstance(GrantAllowanceQuantity, {
            user,
            quantity: new BigNumber("1") // Number of offers that can use this allowance
          })
        )
      : [
          plainToInstance(GrantAllowanceQuantity, {
            user: lender, // Self-allowance for open market offers
            quantity: uses
          })
        ];

  // Create TokenInstanceQueryKey for fungible token
  const tokenInstanceKey = new TokenInstanceQueryKey();
  tokenInstanceKey.collection = principalToken.collection;
  tokenInstanceKey.category = principalToken.category;
  tokenInstanceKey.type = principalToken.type;
  tokenInstanceKey.additionalKey = principalToken.additionalKey;
  tokenInstanceKey.instance = new BigNumber("0"); // Fungible token instance

  await grantAllowance(ctx, {
    tokenInstance: tokenInstanceKey,
    allowanceType: AllowanceType.Lock,
    quantities: allowanceQuantities,
    uses: uses.multipliedBy(targetUsers.length || 1),
    expires
  });

  // Store offers and create lender tracking objects
  const results: LendingOfferResDto[] = [];
  const chainWrites: Promise<void>[] = [];

  for (const offer of offers) {
    // Create lender tracking object
    const lenderTracker = new LendingLender();
    lenderTracker.id = lender;
    lenderTracker.status = LendingStatus.OfferOpen;
    lenderTracker.offer = offer.getCompositeKey();
    lenderTracker.principalToken = principalToken;
    lenderTracker.principalQuantity = principalQuantity;

    // Queue chain writes
    chainWrites.push(putChainObject(ctx, offer));
    chainWrites.push(putChainObject(ctx, lenderTracker));

    // Create response DTO
    const responseDto = new LendingOfferResDto();
    responseDto.offer = offer;
    responseDto.lender = lenderTracker;

    results.push(responseDto);
  }

  // Execute all chain writes in parallel
  await Promise.all(chainWrites);

  ctx.logger.info(`Created ${offers.length} lending offer(s) for lender ${lender}`);

  return results;
}

/**
 * Create a lending offer object with all required fields.
 */
function createOfferObject(params: {
  lender: string;
  principalToken: TokenClassKey;
  principalQuantity: BigNumber;
  interestRate: BigNumber;
  duration: number;
  collateralToken: TokenClassKey;
  collateralRatio: BigNumber;
  borrower?: string;
  uses: BigNumber;
  expires: number;
  id: number;
  created: number;
}): FungibleLendingOffer {
  const offer = new FungibleLendingOffer();

  offer.principalToken = params.principalToken;
  offer.principalQuantity = params.principalQuantity;
  offer.lender = params.lender;
  offer.created = params.created;
  offer.id = params.id;
  offer.interestRate = params.interestRate;
  offer.duration = params.duration;
  offer.collateralToken = params.collateralToken;
  offer.collateralRatio = params.collateralRatio;
  offer.borrower = params.borrower;
  offer.status = LendingStatus.OfferOpen;
  offer.uses = params.uses;
  offer.usesSpent = new BigNumber("0");
  offer.expires = params.expires;

  return offer;
}

/**
 * Validate lending parameters for business logic requirements.
 */
async function validateLendingParameters(params: {
  principalToken: TokenClassKey;
  principalQuantity: BigNumber;
  interestRate: BigNumber;
  duration: number;
  collateralToken: TokenClassKey;
  collateralRatio: BigNumber;
  uses: BigNumber;
  expires: number;
}): Promise<void> {
  const { principalQuantity, interestRate, duration, collateralRatio, uses, expires } = params;

  // Validate principal quantity
  if (principalQuantity.isLessThanOrEqualTo(0)) {
    throw new InvalidLendingParametersError(
      "principalQuantity",
      principalQuantity.toString(),
      "Must be greater than zero"
    );
  }

  // Validate interest rate (allow zero for 0% loans)
  if (interestRate.isNegative()) {
    throw new InvalidLendingParametersError("interestRate", interestRate.toString(), "Must be non-negative");
  }

  // Validate duration
  if (duration <= 0) {
    throw new InvalidLendingParametersError(
      "duration",
      duration.toString(),
      "Must be greater than zero seconds"
    );
  }

  // Validate collateral ratio (must be > 1 for over-collateralization)
  if (collateralRatio.isLessThanOrEqualTo(1)) {
    throw new InvalidLendingParametersError(
      "collateralRatio",
      collateralRatio.toString(),
      "Must be greater than 1.0 for over-collateralization"
    );
  }

  // Validate uses
  if (uses.isLessThanOrEqualTo(0) || !uses.isInteger()) {
    throw new InvalidLendingParametersError("uses", uses.toString(), "Must be a positive integer");
  }

  // Validate expiration
  if (expires < 0) {
    throw new InvalidLendingParametersError(
      "expires",
      expires.toString(),
      "Must be non-negative (0 for no expiration)"
    );
  }

  // Reasonable limits for business logic
  const maxDuration = 10 * 365 * 24 * 60 * 60; // 10 years
  if (duration > maxDuration) {
    throw new InvalidLendingParametersError(
      "duration",
      duration.toString(),
      `Duration cannot exceed ${maxDuration} seconds (10 years)`
    );
  }

  const maxInterestRate = new BigNumber("100000"); // 1000% APR
  if (interestRate.isGreaterThan(maxInterestRate)) {
    throw new InvalidLendingParametersError(
      "interestRate",
      interestRate.toString(),
      `Interest rate cannot exceed ${maxInterestRate} basis points (1000% APR)`
    );
  }

  const maxCollateralRatio = new BigNumber("10"); // 1000% collateralization
  if (collateralRatio.isGreaterThan(maxCollateralRatio)) {
    throw new InvalidLendingParametersError(
      "collateralRatio",
      collateralRatio.toString(),
      `Collateral ratio cannot exceed ${maxCollateralRatio} (1000%)`
    );
  }
}

/**
 * Validate that the lender has sufficient balance of principal tokens.
 */
async function validateLenderBalance(
  ctx: GalaChainContext,
  lender: string,
  principalToken: TokenClassKey,
  requiredQuantity: BigNumber
): Promise<void> {
  const balances = await fetchBalances(ctx, {
    owner: asValidUserAlias(lender),
    ...principalToken
  });

  if (balances.length === 0) {
    throw new InsufficientPrincipalBalanceError(
      lender,
      requiredQuantity.toString(),
      "0",
      principalToken.toStringKey()
    );
  }

  // For fungible tokens, sum all balances of this token class
  const totalBalance = balances.reduce(
    (sum, balance) => sum.plus(balance.getQuantityTotal()),
    new BigNumber("0")
  );

  if (totalBalance.isLessThan(requiredQuantity)) {
    throw new InsufficientPrincipalBalanceError(
      lender,
      requiredQuantity.toString(),
      totalBalance.toString(),
      principalToken.toStringKey()
    );
  }
}

/**
 * Validate that token classes exist and are fungible.
 */
async function validateTokenClasses(
  ctx: GalaChainContext,
  principalToken: TokenClassKey,
  collateralToken: TokenClassKey
): Promise<void> {
  try {
    // Check principal token class
    const principalTokenClass = await getObjectByKey(
      ctx,
      TokenClass,
      TokenClass.buildTokenClassCompositeKey(principalToken)
    );

    if (principalTokenClass.isNonFungible) {
      throw new InvalidTokenClassError(
        principalToken.toStringKey(),
        "lending offer creation",
        "Principal token must be fungible (isNonFungible = false)"
      );
    }

    // Check collateral token class
    const collateralTokenClass = await getObjectByKey(
      ctx,
      TokenClass,
      TokenClass.buildTokenClassCompositeKey(collateralToken)
    );

    if (collateralTokenClass.isNonFungible) {
      throw new InvalidTokenClassError(
        collateralToken.toStringKey(),
        "lending offer creation",
        "Collateral token must be fungible (isNonFungible = false)"
      );
    }
  } catch (error) {
    if (error instanceof InvalidTokenClassError) {
      throw error;
    }

    // If token class not found or other error
    throw new InvalidTokenClassError(
      "unknown",
      "lending offer creation",
      `Failed to validate token classes: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

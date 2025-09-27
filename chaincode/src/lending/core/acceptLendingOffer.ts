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
  FungibleLoan,
  InsufficientCollateralBalanceError,
  InvalidTokenClassError,
  LendingAgreement,
  LendingClosedBy,
  LendingLender,
  LendingOfferNotAvailableError,
  LendingStatus,
  TokenClass,
  TokenInstanceKey,
  TokenInstanceQueryKey,
  UnauthorizedLoanOperationError,
  asValidUserAlias
} from "@gala-chain/api";
import { BigNumber } from "bignumber.js";

import { fetchAllowances } from "../../allowances";
import { fetchBalances } from "../../balances";
import { lockToken } from "../../locks";
import { transferToken } from "../../transfer";
import { GalaChainContext } from "../../types";
import { getObjectByKey, getObjectsByPartialCompositeKey, putChainObject } from "../../utils";

export interface AcceptLendingOfferResult {
  loan: FungibleLoan;
  agreement: LendingAgreement;
  collateralLocked: BigNumber;
  totalDebt: BigNumber;
}

export interface AcceptLendingOfferParams {
  offer: string;
  borrower: string;
  collateralAmount: BigNumber;
}

/**
 * Accept a lending offer and create an active loan.
 *
 * This function:
 * 1. Validates the offer is available and borrower is authorized
 * 2. Calculates required collateral and validates borrower has sufficient balance
 * 3. Transfers principal tokens from lender to borrower
 * 4. Locks collateral tokens from borrower
 * 5. Creates active loan object with loan agreement
 * 6. Updates offer status and usage counters
 * 7. Updates lender tracking objects
 *
 * @param ctx - GalaChain context for blockchain operations
 * @param params - Loan acceptance parameters
 * @returns Created loan with agreement details
 */
export async function acceptLendingOffer(
  ctx: GalaChainContext,
  { offer, borrower, collateralAmount }: AcceptLendingOfferParams
): Promise<AcceptLendingOfferResult> {
  // Retrieve and validate the lending offer
  const lendingOffer = await getObjectByKey(ctx, FungibleLendingOffer, offer);

  // Validate the offer can be accepted
  await validateOfferForAcceptance(ctx, lendingOffer, borrower);

  // Validate collateral requirements
  await validateCollateralRequirements(ctx, lendingOffer, borrower, collateralAmount);

  // Calculate loan parameters
  const loanParams = calculateLoanParameters(lendingOffer, collateralAmount);

  // Transfer principal tokens from lender to borrower
  await transferPrincipalTokens(ctx, lendingOffer, borrower);

  // Lock collateral tokens from borrower
  await lockCollateralTokens(ctx, lendingOffer, borrower, collateralAmount);

  // Create loan and agreement objects
  const { loan, agreement } = await createLoanObjects(ctx, lendingOffer, borrower, loanParams);

  // Update offer status and usage
  await updateOfferUsage(ctx, lendingOffer);

  // Update lender tracking
  await updateLenderTracking(ctx, lendingOffer, loan);

  ctx.logger.info(`Loan originated: ${loan.getCompositeKey()} for offer ${offer} by borrower ${borrower}`);

  return {
    loan,
    agreement,
    collateralLocked: collateralAmount,
    totalDebt: loan.principalAmount.plus(loan.interestAccrued)
  };
}

/**
 * Validate that an offer can be accepted by the borrower.
 */
async function validateOfferForAcceptance(
  ctx: GalaChainContext,
  offer: FungibleLendingOffer,
  borrower: string
): Promise<void> {
  // Check offer status
  if (offer.status !== LendingStatus.OfferOpen) {
    throw new LendingOfferNotAvailableError(offer.status, offer.getCompositeKey(), borrower);
  }

  // Check if offer has expired
  if (offer.expires > 0 && offer.expires <= ctx.txUnixTime) {
    throw new LendingOfferNotAvailableError(LendingStatus.OfferExpired, offer.getCompositeKey(), borrower);
  }

  // Check remaining uses
  if (offer.usesSpent.isGreaterThanOrEqualTo(offer.uses)) {
    throw new LendingOfferNotAvailableError(LendingStatus.OfferExpired, offer.getCompositeKey(), borrower);
  }

  // Check borrower authorization (if offer is for specific borrower)
  if (offer.borrower && offer.borrower !== borrower) {
    throw new UnauthorizedLoanOperationError("accept offer", borrower, offer.getCompositeKey(), [
      offer.borrower
    ]);
  }

  // Ensure borrower is not the lender
  if (offer.lender === borrower) {
    throw new UnauthorizedLoanOperationError("accept own offer", borrower, offer.getCompositeKey(), []);
  }
}

/**
 * Validate collateral requirements and borrower's collateral balance.
 */
async function validateCollateralRequirements(
  ctx: GalaChainContext,
  offer: FungibleLendingOffer,
  borrower: string,
  collateralAmount: BigNumber
): Promise<void> {
  // Calculate minimum required collateral
  const requiredCollateral = offer.principalQuantity.multipliedBy(offer.collateralRatio);

  if (collateralAmount.isLessThan(requiredCollateral)) {
    throw new InsufficientCollateralBalanceError(
      borrower,
      requiredCollateral.toString(),
      collateralAmount.toString(),
      offer.collateralToken.toStringKey()
    );
  }

  // Validate borrower has sufficient collateral tokens
  const collateralBalances = await fetchBalances(ctx, {
    owner: asValidUserAlias(borrower),
    ...offer.collateralToken
  });

  if (collateralBalances.length === 0) {
    throw new InsufficientCollateralBalanceError(
      borrower,
      collateralAmount.toString(),
      "0",
      offer.collateralToken.toStringKey()
    );
  }

  const totalCollateralBalance = collateralBalances.reduce(
    (sum, balance) => sum.plus(balance.getQuantityTotal()),
    new BigNumber("0")
  );

  if (totalCollateralBalance.isLessThan(collateralAmount)) {
    throw new InsufficientCollateralBalanceError(
      borrower,
      collateralAmount.toString(),
      totalCollateralBalance.toString(),
      offer.collateralToken.toStringKey()
    );
  }

  // Validate collateral token class exists and is fungible
  await validateCollateralTokenClass(ctx, offer.collateralToken);
}

/**
 * Validate that collateral token class exists and is fungible.
 */
async function validateCollateralTokenClass(ctx: GalaChainContext, collateralToken: any): Promise<void> {
  try {
    const tokenClass = await getObjectByKey(
      ctx,
      TokenClass,
      TokenClass.buildTokenClassCompositeKey(collateralToken)
    );

    if (tokenClass.isNonFungible) {
      throw new InvalidTokenClassError(
        collateralToken.toStringKey(),
        "loan collateral",
        "Collateral token must be fungible (isNonFungible = false)"
      );
    }
  } catch (error) {
    if (error instanceof InvalidTokenClassError) {
      throw error;
    }

    throw new InvalidTokenClassError(
      "unknown",
      "loan collateral validation",
      `Failed to validate collateral token class: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Calculate loan parameters based on offer and collateral.
 */
function calculateLoanParameters(
  offer: FungibleLendingOffer,
  collateralAmount: BigNumber
): {
  principalAmount: BigNumber;
  interestRate: BigNumber;
  duration: number;
  dueDate: number;
  collateralRatio: BigNumber;
} {
  const currentTime = Date.now() / 1000;

  return {
    principalAmount: offer.principalQuantity,
    interestRate: offer.interestRate,
    duration: offer.duration,
    dueDate: Math.floor(currentTime + offer.duration),
    collateralRatio: collateralAmount.dividedBy(offer.principalQuantity)
  };
}

/**
 * Transfer principal tokens from lender to borrower using locked allowances.
 */
async function transferPrincipalTokens(
  ctx: GalaChainContext,
  offer: FungibleLendingOffer,
  borrower: string
): Promise<void> {
  // Create TokenInstanceKey for fungible token transfer
  const tokenInstanceKey = new TokenInstanceKey();
  tokenInstanceKey.collection = offer.principalToken.collection;
  tokenInstanceKey.category = offer.principalToken.category;
  tokenInstanceKey.type = offer.principalToken.type;
  tokenInstanceKey.additionalKey = offer.principalToken.additionalKey;
  tokenInstanceKey.instance = new BigNumber("0"); // Fungible token instance

  // Find the lock allowances created during offer creation
  const lockAllowances = await findLockAllowances(ctx, offer, borrower);

  // Transfer tokens from lender to borrower using locked allowances
  await transferToken(ctx, {
    from: asValidUserAlias(offer.lender),
    to: asValidUserAlias(borrower),
    tokenInstanceKey: tokenInstanceKey,
    quantity: offer.principalQuantity,
    allowancesToUse: lockAllowances,
    authorizedOnBehalf: {
      callingUser: asValidUserAlias(borrower),
      callingOnBehalf: asValidUserAlias(borrower)
    }
  });
}

/**
 * Find lock allowances created during offer creation that authorize the borrower.
 */
async function findLockAllowances(
  ctx: GalaChainContext,
  offer: FungibleLendingOffer,
  borrower: string
): Promise<string[]> {
  try {
    const allowances = await fetchAllowances(ctx, {
      grantedBy: asValidUserAlias(offer.lender),
      grantedTo: asValidUserAlias(borrower),
      collection: offer.principalToken.collection,
      category: offer.principalToken.category,
      type: offer.principalToken.type,
      additionalKey: offer.principalToken.additionalKey,
      instance: "0",
      allowanceType: AllowanceType.Transfer
    });

    // Filter for allowances that are still valid and not expired
    const validAllowances = allowances.filter((allowance) => {
      const notExpired = allowance.expires === 0 || allowance.expires > ctx.txUnixTime;
      const hasRemainingQuantity = allowance.quantity.isGreaterThan(
        allowance.quantitySpent ?? new BigNumber("0")
      );
      return notExpired && hasRemainingQuantity;
    });

    if (validAllowances.length === 0) {
      throw new Error(`No valid lock allowances found for borrower ${borrower} from lender ${offer.lender}`);
    }

    // Return the composite keys of valid allowances
    return validAllowances.map((allowance) => allowance.getCompositeKey());
  } catch (error) {
    throw new Error(
      `Failed to find lock allowances for offer ${offer.getCompositeKey()}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Lock collateral tokens from borrower using GalaChain locking system.
 */
async function lockCollateralTokens(
  ctx: GalaChainContext,
  offer: FungibleLendingOffer,
  borrower: string,
  collateralAmount: BigNumber
): Promise<void> {
  // Create TokenInstanceKey for fungible collateral tokens
  const collateralInstanceKey = new TokenInstanceKey();
  collateralInstanceKey.collection = offer.collateralToken.collection;
  collateralInstanceKey.category = offer.collateralToken.category;
  collateralInstanceKey.type = offer.collateralToken.type;
  collateralInstanceKey.additionalKey = offer.collateralToken.additionalKey;
  collateralInstanceKey.instance = new BigNumber("0"); // Fungible token instance

  // Lock collateral tokens with lender as lock authority
  await lockToken(ctx, {
    owner: asValidUserAlias(borrower),
    lockAuthority: asValidUserAlias(offer.lender), // Lender can unlock on repayment/liquidation
    tokenInstanceKey: collateralInstanceKey,
    quantity: collateralAmount,
    allowancesToUse: [], // No allowances needed for self-locking
    expires: 0, // Never expires until manual unlock
    name: `loan-collateral-${offer.getCompositeKey()}`, // Unique lock identifier
    vestingPeriodStart: undefined,
    verifyAuthorizedOnBehalf: async () => undefined
  });

  ctx.logger.info(
    `Locked ${collateralAmount} of ${offer.collateralToken.toStringKey()} from ${borrower} for loan collateral`
  );
}

/**
 * Create loan and agreement objects.
 */
async function createLoanObjects(
  ctx: GalaChainContext,
  offer: FungibleLendingOffer,
  borrower: string,
  loanParams: any
): Promise<{ loan: FungibleLoan; agreement: LendingAgreement }> {
  const currentTime = ctx.txUnixTime;

  // Create loan object
  const loan = new FungibleLoan();
  loan.lender = offer.lender;
  loan.borrower = borrower;
  loan.offerKey = offer.getCompositeKey();
  loan.startTime = currentTime;
  loan.principalToken = offer.principalToken;
  loan.principalAmount = loanParams.principalAmount;
  loan.interestRate = loanParams.interestRate;
  loan.collateralToken = offer.collateralToken;
  loan.collateralAmount = loanParams.collateralRatio.multipliedBy(loanParams.principalAmount);
  loan.collateralRatio = loanParams.collateralRatio;
  loan.healthFactor = new BigNumber("1.0"); // Initial health factor
  loan.endTime = loanParams.dueDate;
  loan.status = LendingStatus.LoanActive;
  loan.closedBy = LendingClosedBy.Unspecified;
  loan.interestAccrued = new BigNumber("0");
  loan.lastInterestUpdate = currentTime;

  // Create agreement object
  const agreement = new LendingAgreement();
  agreement.lender = offer.lender;
  agreement.offer = offer.getCompositeKey();
  agreement.loan = loan.getCompositeKey();
  agreement.borrower = borrower;
  agreement.created = currentTime;

  // Save objects to chain
  await putChainObject(ctx, loan);
  await putChainObject(ctx, agreement);

  return { loan, agreement };
}

/**
 * Update offer usage counters and status.
 */
async function updateOfferUsage(ctx: GalaChainContext, offer: FungibleLendingOffer): Promise<void> {
  const updatedOffer = Object.assign(Object.create(Object.getPrototypeOf(offer)), offer);

  // Increment uses spent
  updatedOffer.usesSpent = offer.usesSpent.plus(1);

  // Update status if fully used
  if (updatedOffer.usesSpent.isGreaterThanOrEqualTo(updatedOffer.uses)) {
    updatedOffer.status = LendingStatus.OfferAccepted;
  }

  await putChainObject(ctx, updatedOffer);
}

/**
 * Update lender tracking objects.
 */
async function updateLenderTracking(
  ctx: GalaChainContext,
  offer: FungibleLendingOffer,
  loan: FungibleLoan
): Promise<void> {
  // Query for lender tracking objects
  const lenderQuery = [offer.lender];

  const lenderObjects = await getObjectsByPartialCompositeKey(
    ctx,
    LendingLender.INDEX_KEY,
    lenderQuery,
    LendingLender
  );

  // Find and update the relevant lender tracking object
  const relevantLenders = lenderObjects.filter((lender) => lender.offer === offer.getCompositeKey());

  for (const lender of relevantLenders) {
    const updatedLender = Object.assign(Object.create(Object.getPrototypeOf(lender)), lender);

    // Update status based on offer usage
    if (offer.usesSpent.plus(1).isGreaterThanOrEqualTo(offer.uses)) {
      updatedLender.status = LendingStatus.OfferAccepted;
    } else {
      updatedLender.status = LendingStatus.LoanActive;
    }

    await putChainObject(ctx, updatedLender);
  }
}

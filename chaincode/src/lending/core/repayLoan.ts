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
  TokenInstanceKey,
  UnauthorizedLoanOperationError,
  asValidUserAlias
} from "@gala-chain/api";
import { BigNumber } from "bignumber.js";

import { fetchBalances } from "../../balances";
import { unlockToken } from "../../locks";
import { transferToken } from "../../transfer";
import { GalaChainContext } from "../../types";
import { getObjectByKey, putChainObject } from "../../utils";
import { calculateSimpleInterest } from "../interest/simpleInterest";

export interface RepayLoanParams {
  loanKey: string;
  repaymentAmount?: BigNumber;
  borrower?: string;
}

export interface RepayLoanResult {
  loan: FungibleLoan;
  principalRepaid: BigNumber;
  interestRepaid: BigNumber;
  collateralReturned: BigNumber;
}

/**
 * Repay a loan with principal and accrued interest.
 *
 * This function:
 * 1. Validates the loan exists and borrower is authorized
 * 2. Calculates accrued interest since loan origination
 * 3. Determines repayment amounts (principal vs interest)
 * 4. Transfers principal tokens from borrower to lender
 * 5. Unlocks and returns collateral to borrower (if full repayment)
 * 6. Updates loan status and closes loan if fully repaid
 *
 * @param ctx - GalaChain context for blockchain operations
 * @param params - Loan repayment parameters
 * @returns Repayment result with amounts and updated loan
 */
export async function repayLoan(
  ctx: GalaChainContext,
  { loanKey, repaymentAmount, borrower }: RepayLoanParams
): Promise<RepayLoanResult> {
  // Retrieve and validate the loan
  const loan = await getObjectByKey(ctx, FungibleLoan, loanKey);

  // Validate borrower authorization
  await validateRepaymentAuthorization(ctx, loan, borrower);

  // Calculate current outstanding debt
  const outstandingDebt = await calculateOutstandingDebt(ctx, loan);

  // Determine repayment amount (full repayment if not specified)
  const actualRepaymentAmount = repaymentAmount ?? outstandingDebt.totalDebt;

  // Validate repayment amount
  await validateRepaymentAmount(ctx, loan, actualRepaymentAmount, outstandingDebt);

  // Calculate repayment breakdown (principal vs interest)
  const repaymentBreakdown = calculateRepaymentBreakdown(actualRepaymentAmount, outstandingDebt);

  // Transfer principal tokens from borrower to lender
  await transferRepaymentTokens(ctx, loan, repaymentBreakdown.principalRepaid);

  // Update loan object with repayment
  const updatedLoan = await updateLoanWithRepayment(ctx, loan, repaymentBreakdown, outstandingDebt);

  // Handle collateral return if loan is fully repaid
  const collateralReturned = await handleCollateralReturn(ctx, updatedLoan);

  ctx.logger.info(
    `Loan repayment: ${actualRepaymentAmount} for loan ${loanKey} by borrower ${borrower || ctx.callingUser}`
  );

  return {
    loan: updatedLoan,
    principalRepaid: repaymentBreakdown.principalRepaid.decimalPlaces(8),
    interestRepaid: repaymentBreakdown.interestRepaid.decimalPlaces(8),
    collateralReturned
  };
}

/**
 * Validate that the borrower is authorized to repay the loan.
 */
async function validateRepaymentAuthorization(
  ctx: GalaChainContext,
  loan: FungibleLoan,
  borrower?: string
): Promise<void> {
  // Check loan is active
  if (loan.status !== LendingStatus.LoanActive) {
    throw new Error(`Loan ${loan.getCompositeKey()} is not active (status: ${loan.status})`);
  }

  // Determine who is making the repayment
  const repayingUser = borrower ?? ctx.callingUser;

  // Only the borrower can repay their loan (could be extended to allow third-party repayments)
  if (loan.borrower !== repayingUser) {
    throw new UnauthorizedLoanOperationError("repay loan", repayingUser, loan.getCompositeKey(), [
      loan.borrower
    ]);
  }
}

/**
 * Calculate the current outstanding debt including accrued interest.
 */
async function calculateOutstandingDebt(
  ctx: GalaChainContext,
  loan: FungibleLoan
): Promise<{
  principalOwed: BigNumber;
  interestOwed: BigNumber;
  totalDebt: BigNumber;
}> {
  const currentTime = ctx.txUnixTime;

  // Calculate accrued interest since loan origination or last update
  const timeElapsed = currentTime - loan.lastInterestUpdate;
  const newInterest = calculateSimpleInterest(loan.principalAmount, loan.interestRate, timeElapsed);

  const totalAccruedInterest = loan.interestAccrued.plus(newInterest);
  const principalOwed = loan.principalAmount;
  const totalDebt = principalOwed.plus(totalAccruedInterest);

  return {
    principalOwed,
    interestOwed: totalAccruedInterest,
    totalDebt
  };
}

/**
 * Validate the repayment amount is valid.
 */
async function validateRepaymentAmount(
  ctx: GalaChainContext,
  loan: FungibleLoan,
  repaymentAmount: BigNumber,
  outstandingDebt: { totalDebt: BigNumber }
): Promise<void> {
  if (repaymentAmount.isLessThanOrEqualTo(0)) {
    throw new Error("Repayment amount must be positive");
  }

  if (repaymentAmount.isGreaterThan(outstandingDebt.totalDebt)) {
    throw new Error(
      `Repayment amount ${repaymentAmount.toFixed()} exceeds total debt ${outstandingDebt.totalDebt.toFixed()}`
    );
  }

  // Validate borrower has sufficient balance for repayment
  const borrowerBalances = await fetchBalances(ctx, {
    owner: asValidUserAlias(loan.borrower),
    ...loan.principalToken
  });

  if (borrowerBalances.length === 0) {
    throw new Error(`Borrower ${loan.borrower} has no balance of ${loan.principalToken.toStringKey()}`);
  }

  const totalBalance = borrowerBalances.reduce(
    (sum, balance) => sum.plus(balance.getQuantityTotal()),
    new BigNumber("0")
  );

  if (totalBalance.isLessThan(repaymentAmount)) {
    throw new Error(
      `Borrower ${loan.borrower} has insufficient balance for repayment. Required: ${repaymentAmount}, Available: ${totalBalance}`
    );
  }
}

/**
 * Calculate how much of the repayment goes to principal vs interest.
 */
function calculateRepaymentBreakdown(
  repaymentAmount: BigNumber,
  outstandingDebt: { principalOwed: BigNumber; interestOwed: BigNumber }
): {
  principalRepaid: BigNumber;
  interestRepaid: BigNumber;
} {
  // Interest is paid first, then principal
  const interestRepaid = BigNumber.min(repaymentAmount, outstandingDebt.interestOwed);
  const principalRepaid = repaymentAmount.minus(interestRepaid);

  return {
    principalRepaid,
    interestRepaid
  };
}

/**
 * Transfer repayment tokens from borrower to lender.
 */
async function transferRepaymentTokens(
  ctx: GalaChainContext,
  loan: FungibleLoan,
  principalAmount: BigNumber
): Promise<void> {
  if (principalAmount.isEqualTo(0) || principalAmount.isLessThan(new BigNumber("0.0000000001"))) {
    return; // No principal to transfer (interest-only payment or amount too small)
  }

  // Create TokenInstanceKey for principal token
  const tokenInstanceKey = new TokenInstanceKey();
  tokenInstanceKey.collection = loan.principalToken.collection;
  tokenInstanceKey.category = loan.principalToken.category;
  tokenInstanceKey.type = loan.principalToken.type;
  tokenInstanceKey.additionalKey = loan.principalToken.additionalKey;
  tokenInstanceKey.instance = new BigNumber("0"); // Fungible token instance

  // Transfer principal tokens from borrower to lender
  await transferToken(ctx, {
    from: asValidUserAlias(loan.borrower),
    to: asValidUserAlias(loan.lender),
    tokenInstanceKey,
    quantity: principalAmount,
    allowancesToUse: [], // Borrower is transferring their own tokens
    authorizedOnBehalf: undefined
  });
}

/**
 * Update loan object with repayment information.
 */
async function updateLoanWithRepayment(
  ctx: GalaChainContext,
  loan: FungibleLoan,
  repaymentBreakdown: { principalRepaid: BigNumber; interestRepaid: BigNumber },
  outstandingDebt: { principalOwed: BigNumber; interestOwed: BigNumber; totalDebt: BigNumber }
): Promise<FungibleLoan> {
  const updatedLoan = Object.assign(Object.create(Object.getPrototypeOf(loan)), loan);

  // Update interest accrued to current amount (round to 8 decimal places for token precision)
  updatedLoan.interestAccrued = outstandingDebt.interestOwed.decimalPlaces(8);
  updatedLoan.lastInterestUpdate = ctx.txUnixTime;

  // If this is a full repayment, close the loan
  const remainingDebt = outstandingDebt.totalDebt.minus(
    repaymentBreakdown.principalRepaid.plus(repaymentBreakdown.interestRepaid)
  );

  if (remainingDebt.isEqualTo(0)) {
    updatedLoan.status = LendingStatus.LoanRepaid;
    updatedLoan.closedBy = LendingClosedBy.Borrower;
    updatedLoan.endTime = ctx.txUnixTime;
  }

  await putChainObject(ctx, updatedLoan);
  return updatedLoan;
}

/**
 * Handle collateral return if loan is fully repaid.
 */
async function handleCollateralReturn(ctx: GalaChainContext, loan: FungibleLoan): Promise<BigNumber> {
  if (loan.status !== LendingStatus.LoanRepaid) {
    return new BigNumber("0"); // No collateral returned for partial repayments
  }

  // Create TokenInstanceKey for collateral token
  const collateralInstanceKey = new TokenInstanceKey();
  collateralInstanceKey.collection = loan.collateralToken.collection;
  collateralInstanceKey.category = loan.collateralToken.category;
  collateralInstanceKey.type = loan.collateralToken.type;
  collateralInstanceKey.additionalKey = loan.collateralToken.additionalKey;
  collateralInstanceKey.instance = new BigNumber("0"); // Fungible token instance

  // Unlock collateral tokens
  try {
    await unlockToken(ctx, {
      tokenInstanceKey: collateralInstanceKey,
      name: `loan-collateral-${loan.offerKey}`, // Match the lock name from acceptLendingOffer
      quantity: loan.collateralAmount,
      owner: asValidUserAlias(loan.borrower)
    });
  } catch (error) {
    // Log warning but don't fail the transaction if collateral unlock fails
    // This can happen if the lock doesn't exist (which may be valid in some scenarios)
    ctx.logger.warn(`Failed to unlock collateral for loan ${loan.getCompositeKey()}: ${error.message}`);
  }

  ctx.logger.info(`Unlocked ${loan.collateralAmount} collateral for repaid loan ${loan.getCompositeKey()}`);

  return loan.collateralAmount;
}

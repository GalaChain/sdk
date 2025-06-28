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
import { FungibleLoan, InterestCalculationError } from "@gala-chain/api";
import { BigNumber } from "bignumber.js";

import { GalaChainContext } from "../../types";
import { putChainObject } from "../../utils";
import {
  CompoundingFrequency,
  calculateAccruedInterest,
  calculateEffectiveAnnualRate
} from "./compoundInterest";
import { calculateSimpleInterest } from "./simpleInterest";

/**
 * Configuration for interest accrual calculations.
 */
export interface AccrualConfig {
  /** Default compounding frequency for new loans */
  defaultCompoundingFrequency: CompoundingFrequency;

  /** Maximum time between interest updates (in seconds) before forced update */
  maxAccrualInterval: number;

  /** Minimum interest amount worth updating (to avoid dust) */
  minAccrualThreshold: BigNumber;

  /** Whether to use compound or simple interest */
  useCompoundInterest: boolean;
}

/**
 * Default accrual configuration for production use.
 */
export const DEFAULT_ACCRUAL_CONFIG: AccrualConfig = {
  defaultCompoundingFrequency: CompoundingFrequency.DAILY,
  maxAccrualInterval: 24 * 60 * 60, // 24 hours
  minAccrualThreshold: new BigNumber("0.000001"), // 1 microtoken
  useCompoundInterest: true
};

/**
 * Result of an interest accrual operation.
 */
export interface AccrualResult {
  /** Updated loan object with new interest */
  loan: FungibleLoan;

  /** Amount of interest accrued in this update */
  interestAccrued: BigNumber;

  /** New total debt (principal + all accrued interest) */
  totalDebt: BigNumber;

  /** Time elapsed since last accrual (in seconds) */
  timeElapsed: number;

  /** Whether the loan was actually updated on chain */
  wasUpdated: boolean;
}

/**
 * Update interest accrual for a loan based on elapsed time since last update.
 * This function calculates and applies interest that has accrued since the last
 * interest calculation, updating the loan object accordingly.
 *
 * @param ctx - GalaChain context for blockchain operations
 * @param loan - The loan to update interest for
 * @param currentTime - Current timestamp (defaults to ctx.txUnixTime)
 * @param config - Accrual configuration (defaults to DEFAULT_ACCRUAL_CONFIG)
 * @returns AccrualResult with updated loan and accrual details
 *
 * @example
 * // Update interest for a loan
 * const result = await updateLoanInterest(ctx, loan);
 * console.log(`Accrued ${result.interestAccrued} tokens`);
 */
export async function updateLoanInterest(
  ctx: GalaChainContext,
  loan: FungibleLoan,
  currentTime?: number,
  config: AccrualConfig = DEFAULT_ACCRUAL_CONFIG
): Promise<AccrualResult> {
  try {
    const now = currentTime ?? ctx.txUnixTime;
    const timeElapsed = now - loan.lastInterestUpdate;

    // Validate inputs
    if (timeElapsed < 0) {
      throw new Error("Current time cannot be before last interest update");
    }

    // Calculate current balance (principal + previously accrued interest)
    const currentBalance = loan.principalAmount.plus(loan.interestAccrued);

    // Calculate new interest for the elapsed time
    let newInterest: BigNumber;

    if (config.useCompoundInterest) {
      // Use compound interest calculation
      newInterest = calculateAccruedInterest(
        currentBalance,
        loan.interestRate,
        timeElapsed,
        config.defaultCompoundingFrequency
      );
    } else {
      // Use simple interest on current balance
      newInterest = calculateSimpleInterest(currentBalance, loan.interestRate, timeElapsed);
    }

    // Check if the interest is significant enough to update
    const shouldUpdate =
      newInterest.isGreaterThan(config.minAccrualThreshold) || timeElapsed > config.maxAccrualInterval;

    let updatedLoan = loan;
    let wasUpdated = false;

    if (shouldUpdate) {
      // Update the loan with new interest
      updatedLoan = Object.assign(Object.create(Object.getPrototypeOf(loan)), loan);
      updatedLoan.interestAccrued = loan.interestAccrued.plus(newInterest);
      updatedLoan.lastInterestUpdate = now;

      // Save updated loan to chain
      await putChainObject(ctx, updatedLoan);
      wasUpdated = true;
    }

    const totalDebt = updatedLoan.principalAmount.plus(updatedLoan.interestAccrued);

    return {
      loan: updatedLoan,
      interestAccrued: newInterest,
      totalDebt,
      timeElapsed,
      wasUpdated
    };
  } catch (error) {
    throw new InterestCalculationError(
      loan.principalAmount.toString(),
      loan.interestRate.toString(),
      (currentTime ?? ctx.txUnixTime - loan.lastInterestUpdate).toString(),
      error instanceof Error ? error.message : "Unknown error in interest accrual"
    );
  }
}

/**
 * Calculate the current total debt for a loan without updating it on chain.
 * This is useful for read-only operations like health factor calculations.
 *
 * @param loan - The loan to calculate debt for
 * @param currentTime - Current timestamp for calculation
 * @param config - Accrual configuration
 * @returns Current total debt (principal + accrued interest)
 */
export function calculateCurrentDebt(
  loan: FungibleLoan,
  currentTime: number,
  config: AccrualConfig = DEFAULT_ACCRUAL_CONFIG
): BigNumber {
  try {
    const timeElapsed = currentTime - loan.lastInterestUpdate;

    if (timeElapsed <= 0) {
      return loan.principalAmount.plus(loan.interestAccrued);
    }

    const currentBalance = loan.principalAmount.plus(loan.interestAccrued);

    let additionalInterest: BigNumber;

    if (config.useCompoundInterest) {
      additionalInterest = calculateAccruedInterest(
        currentBalance,
        loan.interestRate,
        timeElapsed,
        config.defaultCompoundingFrequency
      );
    } else {
      additionalInterest = calculateSimpleInterest(currentBalance, loan.interestRate, timeElapsed);
    }

    return currentBalance.plus(additionalInterest);
  } catch (error) {
    throw new InterestCalculationError(
      loan.principalAmount.toString(),
      loan.interestRate.toString(),
      (currentTime - loan.lastInterestUpdate).toString(),
      error instanceof Error ? error.message : "Unknown error in debt calculation"
    );
  }
}

/**
 * Calculate interest that would accrue over a future time period.
 * This is useful for estimating future payments or loan costs.
 *
 * @param loan - The loan to project interest for
 * @param futureSeconds - Number of seconds in the future to project
 * @param config - Accrual configuration
 * @returns Projected interest amount
 */
export function projectFutureInterest(
  loan: FungibleLoan,
  futureSeconds: number,
  config: AccrualConfig = DEFAULT_ACCRUAL_CONFIG
): BigNumber {
  if (futureSeconds <= 0) {
    return new BigNumber("0");
  }

  const currentBalance = loan.principalAmount.plus(loan.interestAccrued);

  if (config.useCompoundInterest) {
    return calculateAccruedInterest(
      currentBalance,
      loan.interestRate,
      futureSeconds,
      config.defaultCompoundingFrequency
    );
  } else {
    return calculateSimpleInterest(currentBalance, loan.interestRate, futureSeconds);
  }
}

/**
 * Calculate the daily interest rate for a loan.
 * This is useful for UI displays and user education.
 *
 * @param annualRateBasisPoints - Annual interest rate in basis points
 * @param compoundingFrequency - How often interest compounds
 * @returns Daily interest rate in basis points
 */
export function calculateDailyRate(
  annualRateBasisPoints: BigNumber,
  compoundingFrequency: CompoundingFrequency = CompoundingFrequency.DAILY
): BigNumber {
  if (compoundingFrequency === CompoundingFrequency.DAILY) {
    return annualRateBasisPoints.dividedBy(365);
  }

  // For other frequencies, calculate effective daily rate
  const effectiveAnnualRate = calculateEffectiveAnnualRate(annualRateBasisPoints, compoundingFrequency);

  // Convert effective annual rate to daily rate
  const dailyMultiplier = new BigNumber(1).plus(effectiveAnnualRate.dividedBy(10000));
  const dailyRate = dailyMultiplier.exponentiatedBy(new BigNumber(1).dividedBy(365)).minus(1);

  return dailyRate.multipliedBy(10000).decimalPlaces(4, BigNumber.ROUND_HALF_UP);
}

/**
 * Batch update interest for multiple loans efficiently.
 * This is useful for periodic maintenance operations.
 *
 * @param ctx - GalaChain context
 * @param loans - Array of loans to update
 * @param currentTime - Current timestamp
 * @param config - Accrual configuration
 * @returns Array of accrual results
 */
export async function batchUpdateInterest(
  ctx: GalaChainContext,
  loans: FungibleLoan[],
  currentTime?: number,
  config: AccrualConfig = DEFAULT_ACCRUAL_CONFIG
): Promise<AccrualResult[]> {
  const results: AccrualResult[] = [];

  for (const loan of loans) {
    try {
      const result = await updateLoanInterest(ctx, loan, currentTime, config);
      results.push(result);
    } catch (error) {
      // Log error but continue with other loans
      ctx.logger.error(
        `Failed to update interest for loan ${loan.getCompositeKey()}: ${
          error instanceof Error ? error.message : error
        }`
      );

      // Create a failed result
      results.push({
        loan,
        interestAccrued: new BigNumber("0"),
        totalDebt: loan.principalAmount.plus(loan.interestAccrued),
        timeElapsed: 0,
        wasUpdated: false
      });
    }
  }

  return results;
}

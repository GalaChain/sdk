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
import { InterestCalculationError } from "@gala-chain/api";
import { BigNumber } from "bignumber.js";

/**
 * Common compounding frequencies used in DeFi lending.
 */
export enum CompoundingFrequency {
  ANNUALLY = 1,
  SEMI_ANNUALLY = 2,
  QUARTERLY = 4,
  MONTHLY = 12,
  WEEKLY = 52,
  DAILY = 365,
  HOURLY = 8760,
  CONTINUOUS = -1 // Special case for continuous compounding
}

/**
 * Calculate compound interest for a given principal, rate, time, and compounding frequency.
 * 
 * Formula: A = P(1 + r/n)^(nt) - P
 * Where:
 * - A = final amount
 * - P = principal
 * - r = annual interest rate (decimal)
 * - n = compounding frequency per year
 * - t = time in years
 * 
 * @param principal - The principal amount (loan amount)
 * @param rate - Annual interest rate in basis points (e.g., 500 = 5.00%)
 * @param timeInSeconds - Time period in seconds
 * @param compoundingFrequency - How often interest compounds per year
 * @returns The calculated compound interest amount
 * 
 * @example
 * // Calculate compound interest for 1000 tokens at 5% APR for 1 year, compounded monthly
 * const principal = new BigNumber("1000");
 * const rate = new BigNumber("500"); // 5% in basis points
 * const time = 365 * 24 * 60 * 60; // 1 year in seconds
 * const interest = calculateCompoundInterest(principal, rate, time, CompoundingFrequency.MONTHLY);
 */
export function calculateCompoundInterest(
  principal: BigNumber,
  rate: BigNumber,
  timeInSeconds: number,
  compoundingFrequency: CompoundingFrequency = CompoundingFrequency.DAILY
): BigNumber {
  try {
    // Validate inputs
    if (principal.isNaN() || principal.isNegative()) {
      throw new Error("Principal must be a positive number");
    }
    
    if (rate.isNaN() || rate.isNegative()) {
      throw new Error("Interest rate must be non-negative");
    }
    
    if (timeInSeconds < 0) {
      throw new Error("Time must be non-negative");
    }
    
    // Handle zero cases
    if (principal.isZero() || rate.isZero() || timeInSeconds === 0) {
      return new BigNumber("0");
    }
    
    // Convert basis points to decimal
    const rateDecimal = rate.dividedBy(10000);
    
    // Convert seconds to years
    const timeInYears = new BigNumber(timeInSeconds).dividedBy(365.25 * 24 * 60 * 60);
    
    let finalAmount: BigNumber;
    
    if (compoundingFrequency === CompoundingFrequency.CONTINUOUS) {
      // Continuous compounding: A = Pe^(rt)
      // Since BigNumber doesn't have e^x, we approximate with a high frequency
      const approximateFrequency = 8760 * 24; // Hourly compounding approximation
      const ratePerPeriod = rateDecimal.dividedBy(approximateFrequency);
      const numberOfPeriods = timeInYears.multipliedBy(approximateFrequency);
      
      // A = P(1 + r/n)^(nt)
      const onePlusRate = new BigNumber(1).plus(ratePerPeriod);
      finalAmount = principal.multipliedBy(onePlusRate.exponentiatedBy(numberOfPeriods));
    } else {
      // Regular compounding: A = P(1 + r/n)^(nt)
      const ratePerPeriod = rateDecimal.dividedBy(compoundingFrequency);
      const numberOfPeriods = timeInYears.multipliedBy(compoundingFrequency);
      
      const onePlusRate = new BigNumber(1).plus(ratePerPeriod);
      finalAmount = principal.multipliedBy(onePlusRate.exponentiatedBy(numberOfPeriods));
    }
    
    // Interest = Final Amount - Principal
    const interest = finalAmount.minus(principal);
    
    // Round to avoid floating point precision issues
    return interest.decimalPlaces(18, BigNumber.ROUND_HALF_UP);
    
  } catch (error) {
    throw new InterestCalculationError(
      principal.toString(),
      rate.toString(),
      timeInSeconds.toString(),
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

/**
 * Calculate the total amount (principal + compound interest) owed.
 * 
 * @param principal - The principal amount
 * @param rate - Annual interest rate in basis points
 * @param timeInSeconds - Time period in seconds
 * @param compoundingFrequency - How often interest compounds per year
 * @returns The total amount (principal + compound interest)
 */
export function calculateCompoundInterestTotal(
  principal: BigNumber,
  rate: BigNumber,
  timeInSeconds: number,
  compoundingFrequency: CompoundingFrequency = CompoundingFrequency.DAILY
): BigNumber {
  const interest = calculateCompoundInterest(principal, rate, timeInSeconds, compoundingFrequency);
  return principal.plus(interest);
}

/**
 * Calculate compound interest with continuous accrual from a starting balance.
 * This is useful for calculating interest on a loan that already has accrued interest.
 * 
 * @param currentBalance - Current balance (principal + previously accrued interest)
 * @param rate - Annual interest rate in basis points
 * @param timeInSeconds - Time period since last interest calculation
 * @param compoundingFrequency - How often interest compounds per year
 * @returns The additional interest accrued on the current balance
 */
export function calculateAccruedInterest(
  currentBalance: BigNumber,
  rate: BigNumber,
  timeInSeconds: number,
  compoundingFrequency: CompoundingFrequency = CompoundingFrequency.DAILY
): BigNumber {
  return calculateCompoundInterest(currentBalance, rate, timeInSeconds, compoundingFrequency);
}

/**
 * Calculate the effective annual rate (EAR) from a nominal rate and compounding frequency.
 * 
 * Formula: EAR = (1 + r/n)^n - 1
 * 
 * @param nominalRate - Nominal annual interest rate in basis points
 * @param compoundingFrequency - How often interest compounds per year
 * @returns The effective annual rate in basis points
 */
export function calculateEffectiveAnnualRate(
  nominalRate: BigNumber,
  compoundingFrequency: CompoundingFrequency
): BigNumber {
  try {
    if (nominalRate.isZero()) {
      return new BigNumber("0");
    }
    
    const rateDecimal = nominalRate.dividedBy(10000);
    
    if (compoundingFrequency === CompoundingFrequency.CONTINUOUS) {
      // EAR = e^r - 1, approximated with very high frequency
      const approximateFrequency = 8760 * 24;
      const ratePerPeriod = rateDecimal.dividedBy(approximateFrequency);
      const onePlusRate = new BigNumber(1).plus(ratePerPeriod);
      const effectiveRate = onePlusRate.exponentiatedBy(approximateFrequency).minus(1);
      return effectiveRate.multipliedBy(10000).decimalPlaces(2, BigNumber.ROUND_HALF_UP);
    } else {
      // EAR = (1 + r/n)^n - 1
      const ratePerPeriod = rateDecimal.dividedBy(compoundingFrequency);
      const onePlusRate = new BigNumber(1).plus(ratePerPeriod);
      const effectiveRate = onePlusRate.exponentiatedBy(compoundingFrequency).minus(1);
      return effectiveRate.multipliedBy(10000).decimalPlaces(2, BigNumber.ROUND_HALF_UP);
    }
    
  } catch (error) {
    throw new InterestCalculationError(
      "unknown",
      nominalRate.toString(),
      "unknown",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

/**
 * Calculate the time required for an investment to double with compound interest.
 * 
 * Formula: t = ln(2) / (n * ln(1 + r/n))
 * 
 * @param rate - Annual interest rate in basis points
 * @param compoundingFrequency - How often interest compounds per year
 * @returns The time in seconds required to double the investment
 */
export function calculateDoublingTime(
  rate: BigNumber,
  compoundingFrequency: CompoundingFrequency
): number {
  try {
    if (rate.isZero()) {
      return Infinity;
    }
    
    const rateDecimal = rate.dividedBy(10000);
    const ratePerPeriod = rateDecimal.dividedBy(compoundingFrequency);
    
    // t = ln(2) / (n * ln(1 + r/n))
    // Using approximation: ln(1+x) ≈ x for small x
    const ln2 = 0.693147180559945309417; // Natural log of 2
    const onePlusRate = new BigNumber(1).plus(ratePerPeriod);
    
    // For small rates, ln(1+x) ≈ x, but for larger rates we need a better approximation
    // We'll use the series expansion: ln(1+x) ≈ x - x²/2 + x³/3 - ...
    let lnOnePlusRate: number;
    if (ratePerPeriod.isLessThan(0.1)) {
      // Use first-order approximation for small rates
      lnOnePlusRate = ratePerPeriod.toNumber();
    } else {
      // Use JavaScript's Math.log for larger rates
      lnOnePlusRate = Math.log(onePlusRate.toNumber());
    }
    
    const timeInYears = ln2 / (compoundingFrequency * lnOnePlusRate);
    const timeInSeconds = timeInYears * 365.25 * 24 * 60 * 60;
    
    return Math.round(timeInSeconds);
    
  } catch (error) {
    throw new InterestCalculationError(
      "unknown",
      rate.toString(),
      "unknown",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
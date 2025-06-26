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
 * Calculate simple interest for a given principal, rate, and time period.
 * 
 * Formula: Interest = Principal × Rate × Time
 * 
 * @param principal - The principal amount (loan amount)
 * @param rate - Annual interest rate in basis points (e.g., 500 = 5.00%)
 * @param timeInSeconds - Time period in seconds
 * @returns The calculated interest amount
 * 
 * @example
 * // Calculate interest for 1000 tokens at 5% APR for 30 days
 * const principal = new BigNumber("1000");
 * const rate = new BigNumber("500"); // 5% in basis points
 * const time = 30 * 24 * 60 * 60; // 30 days in seconds
 * const interest = calculateSimpleInterest(principal, rate, time);
 */
export function calculateSimpleInterest(
  principal: BigNumber,
  rate: BigNumber,
  timeInSeconds: number
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
    
    // Convert basis points to decimal (divide by 10,000)
    const rateDecimal = rate.dividedBy(10000);
    
    // Convert seconds to years (365.25 days per year to account for leap years)
    const timeInYears = new BigNumber(timeInSeconds).dividedBy(365.25 * 24 * 60 * 60);
    
    // Calculate simple interest: I = P × R × T
    const interest = principal.multipliedBy(rateDecimal).multipliedBy(timeInYears);
    
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
 * Calculate the total amount (principal + simple interest) owed.
 * 
 * @param principal - The principal amount
 * @param rate - Annual interest rate in basis points
 * @param timeInSeconds - Time period in seconds
 * @returns The total amount (principal + interest)
 */
export function calculateSimpleInterestTotal(
  principal: BigNumber,
  rate: BigNumber,
  timeInSeconds: number
): BigNumber {
  const interest = calculateSimpleInterest(principal, rate, timeInSeconds);
  return principal.plus(interest);
}

/**
 * Calculate the interest rate required to earn a specific amount of interest.
 * 
 * @param principal - The principal amount
 * @param targetInterest - The desired interest amount
 * @param timeInSeconds - Time period in seconds
 * @returns The required annual interest rate in basis points
 */
export function calculateRequiredSimpleRate(
  principal: BigNumber,
  targetInterest: BigNumber,
  timeInSeconds: number
): BigNumber {
  try {
    if (principal.isZero() || timeInSeconds === 0) {
      throw new Error("Principal and time must be greater than zero");
    }
    
    const timeInYears = new BigNumber(timeInSeconds).dividedBy(365.25 * 24 * 60 * 60);
    
    // Solve for rate: R = I / (P × T)
    const rateDecimal = targetInterest.dividedBy(principal.multipliedBy(timeInYears));
    
    // Convert to basis points
    return rateDecimal.multipliedBy(10000).decimalPlaces(2, BigNumber.ROUND_HALF_UP);
    
  } catch (error) {
    throw new InterestCalculationError(
      principal.toString(),
      "unknown",
      timeInSeconds.toString(),
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

/**
 * Calculate the time required to earn a specific amount of interest at a given rate.
 * 
 * @param principal - The principal amount
 * @param targetInterest - The desired interest amount
 * @param rate - Annual interest rate in basis points
 * @returns The required time in seconds
 */
export function calculateRequiredSimpleTime(
  principal: BigNumber,
  targetInterest: BigNumber,
  rate: BigNumber
): number {
  try {
    if (principal.isZero() || rate.isZero()) {
      throw new Error("Principal and rate must be greater than zero");
    }
    
    const rateDecimal = rate.dividedBy(10000);
    
    // Solve for time: T = I / (P × R)
    const timeInYears = targetInterest.dividedBy(principal.multipliedBy(rateDecimal));
    
    // Convert years to seconds
    const timeInSeconds = timeInYears.multipliedBy(365.25 * 24 * 60 * 60);
    
    return Math.round(timeInSeconds.toNumber());
    
  } catch (error) {
    throw new InterestCalculationError(
      principal.toString(),
      rate.toString(),
      "unknown",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
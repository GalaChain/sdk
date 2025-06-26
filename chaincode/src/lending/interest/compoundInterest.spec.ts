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

import {
  calculateCompoundInterest,
  calculateCompoundInterestTotal,
  calculateDoublingTime,
  calculateEffectiveAnnualRate,
  CompoundingFrequency
} from "./compoundInterest";

describe("compoundInterest", () => {
  describe("calculateCompoundInterest", () => {
    it("should calculate compound interest with daily compounding", () => {
      // Given
      const principal = new BigNumber("1000");
      const rate = new BigNumber("500"); // 5% APR
      const timeInSeconds = 365 * 24 * 60 * 60; // 1 year

      // When
      const interest = calculateCompoundInterest(
        principal, 
        rate, 
        timeInSeconds, 
        CompoundingFrequency.DAILY
      );

      // Then
      // Daily compounding: (1 + 0.05/365)^365 - 1 ≈ 0.05127
      // Interest ≈ 1000 * 0.05127 ≈ 51.27
      expect(interest.toNumber()).toBeCloseTo(51.27, 1);
    });

    it("should calculate compound interest with monthly compounding", () => {
      // Given
      const principal = new BigNumber("1000");
      const rate = new BigNumber("1200"); // 12% APR
      const timeInSeconds = 365 * 24 * 60 * 60; // 1 year

      // When
      const interest = calculateCompoundInterest(
        principal, 
        rate, 
        timeInSeconds, 
        CompoundingFrequency.MONTHLY
      );

      // Then
      // Monthly compounding: (1 + 0.12/12)^12 - 1 ≈ 0.12683
      // Interest ≈ 1000 * 0.12683 ≈ 126.83
      expect(interest.toNumber()).toBeCloseTo(126.83, 1);
    });

    it("should calculate compound interest with continuous compounding", () => {
      // Given
      const principal = new BigNumber("1000");
      const rate = new BigNumber("500"); // 5% APR
      const timeInSeconds = 365 * 24 * 60 * 60; // 1 year

      // When
      const interest = calculateCompoundInterest(
        principal, 
        rate, 
        timeInSeconds, 
        CompoundingFrequency.CONTINUOUS
      );

      // Then
      // Continuous compounding: e^0.05 - 1 ≈ 0.05127
      // Interest ≈ 1000 * 0.05127 ≈ 51.27
      expect(interest.toNumber()).toBeCloseTo(51.27, 0);
    });

    it("should return zero for zero principal", () => {
      // Given
      const principal = new BigNumber("0");
      const rate = new BigNumber("500");
      const timeInSeconds = 365 * 24 * 60 * 60;

      // When
      const interest = calculateCompoundInterest(principal, rate, timeInSeconds);

      // Then
      expect(interest.toString()).toBe("0");
    });

    it("should return zero for zero rate", () => {
      // Given
      const principal = new BigNumber("1000");
      const rate = new BigNumber("0");
      const timeInSeconds = 365 * 24 * 60 * 60;

      // When
      const interest = calculateCompoundInterest(principal, rate, timeInSeconds);

      // Then
      expect(interest.toString()).toBe("0");
    });

    it("should return zero for zero time", () => {
      // Given
      const principal = new BigNumber("1000");
      const rate = new BigNumber("500");
      const timeInSeconds = 0;

      // When
      const interest = calculateCompoundInterest(principal, rate, timeInSeconds);

      // Then
      expect(interest.toString()).toBe("0");
    });

    it("should throw error for negative principal", () => {
      // Given
      const principal = new BigNumber("-100");
      const rate = new BigNumber("500");
      const timeInSeconds = 365 * 24 * 60 * 60;

      // When & Then
      expect(() => calculateCompoundInterest(principal, rate, timeInSeconds))
        .toThrow(InterestCalculationError);
    });
  });

  describe("calculateCompoundInterestTotal", () => {
    it("should calculate total amount correctly", () => {
      // Given
      const principal = new BigNumber("1000");
      const rate = new BigNumber("500"); // 5% APR
      const timeInSeconds = 365 * 24 * 60 * 60; // 1 year

      // When
      const total = calculateCompoundInterestTotal(
        principal, 
        rate, 
        timeInSeconds, 
        CompoundingFrequency.ANNUALLY
      );

      // Then
      expect(total.toString()).toBe("1050"); // 1000 + 50 (annual compounding = simple for 1 year)
    });
  });

  describe("calculateEffectiveAnnualRate", () => {
    it("should calculate EAR for daily compounding", () => {
      // Given
      const nominalRate = new BigNumber("500"); // 5% nominal

      // When
      const ear = calculateEffectiveAnnualRate(nominalRate, CompoundingFrequency.DAILY);

      // Then
      // EAR = (1 + 0.05/365)^365 - 1 ≈ 0.05127 = 512.7 basis points
      expect(ear.toNumber()).toBeCloseTo(512.7, 1);
    });

    it("should return nominal rate for annual compounding", () => {
      // Given
      const nominalRate = new BigNumber("500"); // 5% nominal

      // When
      const ear = calculateEffectiveAnnualRate(nominalRate, CompoundingFrequency.ANNUALLY);

      // Then
      expect(ear.toString()).toBe("500.00"); // Same as nominal for annual compounding
    });

    it("should return zero for zero rate", () => {
      // Given
      const nominalRate = new BigNumber("0");

      // When
      const ear = calculateEffectiveAnnualRate(nominalRate, CompoundingFrequency.DAILY);

      // Then
      expect(ear.toString()).toBe("0");
    });
  });

  describe("calculateDoublingTime", () => {
    it("should calculate doubling time for 10% annual rate", () => {
      // Given
      const rate = new BigNumber("1000"); // 10% APR

      // When
      const doublingTime = calculateDoublingTime(rate, CompoundingFrequency.ANNUALLY);

      // Then
      // Rule of 72: ~7.2 years for 10%
      const expectedYears = 7.27; // More precise calculation
      const expectedSeconds = expectedYears * 365.25 * 24 * 60 * 60;
      expect(doublingTime).toBeCloseTo(expectedSeconds, -4); // Within 10,000 seconds
    });

    it("should return infinity for zero rate", () => {
      // Given
      const rate = new BigNumber("0");

      // When
      const doublingTime = calculateDoublingTime(rate, CompoundingFrequency.ANNUALLY);

      // Then
      expect(doublingTime).toBe(Infinity);
    });

    it("should calculate shorter time for higher frequency", () => {
      // Given
      const rate = new BigNumber("1000"); // 10% APR

      // When
      const annualTime = calculateDoublingTime(rate, CompoundingFrequency.ANNUALLY);
      const dailyTime = calculateDoublingTime(rate, CompoundingFrequency.DAILY);

      // Then
      expect(dailyTime).toBeLessThan(annualTime);
    });
  });

  describe("compounding frequency effects", () => {
    it("should show that higher frequency increases interest", () => {
      // Given
      const principal = new BigNumber("1000");
      const rate = new BigNumber("1000"); // 10% APR
      const timeInSeconds = 365 * 24 * 60 * 60; // 1 year

      // When
      const annualInterest = calculateCompoundInterest(
        principal, rate, timeInSeconds, CompoundingFrequency.ANNUALLY
      );
      const monthlyInterest = calculateCompoundInterest(
        principal, rate, timeInSeconds, CompoundingFrequency.MONTHLY
      );
      const dailyInterest = calculateCompoundInterest(
        principal, rate, timeInSeconds, CompoundingFrequency.DAILY
      );

      // Then
      expect(monthlyInterest.toNumber()).toBeGreaterThan(annualInterest.toNumber());
      expect(dailyInterest.toNumber()).toBeGreaterThan(monthlyInterest.toNumber());
    });

    it("should converge to continuous compounding limit", () => {
      // Given
      const principal = new BigNumber("1000");
      const rate = new BigNumber("1000"); // 10% APR
      const timeInSeconds = 365 * 24 * 60 * 60; // 1 year

      // When
      const dailyInterest = calculateCompoundInterest(
        principal, rate, timeInSeconds, CompoundingFrequency.DAILY
      );
      const continuousInterest = calculateCompoundInterest(
        principal, rate, timeInSeconds, CompoundingFrequency.CONTINUOUS
      );

      // Then
      // Daily and continuous should be very close for reasonable rates
      expect(Math.abs(dailyInterest.toNumber() - continuousInterest.toNumber())).toBeLessThan(1);
    });
  });

  describe("edge cases", () => {
    it("should handle very small time periods", () => {
      // Given
      const principal = new BigNumber("1000");
      const rate = new BigNumber("500");
      const timeInSeconds = 3600; // 1 hour

      // When
      const interest = calculateCompoundInterest(principal, rate, timeInSeconds);

      // Then
      expect(interest.toNumber()).toBeGreaterThan(0);
      expect(interest.toNumber()).toBeLessThan(1); // Very small for 1 hour
    });

    it("should handle very large amounts", () => {
      // Given
      const principal = new BigNumber("1000000000000"); // 1 trillion
      const rate = new BigNumber("500");
      const timeInSeconds = 365 * 24 * 60 * 60;

      // When
      const interest = calculateCompoundInterest(principal, rate, timeInSeconds);

      // Then
      expect(interest.toNumber()).toBeGreaterThan(50000000000); // > 50 billion
    });

    it("should handle fractional time periods", () => {
      // Given
      const principal = new BigNumber("1000");
      const rate = new BigNumber("500");
      const timeInSeconds = 182.5 * 24 * 60 * 60; // Half year

      // When
      const interest = calculateCompoundInterest(principal, rate, timeInSeconds);

      // Then
      expect(interest.toNumber()).toBeCloseTo(25.31, 1); // Roughly half of annual interest
    });
  });
});
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
  calculateRequiredSimpleRate,
  calculateRequiredSimpleTime,
  calculateSimpleInterest,
  calculateSimpleInterestTotal
} from "./simpleInterest";

describe("simpleInterest", () => {
  describe("calculateSimpleInterest", () => {
    it("should calculate correct simple interest", () => {
      // Given
      const principal = new BigNumber("1000");
      const rate = new BigNumber("500"); // 5% APR
      const timeInSeconds = 365 * 24 * 60 * 60; // 1 year

      // When
      const interest = calculateSimpleInterest(principal, rate, timeInSeconds);

      // Then
      expect(interest.toString()).toBe("50"); // 5% of 1000 = 50
    });

    it("should calculate correct interest for partial year", () => {
      // Given
      const principal = new BigNumber("1000");
      const rate = new BigNumber("1000"); // 10% APR
      const timeInSeconds = 30 * 24 * 60 * 60; // 30 days

      // When
      const interest = calculateSimpleInterest(principal, rate, timeInSeconds);

      // Then
      // 30 days = 30/365.25 years ≈ 0.0821 years
      // Interest = 1000 * 0.10 * 0.0821 ≈ 8.21
      expect(interest.toNumber()).toBeCloseTo(8.21, 1);
    });

    it("should return zero for zero principal", () => {
      // Given
      const principal = new BigNumber("0");
      const rate = new BigNumber("500");
      const timeInSeconds = 365 * 24 * 60 * 60;

      // When
      const interest = calculateSimpleInterest(principal, rate, timeInSeconds);

      // Then
      expect(interest.toString()).toBe("0");
    });

    it("should return zero for zero rate", () => {
      // Given
      const principal = new BigNumber("1000");
      const rate = new BigNumber("0");
      const timeInSeconds = 365 * 24 * 60 * 60;

      // When
      const interest = calculateSimpleInterest(principal, rate, timeInSeconds);

      // Then
      expect(interest.toString()).toBe("0");
    });

    it("should return zero for zero time", () => {
      // Given
      const principal = new BigNumber("1000");
      const rate = new BigNumber("500");
      const timeInSeconds = 0;

      // When
      const interest = calculateSimpleInterest(principal, rate, timeInSeconds);

      // Then
      expect(interest.toString()).toBe("0");
    });

    it("should throw error for negative principal", () => {
      // Given
      const principal = new BigNumber("-100");
      const rate = new BigNumber("500");
      const timeInSeconds = 365 * 24 * 60 * 60;

      // When & Then
      expect(() => calculateSimpleInterest(principal, rate, timeInSeconds))
        .toThrow(InterestCalculationError);
    });

    it("should throw error for negative rate", () => {
      // Given
      const principal = new BigNumber("1000");
      const rate = new BigNumber("-500");
      const timeInSeconds = 365 * 24 * 60 * 60;

      // When & Then
      expect(() => calculateSimpleInterest(principal, rate, timeInSeconds))
        .toThrow(InterestCalculationError);
    });

    it("should throw error for negative time", () => {
      // Given
      const principal = new BigNumber("1000");
      const rate = new BigNumber("500");
      const timeInSeconds = -100;

      // When & Then
      expect(() => calculateSimpleInterest(principal, rate, timeInSeconds))
        .toThrow(InterestCalculationError);
    });
  });

  describe("calculateSimpleInterestTotal", () => {
    it("should calculate total amount correctly", () => {
      // Given
      const principal = new BigNumber("1000");
      const rate = new BigNumber("500"); // 5% APR
      const timeInSeconds = 365 * 24 * 60 * 60; // 1 year

      // When
      const total = calculateSimpleInterestTotal(principal, rate, timeInSeconds);

      // Then
      expect(total.toString()).toBe("1050"); // 1000 + 50
    });
  });

  describe("calculateRequiredSimpleRate", () => {
    it("should calculate required rate correctly", () => {
      // Given
      const principal = new BigNumber("1000");
      const targetInterest = new BigNumber("50");
      const timeInSeconds = 365 * 24 * 60 * 60; // 1 year

      // When
      const rate = calculateRequiredSimpleRate(principal, targetInterest, timeInSeconds);

      // Then
      expect(rate.toString()).toBe("500"); // 5% in basis points
    });

    it("should throw error for zero principal", () => {
      // Given
      const principal = new BigNumber("0");
      const targetInterest = new BigNumber("50");
      const timeInSeconds = 365 * 24 * 60 * 60;

      // When & Then
      expect(() => calculateRequiredSimpleRate(principal, targetInterest, timeInSeconds))
        .toThrow(InterestCalculationError);
    });

    it("should throw error for zero time", () => {
      // Given
      const principal = new BigNumber("1000");
      const targetInterest = new BigNumber("50");
      const timeInSeconds = 0;

      // When & Then
      expect(() => calculateRequiredSimpleRate(principal, targetInterest, timeInSeconds))
        .toThrow(InterestCalculationError);
    });
  });

  describe("calculateRequiredSimpleTime", () => {
    it("should calculate required time correctly", () => {
      // Given
      const principal = new BigNumber("1000");
      const targetInterest = new BigNumber("50");
      const rate = new BigNumber("500"); // 5% APR

      // When
      const time = calculateRequiredSimpleTime(principal, targetInterest, rate);

      // Then
      const expectedTime = 365 * 24 * 60 * 60; // 1 year in seconds
      expect(time).toBeCloseTo(expectedTime, -3); // Within 1000 seconds
    });

    it("should throw error for zero principal", () => {
      // Given
      const principal = new BigNumber("0");
      const targetInterest = new BigNumber("50");
      const rate = new BigNumber("500");

      // When & Then
      expect(() => calculateRequiredSimpleTime(principal, targetInterest, rate))
        .toThrow(InterestCalculationError);
    });

    it("should throw error for zero rate", () => {
      // Given
      const principal = new BigNumber("1000");
      const targetInterest = new BigNumber("50");
      const rate = new BigNumber("0");

      // When & Then
      expect(() => calculateRequiredSimpleTime(principal, targetInterest, rate))
        .toThrow(InterestCalculationError);
    });
  });

  describe("edge cases", () => {
    it("should handle very small amounts", () => {
      // Given
      const principal = new BigNumber("0.000001");
      const rate = new BigNumber("500");
      const timeInSeconds = 365 * 24 * 60 * 60;

      // When
      const interest = calculateSimpleInterest(principal, rate, timeInSeconds);

      // Then
      expect(interest.toNumber()).toBeCloseTo(0.00000005, 10);
    });

    it("should handle very large amounts", () => {
      // Given
      const principal = new BigNumber("1000000000000");
      const rate = new BigNumber("500");
      const timeInSeconds = 365 * 24 * 60 * 60;

      // When
      const interest = calculateSimpleInterest(principal, rate, timeInSeconds);

      // Then
      expect(interest.toString()).toBe("50000000000"); // 5% of 1 trillion
    });

    it("should handle very high interest rates", () => {
      // Given
      const principal = new BigNumber("1000");
      const rate = new BigNumber("50000"); // 500% APR
      const timeInSeconds = 365 * 24 * 60 * 60;

      // When
      const interest = calculateSimpleInterest(principal, rate, timeInSeconds);

      // Then
      expect(interest.toString()).toBe("5000"); // 500% of 1000
    });

    it("should handle very short time periods", () => {
      // Given
      const principal = new BigNumber("1000");
      const rate = new BigNumber("500");
      const timeInSeconds = 1; // 1 second

      // When
      const interest = calculateSimpleInterest(principal, rate, timeInSeconds);

      // Then
      // 1 second = 1/(365.25*24*3600) years ≈ 3.17e-8 years
      // Interest = 1000 * 0.05 * 3.17e-8 ≈ 1.58e-6
      expect(interest.toNumber()).toBeCloseTo(0.0000015854, 10);
    });
  });
});
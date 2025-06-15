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
import BigNumber from "bignumber.js";

import {
  getAmountsForLiquidity,
  getLiquidityForAmounts,
  liquidity0,
  liquidity1
} from "./addLiquidity.helper";

describe("Liquidity Math", () => {
  // Given
  const sqrtPriceA = new BigNumber("1.414213"); // ~sqrt(2)
  const sqrtPriceB = new BigNumber("1.732050"); // ~sqrt(3)
  const sqrtRatio = new BigNumber("1.6");
  const amount = new BigNumber("1000");
  const liquidity = new BigNumber("500");

  describe("liquidity0", () => {
    it("calculates liquidity0 when A < B", () => {
      // Given
      const expected = amount
        .multipliedBy(sqrtPriceA.multipliedBy(sqrtPriceB))
        .dividedBy(sqrtPriceB.minus(sqrtPriceA));

      // When
      const result = liquidity0(amount, sqrtPriceA, sqrtPriceB);

      // Then
      expect(result.toFixed(8)).toBe(expected.toFixed(8));
    });

    it("swaps A and B if A > B", () => {
      // Given
      const result1 = liquidity0(amount, sqrtPriceA, sqrtPriceB);

      // When
      const result2 = liquidity0(amount, sqrtPriceB, sqrtPriceA);

      // Then
      expect(result1.toFixed(8)).toEqual(result2.toFixed(8));
    });
  });

  describe("liquidity1", () => {
    it("calculates liquidity1 when A < B", () => {
      // Given
      const expected = amount.dividedBy(sqrtPriceB.minus(sqrtPriceA));

      // When
      const result = liquidity1(amount, sqrtPriceA, sqrtPriceB);

      // Then
      expect(result.toFixed(8)).toBe(expected.toFixed(8));
    });

    it("swaps A and B if A > B", () => {
      // Given
      const result1 = liquidity1(amount, sqrtPriceA, sqrtPriceB);

      // When
      const result2 = liquidity1(amount, sqrtPriceB, sqrtPriceA);

      // Then
      expect(result1.toFixed(8)).toEqual(result2.toFixed(8));
    });
  });

  describe("getAmountsForLiquidity", () => {
    it("returns only amount0 if sqrtRatio <= sqrtRatioA", () => {
      // Given
      const belowRange = new BigNumber("1.3");

      // When
      const [amount0, amount1] = getAmountsForLiquidity(belowRange, sqrtPriceA, sqrtPriceB, liquidity);

      // Then
      expect(amount0.isZero()).toBe(false);
      expect(amount1.isZero()).toBe(true);
    });

    it("returns both amounts if sqrtRatioA < sqrtRatio < sqrtRatioB", () => {
      // When
      const [amount0, amount1] = getAmountsForLiquidity(sqrtRatio, sqrtPriceA, sqrtPriceB, liquidity);

      // Then
      expect(amount0.isZero()).toBe(false);
      expect(amount1.isZero()).toBe(false);
    });

    it("returns only amount1 if sqrtRatio >= sqrtRatioB", () => {
      // Given
      const aboveRange = new BigNumber("1.8");

      // When
      const [amount0, amount1] = getAmountsForLiquidity(aboveRange, sqrtPriceA, sqrtPriceB, liquidity);

      // Then
      expect(amount0.isZero()).toBe(true);
      expect(amount1.isZero()).toBe(false);
    });
  });

  describe("getLiquidityForAmounts", () => {
    it("uses liquidity0 if sqrtRatio <= sqrtRatioA", () => {
      // Given
      const belowRange = new BigNumber("1.3");
      const expected = liquidity0(amount, sqrtPriceA, sqrtPriceB);

      // When
      const result = getLiquidityForAmounts(belowRange, sqrtPriceA, sqrtPriceB, amount, amount);

      // Then
      expect(result.toFixed(8)).toBe(expected.toFixed(8));
    });

    it("uses min(liquidity0, liquidity1) if in between range", () => {
      // Given
      const liquidity0Val = liquidity0(amount, sqrtRatio, sqrtPriceB);
      const liquidity1Val = liquidity1(amount, sqrtPriceA, sqrtRatio);
      const expected = BigNumber.min(liquidity0Val, liquidity1Val);

      // When
      const result = getLiquidityForAmounts(sqrtRatio, sqrtPriceA, sqrtPriceB, amount, amount);

      // Then
      expect(result.toFixed(8)).toBe(expected.toFixed(8));
    });

    it("uses liquidity1 if sqrtRatio >= sqrtRatioB", () => {
      // Given
      const aboveRange = new BigNumber("1.8");
      const expected = liquidity1(amount, sqrtPriceA, sqrtPriceB);

      // When
      const result = getLiquidityForAmounts(aboveRange, sqrtPriceA, sqrtPriceB, amount, amount);

      // Then
      expect(result.toFixed(8)).toBe(expected.toFixed(8));
    });
  });
});

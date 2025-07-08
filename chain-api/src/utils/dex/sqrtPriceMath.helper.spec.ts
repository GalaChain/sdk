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

import { ConflictError } from "../error";
import {
  getAmount0Delta,
  getAmount1Delta,
  getNextSqrtPriceFromAmount0,
  getNextSqrtPriceFromAmount1,
  getNextSqrtPriceFromInput,
  getNextSqrtPriceFromOutput
} from "./sqrtPriceMath.helper";

describe("getAmount0Delta", () => {
  it("calculates amount0 delta correctly", () => {
    // Given
    const sqrtA = new BigNumber(2);
    const sqrtB = new BigNumber(4);
    const liquidity = new BigNumber(100);

    // When
    const result = getAmount0Delta(sqrtA, sqrtB, liquidity);

    // Then
    expect(result.toFixed(6)).toBe("25.000000");
  });
});

describe("getAmount1Delta", () => {
  it("calculates amount1 delta correctly", () => {
    // Given
    const sqrtA = new BigNumber(2);
    const sqrtB = new BigNumber(4);
    const liquidity = new BigNumber(100);

    // When
    const result = getAmount1Delta(sqrtA, sqrtB, liquidity);

    // Then
    expect(result.toFixed(6)).toBe("200.000000");
  });
});

describe("getNextSqrtPriceFromInput", () => {
  it("throws error if price is zero or negative", () => {
    // Given
    const price = new BigNumber(0);
    const liquidity = new BigNumber(100);
    const amountIn = new BigNumber(10);

    expect(
      () =>
        // When
        getNextSqrtPriceFromInput(price, liquidity, amountIn, true)
      // Then
    ).toThrow(ConflictError);
  });

  it("throws error if liquidity is zero", () => {
    // Given
    const price = new BigNumber(5);
    const liquidity = new BigNumber(0);
    const amountIn = new BigNumber(10);

    expect(
      () =>
        // When
        getNextSqrtPriceFromInput(price, liquidity, amountIn, true)
      // Then
    ).toThrow(ConflictError);
  });

  it("computes new sqrtPrice for token0 input", () => {
    // Given
    const price = new BigNumber(4);
    const liquidity = new BigNumber(100);
    const amountIn = new BigNumber(10);

    // When
    const result = getNextSqrtPriceFromInput(price, liquidity, amountIn, true);

    // Then
    expect(result.toNumber()).toBeGreaterThan(0);
  });

  it("computes new sqrtPrice for token1 input", () => {
    // Given
    const price = new BigNumber(4);
    const liquidity = new BigNumber(100);
    const amountIn = new BigNumber(10);

    // When
    const result = getNextSqrtPriceFromInput(price, liquidity, amountIn, false);

    // Then
    expect(result.toNumber()).toBeGreaterThan(0);
  });
});

describe("getNextSqrtPriceFromOutput", () => {
  it("throws error if price is zero or negative", () => {
    // Given
    const price = new BigNumber(0);
    const liquidity = new BigNumber(100);
    const amountOut = new BigNumber(10);

    expect(
      () =>
        // When
        getNextSqrtPriceFromOutput(price, liquidity, amountOut, true)
      // Then
    ).toThrow(ConflictError);
  });

  it("throws error if liquidity is zero", () => {
    // Given
    const price = new BigNumber(5);
    const liquidity = new BigNumber(0);
    const amountOut = new BigNumber(10);

    expect(
      () =>
        // When
        getNextSqrtPriceFromOutput(price, liquidity, amountOut, true)
      // Then
    ).toThrow(ConflictError);
  });

  it("computes new sqrtPrice for token0 output", () => {
    // Given
    const price = new BigNumber(4);
    const liquidity = new BigNumber(100);
    const amountOut = new BigNumber(10);

    // When
    const result = getNextSqrtPriceFromOutput(price, liquidity, amountOut, true);

    // Then
    expect(result.toNumber()).toBeGreaterThan(0);
  });

  it("computes new sqrtPrice for token1 output", () => {
    // Given
    const price = new BigNumber(4);
    const liquidity = new BigNumber(100);
    const amountOut = new BigNumber(10);

    // When
    const result = getNextSqrtPriceFromOutput(price, liquidity, amountOut, false);

    // Then
    expect(result.toNumber()).toBeGreaterThan(0);
  });
});

describe("getNextSqrtPriceFromAmount0", () => {
  it("computes price when adding token0", () => {
    // Given
    const price = new BigNumber(4);
    const liquidity = new BigNumber(100);
    const amount = new BigNumber(10);

    // When
    const result = getNextSqrtPriceFromAmount0(price, liquidity, amount, true);

    // Then
    expect(result.toNumber()).toBeLessThan(price.toNumber());
  });

  it("computes price when removing token0", () => {
    // Given
    const price = new BigNumber(4);
    const liquidity = new BigNumber(100);
    const amount = new BigNumber(10);

    // When
    const result = getNextSqrtPriceFromAmount0(price, liquidity, amount, false);

    // Then
    expect(result.toNumber()).toBeGreaterThan(price.toNumber());
  });
});

describe("getNextSqrtPriceFromAmount1", () => {
  it("computes price when adding token1", () => {
    // Given
    const price = new BigNumber(4);
    const liquidity = new BigNumber(100);
    const amount = new BigNumber(10);

    // When
    const result = getNextSqrtPriceFromAmount1(price, liquidity, amount, true);

    // Then
    expect(result.toNumber()).toBeGreaterThan(price.toNumber());
  });

  it("computes price when removing token1", () => {
    // Given
    const price = new BigNumber(4);
    const liquidity = new BigNumber(100);
    const amount = new BigNumber(10);

    // When
    const result = getNextSqrtPriceFromAmount1(price, liquidity, amount, false);

    // Then
    expect(result.toNumber()).toBeLessThan(price.toNumber());
  });
});

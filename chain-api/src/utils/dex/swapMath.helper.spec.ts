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
  getAmount0Delta,
  getAmount1Delta,
  getNextSqrtPriceFromInput,
  getNextSqrtPriceFromOutput
} from "./sqrtPriceMath.helper";
import { computeSwapStep } from "./swapMath.helper";

// Mock the math helpers if you want pure unit testing without depending on their actual logic
jest.mock("./sqrtPriceMath.helper");

describe("computeSwapStep", () => {
  const fee = 3000; // 0.3%
  const liquidity = new BigNumber(10000);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("computes exact input swap when sqrtPriceTarget is reached (zeroForOne)", () => {
    // Given
    const sqrtPriceCurrent = new BigNumber(2);
    const sqrtPriceTarget = new BigNumber(1.5);
    const amountRemaining = new BigNumber(100);

    (getAmount0Delta as jest.Mock).mockReturnValue(new BigNumber(90));
    (getNextSqrtPriceFromInput as jest.Mock).mockReturnValue(sqrtPriceTarget);
    (getAmount1Delta as jest.Mock).mockReturnValue(new BigNumber(50));

    // When
    const [sqrtPriceNext, amountIn, amountOut, feeAmount] = computeSwapStep(
      sqrtPriceCurrent,
      sqrtPriceTarget,
      liquidity,
      amountRemaining,
      fee
    );

    // Then
    expect(sqrtPriceNext).toEqual(sqrtPriceTarget);
    expect(amountIn.toNumber()).toBeCloseTo(90);
    expect(amountOut.toNumber()).toBeCloseTo(50);
    expect(feeAmount.toNumber()).toBeGreaterThan(0);
  });

  it("computes exact input swap when sqrtPriceTarget is not reached (zeroForOne)", () => {
    // Given
    const sqrtPriceCurrent = new BigNumber(2);
    const sqrtPriceTarget = new BigNumber(1.5);
    const amountRemaining = new BigNumber(60);

    (getNextSqrtPriceFromInput as jest.Mock).mockReturnValue(new BigNumber(1.6));
    (getAmount0Delta as jest.Mock).mockReturnValue(new BigNumber(60));
    (getAmount1Delta as jest.Mock).mockReturnValue(new BigNumber(30));

    // When
    const [sqrtPriceNext, amountIn, amountOut, feeAmount] = computeSwapStep(
      sqrtPriceCurrent,
      sqrtPriceTarget,
      liquidity,
      amountRemaining,
      fee
    );

    // Then
    expect(sqrtPriceNext.toNumber()).toBeCloseTo(1.6);
    expect(amountIn.toNumber()).toBeCloseTo(60);
    expect(amountOut.toNumber()).toBeCloseTo(30);
    expect(feeAmount.toNumber()).toBeCloseTo(amountRemaining.minus(amountIn).toNumber());
  });

  it("computes exact output swap when sqrtPriceTarget is reached (zeroForOne)", () => {
    // Given
    const sqrtPriceCurrent = new BigNumber(2);
    const sqrtPriceTarget = new BigNumber(1.5);
    const amountRemaining = new BigNumber(-50);

    (getAmount1Delta as jest.Mock).mockReturnValue(new BigNumber(40));
    (getAmount0Delta as jest.Mock).mockReturnValue(new BigNumber(70));

    // When
    const [sqrtPriceNext, amountIn, amountOut, feeAmount] = computeSwapStep(
      sqrtPriceCurrent,
      sqrtPriceTarget,
      liquidity,
      amountRemaining,
      fee
    );

    // Then
    expect(sqrtPriceNext).toEqual(sqrtPriceTarget);
    expect(amountOut.toNumber()).toBeCloseTo(40);
    expect(amountIn.toNumber()).toBeCloseTo(70);
    expect(feeAmount.toNumber()).toBeGreaterThan(0);
  });

  it("computes exact output swap when sqrtPriceTarget is not reached (zeroForOne)", () => {
    // Given
    const sqrtPriceCurrent = new BigNumber(2);
    const sqrtPriceTarget = new BigNumber(1.5);
    const amountRemaining = new BigNumber(-25);

    (getAmount1Delta as jest.Mock).mockReturnValue(new BigNumber(40));
    (getNextSqrtPriceFromOutput as jest.Mock).mockReturnValue(new BigNumber(1.6));
    (getAmount0Delta as jest.Mock).mockReturnValue(new BigNumber(30));

    // When
    const [sqrtPriceNext, amountIn, amountOut, feeAmount] = computeSwapStep(
      sqrtPriceCurrent,
      sqrtPriceTarget,
      liquidity,
      amountRemaining,
      fee
    );

    // Then
    expect(sqrtPriceNext.toNumber()).toBeCloseTo(1.6);
    expect(amountOut.toNumber()).toBeCloseTo(25);
    expect(amountIn.toNumber()).toBeCloseTo(30);
    expect(feeAmount.toNumber()).toBeGreaterThan(0);
  });

  it("computes swap when zeroForOne is false (token1 for token0)", () => {
    // Given
    const sqrtPriceCurrent = new BigNumber(1.5);
    const sqrtPriceTarget = new BigNumber(2); // implies zeroForOne = false
    const amountRemaining = new BigNumber(100);

    (getAmount1Delta as jest.Mock).mockReturnValue(new BigNumber(80));
    (getNextSqrtPriceFromInput as jest.Mock).mockReturnValue(sqrtPriceTarget);
    (getAmount0Delta as jest.Mock).mockReturnValue(new BigNumber(70));

    // When
    const [sqrtPriceNext, amountIn, amountOut, feeAmount] = computeSwapStep(
      sqrtPriceCurrent,
      sqrtPriceTarget,
      liquidity,
      amountRemaining,
      fee
    );

    // Then
    expect(sqrtPriceNext).toEqual(sqrtPriceTarget);
    expect(amountIn.toNumber()).toBeCloseTo(80);
    expect(amountOut.toNumber()).toBeCloseTo(70);
    expect(feeAmount.toNumber()).toBeGreaterThan(0);
  });
});

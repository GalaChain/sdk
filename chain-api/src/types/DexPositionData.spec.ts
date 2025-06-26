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
import { plainToInstance } from "class-transformer";

import { DexFeePercentageTypes } from "./DexDtos";
import { DexPositionData } from "./DexPositionData";
import { TokenClassKey } from "./TokenClass";

const tokenClass0Properties = {
  collection: "TEST",
  category: "Token",
  type: "Zero",
  additionalKey: "none"
};

const tokenClass1Properties = {
  collection: "TEST",
  category: "Token",
  type: "One",
  additionalKey: "none"
};

describe("DexPositionData", () => {
  const mockTokenClassKey0 = plainToInstance(TokenClassKey, tokenClass0Properties);
  const mockTokenClassKey1 = plainToInstance(TokenClassKey, tokenClass1Properties);

  const poolHash = "pool-hash-123";
  const positionId = "position-xyz";
  const tickLower = -60;
  const tickUpper = 60;
  const fee = DexFeePercentageTypes.FEE_0_05_PERCENT;

  let position: DexPositionData;

  beforeEach(() => {
    // Given: A fresh DexPositionData instance
    position = new DexPositionData(
      poolHash,
      positionId,
      tickUpper,
      tickLower,
      mockTokenClassKey0,
      mockTokenClassKey1,
      fee
    );
  });

  it("should initialize with correct default values", () => {
    // Then
    expect(position.liquidity.isEqualTo(0)).toBe(true);
    expect(position.feeGrowthInside0Last.isEqualTo(0)).toBe(true);
    expect(position.feeGrowthInside1Last.isEqualTo(0)).toBe(true);
    expect(position.tokensOwed0.isEqualTo(0)).toBe(true);
    expect(position.tokensOwed1.isEqualTo(0)).toBe(true);
    expect(position.tickUpper).toBe(tickUpper);
    expect(position.tickLower).toBe(tickLower);
  });

  it("should update liquidity and fee tracking correctly when liquidity delta is positive", () => {
    // Given
    const liquidityDelta = new BigNumber("1000");
    const newFeeGrowth0 = new BigNumber("0.01");
    const newFeeGrowth1 = new BigNumber("0.02");

    // When
    position.updatePosition(liquidityDelta, newFeeGrowth0, newFeeGrowth1);

    // Then
    expect(position.liquidity.isEqualTo(1000)).toBe(true);
    expect(position.tokensOwed0.isEqualTo(0)).toBe(true);
    expect(position.tokensOwed1.isEqualTo(0)).toBe(true);
    expect(position.feeGrowthInside0Last.isEqualTo(newFeeGrowth0)).toBe(true);
    expect(position.feeGrowthInside1Last.isEqualTo(newFeeGrowth1)).toBe(true);
  });

  it("should accumulate tokens owed when fee growth increases without changing liquidity", () => {
    // Given
    const liquidityDelta = new BigNumber("1000");
    const feeGrowth0a = new BigNumber("0.01");
    const feeGrowth1a = new BigNumber("0.02");
    position.updatePosition(liquidityDelta, feeGrowth0a, feeGrowth1a);

    const feeGrowth0b = new BigNumber("0.015");
    const feeGrowth1b = new BigNumber("0.025");

    // When
    position.updatePosition(new BigNumber(0), feeGrowth0b, feeGrowth1b);

    // Then
    const expectedOwed0 = new BigNumber("0.005").times(1000); // 5
    const expectedOwed1 = new BigNumber("0.005").times(1000); // 5

    expect(position.tokensOwed0.isEqualTo(expectedOwed0)).toBe(true);
    expect(position.tokensOwed1.isEqualTo(expectedOwed1)).toBe(true);
  });

  it("should throw if resulting liquidity is negative", () => {
    // Given
    const liquidityDelta = new BigNumber("-1");

    // When / Then
    expect(() => position.updatePosition(liquidityDelta, new BigNumber(0), new BigNumber(0))).toThrow(
      "Uint Out of Bounds error :Uint"
    );
  });

  it("should not update tokens owed if deltas are zero", () => {
    // Given
    const liquidityDelta = new BigNumber("1000");
    const feeGrowth = new BigNumber("0.01");

    position.updatePosition(liquidityDelta, feeGrowth, feeGrowth);

    // When
    position.updatePosition(new BigNumber(0), feeGrowth, feeGrowth);

    // Then
    expect(position.tokensOwed0.isEqualTo(0)).toBe(true);
    expect(position.tokensOwed1.isEqualTo(0)).toBe(true);
  });

  it("should handle multiple updates correctly", () => {
    // Given
    position.updatePosition(new BigNumber("1000"), new BigNumber("0.01"), new BigNumber("0.01"));
    position.updatePosition(new BigNumber(0), new BigNumber("0.02"), new BigNumber("0.015"));
    position.updatePosition(new BigNumber("500"), new BigNumber("0.03"), new BigNumber("0.025"));

    // Then
    expect(position.liquidity.isEqualTo("1500")).toBe(true);
    expect(position.feeGrowthInside0Last.isEqualTo("0.03")).toBe(true);
    expect(position.feeGrowthInside1Last.isEqualTo("0.025")).toBe(true);

    const owed0 = new BigNumber("0.02").times(1000); // update 2
    const owed1 = new BigNumber("0.015").times(1000); // update 2

    expect(position.tokensOwed0.isEqualTo(owed0)).toBe(true);
    expect(position.tokensOwed1.isEqualTo(owed1)).toBe(true);
  });
});

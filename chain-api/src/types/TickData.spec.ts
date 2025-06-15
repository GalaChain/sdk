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

import { ValidationFailedError } from "../utils";
import { TickData } from "./TickData";

describe("TickData", () => {
  const poolHash = "pool-abc";
  const tick = 100;

  let tickData: TickData;

  beforeEach(() => {
    // Given
    tickData = new TickData(poolHash, tick);
  });

  it("should initialize with default values", () => {
    // Then
    expect(tickData.poolHash).toBe(poolHash);
    expect(tickData.tick).toBe(tick);
    expect(tickData.liquidityGross.isZero()).toBe(true);
    expect(tickData.liquidityNet.isZero()).toBe(true);
    expect(tickData.initialised).toBe(false);
    expect(tickData.feeGrowthOutside0.isZero()).toBe(true);
    expect(tickData.feeGrowthOutside1.isZero()).toBe(true);
  });

  it("should initialize tick and set fee growth if first time and tick <= current", () => {
    // When
    const result = tickData.updateTick(
      150,
      new BigNumber(1000),
      false,
      new BigNumber(10),
      new BigNumber(20),
      new BigNumber(100000)
    );

    // Then
    expect(result).toBe(true);
    expect(tickData.initialised).toBe(true);
    expect(tickData.feeGrowthOutside0.toString()).toBe("10");
    expect(tickData.feeGrowthOutside1.toString()).toBe("20");
    expect(tickData.liquidityGross.toString()).toBe("1000");
    expect(tickData.liquidityNet.toString()).toBe("1000");
  });

  it("should initialize tick but not set fee growth if tick > current", () => {
    // When
    const result = tickData.updateTick(
      50,
      new BigNumber(500),
      true,
      new BigNumber(30),
      new BigNumber(40),
      new BigNumber(100000)
    );

    // Then
    expect(result).toBe(true);
    expect(tickData.initialised).toBe(true);
    expect(tickData.feeGrowthOutside0.toString()).toBe("0");
    expect(tickData.feeGrowthOutside1.toString()).toBe("0");
    expect(tickData.liquidityGross.toString()).toBe("500");
    expect(tickData.liquidityNet.toString()).toBe("-500"); // because upper = true
  });

  it("should throw if gross liquidity exceeds max", () => {
    // Given
    const delta = new BigNumber(1001);
    const max = new BigNumber(1000);

    // Then
    expect(() => tickData.updateTick(0, delta, false, new BigNumber(0), new BigNumber(0), max)).toThrow(
      ValidationFailedError
    );
  });

  it("should flip from initialized to uninitialized and return true", () => {
    // Given
    tickData.updateTick(
      100,
      new BigNumber(1000),
      false,
      new BigNumber(5),
      new BigNumber(10),
      new BigNumber(100000)
    );

    // When
    const result = tickData.updateTick(
      100,
      new BigNumber(-1000),
      false,
      new BigNumber(5),
      new BigNumber(10),
      new BigNumber(100000)
    );

    // Then
    expect(result).toBe(true);
    expect(tickData.liquidityGross.isZero()).toBe(true);
  });

  it("should return false if liquidity does not flip zero", () => {
    // Given
    tickData.updateTick(
      100,
      new BigNumber(1000),
      false,
      new BigNumber(0),
      new BigNumber(0),
      new BigNumber(100000)
    );

    // When
    const result = tickData.updateTick(
      100,
      new BigNumber(500),
      false,
      new BigNumber(0),
      new BigNumber(0),
      new BigNumber(100000)
    );

    // Then
    expect(result).toBe(false);
    expect(tickData.liquidityGross.toString()).toBe("1500");
  });

  it("tickCross should subtract outside from global and return liquidityNet", () => {
    // Given
    tickData.liquidityNet = new BigNumber(777);
    tickData.feeGrowthOutside0 = new BigNumber(3);
    tickData.feeGrowthOutside1 = new BigNumber(4);

    // When
    const result = tickData.tickCross(new BigNumber(10), new BigNumber(12));

    // Then
    expect(result.toString()).toBe("777");
    expect(tickData.feeGrowthOutside0.toString()).toBe("7");
    expect(tickData.feeGrowthOutside1.toString()).toBe("8");
  });
});

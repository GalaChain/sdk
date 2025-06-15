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

import { TickData } from "../../types/TickData";
import {
  checkTicks,
  feeAmountTickSpacing,
  flipTick,
  flipTickOrientation,
  getFeeGrowthInside,
  nextInitialisedTickWithInSameWord,
  spaceTick,
  sqrtPriceToTick,
  tickSpacingToMaxLiquidityPerTick,
  tickToSqrtPrice
} from "./tick.helper";

describe("tick.helper", () => {
  describe("tickToSqrtPrice", () => {
    it("should return sqrt(1.0001^tick)", () => {
      // Given
      const tick = 100;

      // When
      const result = tickToSqrtPrice(tick);

      // Then
      expect(result.toNumber()).toBeCloseTo(Math.sqrt(1.0001 ** tick));
    });
  });

  describe("sqrtPriceToTick", () => {
    it("should return correct tick for given sqrtPrice", () => {
      // Given
      const sqrtPrice = new BigNumber(Math.sqrt(1.0001 ** 200));

      // When
      const tick = sqrtPriceToTick(sqrtPrice);

      // Then
      expect(tick).toBe(200);
    });
  });

  describe("flipTick", () => {
    it("should flip tick state in bitmap", () => {
      // Given
      const bitmap: Record<string, string> = {};
      const tick = 60;
      const tickSpacing = 60;

      // When
      flipTick(bitmap, tick, tickSpacing);

      // Then
      const word = Math.floor(tick / tickSpacing / 256);
      expect(BigInt(bitmap[word])).toBe(BigInt(2));
    });
  });

  describe("nextInitialisedTickWithInSameWord", () => {
    it("should return initialized tick on left side", () => {
      // Given
      const bitmap: Record<string, string> = {};
      const tick = 60;
      const tickSpacing = 60;
      const sqrtPrice = tickToSqrtPrice(60);
      flipTick(bitmap, tick, tickSpacing);

      // When
      const [nextTick, initialized] = nextInitialisedTickWithInSameWord(
        bitmap,
        tick,
        tickSpacing,
        true,
        sqrtPrice
      );

      // Then
      expect(nextTick).toBe(tick);
      expect(initialized).toBe(true);
    });

    it("should return initialized tick on right side", () => {
      // Given
      const bitmap: Record<string, string> = {};
      const tick = 60;
      const tickSpacing = 60;
      const sqrtPrice = tickToSqrtPrice(59);
      flipTick(bitmap, tick, tickSpacing);

      // When
      const [nextTick, initialized] = nextInitialisedTickWithInSameWord(
        bitmap,
        tick - 1,
        tickSpacing,
        false,
        sqrtPrice
      );

      // Then
      expect(nextTick).toBe(tick);
      expect(initialized).toBe(true);
    });
  });

  describe("getFeeGrowthInside", () => {
    it("should return correct fee growth inside bounds", () => {
      // Given
      const tickLower = new TickData("0xpool", 0);
      tickLower.feeGrowthOutside0 = new BigNumber(100);
      tickLower.feeGrowthOutside1 = new BigNumber(200);

      const tickUpper = new TickData("0xpool", 100);
      tickUpper.feeGrowthOutside0 = new BigNumber(300);
      tickUpper.feeGrowthOutside1 = new BigNumber(400);

      const tickCurrent = 50;
      const feeGrowthGlobal0 = new BigNumber(1000);
      const feeGrowthGlobal1 = new BigNumber(1000);

      // When
      const [feeInside0, feeInside1] = getFeeGrowthInside(
        tickLower,
        tickUpper,
        tickCurrent,
        feeGrowthGlobal0,
        feeGrowthGlobal1
      );

      // Then
      expect(feeInside0.toNumber()).toBe(1000 - 100 - 300);
      expect(feeInside1.toNumber()).toBe(1000 - 200 - 400);
    });
  });

  describe("checkTicks", () => {
    it("should throw if tick range is invalid", () => {
      // Given / When / Then
      expect(() => checkTicks(100, 99)).toThrow("Lower Tick is greater than Upper Tick");
      expect(() => checkTicks(-888000, 0)).toThrow("Lower Tick is less than Min Tick");
      expect(() => checkTicks(0, 888000)).toThrow("Upper Tick is greater than Max Tick");
    });
  });

  describe("tickSpacingToMaxLiquidityPerTick", () => {
    it("should return max liquidity per tick", () => {
      // Given
      const tickSpacing = 60;

      // When
      const result = tickSpacingToMaxLiquidityPerTick(tickSpacing);

      // Then
      expect(result.isGreaterThan(0)).toBe(true);
    });
  });

  describe("feeAmountTickSpacing", () => {
    it("should have correct spacing for fee amount", () => {
      // Given / When / Then
      expect(feeAmountTickSpacing[500]).toBe(10);
      expect(feeAmountTickSpacing[3000]).toBe(60);
      expect(feeAmountTickSpacing[10000]).toBe(200);
    });
  });

  describe("flipTickOrientation", () => {
    it("should return mirrored tick for inverse price", () => {
      // Given
      const tick = 200;

      // When
      const flipped = flipTickOrientation(tick);

      // Then
      expect(typeof flipped).toBe("number");
      expect(flipped).toBeCloseTo(-tick, -1); // Approximate mirror
    });
  });

  describe("spaceTick", () => {
    it("should space the tick according to tick spacing", () => {
      // Given
      const tick = 123;
      const spacing = 10;

      // When
      const spaced = spaceTick(tick, spacing);

      // Then
      expect(spaced).toBe(120);
    });

    it("should throw if spacing is 0", () => {
      // Given / When / Then
      expect(() => spaceTick(123, 0)).toThrow("Tickspacing cannot be zero");
    });
  });
});

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
import {
  Bitmap,
  TickDataObj,
  TokenClassKey,
  computeSwapStep,
  getAmount0Delta,
  getAmount1Delta,
  getAmountsForLiquidity,
  getLiquidityForAmounts,
  getNextSqrtPriceFromAmount0,
  getNextSqrtPriceFromAmount1,
  getNextSqrtPriceFromInput,
  getNextSqrtPriceFromOutput,
  leastSignificantBit,
  liquidity0,
  liquidity1,
  mostSignificantBit,
  updatePositions
} from "@gala-chain/api";
import {
  checkTicks,
  flipTick,
  getFeeGrowthInside,
  nextInitialisedTickWithInSameWord,
  spaceTick,
  sqrtPriceToTick,
  tickCross,
  tickSpacingToMaxLiquidityPerTick,
  tickToSqrtPrice,
  updateTick
} from "@gala-chain/api";
import { genKey, validateTokenOrder } from "@gala-chain/chaincode";
import BigNumber from "bignumber.js";

import TOKENS from "./tokens";

const ETH_ClassKey = Object.assign(new TokenClassKey(), TOKENS.ETH.KEY);
const USDC_ClassKey = Object.assign(new TokenClassKey(), TOKENS.USDC.KEY);

describe("Unit testing for helper functions", () => {
  describe("Add liquidity Helper functions", () => {
    describe("liquidity0", () => {
      it("should return correct liquidity when sqrtPriceA < sqrtPriceB", () => {
        const amount = new BigNumber(1000);
        const sqrtPriceA = new BigNumber(2);
        const sqrtPriceB = new BigNumber(5);
        const expectedLiquidity = amount
          .multipliedBy(sqrtPriceA.multipliedBy(sqrtPriceB))
          .dividedBy(sqrtPriceB.minus(sqrtPriceA));
        expect(liquidity0(amount, sqrtPriceA, sqrtPriceB).toString()).toBe(expectedLiquidity.toString());
      });
      it("should swap values if sqrtPriceA > sqrtPriceB", () => {
        const amount = new BigNumber(1000);
        const sqrtPriceA = new BigNumber(5);
        const sqrtPriceB = new BigNumber(2);
        const expectedLiquidity = amount
          .multipliedBy(sqrtPriceB.multipliedBy(sqrtPriceA))
          .dividedBy(sqrtPriceA.minus(sqrtPriceB));

        expect(liquidity0(amount, sqrtPriceA, sqrtPriceB).toString()).toBe(expectedLiquidity.toString());
      });

      it("should handle edge case where amount is zero", () => {
        const amount = new BigNumber(0);
        const sqrtPriceA = new BigNumber(2);
        const sqrtPriceB = new BigNumber(5);

        expect(liquidity0(amount, sqrtPriceA, sqrtPriceB).toString()).toBe("0");
      });

      it("should handle large numbers correctly", () => {
        const amount = new BigNumber("1000000000000000000");
        const sqrtPriceA = new BigNumber("1000000000000");
        const sqrtPriceB = new BigNumber("5000000000000");
        const expectedLiquidity = amount
          .multipliedBy(sqrtPriceA.multipliedBy(sqrtPriceB))
          .dividedBy(sqrtPriceB.minus(sqrtPriceA));

        expect(liquidity0(amount, sqrtPriceA, sqrtPriceB).toString()).toBe(expectedLiquidity.toString());
      });
    });
  });
  describe("getLiquidityForAmounts", () => {
    /**
     * General convention followed
     * SqrtPriceB > sqrtPriceA
     */
    it("should return liquidity0 when sqrtRatio <= sqrtRatioA", () => {
      const sqrtRatio = new BigNumber(2);
      const sqrtRatioA = new BigNumber(3);
      const sqrtRatioB = new BigNumber(5);
      const amount0 = new BigNumber(1000);
      const amount1 = new BigNumber(500);

      const expectedLiquidity = liquidity0(amount0, sqrtRatioA, sqrtRatioB);
      expect(getLiquidityForAmounts(sqrtRatio, sqrtRatioA, sqrtRatioB, amount0, amount1).toString()).toBe(
        expectedLiquidity.toString()
      );
    });

    it("should return minimum of liquidity0 and liquidity1 when sqrtRatio is within range", () => {
      const sqrtRatio = new BigNumber(4);
      const sqrtRatioA = new BigNumber(3);
      const sqrtRatioB = new BigNumber(5);
      const amount0 = new BigNumber(1000);
      const amount1 = new BigNumber(500);

      const Liquidity0 = liquidity0(amount0, sqrtRatio, sqrtRatioB);
      const Liquidity1 = liquidity1(amount1, sqrtRatioA, sqrtRatio);
      const expectedLiquidity = Liquidity0.lt(Liquidity1) ? Liquidity0 : Liquidity1;

      expect(getLiquidityForAmounts(sqrtRatio, sqrtRatioA, sqrtRatioB, amount0, amount1).toString()).toBe(
        expectedLiquidity.toString()
      );
    });

    it("should return liquidity1 when sqrtRatio >= sqrtRatioB", () => {
      const sqrtRatio = new BigNumber(6);
      const sqrtRatioA = new BigNumber(3);
      const sqrtRatioB = new BigNumber(5);
      const amount0 = new BigNumber(1000);
      const amount1 = new BigNumber(500);

      const expectedLiquidity = liquidity1(amount1, sqrtRatioA, sqrtRatioB);
      expect(getLiquidityForAmounts(sqrtRatio, sqrtRatioA, sqrtRatioB, amount0, amount1).toString()).toBe(
        expectedLiquidity.toString()
      );
    });

    it("should handle edge case where amount0 and amount1 are zero", () => {
      const sqrtRatio = new BigNumber(4);
      const sqrtRatioA = new BigNumber(3);
      const sqrtRatioB = new BigNumber(5);
      const amount0 = new BigNumber(0);
      const amount1 = new BigNumber(0);

      expect(getLiquidityForAmounts(sqrtRatio, sqrtRatioA, sqrtRatioB, amount0, amount1).toString()).toBe(
        "0"
      );
    });
  });
  describe("getAmountsForLiquidity", () => {
    it("should return correct amounts when sqrtRatio <= sqrtRatioA", () => {
      const sqrtRatio = new BigNumber(2);
      const sqrtRatioA = new BigNumber(3);
      const sqrtRatioB = new BigNumber(5);
      const liquidity = new BigNumber(1000);

      const expectedAmount0 = getAmount0Delta(sqrtRatioA, sqrtRatioB, liquidity);
      expect(getAmountsForLiquidity(sqrtRatio, sqrtRatioA, sqrtRatioB, liquidity)).toEqual([
        expectedAmount0,
        new BigNumber(0)
      ]);
    });

    it("should return correct amounts when sqrtRatio is within range", () => {
      const sqrtRatio = new BigNumber(4);
      const sqrtRatioA = new BigNumber(3);
      const sqrtRatioB = new BigNumber(5);
      const liquidity = new BigNumber(1000);

      const expectedAmount0 = getAmount0Delta(sqrtRatio, sqrtRatioB, liquidity);
      const expectedAmount1 = getAmount1Delta(sqrtRatioA, sqrtRatio, liquidity);
      expect(getAmountsForLiquidity(sqrtRatio, sqrtRatioA, sqrtRatioB, liquidity)).toEqual([
        expectedAmount0,
        expectedAmount1
      ]);
    });

    it("should return correct amounts when sqrtRatio >= sqrtRatioB", () => {
      const sqrtRatio = new BigNumber(6);
      const sqrtRatioA = new BigNumber(3);
      const sqrtRatioB = new BigNumber(5);
      const liquidity = new BigNumber(1000);

      const expectedAmount1 = getAmount1Delta(sqrtRatioA, sqrtRatioB, liquidity);
      expect(getAmountsForLiquidity(sqrtRatio, sqrtRatioA, sqrtRatioB, liquidity)).toEqual([
        new BigNumber(0),
        expectedAmount1
      ]);
    });
  });
});

describe("mostSignificantBit", () => {
  test("should return 255 for 0", () => {
    expect(mostSignificantBit(BigInt(0))).toBe(0);
  });

  test("should return correct MSB for powers of 2", () => {
    expect(mostSignificantBit(BigInt(1))).toBe(0);
    expect(mostSignificantBit(BigInt(2))).toBe(1);
    expect(mostSignificantBit(BigInt(4))).toBe(2);
    expect(mostSignificantBit(BigInt(8))).toBe(3);
  });

  test("should return correct MSB for arbitrary numbers", () => {
    expect(mostSignificantBit(BigInt(7))).toBe(2); // 111
    expect(mostSignificantBit(BigInt(1024))).toBe(10); // 10000000000
    expect(mostSignificantBit(BigInt("0x80000000000000000000000000000000"))).toBe(127);
    expect(mostSignificantBit(BigInt("0xffffffffffffffffffffffffffffffff"))).toBe(127);
  });
});

describe("leastSignificantBit", () => {
  test("should return 255 for 0", () => {
    expect(leastSignificantBit(BigInt(0))).toBe(255);
  });

  test("should return correct LSB for powers of 2", () => {
    expect(leastSignificantBit(BigInt(1))).toBe(0);
    expect(leastSignificantBit(BigInt(2))).toBe(1);
    expect(leastSignificantBit(BigInt(4))).toBe(2);
    expect(leastSignificantBit(BigInt(8))).toBe(3);
  });

  test("should return correct LSB for arbitrary numbers", () => {
    expect(leastSignificantBit(BigInt(6))).toBe(1); // 110
    expect(leastSignificantBit(BigInt(1024))).toBe(10); // 10000000000
    expect(leastSignificantBit(BigInt("0x80000000000000000000000000000001"))).toBe(0);
    expect(leastSignificantBit(BigInt("0x40000000000000000000000000000000"))).toBe(126);
  });
});
describe("validateTokenOrder", () => {
  test("should return string keys for the sorted tokens", () => {
    expect(validateTokenOrder(ETH_ClassKey, USDC_ClassKey)).toMatchObject([
      ETH_ClassKey.toStringKey(),
      USDC_ClassKey.toStringKey()
    ]);
  });
  test("should throw error string for the un-sorted tokens", () => {
    expect(() => validateTokenOrder(USDC_ClassKey, ETH_ClassKey)).toThrow("Token0 must be smaller");
  });
});
describe("genKey", () => {
  test("should concatenate parameters with '_'", () => {
    expect(genKey("1", "2", "3", "4")).toBe("1_2_3_4");
  });
});

describe("updatePositions", () => {
  test("should initialize a new position if not existing", () => {
    const positions = {};
    const nftId = "0x123";
    const tickLower = -10;
    const tickUpper = 10;
    const liquidityDelta = new BigNumber(100);
    const feeGrowthInside0 = new BigNumber(5);
    const feeGrowthInside1 = new BigNumber(10);

    updatePositions(
      positions,
      nftId,
      tickLower,
      tickUpper,
      liquidityDelta,
      feeGrowthInside0,
      feeGrowthInside1
    );

    expect(positions[nftId]).toBeTruthy();
    expect(positions[nftId].liquidity).toBe("100");
  });

  test("should update liquidity and fees for an existing position", () => {
    const positions = {};
    const nftId = "0x123";
    const tickLower = -10;
    const tickUpper = 10;
    const liquidityDelta = new BigNumber(100);
    const feeGrowthInside0 = new BigNumber(5);
    const feeGrowthInside1 = new BigNumber(10);

    updatePositions(
      positions,
      nftId,
      tickLower,
      tickUpper,
      liquidityDelta,
      feeGrowthInside0,
      feeGrowthInside1
    );
    updatePositions(
      positions,
      nftId,
      tickLower,
      tickUpper,
      new BigNumber(50),
      new BigNumber(8),
      new BigNumber(15)
    );
    const position = positions[nftId];

    expect(position.liquidity).toBe("150");
    expect(position.feeGrowthInside0Last).toBe("8");
    expect(position.feeGrowthInside1Last).toBe("15");
  });

  test("should throw error if decreasing liquidity below zero", () => {
    const positions = {};
    const nftId = "0x123";
    const tickLower = -10;
    const tickUpper = 10;
    const liquidityDelta = new BigNumber(100);
    const feeGrowthInside0 = new BigNumber(5);
    const feeGrowthInside1 = new BigNumber(10);

    updatePositions(
      positions,
      nftId,
      tickLower,
      tickUpper,
      liquidityDelta,
      feeGrowthInside0,
      feeGrowthInside1
    );
    expect(() => {
      updatePositions(
        positions,
        nftId,
        tickLower,
        tickUpper,
        new BigNumber(-200),
        feeGrowthInside0,
        feeGrowthInside1
      );
    }).toThrow();
  });
});

describe("getNextSqrtPriceFromAmount0", () => {
  const sqrtPrice = new BigNumber("100000");
  const liquidity = new BigNumber("500000");
  const amount = new BigNumber("10000");

  const expectNumerator = liquidity.multipliedBy(sqrtPrice);
  const expectDenominatorAdd = liquidity.plus(sqrtPrice.times(amount));
  const expectDenominatorRemove = liquidity.minus(sqrtPrice.times(amount));
  test("should return correct next sqrt price when adding amount", () => {
    const addResult = getNextSqrtPriceFromAmount0(sqrtPrice, liquidity, amount, true);
    expect(addResult.toFixed()).toBe(expectNumerator.dividedBy(expectDenominatorAdd).toString());
  });

  test("should return correct next sqrt price when removing amount", () => {
    const removeResult = getNextSqrtPriceFromAmount0(sqrtPrice, liquidity, amount, false);
    expect(removeResult.toFixed()).toBe(expectNumerator.dividedBy(expectDenominatorRemove).toString());
  });
});

describe("getNextSqrtPriceFromAmount1", () => {
  const sqrtPrice = new BigNumber("100000");
  const liquidity = new BigNumber("500000");
  const amount = new BigNumber("10000");
  test("should return correct next sqrt price when adding amount", () => {
    const result = getNextSqrtPriceFromAmount1(sqrtPrice, liquidity, amount, true);
    expect(result.toFixed()).toBe("100000.02");
  });

  test("should return correct next sqrt price when removing amount", () => {
    const sqrtPrice = new BigNumber("100000");
    const liquidity = new BigNumber("500000");
    const amount = new BigNumber("10000");
    const result = getNextSqrtPriceFromAmount1(sqrtPrice, liquidity, amount, false);
    expect(result.toFixed()).toBe("99999.98");
  });
});

describe("getAmount0Delta", () => {
  test("should return correct amount0 delta", () => {
    const sqrtPriceA = new BigNumber("100000");
    const sqrtPriceB = new BigNumber("120000");
    const liquidity = new BigNumber("500000");
    const result = getAmount0Delta(sqrtPriceA, sqrtPriceB, liquidity);
    expect(result.toFixed()).toBe("0.83333333333333333334");
  });
});

describe("getAmount1Delta", () => {
  test("should return correct amount1 delta", () => {
    const sqrtPriceLower = new BigNumber("100000");
    const sqrtPriceUpper = new BigNumber("120000");
    const liquidityDelta = new BigNumber("500000");
    const result = getAmount1Delta(sqrtPriceLower, sqrtPriceUpper, liquidityDelta);
    expect(result.toFixed()).toBe("10000000000");
  });
});

describe("getNextSqrtPriceFromInput old", () => {
  test("should return correct next sqrt price when zeroForOne is true", () => {
    const sqrtPrice = new BigNumber("100000");
    const liquidity = new BigNumber("500000");
    const amountIn = new BigNumber("10000");
    const result = getNextSqrtPriceFromInput(sqrtPrice, liquidity, amountIn, true);
    expect(result.toFixed()).toBe("49.97501249375312343829");
  });

  test("should return correct next sqrt price when zeroForOne is false", () => {
    const sqrtPrice = new BigNumber("100000");
    const liquidity = new BigNumber("500000");
    const amountIn = new BigNumber("10000");
    const result = getNextSqrtPriceFromInput(sqrtPrice, liquidity, amountIn, false);
    expect(result.toFixed()).toBe("100000.02");
  });
});

describe("getNextSqrtPriceFromInput", () => {
  const sqrtPrice = BigNumber("1000000000000000000");
  const liquidity = BigNumber("500000000000000000000");
  const amountIn = BigNumber("1000000000000000000");

  test("Token0 to Token1 swap", () => {
    const result = getNextSqrtPriceFromInput(sqrtPrice, liquidity, amountIn, true);
    expect(result.toString()).toBe("499.99999999999975000001");
  });

  test("Token1 to Token0 swap", () => {
    const result = getNextSqrtPriceFromInput(sqrtPrice, liquidity, amountIn, false);
    expect(result.toString()).toBe("1000000000000000000.002");
  });

  test("Zero amountIn should not change sqrtPrice", () => {
    const result = getNextSqrtPriceFromInput(sqrtPrice, liquidity, BigNumber("0"), true);
    expect(result).toEqual(sqrtPrice);
  });

  test("Very large amountIn should return a valid price", () => {
    const largeAmountIn = BigNumber("1000000000000000000000000000");
    const result = getNextSqrtPriceFromInput(sqrtPrice, liquidity, largeAmountIn, true);
    expect(result).toBeInstanceOf(BigNumber);
  });

  test("Minimum valid values", () => {
    const minSqrtPrice = BigNumber("1");
    const minLiquidity = BigNumber("1");
    const minAmountIn = BigNumber("1");
    const result = getNextSqrtPriceFromInput(minSqrtPrice, minLiquidity, minAmountIn, true);
    expect(result).toBeInstanceOf(BigNumber);
  });

  test("Throws error if sqrtPrice is zero", () => {
    expect(() => getNextSqrtPriceFromInput(BigNumber("0"), liquidity, amountIn, true)).toThrow();
  });

  test("Throws error if sqrtPrice is negative", () => {
    expect(() => getNextSqrtPriceFromInput(BigNumber("-1000"), liquidity, amountIn, true)).toThrow();
  });
});

describe("getNextSqrtPriceFromOutput", () => {
  const sqrtPrice = BigNumber("1000000000000000000"); // 1e18
  const liquidity = BigNumber("500000000000000000000"); // 5e20
  const amountOut = BigNumber("1000000000000000000"); // 1e18

  test("Token0 to Token1 swap", () => {
    const result = getNextSqrtPriceFromOutput(sqrtPrice, liquidity, amountOut, true);
    expect(result.toString()).toBe("999999999999999999.998");
  });

  test("Token1 to Token0 swap", () => {
    const result = getNextSqrtPriceFromOutput(sqrtPrice, liquidity, amountOut, false);
    expect(result.toString()).toBe("-500.00000000000025000001");
  });

  test("Zero amountOut should not change sqrtPrice", () => {
    const result = getNextSqrtPriceFromOutput(sqrtPrice, liquidity, BigNumber("0"), true);
    expect(result).toEqual(sqrtPrice);
  });

  test("Very large amountOut should return a valid price", () => {
    const largeAmountOut = BigNumber("1000000000000000000000000000"); // Large value
    const result = getNextSqrtPriceFromOutput(sqrtPrice, liquidity, largeAmountOut, true);
    expect(result.toString()).toBe("999999999998000000");
  });

  test("Minimum valid values", () => {
    const minSqrtPrice = BigNumber("1");
    const minLiquidity = BigNumber("1");
    const minAmountOut = BigNumber("1");
    const result = getNextSqrtPriceFromOutput(minSqrtPrice, minLiquidity, minAmountOut, true);
    expect(result.toString()).toBe("0");
  });

  test("Throws error if sqrtPrice is zero", () => {
    expect(() => getNextSqrtPriceFromOutput(BigNumber("0"), liquidity, amountOut, true)).toThrow();
  });

  test("Throws error if liquidity is zero", () => {
    expect(() => getNextSqrtPriceFromOutput(sqrtPrice, BigNumber("0"), amountOut, true)).toThrow();
  });

  test("Throws error if sqrtPrice is negative", () => {
    expect(() => getNextSqrtPriceFromOutput(BigNumber("-1000"), liquidity, amountOut, true)).toThrow();
  });

  test("Throws error if liquidity is negative", () => {
    expect(() => getNextSqrtPriceFromOutput(sqrtPrice, BigNumber("-1000"), amountOut, true)).toThrow();
  });
});

describe("computeSwapStep", () => {
  const sqrtPriceCurrent = new BigNumber("1000000");
  const sqrtPriceTarget = new BigNumber("12000000");
  const liquidity = new BigNumber("5000000");
  const amountRemaining = new BigNumber("1000000");
  const fee = 3000;

  test("Standard swap: Token0 to Token1", () => {
    const result = computeSwapStep(sqrtPriceCurrent, sqrtPriceTarget, liquidity, amountRemaining, fee);
    expect(result).toHaveLength(4);
    expect(result[0].toString()).toBe("1000000.1994");
    expect(result[1].toString()).toBe("997000");
    expect(result[2].toString()).toBe("9.9699980119824e-7");
    expect(result[3].toString()).toBe("3000");
  });

  test("Standard swap: Token1 to Token0", () => {
    const result = computeSwapStep(sqrtPriceTarget, sqrtPriceCurrent, liquidity, amountRemaining, fee);
    expect(result).toHaveLength(4);
    expect(result[0].toString()).toBe("1000000");
    expect(result[1].toString()).toBe("4.58333333333333333334");
    expect(result[2].toString()).toBe("55000000000000");
    expect(result[3].toString()).toBe("0.01379137412236710131");
  });

  test("Zero amountRemaining should not affect sqrtPrice", () => {
    const zero = new BigNumber("0");
    const result = computeSwapStep(sqrtPriceCurrent, sqrtPriceTarget, liquidity, zero, fee);

    expect(result[0].toString()).toEqual(sqrtPriceCurrent.toString());
    expect(result[1].toString()).toEqual(zero.toString());
    expect(result[2].toString()).toEqual(zero.toString());
    expect(result[3].toString()).toEqual(zero.toString());
  });

  test("Negative amountRemaining (exactOutput case)", () => {
    const negativeAmountRemaining = new BigNumber("-1000000");
    const result = computeSwapStep(
      sqrtPriceCurrent,
      sqrtPriceTarget,
      liquidity,
      negativeAmountRemaining,
      fee
    );
    expect(result[0]).toBeInstanceOf(BigNumber);
    expect(result[0].toString()).toEqual("12000000");
    expect(result[1].toString()).toEqual("55000000000000");
    expect(result[2].toString()).toEqual("4.58333333333333333334");
    expect(result[3].toString()).toEqual("165496489468.40521564694082246741");
  });

  test("Large swap amount should return target sqrtPrice", () => {
    const largeAmountRemaining = new BigNumber("10000000");
    const result = computeSwapStep(sqrtPriceCurrent, sqrtPriceTarget, liquidity, largeAmountRemaining, fee);
    expect(result[0].toString()).toEqual("1000001.994");
    expect(result[1].toString()).toEqual("9970000");
    expect(result[2].toString()).toEqual("0.00000996998011985965");
    expect(result[3].toString()).toEqual("30000");
  });

  test("Minimum values should not throw error", () => {
    const result = computeSwapStep(
      new BigNumber("1"),
      new BigNumber("2"),
      new BigNumber("1"),
      new BigNumber("1"),
      fee
    );
    expect(result[0]).toBeInstanceOf(BigNumber);
    expect(result[0].toString()).toEqual("1.997");
    expect(result[1].toString()).toEqual("0.997");
    expect(result[2].toString()).toEqual("0.49924887330996494743");
    expect(result[3].toString()).toEqual("0.003");
  });

  test("Throws error if sqrtPriceCurrent is zero", () => {
    expect(() =>
      computeSwapStep(new BigNumber("0"), sqrtPriceTarget, liquidity, amountRemaining, fee)
    ).toThrow();
  });
  test("Throws error if sqrtPriceCurrent is negative", () => {
    expect(() =>
      computeSwapStep(new BigNumber("-1000"), sqrtPriceTarget, liquidity, amountRemaining, fee)
    ).toThrow();
  });
});

describe("tickToSqrtPrice", () => {
  test("tick 0 should return 1", () => {
    const result = tickToSqrtPrice(0);
    expect(result.toFixed()).toBe("1");
  });

  test("tick 10 should return correct sqrt price", () => {
    const result = tickToSqrtPrice(10);
    expect(result.toFixed(10)).toBe(new BigNumber(1.0001 ** (10 / 2)).toFixed(10));
  });

  test("tick -10 should return correct sqrt price", () => {
    const result = tickToSqrtPrice(-10);
    expect(result.toFixed(10)).toBe(new BigNumber(1.0001 ** (-10 / 2)).toFixed(10));
  });

  test("Large tick should return correct sqrt price", () => {
    const result = tickToSqrtPrice(10000);
    expect(result.toFixed(10)).toBe(new BigNumber(1.0001 ** (10000 / 2)).toFixed(10));
  });
});

describe("sqrtPriceToTick", () => {
  test("sqrtPrice 1 should return tick 0", () => {
    const result = sqrtPriceToTick(new BigNumber(1));
    expect(result).toBe(0);
  });

  test("sqrtPrice for tick 10 should return 10", () => {
    const sqrtPrice = tickToSqrtPrice(10);
    const result = sqrtPriceToTick(sqrtPrice);
    expect(result).toBe(10);
  });

  test("sqrtPrice for tick -10 should return -10", () => {
    const sqrtPrice = tickToSqrtPrice(-10);
    const result = sqrtPriceToTick(sqrtPrice);
    expect(result).toBe(-10);
  });

  test("sqrtPrice for large tick should return correct tick", () => {
    const sqrtPrice = tickToSqrtPrice(10000);
    const result = sqrtPriceToTick(sqrtPrice);
    expect(result).toBe(10000);
  });
});

describe("updateTick function", () => {
  let tickData: TickDataObj;
  let tick: number;
  let tickCurrent: number;
  let liquidityDelta: BigNumber;
  let upper: boolean;
  let feeGrowthGlobal0: BigNumber;
  let feeGrowthGlobal1: BigNumber;
  let maxLiquidity: BigNumber;

  beforeEach(() => {
    tickData = {};
    tick = 100;
    tickCurrent = 50;
    liquidityDelta = new BigNumber(1000);
    upper = true;
    feeGrowthGlobal0 = new BigNumber(500);
    feeGrowthGlobal1 = new BigNumber(600);
    maxLiquidity = new BigNumber(10000);
  });

  test("should initialize tickData if not present", () => {
    expect(tickData[tick]).toBeUndefined();
    const result = updateTick(
      tickData,
      tick,
      tickCurrent,
      liquidityDelta,
      upper,
      feeGrowthGlobal0,
      feeGrowthGlobal1,
      maxLiquidity
    );
    expect(tickData[tick]).toBeDefined();
    expect(tickData[tick].initialised).toBe(true);
    expect(result).toBe(true);
  });

  test("should update liquidityGross correctly", () => {
    updateTick(
      tickData,
      tick,
      tickCurrent,
      liquidityDelta,
      upper,
      feeGrowthGlobal0,
      feeGrowthGlobal1,
      maxLiquidity
    );
    expect(new BigNumber(tickData[tick].liquidityGross).toString()).toBe("1000");
  });

  test("should update liquidityNet correctly for upper=true", () => {
    updateTick(
      tickData,
      tick,
      tickCurrent,
      liquidityDelta,
      upper,
      feeGrowthGlobal0,
      feeGrowthGlobal1,
      maxLiquidity
    );
    expect(new BigNumber(tickData[tick].liquidityNet).toString()).toBe("-1000");
  });

  test("should update liquidityNet correctly for upper=false", () => {
    upper = false;
    updateTick(
      tickData,
      tick,
      tickCurrent,
      liquidityDelta,
      upper,
      feeGrowthGlobal0,
      feeGrowthGlobal1,
      maxLiquidity
    );
    expect(new BigNumber(tickData[tick].liquidityNet).toString()).toBe("1000");
  });

  test("should throw error if liquidity exceeds maxLiquidity", () => {
    liquidityDelta = new BigNumber(20000);
    expect(() =>
      updateTick(
        tickData,
        tick,
        tickCurrent,
        liquidityDelta,
        upper,
        feeGrowthGlobal0,
        feeGrowthGlobal1,
        maxLiquidity
      )
    ).toThrow("liquidity crossed max liquidity");
  });

  test("should set feeGrowthOutside if tick is initialized for the first time and tick <= tickCurrent", () => {
    updateTick(
      tickData,
      tick,
      tickCurrent,
      liquidityDelta,
      upper,
      feeGrowthGlobal0,
      feeGrowthGlobal1,
      maxLiquidity
    );
    expect(new BigNumber(tickData[tick].feeGrowthOutside0).toString()).toBe("0");
    expect(new BigNumber(tickData[tick].feeGrowthOutside1).toString()).toBe("0");
  });

  test("should correctly determine if tick flipped", () => {
    const flipped = updateTick(
      tickData,
      tick,
      tickCurrent,
      liquidityDelta,
      upper,
      feeGrowthGlobal0,
      feeGrowthGlobal1,
      maxLiquidity
    );
    expect(flipped).toBe(true);
  });

  test("should not flip tick if liquidityGross remains nonzero", () => {
    updateTick(
      tickData,
      tick,
      tickCurrent,
      liquidityDelta,
      upper,
      feeGrowthGlobal0,
      feeGrowthGlobal1,
      maxLiquidity
    );
    const flipped = updateTick(
      tickData,
      tick,
      tickCurrent,
      liquidityDelta,
      upper,
      feeGrowthGlobal0,
      feeGrowthGlobal1,
      maxLiquidity
    );
    expect(flipped).toBe(false);
  });
});

describe("flipTick function", () => {
  let bitmap: Bitmap;

  beforeEach(() => {
    bitmap = {};
  });

  test("should flip a tick when tick is spaced correctly", () => {
    flipTick(bitmap, 256, 1);
    const word = 256 >> 8;
    const pos = 256 % 256;
    const mask = BigInt(1) << BigInt(pos);
    expect(BigInt(bitmap[word])).toBe(mask);
  });

  test("should flip the tick back when called twice", () => {
    flipTick(bitmap, 256, 1);
    flipTick(bitmap, 256, 1);
    const word = 256 >> 8;
    expect(BigInt(bitmap[word])).toBe(BigInt(0));
  });

  test("should throw an error if tick is not spaced correctly", () => {
    expect(() => flipTick(bitmap, 257, 10)).toThrow("Tick is not spaced 257 10");
  });

  test("should initialize word in bitmap if undefined", () => {
    expect(!!bitmap[1]).toBe(false);
    flipTick(bitmap, 256, 1);
    expect(!!bitmap[1]).toBe(true);
  });

  test("should flip multiple ticks correctly", () => {
    flipTick(bitmap, 256, 1);
    flipTick(bitmap, 512, 1);
    const word1 = 256 >> 8;
    const word2 = 512 >> 8;
    const pos1 = 256 % 256;
    const pos2 = 512 % 256;
    const mask1 = BigInt(1) << BigInt(pos1);
    const mask2 = BigInt(1) << BigInt(pos2);
    expect(BigInt(bitmap[word1])).toBe(mask1);
    expect(BigInt(bitmap[word2])).toBe(mask2);
  });
});

describe("nextInitialisedTickWithInSameWord", () => {
  test("should return the nearest initialized tick when lte=true", () => {
    const bitmap: Bitmap = {};
    bitmap[0] = BigInt("0b1010").toString(); // 10

    expect(nextInitialisedTickWithInSameWord(bitmap, 2, 1, true, new BigNumber(0))).toEqual([1, true]);
    expect(nextInitialisedTickWithInSameWord(bitmap, 4, 1, true, new BigNumber(0))).toEqual([3, true]);
    expect(nextInitialisedTickWithInSameWord(bitmap, 0, 1, true, new BigNumber(0))).toEqual([0, false]);
  });

  test("should return the nearest initialized tick when lte=false", () => {
    const bitmap: Bitmap = {};
    bitmap[0] = BigInt("0b1010").toString(); // 10

    expect(nextInitialisedTickWithInSameWord(bitmap, 1, 1, false, new BigNumber(0))).toEqual([3, true]);
    expect(nextInitialisedTickWithInSameWord(bitmap, 2, 1, false, new BigNumber(0))).toEqual([3, true]);
    expect(nextInitialisedTickWithInSameWord(bitmap, 3, 1, false, new BigNumber(0))).toEqual([255, false]);
  });

  test("should handle negative ticks", () => {
    const bitmap: Bitmap = {};
    bitmap[-1] = BigInt("0b1000").toString(); // 8

    expect(nextInitialisedTickWithInSameWord(bitmap, -3, 1, true, new BigNumber(0))).toEqual([-253, true]);
    expect(nextInitialisedTickWithInSameWord(bitmap, -5, 1, true, new BigNumber(0))).toEqual([-253, true]);
  });

  test("should handle empty bitmaps", () => {
    const bitmap: Bitmap = {};

    expect(nextInitialisedTickWithInSameWord(bitmap, 10, 1, true, new BigNumber(0))).toEqual([0, false]);
    expect(nextInitialisedTickWithInSameWord(bitmap, 10, 1, false, new BigNumber(0))).toEqual([255, false]);
  });

  test("should handle large tick spacings", () => {
    const bitmap: Bitmap = {};
    bitmap[0] = BigInt("0b100").toString();

    expect(nextInitialisedTickWithInSameWord(bitmap, 512, 256, true, new BigNumber(0))).toEqual([512, true]);
    expect(nextInitialisedTickWithInSameWord(bitmap, 256, 256, false, new BigNumber(0))).toEqual([512, true]);
  });
});

describe("tickCross function", () => {
  test("Initializes tick data if it does not exist", () => {
    const tick = 100;
    const tickData: TickDataObj = {};
    const feeGrowthGlobal0 = new BigNumber(50);
    const feeGrowthGlobal1 = new BigNumber(100);

    const result = tickCross(tick, tickData, feeGrowthGlobal0, feeGrowthGlobal1);

    expect(!!tickData[tick]).toBe(true);
    expect(tickData[tick]).toMatchObject({
      liquidityGross: "0",
      initialised: false,
      liquidityNet: "0",
      feeGrowthOutside0: "50",
      feeGrowthOutside1: "100"
    });
    expect(result.isEqualTo(new BigNumber(0))).toBe(true);
  });

  test("Updates feeGrowthOutside values correctly for existing tick", () => {
    const tick = 120;
    const tickData = {
      [tick]: {
        liquidityGross: "500",
        initialised: true,
        liquidityNet: "200",
        feeGrowthOutside0: "20",
        feeGrowthOutside1: "40"
      }
    };
    const feeGrowthGlobal0 = new BigNumber(70);
    const feeGrowthGlobal1 = new BigNumber(150);

    const result = tickCross(tick, tickData, feeGrowthGlobal0, feeGrowthGlobal1);

    expect(tickData[tick]).toMatchObject({
      liquidityGross: "500",
      initialised: true,
      liquidityNet: "200",
      feeGrowthOutside0: "50",
      feeGrowthOutside1: "110"
    });
    expect(result.isEqualTo(new BigNumber(200))).toBe(true);
  });

  test("Handles zero liquidityNet properly", () => {
    const tick = 200;
    const tickData = {
      [tick]: {
        liquidityGross: "0",
        initialised: true,
        liquidityNet: "0",
        feeGrowthOutside0: "30",
        feeGrowthOutside1: "60"
      }
    };
    const feeGrowthGlobal0 = new BigNumber(100);
    const feeGrowthGlobal1 = new BigNumber(200);

    const result = tickCross(tick, tickData, feeGrowthGlobal0, feeGrowthGlobal1);

    expect(tickData[tick]).toMatchObject({
      liquidityGross: "0",
      initialised: true,
      liquidityNet: "0",
      feeGrowthOutside0: "70",
      feeGrowthOutside1: "140"
    });
    expect(result.isEqualTo(new BigNumber(0))).toBe(true);
  });

  test("Handles negative fee growth values", () => {
    const tick = 300;
    const tickData = {
      [tick]: {
        liquidityGross: "1000",
        initialised: true,
        liquidityNet: "-500",
        feeGrowthOutside0: "20",
        feeGrowthOutside1: "-40"
      }
    };
    const feeGrowthGlobal0 = new BigNumber(-10);
    const feeGrowthGlobal1 = new BigNumber(20);

    const result = tickCross(tick, tickData, feeGrowthGlobal0, feeGrowthGlobal1);

    expect(tickData[tick]).toMatchObject({
      liquidityGross: "1000",
      initialised: true,
      liquidityNet: "-500",
      feeGrowthOutside0: "-30",
      feeGrowthOutside1: "60"
    });
    expect(result.isEqualTo(new BigNumber(-500))).toBe(true);
  });

  test("Handles large fee growth values", () => {
    const tick = 400;
    const tickData = {
      [tick]: {
        liquidityGross: "1000000",
        initialised: true,
        liquidityNet: "500000",
        feeGrowthOutside0: "100000",
        feeGrowthOutside1: "200000"
      }
    };
    const feeGrowthGlobal0 = new BigNumber("9999999");
    const feeGrowthGlobal1 = new BigNumber("8888888");

    const result = tickCross(tick, tickData, feeGrowthGlobal0, feeGrowthGlobal1);

    expect(tickData[tick]).toMatchObject({
      liquidityGross: "1000000",
      initialised: true,
      liquidityNet: "500000",
      feeGrowthOutside0: "9899999",
      feeGrowthOutside1: "8688888"
    });
    expect(result.isEqualTo(new BigNumber(500000))).toBe(true);
  });
});

describe("getFeeGrowthInside", () => {
  let tickData: TickDataObj;
  beforeEach(() => {
    tickData = {
      "10": {
        feeGrowthOutside0: "100",
        feeGrowthOutside1: "200",
        liquidityGross: "0",
        initialised: true,
        liquidityNet: "0"
      },
      "20": {
        feeGrowthOutside0: "300",
        feeGrowthOutside1: "400",
        liquidityGross: "0",
        initialised: true,
        liquidityNet: "0"
      }
    };
  });

  test("calculates fee growth inside when tickCurrent is within range", () => {
    const result = getFeeGrowthInside(tickData, 10, 20, 15, new BigNumber(500), new BigNumber(600));
    expect(result[0].toString()).toBe("100");
    expect(result[1].toString()).toBe("0");
  });

  test("calculates fee growth inside when tickCurrent is at tickLower", () => {
    const result = getFeeGrowthInside(tickData, 10, 20, 10, new BigNumber(500), new BigNumber(600));
    expect(result[0].toString()).toBe("100");
    expect(result[1].toString()).toBe("0");
  });

  test("calculates fee growth inside when tickCurrent is at tickUpper", () => {
    const result = getFeeGrowthInside(tickData, 10, 20, 20, new BigNumber(500), new BigNumber(600));
    expect(result[0].toString()).toBe("200");
    expect(result[1].toString()).toBe("200");
  });
});

describe("checkTicks", () => {
  test("throws error when tickLower is greater than or equal to tickUpper", () => {
    expect(() => checkTicks(10, 10)).toThrow("Lower Tick is greater than Upper Tick");
    expect(() => checkTicks(20, 10)).toThrow("Lower Tick is greater than Upper Tick");
  });

  test("throws error when tickLower is out of range", () => {
    expect(() => checkTicks(-887273, 10)).toThrow("Lower Tick is less than Min Tick");
  });

  test("throws error when tickUpper is out of range", () => {
    expect(() => checkTicks(10, 887273)).toThrow("Upper Tick is greater than Max Tick");
  });

  test("does not throw error for valid tick range", () => {
    expect(() => checkTicks(-887272, 887272)).not.toThrow();
  });
});

describe("tickSpacingToMaxLiquidityPerTick", () => {
  it("should correctly calculate max liquidity per tick for tickSpacing = 10", () => {
    const tickSpacing = 10;
    const result = tickSpacingToMaxLiquidityPerTick(tickSpacing);

    const minTick = Math.ceil((-887272 / tickSpacing) * tickSpacing);
    const maxTick = Math.floor((887272 / tickSpacing) * tickSpacing);
    const numTicks = (maxTick - minTick) / tickSpacing + 1;
    const expected = new BigNumber(2).pow(128).minus(1).dividedBy(numTicks);

    expect(result.toFixed()).toBe(expected.toFixed());
  });

  it("should handle minimum tickSpacing = 1", () => {
    const tickSpacing = 1;
    const result = tickSpacingToMaxLiquidityPerTick(tickSpacing);

    const minTick = Math.ceil((-887272 / tickSpacing) * tickSpacing);
    const maxTick = Math.floor((887272 / tickSpacing) * tickSpacing);
    const numTicks = (maxTick - minTick) / tickSpacing + 1;
    const expected = new BigNumber(2).pow(128).minus(1).dividedBy(numTicks);

    expect(result.toFixed()).toBe(expected.toFixed());
  });

  it("should handle maximum tickSpacing = 887272", () => {
    const tickSpacing = 887272;
    const result = tickSpacingToMaxLiquidityPerTick(tickSpacing);

    const minTick = Math.ceil((-887272 / tickSpacing) * tickSpacing);
    const maxTick = Math.floor((887272 / tickSpacing) * tickSpacing);
    const numTicks = (maxTick - minTick) / tickSpacing + 1;
    const expected = new BigNumber(2).pow(128).minus(1).dividedBy(numTicks);

    expect(result.toFixed()).toBe(expected.toFixed());
  });

  it("should handle large tickSpacing = 100000", () => {
    const tickSpacing = 100000;
    const result = tickSpacingToMaxLiquidityPerTick(tickSpacing);
    const minTick = Math.ceil((-887272 / tickSpacing) * tickSpacing);
    const maxTick = Math.floor((887272 / tickSpacing) * tickSpacing);
    const numTicks = (maxTick - minTick) / tickSpacing + 1;
    const expected = new BigNumber(2).pow(128).minus(1).dividedBy(numTicks);

    expect(result.toFixed()).toBe(expected.toFixed());
  });
});

describe("spaceTick", () => {
  it("should round down to the nearest tick spacing", () => {
    expect(spaceTick(105, 10)).toBe(100);
  });

  it("should return the same tick if it's an exact multiple of tickSpacing", () => {
    expect(spaceTick(100, 10)).toBe(100);
    expect(spaceTick(200, 50)).toBe(200);
  });

  it("should correctly space negative ticks", () => {
    expect(spaceTick(-95, 10)).toBe(-100);
    expect(spaceTick(-101, 10)).toBe(-110);
  });

  it("should handle large tick values", () => {
    expect(spaceTick(987654321, 1000)).toBe(987654000);
  });

  it("should return 0 when tick is 0", () => {
    expect(spaceTick(0, 10)).toBe(0);
  });

  it("should throw an error when tickSpacing is 0", () => {
    expect(() => spaceTick(100, 0)).toThrow();
  });
});

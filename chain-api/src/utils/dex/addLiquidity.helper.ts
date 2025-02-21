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

import { getAmount0Delta, getAmount1Delta } from "./sqrtPriceMath.helper";

/**
 *
 * we know dx = d ( 1 / sqrt(p)) * L
 * on rearranging
 * dx = ( 1 / sqrt(pa) - 1/sqrt(pb)) * L
 * dx =  ( (sqrt(pb) - sqrt(pa))/ (sqrt(pb) * sqrt(pa))) * L
 * dx * (sqrt(pb) * sqrt(pa)) / (sqrt(pb) - sqrt(pa)) =  L
 * since we adding liquidity within the price range then it will be
 * pa will become pc (current price)
 * dx * (sqrt(pb) * sqrt(pc)) / (sqrt(pb) - sqrt(pc)) =  L
 *
 * @param amount
 * @param sqrtPriceA
 * @param sqrtPriceB
 * @returns
 */

export function liquidity0(amount: BigNumber, sqrtPriceA: BigNumber, sqrtPriceB: BigNumber): BigNumber {
  if (sqrtPriceA.gt(sqrtPriceB)) {
    const temp = sqrtPriceB;
    sqrtPriceB = sqrtPriceA;
    sqrtPriceA = temp;
  }
  return amount.multipliedBy(sqrtPriceA.multipliedBy(sqrtPriceB)).dividedBy(sqrtPriceB.minus(sqrtPriceA));
}

/**
 * @dev
 * We know that dy = (sqrt(pb) - sqrt(pa)) * L
 * dy / (sqrt(pb) - sqrt(pa)) = L
 * @param amount
 * @param sqrtPriceA
 * @param sqrtPriceB
 * @returns
 */
export function liquidity1(amount: BigNumber, sqrtPriceA: BigNumber, sqrtPriceB: BigNumber): BigNumber {
  if (sqrtPriceA.gt(sqrtPriceB)) {
    const temp = sqrtPriceB;
    sqrtPriceB = sqrtPriceA;
    sqrtPriceA = temp;
  }
  return amount.dividedBy(sqrtPriceB.minus(sqrtPriceA));
}

export function getAmountsForLiquidity(
  sqrtRatio: BigNumber,
  sqrtRatioA: BigNumber,
  sqrtRatioB: BigNumber,
  liquidity: BigNumber
) {
  [sqrtRatioA, sqrtRatioB] = sqrtRatioA.gt(sqrtRatioB) ? [sqrtRatioB, sqrtRatioA] : [sqrtRatioA, sqrtRatioB];

  let amount0 = new BigNumber(0),
    amount1 = new BigNumber(0);

  if (sqrtRatio.lte(sqrtRatioA)) {
    amount0 = getAmount0Delta(sqrtRatioA, sqrtRatioB, liquidity);
  } else if (sqrtRatio.lt(sqrtRatioB)) {
    amount0 = getAmount0Delta(sqrtRatio, sqrtRatioB, liquidity);
    amount1 = getAmount1Delta(sqrtRatioA, sqrtRatio, liquidity);
  } else {
    amount1 = getAmount1Delta(sqrtRatioA, sqrtRatioB, liquidity);
  }

  return [amount0, amount1];
}

export function getLiquidityForAmounts(
  sqrtRatio: BigNumber,
  sqrtRatioA: BigNumber,
  sqrtRatioB: BigNumber,
  amount0: BigNumber,
  amount1: BigNumber
) {
  [sqrtRatioA, sqrtRatioB] = sqrtRatioA.gt(sqrtRatioB) ? [sqrtRatioB, sqrtRatioA] : [sqrtRatioA, sqrtRatioB];
  let liquidity: BigNumber = new BigNumber(0),
    Liquidity0: BigNumber,
    Liquidity1: BigNumber;
  if (sqrtRatio.lte(sqrtRatioA)) {
    liquidity = liquidity0(amount0, sqrtRatioA, sqrtRatioB);
  } else if (sqrtRatio.lt(sqrtRatioB)) {
    Liquidity0 = liquidity0(amount0, sqrtRatio, sqrtRatioB);
    Liquidity1 = liquidity1(amount1, sqrtRatioA, sqrtRatio);
    liquidity = Liquidity0.lt(Liquidity1) ? Liquidity0 : Liquidity1;
  } else {
    liquidity = liquidity1(amount1, sqrtRatioA, sqrtRatioB);
  }
  return liquidity;
}

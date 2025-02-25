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

export type SwapState = {
  // the amount remaining to be swapped in/out of the input/output asset
  amountSpecifiedRemaining: BigNumber;

  // the amount already swapped out/in of the output/input asset
  amountCalculated: BigNumber;

  // current sqrt(price)
  sqrtPrice: BigNumber;

  // the tick associated with the current price
  tick: number;

  // the current liquidity in range
  liquidity: BigNumber;

  // tracking fee
  feeGrowthGlobalX: BigNumber;

  // tracking protocol fee
  protocolFee: BigNumber;
};

export type StepComputations = {
  // the price at the beginning of the step
  sqrtPriceStart: BigNumber;

  // the next tick to swap to from the current tick in the swap direction
  tickNext: number;

  // whether tickNext is initialized or not
  initialised: boolean;

  // sqrt(price) for the next tick (1/0)
  sqrtPriceNext: BigNumber;

  // how much is being swapped in in this step
  amountIn: BigNumber;

  // how much is being swapped out
  amountOut: BigNumber;

  // fee during swap step
  feeAmount: BigNumber;
};

type UserPositionProps = {
  tickLower: number;
  tickUpper: number;
  liquidity: string;
};

export type PositionInPool = {
  [key: string]: UserPositionProps[];
};

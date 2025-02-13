import BigNumber from "bignumber.js";

export type TickData = {
  liquidityGross: string;
  initialised: boolean;
  liquidityNet: string;
  feeGrowthOutside0: string;
  feeGrowthOutside1: string;
};

export type PositionData = {
  owner: string;

  // amount of liquidity owned by this position
  liquidity: string;

  // fee growth per unit of liquidity as of the last update to the liquidity or fees owed
  feeGrowthInside0Last: string;
  feeGrowthInside1Last: string;

  // fees owed to the position owner in token0/token1
  tokensOwed0: string;
  tokensOwed1: string;
};

export type TokenInstanceKeyData = {
  collection: string;
  category: string;
  type: string;
  additionalKey: string;
};

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

type PositionInPool = {
  [key: string]: UserPositionProps[];
};

interface IPosition {
  tickLower: number;
  tickUpper: number;
  liquidity: string;
}

export interface PositionsObject {
  [key: string]: IPosition[];
}

export interface GetUserPositionResponse {
  positions: PositionsObject;
  totalCount: number;
}

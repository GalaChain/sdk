import { DefaultError } from "@gala-chain/api";
import BigNumber from "bignumber.js";

/// @notice Gets the amount0 delta between two prices
/// @dev Calculates liquidity / sqrt(lower) - liquidity / sqrt(upper),
/// i.e. liquidity * (sqrt(upper) - sqrt(lower)) / (sqrt(upper) * sqrt(lower))
/// @param sqrtRatioA A sqrt price
/// @param sqrtRatioB Another sqrt price
/// @param liquidity The amount of usable liquidity
/// @return Amount of token0 required to cover a position of size liquidity between the two passed prices
export function getAmount0Delta(
  sqrtPriceA: BigNumber,
  sqrtPriceB: BigNumber,
  liquidity: BigNumber
): BigNumber {
  let [lowerPrice, higherPrice] = sqrtPriceA.isLessThan(sqrtPriceB)
    ? [sqrtPriceA, sqrtPriceB]
    : [sqrtPriceB, sqrtPriceA];

  return liquidity.multipliedBy(higherPrice.minus(lowerPrice)).div(higherPrice.multipliedBy(lowerPrice));
}

/// @notice Gets the amount1 delta between two prices
/// @dev Calculates liquidity * (sqrt(upper) - sqrt(lower))
/// @param sqrtRatioA A sqrt price
/// @param sqrtRatioB Another sqrt price
/// @param liquidity The amount of usable liquidity
/// @return Amount of token1 required to cover a position of size liquidity between the two passed prices
export function getAmount1Delta(
  sqrtPriceLower: BigNumber,
  sqrtPriceUpper: BigNumber,
  liquidityDelta: BigNumber
): BigNumber {
  let [lowerPrice, higherPrice] = sqrtPriceLower.isLessThan(sqrtPriceUpper)
    ? [sqrtPriceLower, sqrtPriceUpper]
    : [sqrtPriceUpper, sqrtPriceLower];

  return liquidityDelta.times(higherPrice.minus(lowerPrice));
}

/// @notice Gets the next sqrt price given an input amount of token0 or token1
/// @dev Throws if price or liquidity are 0, or if the next price is out of bounds
/// @param sqrtPrice The starting price, i.e., before accounting for the input amount
/// @param liquidity The amount of usable liquidity
/// @param amountIn How much of token0, or token1, is being swapped in
/// @param zeroForOne Whether the amount in is token0 or token1
/// @return The price after adding the input amount to token0 or token1
export function getNextSqrtPriceFromInput(
  sqrtPrice: BigNumber,
  liquidity: BigNumber,
  amountIn: BigNumber,
  zeroForOne: boolean
): BigNumber {
  if (sqrtPrice.isLessThanOrEqualTo(0)) throw new DefaultError("Invalid Price");
  if (liquidity.isLessThanOrEqualTo(0)) throw new DefaultError("Invalid liquidity");

  return (zeroForOne
    ? getNextSqrtPriceFromAmount0(sqrtPrice, liquidity, amountIn, true)
    : getNextSqrtPriceFromAmount1(sqrtPrice, liquidity, amountIn, true));
}

/// @notice Gets the next sqrt price given an output amount of token0 or token1
/// @dev Throws if price or liquidity are 0 or the next price is out of bounds
/// @param sqrtPrice The starting price before accounting for the output amount
/// @param liquidity The amount of usable liquidity
/// @param amountOut How much of token0, or token1, is being swapped out
/// @param zeroForOne Whether the amount out is token0 or token1
/// @return The price after removing the output amount of token0 or token1
export function getNextSqrtPriceFromOutput(
  sqrtPrice: BigNumber,
  liquidity: BigNumber,
  amountOut: BigNumber,
  zeroForOne: boolean
): BigNumber {
  if (sqrtPrice.isLessThanOrEqualTo(0)) throw new DefaultError("Invalid Price");
  if (liquidity.isLessThanOrEqualTo(0)) throw new DefaultError("Invalid liquidity");

  return (zeroForOne
    ? getNextSqrtPriceFromAmount1(sqrtPrice, liquidity, amountOut, false)
    : getNextSqrtPriceFromAmount0(sqrtPrice, liquidity, amountOut, false));
}

/// @notice Gets the next sqrt price given a delta of token0
/// @dev The most precise formula for this is liquidity * sqrtPrice / (liquidity +- amount * sqrtPrice)
/// @param sqrtPrice The starting price, i.e. before accounting for the token0 delta
/// @param liquidity The amount of usable liquidity
/// @param amount How much of token0 to add or remove from virtual reserves
/// @param add Whether to add or remove the amount of token0
/// @return The price after adding or removing amount, depending on add
export function getNextSqrtPriceFromAmount0(
  sqrtPrice: BigNumber,
  liquidity: BigNumber,
  amount: BigNumber,
  add: boolean
): BigNumber {
  return (add
    ? liquidity.times(sqrtPrice).div(liquidity.plus(sqrtPrice.times(amount)))
    : liquidity.times(sqrtPrice).div(liquidity.minus(sqrtPrice.times(amount))))
}

/// @notice Gets the next sqrt price given a delta of token1
/// @dev Calculates sqrtPrice +- amount / liquidity
/// @param sqrtPrice The starting price, i.e., before accounting for the token1 delta
/// @param liquidity The amount of usable liquidity
/// @param amount How much of token1 to add, or remove, from virtual reserves
/// @param add Whether to add, or remove, the amount of token1
/// @return The price after adding or removing `amount`
export function getNextSqrtPriceFromAmount1(
  sqrtPrice: BigNumber,
  liquidity: BigNumber,
  amount: BigNumber,
  add: boolean
): BigNumber {
  return (add ? amount.div(liquidity).plus(sqrtPrice) : sqrtPrice.minus(amount.div(liquidity)));
}

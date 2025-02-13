import BigNumber from "bignumber.js";
import {
  getAmount0Delta,
  getAmount1Delta,
  getNextSqrtPriceFromInput,
  getNextSqrtPriceFromOutput
} from "./sqrtPriceMath.helper";

const FEE_PIPS = 1000000;

/// @notice Computes the result of swapping some amount in, or amount out, given the parameters of the swap
/// @dev The fee, plus the amount in, will never exceed the amount remaining if the swap's `amountSpecified` is positive
/// @param sqrtRatioCurrent The current sqrt price of the pool
/// @param sqrtRatioTarget The price that cannot be exceeded, from which the direction of the swap is inferred
/// @param liquidity The usable liquidity
/// @param amountRemaining How much input or output amount is remaining to be swapped in/out
/// @param fee The fee taken from the input amount
/// @return sqrtRatioNext The price after swapping the amount in/out, not to exceed the price target
/// @return amountIn The amount to be swapped in, of either token0 or token1, based on the direction of the swap
/// @return amountOut The amount to be received, of either token0 or token1, based on the direction of the swap
/// @return feeAmount The amount of input that will be taken as a fee
export function computeSwapStep(
  sqrtPriceCurrent: BigNumber,
  sqrtPriceTarget: BigNumber,
  liquidity: BigNumber,
  amountRemaining: BigNumber,
  fee: number
): BigNumber[] {
  //returns
  let amountIn = new BigNumber(0),
    amountOut = new BigNumber(0),
    sqrtPriceNext: BigNumber,
    feeAmount: BigNumber;

  //define direction
  let zeroForOne = sqrtPriceCurrent.isGreaterThanOrEqualTo(sqrtPriceTarget);
  let exactInput = amountRemaining.isGreaterThanOrEqualTo(0);

  if (exactInput) {
    let amountRemainingLessFee = amountRemaining.times(FEE_PIPS - fee).dividedBy(FEE_PIPS);

    amountIn = zeroForOne
      ? getAmount0Delta(sqrtPriceTarget, sqrtPriceCurrent, liquidity)
      : getAmount1Delta(sqrtPriceCurrent, sqrtPriceTarget, liquidity);

    if (amountRemainingLessFee.isGreaterThanOrEqualTo(amountIn)) sqrtPriceNext = sqrtPriceTarget;
    else
      sqrtPriceNext = getNextSqrtPriceFromInput(
        sqrtPriceCurrent,
        liquidity,
        amountRemainingLessFee,
        zeroForOne
      );
  } else {
    amountOut = zeroForOne
      ? getAmount1Delta(sqrtPriceTarget, sqrtPriceCurrent, liquidity)
      : getAmount0Delta(sqrtPriceCurrent, sqrtPriceTarget, liquidity);

    if (amountRemaining.multipliedBy(-1).isGreaterThanOrEqualTo(amountOut)) sqrtPriceNext = sqrtPriceTarget;
    else
      sqrtPriceNext = getNextSqrtPriceFromOutput(
        sqrtPriceCurrent,
        liquidity,
        amountRemaining.multipliedBy(-1),
        zeroForOne
      );
  }

  let max = sqrtPriceTarget.isEqualTo(sqrtPriceNext);

  //get amountIn and amountOut
  if (zeroForOne) {
    amountIn = max && exactInput ? amountIn : getAmount0Delta(sqrtPriceNext, sqrtPriceCurrent, liquidity);

    amountOut = max && !exactInput ? amountOut : getAmount1Delta(sqrtPriceCurrent, sqrtPriceNext, liquidity);
  } else {
    amountIn = max && exactInput ? amountIn : getAmount1Delta(sqrtPriceNext, sqrtPriceCurrent, liquidity);

    amountOut = max && !exactInput ? amountOut : getAmount0Delta(sqrtPriceCurrent, sqrtPriceNext, liquidity);
  }

  // cap the output amount to not exceed the remaining output amount
  if (!exactInput && amountOut.isGreaterThan(amountRemaining.multipliedBy(-1))) {
    amountOut = amountRemaining.multipliedBy(-1);
  }

  if (exactInput && !sqrtPriceNext.isEqualTo(sqrtPriceTarget)) {
    // we didn't reach the target, so take the remainder of the maximum input as fee
    feeAmount = amountRemaining.minus(amountIn);
  } else feeAmount = amountIn.times(fee).dividedBy(FEE_PIPS - fee);

  return [sqrtPriceNext, amountIn, amountOut, feeAmount];
}

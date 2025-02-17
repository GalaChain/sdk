import { BigNumber } from "bignumber.js";
import Decimal from "decimal.js";

import { getBondingConstants } from "../utils";
import { BASE_PRICE, PreMintCalculationDto } from "@gala-chain/api";

BigNumber.config({
  ROUNDING_MODE: BigNumber.ROUND_UP
});

/**
 * Calculates the number of tokens that can be purchased using a specified amount
 * of native tokens based on a bonding curve mechanism.
 *
 * This function applies the bonding curve formula for a brand new sale with zero tokens sold
 * to determine the number of tokens the user can buy with the provided native token amount.
 *
 * @param ctx - The context object providing access to the GalaChain environment.
 * @param buyTokenDTO - The Amount of native tokens to spend for the purchase.
 *
 * @returns A promise that resolves to a string representing the calculated amount of
 *          tokens to be received, rounded down to 18 decimal places.
 *
 * @throws Error if the calculation results in an invalid state.
 */
export async function calculatePreMintTokens(buyTokenDTO: PreMintCalculationDto): Promise<string> {
  const totalTokensSold = new Decimal(0); // current tokens sold / x
  const nativeTokens = new Decimal(buyTokenDTO.nativeTokenAmount.toString()); // native tokens used to buy / y
  const basePrice = new Decimal(BASE_PRICE); // base price / a
  const { exponentFactor, euler, decimals } = getBondingConstants();

  const constant = nativeTokens.mul(exponentFactor).div(basePrice);

  const exponent1 = exponentFactor.mul(totalTokensSold).div(decimals);

  const eResult1 = euler.pow(exponent1);

  const ethScaled = constant.add(eResult1);

  const lnEthScaled = ethScaled.ln().mul(decimals);

  const lnEthScaledBase = lnEthScaled.div(exponentFactor);

  const result = lnEthScaledBase.minus(totalTokensSold);
  const roundedResult = result.toDecimalPlaces(18, Decimal.ROUND_DOWN);

  return roundedResult.toString();
}

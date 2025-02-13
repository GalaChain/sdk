import { DefaultError } from "@gala-chain/api";
import { GalaChainContext } from "@gala-chain/chaincode";
import { BigNumber } from "bignumber.js";
import Decimal from "decimal.js";

import { exactTokenAmountDto } from "./dtos";
import { fetchAndValidateSale, getBondingConstants } from "./helper/launchpadHelperFunctions";

BigNumber.config({
  ROUNDING_MODE: BigNumber.ROUND_UP
});

/**
 * Calculates the amount of native tokens a user would receive when selling
 * a specified amount of tokens based on a bonding curve mechanism.
 *
 * This function retrieves the sale details and applies the bonding curve formula
 * to determine the value in native tokens for the given token amount.
 *
 * @param ctx - The context object providing access to the GalaChain environment.
 * @param sellTokenDTO - The data transfer object containing the sale address
 *                       and the exact amount of tokens to be sold.
 *
 * @returns A promise that resolves to a string representing the calculated amount of
 *          native tokens to be received, rounded down to 8 decimal places.
 *
 * @throws DefaultError if the calculated new total tokens sold is less than zero
 *                      or if the input amount is invalid.
 */
export async function callNativeTokenOut(
  ctx: GalaChainContext,
  sellTokenDTO: exactTokenAmountDto
): Promise<string> {
  const sale = await fetchAndValidateSale(ctx, sellTokenDTO.vaultAddress);

  const totalTokensSold = new Decimal(sale.fetchTokensSold()); // 1e18 / x
  let tokensToSell = new Decimal(sellTokenDTO.tokenAmount.toString()); // 0.5e18 / dx
  const basePrice = new Decimal(sale.fetchBasePrice()); // base price / a
  const { exponentFactor, euler, decimals } = getBondingConstants();

  let newTotalTokensSold = totalTokensSold.minus(tokensToSell);
  if (newTotalTokensSold.comparedTo(0) < 0) {
    tokensToSell = totalTokensSold;
    newTotalTokensSold = new Decimal(0);
  }

  const exponent1 = exponentFactor.mul(newTotalTokensSold.add(tokensToSell)).div(decimals);
  const exponent2 = exponentFactor.mul(newTotalTokensSold).div(decimals);

  const eResult1 = euler.pow(exponent1);
  const eResult2 = euler.pow(exponent2);

  const constantFactor = basePrice.div(exponentFactor);
  const differenceOfExponentials = eResult1.minus(eResult2);
  const price = constantFactor.mul(differenceOfExponentials);
  const roundedPrice = price.toDecimalPlaces(8, Decimal.ROUND_DOWN);

  return roundedPrice.toString();
}

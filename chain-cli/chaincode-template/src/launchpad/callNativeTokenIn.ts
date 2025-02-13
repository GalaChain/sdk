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
 * Calculates the amount of native tokens required to purchase a specified amount
 * of tokens using a bonding curve mechanism.
 *
 * This function retrieves the sale details and applies the bonding curve formula
 * to determine the cost in native tokens for the given token amount.
 *
 * @param ctx - The context object providing access to the GalaChain environment.
 * @param buyTokenDTO - The data transfer object containing the sale address
 *                      and the exact amount of tokens to be purchased.
 *
 * @returns A promise that resolves to a string representing the calculated amount of
 *          native tokens required for the purchase, rounded up to 8 decimal places.
 *
 * @throws Error if the calculation encounters an invalid state or data.
 */
export async function callNativeTokenIn(
  ctx: GalaChainContext,
  buyTokenDTO: exactTokenAmountDto
): Promise<string> {
  const sale = await fetchAndValidateSale(ctx, buyTokenDTO.vaultAddress);

  const totalTokensSold = new Decimal(sale.fetchTokensSold()); // 1e18 / x
  let tokensToBuy = new Decimal(buyTokenDTO.tokenAmount.toString()); // 0.5e18 / dx
  const basePrice = new Decimal(sale.fetchBasePrice()); // base price / a
  const { exponentFactor, euler, decimals } = getBondingConstants();

  if (tokensToBuy.add(totalTokensSold).greaterThan(new Decimal("1e+7"))) {
    tokensToBuy = new Decimal(sale.sellingTokenQuantity);
  }

  const exponent1 = exponentFactor.mul(totalTokensSold.add(tokensToBuy)).div(decimals);
  const exponent2 = exponentFactor.mul(totalTokensSold).div(decimals);

  const eResult1 = euler.pow(exponent1);
  const eResult2 = euler.pow(exponent2);

  const constantFactor = basePrice.div(exponentFactor);
  const differenceOfExponentials = eResult1.minus(eResult2);

  const price = constantFactor.mul(differenceOfExponentials);
  const roundedPrice = price.toDecimalPlaces(8, Decimal.ROUND_UP);
  return roundedPrice.toString();
}

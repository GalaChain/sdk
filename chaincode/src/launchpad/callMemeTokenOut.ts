import { MARKET_CAP, NativeTokenAmountDto } from "@gala-chain/api";
import { GalaChainContext } from "@gala-chain/chaincode";
import { BigNumber } from "bignumber.js";
import Decimal from "decimal.js";

import { fetchAndValidateSale, getBondingConstants } from "../utils";

BigNumber.config({
  ROUNDING_MODE: BigNumber.ROUND_UP
});

/**
 * Calculates the number of tokens that can be purchased using a specified amount
 * of native tokens based on a bonding curve mechanism.
 *
 * This function retrieves the sale details and applies the bonding curve formula
 * to determine the number of tokens the user can buy with the provided native token amount.
 *
 * @param ctx - The context object providing access to the GalaChain environment.
 * @param buyTokenDTO - The data transfer object containing the sale address
 *                      and the amount of native tokens to spend for the purchase.
 *
 * @returns A promise that resolves to a string representing the calculated amount of
 *          tokens to be received, rounded down to 18 decimal places.
 *
 * @throws Error if the calculation results in an invalid state.
 */
export async function callMemeTokenOut(
  ctx: GalaChainContext,
  buyTokenDTO: NativeTokenAmountDto
): Promise<string> {
  const sale = await fetchAndValidateSale(ctx, buyTokenDTO.vaultAddress);
  const totalTokensSold = new Decimal(sale.fetchTokensSold()); // current tokens sold / x
  let nativeTokens = new Decimal(buyTokenDTO.nativeTokenAmount.toString()); // native tokens used to buy / y
  const basePrice = new Decimal(sale.fetchBasePrice()); // base price / a
  const { exponentFactor, euler, decimals } = getBondingConstants();

  if (nativeTokens.add(new Decimal(sale.nativeTokenQuantity)).greaterThan(new Decimal(MARKET_CAP))) {
    nativeTokens = new Decimal(MARKET_CAP).minus(new Decimal(sale.nativeTokenQuantity));
  }

  const constant = nativeTokens.mul(exponentFactor).div(basePrice);

  const exponent1 = exponentFactor.mul(totalTokensSold).div(decimals);

  const eResult1 = euler.pow(exponent1);

  const ethScaled = constant.add(eResult1);

  const lnEthScaled = ethScaled.ln().mul(decimals);

  const lnEthScaledBase = lnEthScaled.div(exponentFactor);

  const result = lnEthScaledBase.minus(totalTokensSold);
  let roundedResult = result.toDecimalPlaces(18, Decimal.ROUND_DOWN);

  if (roundedResult.add(totalTokensSold).greaterThan(new Decimal("1e+7"))) {
    roundedResult = new Decimal("1e+7").minus(new Decimal(totalTokensSold))
  }
  return roundedResult.toString();
}

import { GalaChainContext } from "@gala-chain/chaincode";
import { BigNumber } from "bignumber.js";
import Decimal from "decimal.js";

import { nativeTokenAmountDto } from "./dtos";
import { fetchAndValidateSale, getBondingConstants } from "./helper/launchpadHelperFunctions";

BigNumber.config({
  ROUNDING_MODE: BigNumber.ROUND_UP
});

/**
 * Calculates the number of tokens that can be sold in exchange for a specified amount
 * of native tokens using a bonding curve mechanism.
 *
 * This function retrieves the sale details and applies the bonding curve formula
 * to determine the number of tokens the user can sell based on the provided native token amount.
 *
 * @param ctx - The context object that provides access to the GalaChain environment.
 * @param sellTokenDTO - An object containing the sale details:
 *   - `vaultAddress`: The address of the sale.
 *   - `nativeTokenAmount`: The amount of native tokens to be recieved from sale.
 *   - `expectedToken` (optional): The expected amount of tokens to be sold.
 *
 * @returns A promise that resolves to a string representing the calculated amount of
 *          tokens to be sent, rounded up to 18 decimal places.
 *
 * @throws Error if the calculation results in an invalid amount (e.g., `InvalidAmountError`).
 */
export async function callMemeTokenIn(
  ctx: GalaChainContext,
  sellTokenDTO: nativeTokenAmountDto
): Promise<string> {
  const sale = await fetchAndValidateSale(ctx, sellTokenDTO.vaultAddress);

  const totalTokensSold = new Decimal(sale.fetchTokensSold()); // current tokens sold / x
  let nativeTokens = new Decimal(sellTokenDTO.nativeTokenAmount.toString()); // native tokens used to buy / y
  const basePrice = new Decimal(sale.fetchBasePrice()); // base price / a
  const { exponentFactor, euler, decimals } = getBondingConstants();

  const nativeTokenInVault = new Decimal(sale.nativeTokenQuantity);
  if (nativeTokens.greaterThan(nativeTokenInVault)) {
    nativeTokens = nativeTokenInVault;
  }

  const exponent = exponentFactor.mul(totalTokensSold).div(decimals);
  const exp1 = euler.pow(exponent);
  const constantFactor = nativeTokens.mul(exponentFactor).div(basePrice);

  if (exp1.lte(constantFactor)) {
    throw new Error("Cannot sell more tokens than have been bought in this sale.");
  }

  const adjustedExp = exp1.minus(constantFactor);
  const lnAdjustedExp = adjustedExp.ln();
  const tokensSent = totalTokensSold.minus(lnAdjustedExp.mul(decimals).div(exponentFactor));
  const roundedTokenSent = tokensSent.toDecimalPlaces(18, Decimal.ROUND_UP);

  return roundedTokenSent.toString();
}

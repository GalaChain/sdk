import { DefaultError, NativeTokenAmountDto, TradeResponse, asValidUserAlias } from "@gala-chain/api";
import { GalaChainContext, fetchTokenClass, putChainObject, transferToken } from "@gala-chain/chaincode";
import { BigNumber } from "bignumber.js";

import { fetchAndValidateSale } from "../utils";
import { callMemeTokenIn } from "./callMemeTokenIn";

BigNumber.config({
  ROUNDING_MODE: BigNumber.ROUND_UP
});

/**
 * Executes a sale of tokens using native tokens (e.g., GALA) in exchange for the specified token amount.
 *
 * This function handles the process of selling tokens for native tokens in the sale vault, ensuring
 * that the token amount and native token quantity are properly adjusted based on the sale vault's
 * available balance. It also checks if the expected token amount matches the actual amount required.
 *
 * @param ctx - The context object that provides access to the GalaChain environment.
 * @param sellTokenDTO - An object containing the sale details:
 *   - `vaultAddress`: The address of the sale.
 *   - `nativeTokenAmount`: The amount of native tokens to be used in the sale.
 *   - `expectedToken` (optional): The expected amount of tokens to be received in return.
 *
 * @returns A promise that resolves to a `TradeResponse` object containing the updated
 *          balances of the seller's tokens and native tokens.
 *
 * @throws DefaultError if the expected token amount is less than the actual amount required
 *         for the operation.
 */
export async function sellWithNative(
  ctx: GalaChainContext,
  sellTokenDTO: NativeTokenAmountDto
): Promise<TradeResponse> {
  const sale = await fetchAndValidateSale(ctx, sellTokenDTO.vaultAddress);

  const nativeTokensLeftInVault = new BigNumber(sale.nativeTokenQuantity);
  if (nativeTokensLeftInVault.comparedTo(sellTokenDTO.nativeTokenAmount) < 0) {
    sellTokenDTO.nativeTokenAmount = nativeTokensLeftInVault;
  }
  const tokensToSell = new BigNumber(await callMemeTokenIn(ctx, sellTokenDTO));
  const nativeToken = sale.fetchNativeTokenInstanceKey();
  const memeToken = sale.fetchSellingTokenInstanceKey();
  const vaultAddress = asValidUserAlias(sellTokenDTO.vaultAddress);

  if (sellTokenDTO.expectedToken && sellTokenDTO.expectedToken.comparedTo(tokensToSell) < 0) {
    throw new DefaultError(
      "Token amount expected to cost for this operation is less than the the actual amount required."
    );
  }

  await transferToken(ctx, {
    from: ctx.callingUser,
    to: vaultAddress,
    tokenInstanceKey: memeToken,
    quantity: tokensToSell,
    allowancesToUse: [],
    authorizedOnBehalf: undefined
  });
  await transferToken(ctx, {
    from: vaultAddress,
    to: ctx.callingUser,
    tokenInstanceKey: nativeToken,
    quantity: sellTokenDTO.nativeTokenAmount,
    allowancesToUse: [],
    authorizedOnBehalf: {
      callingOnBehalf: vaultAddress,
      callingUser: vaultAddress
    }
  });

  sale.sellToken(tokensToSell, sellTokenDTO.nativeTokenAmount);
  await putChainObject(ctx, sale);

  const token = await fetchTokenClass(ctx, sale.sellingToken);
  return {
    inputAmount: tokensToSell.toString(),
    outputAmount: sellTokenDTO.nativeTokenAmount.toString(),
    tokenName: token.name,
    tradeType: "Sell",
    vaultAddress: vaultAddress,
    userAddress: ctx.callingUser
  };
}

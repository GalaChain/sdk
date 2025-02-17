import { DefaultError, ExactTokenAmountDto, MARKET_CAP, TradeResponse, asValidUserAlias } from "@gala-chain/api";
import {
  GalaChainContext,
  fetchTokenClass,
  putChainObject,
  transferToken
} from "@gala-chain/chaincode";
import { BigNumber } from "bignumber.js";

import { fetchAndValidateSale } from "../utils";
import { callNativeTokenIn } from "./callNativeTokenIn";
import { finalizeLaunchpadSale } from "../utils/finaliseLaunchpadSale";

BigNumber.config({
  ROUNDING_MODE: BigNumber.ROUND_UP
});

/**
 * Executes the purchase of an exact amount of tokens in a token sale.
 *
 * This function validates the sale, calculates the required native tokens,
 * and performs the token transfer to complete the purchase. If the purchase
 * consumes all tokens in the sale, the sale is marked as finalized.
 *
 * @param ctx - The context object providing access to the GalaChain environment.
 * @param buyTokenDTO - The data transfer object containing the sale address,
 *                      token amount to buy, and optional expected native token amount.
 *
 * @returns A promise that resolves to a `TradeResponse` containing the updated
 *          balances of the purchased token and the native token for the buyer.
 *
 * @throws DefaultError if the expected native tokens are insufficient to complete the purchase.
 */
export async function buyExactToken(
  ctx: GalaChainContext,
  buyTokenDTO: ExactTokenAmountDto
): Promise<TradeResponse> {
  let isSaleFinalised = false;

  // Fetch and validate the sale based on the provided vault address
  const sale = await fetchAndValidateSale(ctx, buyTokenDTO.vaultAddress);
  const tokenLeftInVault = new BigNumber(sale.sellingTokenQuantity);
  const vaultAddress = asValidUserAlias(buyTokenDTO.vaultAddress);

  // Calculate the required amount of native tokens to buy the specified token amount
  let nativeTokensToBuy = new BigNumber(await callNativeTokenIn(ctx, buyTokenDTO));
  const nativeToken = sale.fetchNativeTokenInstanceKey();
  const memeToken = sale.fetchSellingTokenInstanceKey();

  // If the requested token amount exceeds what's available, adjust it and recalculate native tokens needed
  if (tokenLeftInVault.lte(buyTokenDTO.tokenAmount)) {
    buyTokenDTO.tokenAmount = tokenLeftInVault;
    nativeTokensToBuy = new BigNumber(await callNativeTokenIn(ctx, buyTokenDTO));
    isSaleFinalised = true;
  }

  // Check if the native tokens used exceed the market cap, finalizing the sale if true
  if (nativeTokensToBuy.plus(new BigNumber(sale.nativeTokenQuantity)).gte(new BigNumber(MARKET_CAP))) {
    isSaleFinalised = true;
  }

  // Ensure the expected native token amount is not less than the actual amount required
  if (buyTokenDTO.expectedNativeToken && buyTokenDTO.expectedNativeToken.comparedTo(nativeTokensToBuy) < 0) {
    throw new DefaultError(
      "Gala tokens expected to perform this operation are less than the actual amount required."
    );
  }

  // Transfer native tokens from the buyer to the vault
  await transferToken(ctx, {
    from: ctx.callingUser,
    to: vaultAddress,
    tokenInstanceKey: nativeToken,
    quantity: nativeTokensToBuy,
    allowancesToUse: [],
    authorizedOnBehalf: undefined
  });

  // Transfer meme tokens from the vault to the buyer
  await transferToken(ctx, {
    from: vaultAddress,
    to: ctx.callingUser,
    tokenInstanceKey: memeToken,
    quantity: buyTokenDTO.tokenAmount,
    allowancesToUse: [],
    authorizedOnBehalf: {
      callingOnBehalf: vaultAddress,
      callingUser: vaultAddress
    }
  });

  // Update the sale record with the purchased token details
  sale.buyToken(buyTokenDTO.tokenAmount, nativeTokensToBuy);
  await putChainObject(ctx, sale);

  // If the sale is finalized, create a V3 pool and add liquidity
  if (isSaleFinalised) {
    await finalizeLaunchpadSale(ctx, sale);
  }

  // Return the updated balance response
  const token = await fetchTokenClass(ctx, sale.sellingToken);
  return {
    inputAmount: nativeTokensToBuy.toString(),
    outputAmount: buyTokenDTO.tokenAmount.toString(),
    tokenName: token.name,
    tradeType: "Buy",
    vaultAddress: vaultAddress,
    userAddress: ctx.callingUser
  };
}

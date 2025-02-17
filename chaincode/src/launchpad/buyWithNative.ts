import { DefaultError, MARKET_CAP, asValidUserAlias } from "@gala-chain/api";
import { ExactTokenAmountDto, NativeTokenAmountDto, TradeResponse } from "@gala-chain/api";
import {
  GalaChainContext,
  fetchTokenClass,
  putChainObject,
  transferToken
} from "@gala-chain/chaincode";
import { BigNumber } from "bignumber.js";

import { fetchAndValidateSale } from "../utils";
import { callMemeTokenOut } from "./callMemeTokenOut";
import { callNativeTokenIn } from "./callNativeTokenIn";
import { finalizeLaunchpadSale } from "../utils/finaliseLaunchpadSale";

BigNumber.config({
  ROUNDING_MODE: BigNumber.ROUND_UP
});

/**
 * Executes the purchase of tokens using a specified amount of native tokens.
 *
 * This function validates the sale, calculates the amount of tokens that can
 * be purchased with the provided native tokens, and performs the token transfer
 * to complete the purchase. If the purchase consumes all tokens in the sale,
 * the sale is marked as finalized.
 *
 * @param ctx - The context object providing access to the GalaChain environment.
 * @param buyTokenDTO - The data transfer object containing the sale address,
 *                      native token amount to spend, and optional expected token amount.
 *
 * @returns A promise that resolves to a `TradeResponse` containing the updated
 *          balances of the purchased token and the native token for the buyer.
 *
 * @throws DefaultError if the expected tokens to be received are less than the
 *                      actual amount provided by the operation.
 */
export async function buyWithNative(
  ctx: GalaChainContext,
  buyTokenDTO: NativeTokenAmountDto
): Promise<TradeResponse> {
  let isSaleFinalised = false;
  const sale = await fetchAndValidateSale(ctx, buyTokenDTO.vaultAddress);
  const tokensLeftInVault = new BigNumber(sale.sellingTokenQuantity);
  let tokensToBuy = new BigNumber(await callMemeTokenOut(ctx, buyTokenDTO));
  const vaultAddress = asValidUserAlias(buyTokenDTO.vaultAddress);

  const nativeToken = sale.fetchNativeTokenInstanceKey();
  const memeToken = sale.fetchSellingTokenInstanceKey();

  if (tokensLeftInVault.comparedTo(tokensToBuy) <= 0) {
    tokensToBuy = tokensLeftInVault;
    const nativeTokensrequiredToBuyDto = new ExactTokenAmountDto();
    nativeTokensrequiredToBuyDto.vaultAddress = buyTokenDTO.vaultAddress;
    nativeTokensrequiredToBuyDto.tokenAmount = tokensToBuy;
    buyTokenDTO.nativeTokenAmount = new BigNumber(await callNativeTokenIn(ctx, nativeTokensrequiredToBuyDto));
    isSaleFinalised = true;
  }

  if (
    buyTokenDTO.nativeTokenAmount.plus(new BigNumber(sale.nativeTokenQuantity)).gte(new BigNumber(MARKET_CAP))
  )
    isSaleFinalised = true;

  if (buyTokenDTO.expectedToken && buyTokenDTO.expectedToken.comparedTo(tokensToBuy) > 0) {
    throw new DefaultError(
      "Tokens expected from this operation are less than the the actual amount that will be provided."
    );
  }

  await transferToken(ctx, {
    from: ctx.callingUser,
    to: vaultAddress,
    tokenInstanceKey: nativeToken,
    quantity: buyTokenDTO.nativeTokenAmount,
    allowancesToUse: [],
    authorizedOnBehalf: undefined
  });

  await transferToken(ctx, {
    from: vaultAddress,
    to: ctx.callingUser,
    tokenInstanceKey: memeToken,
    quantity: tokensToBuy,
    allowancesToUse: [],
    authorizedOnBehalf: {
      callingOnBehalf: vaultAddress,
      callingUser: vaultAddress
    }
  });

  sale.buyToken(tokensToBuy, buyTokenDTO.nativeTokenAmount);
  await putChainObject(ctx, sale);

  if (isSaleFinalised) {
    await finalizeLaunchpadSale(ctx, sale);
  }

  const token = await fetchTokenClass(ctx, sale.sellingToken);
  return {
    inputAmount: buyTokenDTO.nativeTokenAmount.toString(),
    outputAmount: tokensToBuy.toString(),
    tokenName: token.name,
    tradeType: "Buy",
    vaultAddress: vaultAddress,
    userAddress: ctx.callingUser
  };
}

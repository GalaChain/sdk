import { DefaultError } from "@gala-chain/api";
import {
  GalaChainContext,
  fetchOrCreateBalance,
  fetchTokenClass,
  putChainObject,
  transferToken
} from "@gala-chain/chaincode";
import { BigNumber } from "bignumber.js";

import { callMemeTokenOut } from "./callMemeTokenOut";
import { callNativeTokenIn } from "./callNativeTokenIn";
import { MARKET_CAP } from "./constants";
import { exactTokenAmountDto, nativeTokenAmountDto, tradeResponse } from "./dtos";
import { finalizeSale } from "./finaliseSale";
import { fetchAndValidateSale } from "./helper/launchpadHelperFunctions";

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
 * @returns A promise that resolves to a `tradeResponse` containing the updated
 *          balances of the purchased token and the native token for the buyer.
 *
 * @throws DefaultError if the expected tokens to be received are less than the
 *                      actual amount provided by the operation.
 */
export async function buyWithNative(
  ctx: GalaChainContext,
  buyTokenDTO: nativeTokenAmountDto
): Promise<tradeResponse> {
  let isSaleFinalised = false;
  const sale = await fetchAndValidateSale(ctx, buyTokenDTO.vaultAddress);
  const tokensLeftInVault = new BigNumber(sale.sellingTokenQuantity);
  let tokensToBuy = new BigNumber(await callMemeTokenOut(ctx, buyTokenDTO));

  const nativeToken = sale.fetchNativeTokenInstanceKey();
  const memeToken = sale.fetchSellingTokenInstanceKey();

  if (tokensLeftInVault.comparedTo(tokensToBuy) <= 0) {
    tokensToBuy = tokensLeftInVault;
    const nativeTokensrequiredToBuyDto = new exactTokenAmountDto();
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
    to: buyTokenDTO.vaultAddress,
    tokenInstanceKey: nativeToken,
    quantity: buyTokenDTO.nativeTokenAmount,
    allowancesToUse: [],
    authorizedOnBehalf: undefined
  });

  await transferToken(ctx, {
    from: buyTokenDTO.vaultAddress,
    to: ctx.callingUser,
    tokenInstanceKey: memeToken,
    quantity: tokensToBuy,
    allowancesToUse: [],
    authorizedOnBehalf: {
      callingOnBehalf: buyTokenDTO.vaultAddress,
      callingUser: buyTokenDTO.vaultAddress
    }
  });

  sale.buyToken(tokensToBuy, buyTokenDTO.nativeTokenAmount);
  await putChainObject(ctx, sale);

  if (isSaleFinalised) {
    // todo: function to create v3 pool and add liquidity
    await finalizeSale(ctx, sale);
  }

  const token = await fetchTokenClass(ctx, sale.sellingToken);
  return {
    inputAmount: buyTokenDTO.nativeTokenAmount.toString(),
    outputAmount: tokensToBuy.toString(),
    tokenName: token.name,
    tradeType: "Buy",
    vaultAddress: buyTokenDTO.vaultAddress,
    userAddress: ctx.callingUser
  };
}

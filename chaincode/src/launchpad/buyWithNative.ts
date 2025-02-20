/*
 * Copyright (c) Gala Games Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { DefaultError, LaunchPadSale } from "@gala-chain/api";
import { ExactTokenAmountDto, NativeTokenAmountDto, TradeResponse } from "@gala-chain/api";
import {
  GalaChainContext,
  fetchTokenClass,
  putChainObject,
  transferToken
} from "@gala-chain/chaincode";
import { BigNumber } from "bignumber.js";

import { fetchAndValidateSale, finalizeSale } from "../utils";
import { callMemeTokenOut } from "./callMemeTokenOut";
import { callNativeTokenIn } from "./callNativeTokenIn";

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
    buyTokenDTO.nativeTokenAmount
      .plus(new BigNumber(sale.nativeTokenQuantity))
      .gte(new BigNumber(LaunchPadSale.MARKET_CAP))
  )
    isSaleFinalised = true;

  if (buyTokenDTO.expectedToken && buyTokenDTO.expectedToken.comparedTo(tokensToBuy) > 0) {
    throw new DefaultError(
      "Tokens expected from this operation are more than the the actual amount that will be provided."
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
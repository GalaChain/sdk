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
import {
  ExactTokenQuantityDto,
  LaunchpadSale,
  SlippageToleranceExceededError,
  TradeResDto
} from "@gala-chain/api";
import { BigNumber } from "bignumber.js";

import { fetchTokenClass } from "../token";
import { transferToken } from "../transfer";
import { GalaChainContext } from "../types";
import { fetchAndValidateSale, putChainObject } from "../utils";
import { callNativeTokenIn } from "./callNativeTokenIn";
import { finalizeSale } from "./finaliseSale";

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
 * @returns A promise that resolves to a `TradeResDto` containing the updated
 *          balances of the purchased token and the native token for the buyer.
 *
 * @throws DefaultError if the expected native tokens are insufficient to complete the purchase.
 */
export async function buyExactToken(
  ctx: GalaChainContext,
  buyTokenDTO: ExactTokenQuantityDto
): Promise<TradeResDto> {
  let isSaleFinalised = false;

  // Fetch and validate the sale based on the provided vault address
  const sale = await fetchAndValidateSale(ctx, buyTokenDTO.vaultAddress);
  const tokenLeftInVault = new BigNumber(sale.sellingTokenQuantity);

  // Calculate the required amount of native tokens to buy the specified token amount
  const callNativeTokenInResult1 = await callNativeTokenIn(ctx, buyTokenDTO);
  let nativeTokensToBuy = new BigNumber(callNativeTokenInResult1.calculatedQuantity);
  const nativeToken = sale.fetchNativeTokenInstanceKey();
  const memeToken = sale.fetchSellingTokenInstanceKey();

  // If the requested token amount exceeds what's available, adjust it and recalculate native tokens needed
  if (tokenLeftInVault.lte(buyTokenDTO.tokenQuantity)) {
    buyTokenDTO.tokenQuantity = tokenLeftInVault;
    const callNativeTokenInResult2 = await callNativeTokenIn(ctx, buyTokenDTO);
    nativeTokensToBuy = new BigNumber(callNativeTokenInResult2.calculatedQuantity);
    isSaleFinalised = true;
  }

  // Check if the native tokens used exceed the market cap, finalizing the sale if true
  if (
    nativeTokensToBuy
      .plus(new BigNumber(sale.nativeTokenQuantity))
      .gte(new BigNumber(LaunchpadSale.MARKET_CAP))
  ) {
    isSaleFinalised = true;
  }

  // Ensure the expected native token amount is not less than the actual amount required
  if (buyTokenDTO.expectedNativeToken && buyTokenDTO.expectedNativeToken.comparedTo(nativeTokensToBuy) < 0) {
    throw new SlippageToleranceExceededError(
      "Gala tokens expected to perform this operation are less than the actual amount required."
    );
  }

  // Transfer native tokens from the buyer to the vault
  await transferToken(ctx, {
    from: ctx.callingUser,
    to: buyTokenDTO.vaultAddress,
    tokenInstanceKey: nativeToken,
    quantity: nativeTokensToBuy,
    allowancesToUse: [],
    authorizedOnBehalf: undefined
  });

  // Transfer meme tokens from the vault to the buyer
  await transferToken(ctx, {
    from: buyTokenDTO.vaultAddress,
    to: ctx.callingUser,
    tokenInstanceKey: memeToken,
    quantity: buyTokenDTO.tokenQuantity,
    allowancesToUse: [],
    authorizedOnBehalf: {
      callingOnBehalf: buyTokenDTO.vaultAddress,
      callingUser: buyTokenDTO.vaultAddress
    }
  });

  // Update the sale record with the purchased token details
  sale.buyToken(buyTokenDTO.tokenQuantity, nativeTokensToBuy);
  await putChainObject(ctx, sale);

  // If the sale is finalized, create a V3 pool and add liquidity
  if (isSaleFinalised) {
    await finalizeSale(ctx, sale);
  }

  // Return the updated balance response
  const token = await fetchTokenClass(ctx, sale.sellingToken);
  return {
    inputQuantity: nativeTokensToBuy.toFixed(),
    outputQuantity: buyTokenDTO.tokenQuantity.toFixed(),
    tokenName: token.name,
    tradeType: "Buy",
    vaultAddress: buyTokenDTO.vaultAddress,
    userAddress: ctx.callingUser,
    isFinalized: isSaleFinalised,
    functionName: "BuyExactToken"
  };
}

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
  NativeTokenQuantityDto,
  SlippageToleranceExceededError,
  TradeResDto
} from "@gala-chain/api";
import { BigNumber } from "bignumber.js";

import { fetchTokenClass } from "../token";
import { transferToken } from "../transfer";
import { GalaChainContext } from "../types";
import { fetchAndValidateSale, putChainObject } from "../utils";
import { callMemeTokenIn } from "./callMemeTokenIn";
import { callNativeTokenOut } from "./callNativeTokenOut";
import { payReverseBondingCurveFee } from "./fees";

BigNumber.config({
  ROUNDING_MODE: BigNumber.ROUND_UP
});

/**
 * Executes the sale of an exact amount of tokens for native tokens (e.g., GALA).
 *
 * This function facilitates selling a specific token amount by transferring the tokens to
 * the sale vault and providing the calculated native tokens in return. It ensures validation
 * of the sale, handles insufficient vault balances, and checks expected vs. actual native tokens.
 *
 * @param ctx - The context object providing access to the GalaChain environment.
 * @param sellTokenDTO - An object containing the sale details:
 *   - `vaultAddress`: The address of the sale.
 *   - `tokenAmount`: The exact amount of tokens to sell.
 *   - `expectedNativeToken` (optional): The expected amount of native tokens in return.
 *
 * @returns A promise that resolves to a `TradeResDto` object containing the updated
 *          balances of the seller's tokens and native tokens.
 *
 * @throws DefaultError if the expected native tokens exceed the actual amount to be provided.
 */
export async function sellExactToken(
  ctx: GalaChainContext,
  sellTokenDTO: ExactTokenQuantityDto
): Promise<TradeResDto> {
  const sale = await fetchAndValidateSale(ctx, sellTokenDTO.vaultAddress);

  const callNativeTokenOutResult = await callNativeTokenOut(ctx, sellTokenDTO);
  let nativeTokensToProvide = new BigNumber(callNativeTokenOutResult.calculatedQuantity);
  const nativeTokensLeftInVault = new BigNumber(sale.nativeTokenQuantity);
  const nativeToken = sale.fetchNativeTokenInstanceKey();
  const memeToken = sale.fetchSellingTokenInstanceKey();

  if (nativeTokensLeftInVault.comparedTo(nativeTokensToProvide) < 0) {
    nativeTokensToProvide = nativeTokensLeftInVault;
    const nativeTokensBeingSoldDto = new NativeTokenQuantityDto();
    nativeTokensBeingSoldDto.vaultAddress = sellTokenDTO.vaultAddress;
    nativeTokensBeingSoldDto.nativeTokenQuantity = nativeTokensToProvide;
    const callMemeTokenInResult = await callMemeTokenIn(ctx, nativeTokensBeingSoldDto);
    sellTokenDTO.tokenQuantity = new BigNumber(callMemeTokenInResult.calculatedQuantity);
  }

  if (
    sellTokenDTO.expectedNativeToken &&
    sellTokenDTO.expectedNativeToken.comparedTo(nativeTokensToProvide) > 0
  ) {
    throw new SlippageToleranceExceededError(
      "Expected Gala tokens from this operation exceeds the actual amount that will be provided."
    );
  }

  // The fee must be paid BEFORE the sale can happen.
  // That means you cannot pay the fee using proceeds from the sale.
  await payReverseBondingCurveFee(
    ctx,
    sale,
    nativeTokensToProvide,
    sellTokenDTO.extraFees?.maxAcceptableReverseBondingCurveFee
  );

  await transferToken(ctx, {
    from: ctx.callingUser,
    to: sellTokenDTO.vaultAddress,
    tokenInstanceKey: memeToken,
    quantity: sellTokenDTO.tokenQuantity,
    allowancesToUse: [],
    authorizedOnBehalf: undefined
  });

  await transferToken(ctx, {
    from: sellTokenDTO.vaultAddress,
    to: ctx.callingUser,
    tokenInstanceKey: nativeToken,
    quantity: nativeTokensToProvide,
    allowancesToUse: [],
    authorizedOnBehalf: {
      callingOnBehalf: sellTokenDTO.vaultAddress,
      callingUser: sellTokenDTO.vaultAddress
    }
  });

  sale.sellToken(sellTokenDTO.tokenQuantity, nativeTokensToProvide);
  await putChainObject(ctx, sale);

  const token = await fetchTokenClass(ctx, sale.sellingToken);
  return {
    inputQuantity: sellTokenDTO.tokenQuantity.toFixed(),
    outputQuantity: nativeTokensToProvide.toFixed(),
    tokenName: token.name,
    tradeType: "Sell",
    vaultAddress: sellTokenDTO.vaultAddress,
    userAddress: ctx.callingUser,
    isFinalized: false,
    functionName: "SellExactToken"
  };
}

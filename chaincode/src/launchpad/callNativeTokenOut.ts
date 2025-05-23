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
import { ExactTokenQuantityDto, LaunchpadSale } from "@gala-chain/api";
import { BigNumber } from "bignumber.js";
import Decimal from "decimal.js";

import { GalaChainContext } from "../types";
import { fetchAndValidateSale, getBondingConstants } from "../utils";
import { calculateReverseBondingCurveFee } from "./fees";

BigNumber.config({
  ROUNDING_MODE: BigNumber.ROUND_UP
});

function calculateNativeTokensReceived(sale: LaunchpadSale, tokensToSellBn: BigNumber) {
  const totalTokensSold = new Decimal(sale.fetchTokensSold());

  let tokensToSell = new Decimal(tokensToSellBn.toString());
  const basePrice = new Decimal(sale.fetchBasePrice());
  const { exponentFactor, euler, decimals } = getBondingConstants();

  let newTotalTokensSold = totalTokensSold.minus(tokensToSell);

  if (newTotalTokensSold.comparedTo(0) < 0) {
    tokensToSell = totalTokensSold;
    newTotalTokensSold = new Decimal(0);
  }

  const exponent1 = exponentFactor.mul(newTotalTokensSold.add(tokensToSell)).div(decimals);
  const exponent2 = exponentFactor.mul(newTotalTokensSold).div(decimals);

  const eResult1 = euler.pow(exponent1);
  const eResult2 = euler.pow(exponent2);

  const constantFactor = basePrice.div(exponentFactor);
  const differenceOfExponentials = eResult1.minus(eResult2);
  const price = constantFactor.mul(differenceOfExponentials);
  const roundedPrice = price.toDecimalPlaces(8, Decimal.ROUND_DOWN);

  return roundedPrice.toFixed();
}

/**
 * Calculates the amount of native tokens a user would receive when selling
 * a specified amount of tokens based on a bonding curve mechanism.
 *
 * This function retrieves the sale details and applies the bonding curve formula
 * to determine the value in native tokens for the given token amount.
 *
 * @param ctx - The context object providing access to the GalaChain environment.
 * @param sellTokenDTO - The data transfer object containing the sale address
 *                       and the exact amount of tokens to be sold.
 *
 * @returns A promise that resolves to a string representing the calculated amount of
 *          native tokens to be received, rounded down to 8 decimal places.
 *
 * @throws DefaultError if the calculated new total tokens sold is less than zero
 *                      or if the input amount is invalid.
 */
export async function callNativeTokenOut(ctx: GalaChainContext, sellTokenDTO: ExactTokenQuantityDto) {
  const sale = await fetchAndValidateSale(ctx, sellTokenDTO.vaultAddress);
  const nativeTokensReceived = calculateNativeTokensReceived(sale, sellTokenDTO.tokenQuantity);
  return {
    calculatedQuantity: nativeTokensReceived,
    extraFees: {
      reverseBondingCurve: calculateReverseBondingCurveFee(sale, BigNumber(nativeTokensReceived)).toString()
    }
  };
}

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
import { ExactTokenQuantityDto } from "@gala-chain/api";
import { BigNumber } from "bignumber.js";
import Decimal from "decimal.js";

import { GalaChainContext } from "../types";
import { fetchAndValidateSale, getBondingConstants } from "../utils";

BigNumber.config({
  ROUNDING_MODE: BigNumber.ROUND_UP
});

/**
 * Calculates the amount of native tokens required to purchase a specified amount
 * of tokens using a bonding curve mechanism.
 *
 * This function retrieves the sale details and applies the bonding curve formula
 * to determine the cost in native tokens for the given token amount.
 *
 * @param ctx - The context object providing access to the GalaChain environment.
 * @param buyTokenDTO - The data transfer object containing the sale address
 *                      and the exact amount of tokens to be purchased.
 *
 * @returns A promise that resolves to a string representing the calculated amount of
 *          native tokens required for the purchase, rounded up to 8 decimal places.
 *
 * @throws Error if the calculation encounters an invalid state or data.
 */
export async function callNativeTokenIn(ctx: GalaChainContext, buyTokenDTO: ExactTokenQuantityDto) {
  const sale = await fetchAndValidateSale(ctx, buyTokenDTO.vaultAddress);
  const totalTokensSold = new Decimal(sale.fetchTokensSold());

  let tokensToBuy = new Decimal(buyTokenDTO.tokenQuantity.toString());
  const basePrice = new Decimal(sale.fetchBasePrice());
  const { exponentFactor, euler, decimals } = getBondingConstants();

  if (tokensToBuy.add(totalTokensSold).greaterThan(new Decimal("1e+7"))) {
    tokensToBuy = new Decimal(sale.sellingTokenQuantity);
  }

  const exponent1 = exponentFactor.mul(totalTokensSold.add(tokensToBuy)).div(decimals);
  const exponent2 = exponentFactor.mul(totalTokensSold).div(decimals);

  const eResult1 = euler.pow(exponent1);
  const eResult2 = euler.pow(exponent2);

  const constantFactor = basePrice.div(exponentFactor);
  const differenceOfExponentials = eResult1.minus(eResult2);

  const price = constantFactor.mul(differenceOfExponentials);

  return {
    calculatedQuantity: price.toDecimalPlaces(8, Decimal.ROUND_UP).toFixed(),
    extraFees: {
      reverseBondingCurve: "0"
    }
  };
}

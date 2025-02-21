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
import { LaunchpadSale, PreMintCalculationDto } from "@gala-chain/api";
import { BigNumber } from "bignumber.js";
import Decimal from "decimal.js";

import { getBondingConstants } from "../utils";

BigNumber.config({
  ROUNDING_MODE: BigNumber.ROUND_UP
});

/**
 * Calculates the number of tokens that can be purchased using a specified amount
 * of native tokens based on a bonding curve mechanism.
 *
 * This function applies the bonding curve formula for a brand new sale with zero tokens sold
 * to determine the number of tokens the user can buy with the provided native token amount.
 *
 * @param buyTokenDTO - The Amount of native tokens to spend for the purchase.
 *
 * @returns A promise that resolves to a string representing the calculated amount of
 *          tokens to be received, rounded down to 18 decimal places.
 *
 * @throws Error if the calculation results in an invalid state.
 */
export async function calculatePreMintTokens(buyTokenDTO: PreMintCalculationDto): Promise<string> {
  const totalTokensSold = new Decimal(0); // current tokens sold / x
  const nativeTokens = new Decimal(buyTokenDTO.nativeTokenQuantity.toString()); // native tokens used to buy / y
  const basePrice = new Decimal(LaunchpadSale.BASE_PRICE); // base price / a
  const { exponentFactor, euler, decimals } = getBondingConstants();

  const constant = nativeTokens.mul(exponentFactor).div(basePrice);

  const exponent1 = exponentFactor.mul(totalTokensSold).div(decimals);

  const eResult1 = euler.pow(exponent1);

  const ethScaled = constant.add(eResult1);

  const lnEthScaled = ethScaled.ln().mul(decimals);

  const lnEthScaledBase = lnEthScaled.div(exponentFactor);

  const result = lnEthScaledBase.minus(totalTokensSold);
  const roundedResult = result.toDecimalPlaces(18, Decimal.ROUND_DOWN);

  return roundedResult.toString();
}

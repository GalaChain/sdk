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
import Decimal from "decimal.js";

const A = new Decimal("0.00001650667150665");
const B = new Decimal("0.000001166069");
const SCALE = new Decimal(10).pow(0);

export function calMemeTokensOutTest(totalSupply: number, amount: number): string {
  const totalSupplyF = new Decimal(totalSupply).div(SCALE);
  const amountF = new Decimal(amount).div(SCALE);

  const expPart = B.times(totalSupplyF).exp();
  const logPart = amountF.times(B).div(A).plus(expPart).ln();
  const result = logPart.div(B).minus(totalSupplyF).times(SCALE);

  return result.toFixed(18, Decimal.ROUND_DOWN);
}

export function calNativeTokensInTest(totalSupply, amount) {
  const totalSupplyF = new Decimal(totalSupply).div(SCALE);
  const amountF = new Decimal(amount).div(SCALE);
  const result = A.times(Decimal.exp(B.times(totalSupplyF.plus(amountF))).minus(Decimal.exp(B.times(totalSupplyF))))
  .div(B)
  .times(SCALE);
  const roundedResult = result.toDecimalPlaces(8, Decimal.ROUND_UP);

  return roundedResult;
}

export function calNativeTokensOutTest(totalSupply: number, amount: number): number {
  const totalSupplyF = new Decimal(totalSupply).div(SCALE);
  const amountF = new Decimal(amount).div(SCALE);

  const exponent1 = B.mul(totalSupplyF);
  const exponent2 = B.mul(totalSupplyF.minus(amountF));

  const term1 = Decimal.exp(exponent1);
  const term2 = Decimal.exp(exponent2);

  const result = A.mul(term1.minus(term2)).div(B).mul(SCALE);
  const roundedResult = result.toDecimalPlaces(8, Decimal.ROUND_DOWN);

  return roundedResult.toNumber();
}

export function calMemeTokensInTest(totalSupply, amount) {
  const totalSupplyF = new Decimal(totalSupply).div(SCALE);
  const amountF = new Decimal(amount).div(SCALE);
  const expTerm = Decimal.exp(totalSupplyF.times(B));
  const amountTerm = amountF.times(B).div(A);
  const logInput = expTerm.minus(amountTerm);
  const result = totalSupplyF.minus(Decimal.ln(logInput).div(B)).times(SCALE);
  const roundedResult = result.toDecimalPlaces(18, Decimal.ROUND_UP);

  return roundedResult;
}
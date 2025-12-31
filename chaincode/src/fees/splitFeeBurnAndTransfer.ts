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
  BurnTokenQuantity,
  FeeCodeSplitFormula,
  PaymentRequiredError,
  TokenClass,
  TokenInstanceKey
} from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { burnTokens } from "../burns";
import { transferToken } from "../transfer";
import { GalaChainContext } from "../types";
import { getObjectByKey } from "../utils";

export interface SplitFeeBurnAndTransferParams {
  feeCode: string;
  quantity: BigNumber;
  galaCurrencyKey: TokenInstanceKey;
  splitFormula: FeeCodeSplitFormula;
}

export async function splitFeeImmediatelyWithBurnAndTransfer(
  ctx: GalaChainContext,
  data: SplitFeeBurnAndTransferParams
): Promise<void> {
  const payingUser = ctx.callingUser;
  const { feeCode, galaCurrencyKey, splitFormula } = data;
  const totalFeeQuantity = data.quantity;

  const { collection, category, type, additionalKey } = galaCurrencyKey;
  const galaCurrencyTokenClassKey = TokenClass.getCompositeKeyFromParts(TokenClass.INDEX_KEY, [
    collection,
    category,
    type,
    additionalKey
  ]);
  const galaCurrencyTokenClass = await getObjectByKey(ctx, TokenClass, galaCurrencyTokenClassKey);

  const decimals: number = galaCurrencyTokenClass.decimals;

  const [burnFeeQuantity, transferQuantities] = splitFormula.calculateAmounts(totalFeeQuantity, decimals);

  const burnQuantity: BurnTokenQuantity = {
    quantity: burnFeeQuantity,
    tokenInstanceKey: galaCurrencyKey
  };

  await burnTokens(ctx, {
    owner: payingUser,
    toBurn: [burnQuantity]
  }).catch((e) => {
    throw new PaymentRequiredError(
      `Payment Required. Failed to burnTokens for splitFeeFormula: ` +
        `for payingUser: ${payingUser} ` +
        `burnFeeQuantity: ${burnFeeQuantity.toString()}, ` +
        `totalFeeQuantity: ${totalFeeQuantity.toString()}, ` +
        `failed with error: ${e.message}`,
      { paymentQuantity: totalFeeQuantity.toString() }
    );
  });

  for (const transfer of transferQuantities) {
    await transferToken(ctx, {
      from: payingUser,
      to: transfer.transferToUser,
      tokenInstanceKey: galaCurrencyKey,
      quantity: transfer.transferQuantity,
      authorizedOnBehalf: undefined
    }).catch((e) => {
      throw new PaymentRequiredError(
        `Payment Required. Failed to transferToken for splitFeeFormula ` +
          `defined for ${feeCode} feeCode: ` +
          `from payingUser: ${payingUser}, to transferToUser: ${transfer.transferToUser}` +
          `transferQuantity: ${transfer.transferQuantity.toString()} ` +
          `totalFeeQuantity: ${totalFeeQuantity.toString()}, ` +
          `Received error: ${e.message}`,
        { paymentQuantity: totalFeeQuantity.toString() }
      );
    });
  }
}

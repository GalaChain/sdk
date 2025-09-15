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
  ChainError,
  ErrorCode,
  FeeCodeSplitFormula,
  FeeProperties,
  FeeReceiptStatus,
  PaymentRequiredError,
  TokenInstanceKey
} from "@gala-chain/api";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import { burnTokens } from "../burns";
import { GalaChainContext } from "../types";
import { getObjectByKey, txUnixTimeToDateIndexKeys } from "../utils";
import { fetchGalaFeeProperties } from "./galaFeeProperties";
import { splitFeeImmediatelyWithBurnAndTransfer } from "./splitFeeBurnAndTransfer";
import { writeChannelPaymentReceipt } from "./writeChannelPaymentReceipt";
import { writeUserPaymentReceipt } from "./writeUserPaymentReceipt";

export interface payFeeImmediatelyParams {
  feeCode: string;
  quantity: BigNumber;
}

// A version of ./payFee.ts designed to only be used on the assets channel
// where fee payments can be settled atomically / transactionally
// rather than authoritatively across channels.
// payFeeImmediatelyFromBalance, on the channel where Gala balances are stored (assets).
// do not use on non-assets channels where users don't hold Gala.
export async function payFeeImmediatelyFromBalance(ctx: GalaChainContext, data: payFeeImmediatelyParams) {
  const payingUser = ctx.callingUser;
  const { feeCode, quantity } = data;

  const feeTokenProperties: FeeProperties | ChainError = await fetchGalaFeeProperties(ctx);

  if (feeTokenProperties instanceof ChainError && feeTokenProperties.code === ErrorCode.NOT_FOUND) {
    // if the feeToken is not defined, no fee can be charged
    return;
  }

  const { collection, category, type, additionalKey, instance } = feeTokenProperties as FeeProperties;
  const galaCurrencyKey: TokenInstanceKey = plainToInstance(TokenInstanceKey, {
    collection,
    category,
    type,
    additionalKey,
    instance
  });

  const splitFormulaKey = FeeCodeSplitFormula.getCompositeKeyFromParts(FeeCodeSplitFormula.INDEX_KEY, [
    feeCode
  ]);

  const splitFormula: FeeCodeSplitFormula | ChainError = await getObjectByKey(
    ctx,
    FeeCodeSplitFormula,
    splitFormulaKey
  ).catch((e) => ChainError.from(e));

  // Default to burning the whole fee if FeeCodeSplitFormula is not defined on chain
  // instead of throwing an error. Avoid breaking/preventing end user actions.
  // and enable any fee to add support for this burn/transfer split in the future
  // without further code changes.
  if (splitFormula instanceof ChainError && splitFormula.code === ErrorCode.NOT_FOUND) {
    const burnQuantity: BurnTokenQuantity = {
      quantity: quantity,
      tokenInstanceKey: galaCurrencyKey
    };

    await burnTokens(ctx, {
      owner: payingUser,
      toBurn: [burnQuantity]
    }).catch((e: ChainError) => {
      throw new PaymentRequiredError(`Failed to burnTokens fee: ${e.message}`, {
        paymentQuantity: quantity.toString()
      });
    });
  } else if (splitFormula instanceof ChainError) {
    throw splitFormula;
  } else {
    await splitFeeImmediatelyWithBurnAndTransfer(ctx, {
      feeCode,
      quantity,
      galaCurrencyKey,
      splitFormula
    });
  }

  const { year, month, day } = txUnixTimeToDateIndexKeys(ctx.txUnixTime);
  const txId = ctx.stub.getTxID();

  // channel payment receipt and user payment receipts
  // have the same data, just ordered differently.
  // like a transaction where the merchant keeps on copy,
  // and provides another copy to the customer.
  // the different ordering of keys (owner-first vs yyyy/mm/dd-first)
  // permits different query use cases.
  await writeChannelPaymentReceipt(ctx, {
    year,
    month,
    day,
    feeCode,
    paidByUser: payingUser,
    txId,
    quantity,
    status: FeeReceiptStatus.Settled
  });

  await writeUserPaymentReceipt(ctx, {
    paidByUser: payingUser,
    year,
    month,
    day,
    feeCode,
    txId,
    quantity,
    status: FeeReceiptStatus.Settled
  });
}

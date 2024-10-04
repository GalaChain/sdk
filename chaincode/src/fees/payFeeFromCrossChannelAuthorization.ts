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
import { ChainObject, FeePendingBalance, FeeReceiptStatus, PaymentRequiredError } from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { GalaChainContext } from "../types";
import { getObjectByKey, putChainObject, txUnixTimeToDateIndexKeys } from "../utils";
import { writeChannelPaymentReceipt } from "./writeChannelPaymentReceipt";
import { writeUserPaymentReceipt } from "./writeUserPaymentReceipt";

export interface payFeeParams {
  feeCode: string;
  quantity: BigNumber;
}

export async function payFeeFromCrossChannelAuthorization(ctx: GalaChainContext, data: payFeeParams) {
  const owner = ctx.callingUser;
  const paymentRequired = data.quantity;

  const userPendingAuthorizationBalanceChainKey = ChainObject.getCompositeKeyFromParts(
    FeePendingBalance.INDEX_KEY,
    [owner]
  );

  const pendingBalance = await getObjectByKey(
    ctx,
    FeePendingBalance,
    userPendingAuthorizationBalanceChainKey
  ).catch(() => undefined);

  if (!pendingBalance) {
    throw new PaymentRequiredError(
      `Payment Required: Transaction requires fee of ${paymentRequired.toString()}. ` +
        `FeePendingBalance not found on chain for user: ${owner}`,
      { paymentQuantity: paymentRequired.toString() }
    );
  }

  if (paymentRequired.isGreaterThan(pendingBalance.quantity)) {
    throw new PaymentRequiredError(
      `Payment Required: Transaction requires fee of ${paymentRequired.toString()}. ` +
        ` User balance: ${pendingBalance.quantity.toString()}`,
      { paymentQuantity: paymentRequired.toString() }
    );
  }

  pendingBalance.quantity = pendingBalance.quantity.minus(paymentRequired);
  await putChainObject(ctx, pendingBalance);

  const { year, month, day, minutes, seconds } = txUnixTimeToDateIndexKeys(ctx.txUnixTime);
  const { feeCode, quantity } = data;
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
    paidByUser: owner,
    txId,
    quantity,
    status: FeeReceiptStatus.Open
  });

  await writeUserPaymentReceipt(ctx, {
    paidByUser: owner,
    year,
    month,
    day,
    feeCode,
    txId,
    quantity,
    status: FeeReceiptStatus.Open
  });
}

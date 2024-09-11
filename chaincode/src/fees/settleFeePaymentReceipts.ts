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
  ChainObject,
  FeeChannelPaymentReceipt, 
  FeeReceiptStatus,
  FeeUserPaymentReceipt,
  SettleFeePaymentReceiptsResponse
} from "@gala-chain/api";
import { GalaChainContext } from "../types";
import { getObjectByKey, getObjectsByKeys, putChainObject } from "../utils";
import { plainToInstance } from "class-transformer";

export interface SettleFeePaymentReceiptsParams {
  chainKeys: string[];
}

export async function settleFeePaymentReceipts(
  ctx: GalaChainContext,
  data: SettleFeePaymentReceiptsParams
): Promise<SettleFeePaymentReceiptsResponse> {
  const results = await getObjectsByKeys(ctx, FeeChannelPaymentReceipt, data.chainKeys);

  for (const receipt of results) {
    receipt.status = FeeReceiptStatus.Settled;

    await putChainObject(ctx, receipt);

    const { paidByUser, year, month, day, txId } = receipt;
    const userReceiptKey = ChainObject.getCompositeKeyFromParts(FeeUserPaymentReceipt.INDEX_KEY, [
      paidByUser,
      year,
      month,
      day,
      txId
    ]);

    const userReceipt = await getObjectByKey(ctx, FeeUserPaymentReceipt, userReceiptKey);

    userReceipt.status = FeeReceiptStatus.Settled;

    await putChainObject(ctx, userReceipt);
  }

  const response = plainToInstance(SettleFeePaymentReceiptsResponse, {
    results: results
  });

  return response;
}

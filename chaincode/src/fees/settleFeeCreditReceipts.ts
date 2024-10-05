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
import { FeeBalanceCreditReceipt, FeeReceiptStatus, SettleFeeCreditReceiptsResponse } from "@gala-chain/api";
import { plainToInstance } from "class-transformer";

import { GalaChainContext } from "../types";
import { getObjectsByKeys, putChainObject } from "../utils";

export interface SettleFeeCreditReceiptsParams {
  chainKeys: string[];
}

/**
 * Intended for use with cross-channel fees (i.e. secondary channels other than
 * the asset channel).
 *
 * Given an array of `FeeBalanceCreditReceipt` index keys,
 * query the entries and mark the `FeeBalanceCreditReceipt` entries as `Settled`.
 *
 * The intended flow cross-channel is that a secondary channel operator
 * first executes `settleFeeBalances` to zero out unspent fee credit authorizations
 * as needed.
 *
 * Then, after verifying that $GALA has been credited back on the
 * asset channel, the `FeeBalanceCreditReceipt` on the secondary channel can
 * be marked as `Settled`, indicating the credit has been issued and finalized.
 *
 * @param ctx
 * @param data
 * @returns
 */
export async function settleFeeCreditReceipts(
  ctx: GalaChainContext,
  data: SettleFeeCreditReceiptsParams
): Promise<SettleFeeCreditReceiptsResponse> {
  const results = await getObjectsByKeys(ctx, FeeBalanceCreditReceipt, data.chainKeys);

  for (const receipt of results) {
    receipt.status = FeeReceiptStatus.Settled;

    await putChainObject(ctx, receipt);
  }

  const response = plainToInstance(SettleFeeCreditReceiptsResponse, {
    results: results
  });

  return response;
}

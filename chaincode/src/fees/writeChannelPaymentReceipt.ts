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
import { FeeChannelPaymentReceipt, FeeReceiptStatus } from "@gala-chain/api";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import { GalaChainContext } from "../types";
import { putChainObject } from "../utils";

export interface WriteChannelPaymentReceiptParams {
  year: string;
  month: string;
  day: string;
  feeCode: string;
  paidByUser: string;
  txId: string;
  quantity: BigNumber;
  status: FeeReceiptStatus;
}
export async function writeChannelPaymentReceipt(
  ctx: GalaChainContext,
  data: WriteChannelPaymentReceiptParams
): Promise<void> {
  const channelPaymentReceipt: FeeChannelPaymentReceipt = plainToInstance(FeeChannelPaymentReceipt, data);

  await putChainObject(ctx, channelPaymentReceipt);
}

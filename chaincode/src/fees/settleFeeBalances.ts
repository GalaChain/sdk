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
  FeeBalanceCreditReceipt,
  FeeBalanceSettlement,
  FeePendingBalance,
  FeeReceiptStatus,
  SettleFeeBalancesResponse
} from "@gala-chain/api";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import { GalaChainContext } from "../types";
import { getObjectsByKeys, putChainObject, txUnixTimeToDateIndexKeys } from "../utils";

export interface SettleFeeBalancesParams {
  chainKeys: string[];
}

export async function settleFeeBalances(
  ctx: GalaChainContext,
  data: SettleFeeBalancesParams
): Promise<SettleFeeBalancesResponse> {
  const results = await getObjectsByKeys(ctx, FeePendingBalance, data.chainKeys);

  const settlementResults: FeeBalanceSettlement[] = [];

  const { year, month, day, hours, minutes, seconds } = txUnixTimeToDateIndexKeys(ctx.txUnixTime);
  const txId = ctx.stub.getTxID();

  for (const balance of results) {
    const unspentBalance: BigNumber = new BigNumber(balance.quantity);
    balance.quantity = new BigNumber("0");

    const settlement = plainToInstance(FeeBalanceSettlement, {
      balance: balance
    });

    if (unspentBalance.isEqualTo(0)) {
      settlementResults.push(settlement);
      continue;
    }

    const receipt: FeeBalanceCreditReceipt = plainToInstance(FeeBalanceCreditReceipt, {
      year,
      month,
      day,
      hours,
      minutes,
      seconds,
      creditToUser: balance.owner,
      txId,
      quantity: unspentBalance,
      status: FeeReceiptStatus.Open
    });

    await receipt.validateOrReject();

    await putChainObject(ctx, receipt);

    settlement.receipt = receipt;

    settlementResults.push(settlement);
  }

  const response = plainToInstance(SettleFeeBalancesResponse, {
    results: settlementResults
  });

  return response;
}

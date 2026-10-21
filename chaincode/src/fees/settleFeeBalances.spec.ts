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
  FeePendingBalance,
  FeeReceiptStatus,
  createValidChainObject
} from "@gala-chain/api";
import { fixture, users, writesMap } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { instanceToInstance, plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { GalaChainContext } from "../types";
import { txUnixTimeToDateIndexKeys } from "../utils";
import { settleFeeBalances } from "./settleFeeBalances";

describe("settleFeeBalances", () => {
  it("should persist a pending balance after clearing it", async () => {
    const balance = await createValidChainObject(FeePendingBalance, {
      owner: users.testUser1.identityKey,
      quantity: new BigNumber("5")
    });

    const { ctx, getWrites } = fixture<GalaChainContext, GalaChainTokenContract>(GalaChainTokenContract)
      .callingUser(users.testUser1)
      .savedState(balance);

    const { year, month, day, hours, minutes, seconds } = txUnixTimeToDateIndexKeys(ctx.txUnixTime);

    await settleFeeBalances(ctx, { chainKeys: [balance.getCompositeKey()] });
    await ctx.stub.flushWrites();

    const expectedBalance = instanceToInstance(balance);
    expectedBalance.quantity = new BigNumber("0");

    const expectedReceipt = plainToInstance(FeeBalanceCreditReceipt, {
      year,
      month,
      day,
      hours,
      minutes,
      seconds,
      creditToUser: balance.owner,
      txId: ctx.stub.getTxID(),
      quantity: new BigNumber("5"),
      status: FeeReceiptStatus.Open
    });

    expect(getWrites()).toEqual(writesMap(expectedBalance, expectedReceipt));
  });
});

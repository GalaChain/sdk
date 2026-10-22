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
  FeeAuthorization,
  FeeBalanceCreditReceipt,
  FeeChannelPaymentReceipt,
  FeeReceiptStatus,
  FeeUserPaymentReceipt,
  createValidChainObject
} from "@gala-chain/api";
import { fixture, users, writesMap } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import { GalaChainFeeContract } from "../__test__/GalaChainFeeContract";
import { fetchFeeAuthorizations } from "./fetchFeeAuthorizations";
import { fetchFeeCreditReceipts } from "./fetchFeeCreditReceipts";
import { fetchFeePayments } from "./fetchFeePayments";
import { writeChannelPaymentReceipt } from "./writeChannelPaymentReceipt";
import { writeUserPaymentReceipt } from "./writeUserPaymentReceipt";

describe("fee receipts", () => {
  const paidByUser = users.testUser1.identityKey;

  it("adds channel receipt quantities that share a key", async () => {
    const { ctx, getWrites } = fixture(GalaChainFeeContract);
    const base = {
      year: "2026",
      month: "01",
      day: "02",
      feeCode: "TransferToken",
      paidByUser,
      txId: "tx-1",
      status: FeeReceiptStatus.Open
    };

    await writeChannelPaymentReceipt(ctx, { ...base, quantity: new BigNumber("1") });
    await writeChannelPaymentReceipt(ctx, { ...base, quantity: new BigNumber("2.5") });
    await ctx.stub.flushWrites();

    const expected = await createValidChainObject(FeeChannelPaymentReceipt, {
      ...base,
      quantity: new BigNumber("3.5")
    });

    expect(getWrites()).toEqual(writesMap(expected));
  });

  it("adds user receipt quantities from different fee codes in one transaction", async () => {
    const { ctx, getWrites } = fixture(GalaChainFeeContract);
    const base = {
      paidByUser,
      year: "2026",
      month: "01",
      day: "02",
      txId: "tx-1",
      status: FeeReceiptStatus.Open
    };

    await writeUserPaymentReceipt(ctx, {
      ...base,
      feeCode: "TransferToken",
      quantity: new BigNumber("1")
    });
    await writeUserPaymentReceipt(ctx, {
      ...base,
      feeCode: "SwapTokenFill",
      quantity: new BigNumber("4")
    });
    await ctx.stub.flushWrites();

    const expected = plainToInstance(FeeUserPaymentReceipt, {
      ...base,
      feeCode: "SwapTokenFill",
      quantity: new BigNumber("5")
    });

    expect(getWrites()).toEqual(writesMap(expected));
  });

  it("finds a channel payment when feeCode is queried without an hour", async () => {
    const receipt = await createValidChainObject(FeeChannelPaymentReceipt, {
      year: "2026",
      month: "01",
      day: "02",
      feeCode: "TransferToken",
      paidByUser,
      txId: "tx-1",
      quantity: new BigNumber("1"),
      status: FeeReceiptStatus.Open
    });
    const { ctx } = fixture(GalaChainFeeContract).savedState(receipt);

    const response = await fetchFeePayments(ctx, {
      year: "2026",
      month: "01",
      day: "02",
      feeCode: "TransferToken"
    });

    expect(response.results.map((result) => result.value)).toEqual([receipt]);
  });

  it("finds an authorization by authority and transaction id", async () => {
    const authorization = await createValidChainObject(FeeAuthorization, {
      authority: paidByUser,
      year: "2026",
      month: "01",
      day: "02",
      txId: "tx-1",
      quantity: new BigNumber("10")
    });
    const { ctx } = fixture(GalaChainFeeContract).savedState(authorization);

    const response = await fetchFeeAuthorizations(ctx, {
      authority: paidByUser,
      year: "2026",
      month: "01",
      day: "02",
      txId: "tx-1"
    });

    expect(response.results).toEqual([authorization]);
  });

  it("finds a credit receipt when seconds is queried after minutes", async () => {
    const receipt = await createValidChainObject(FeeBalanceCreditReceipt, {
      year: "2026",
      month: "01",
      day: "02",
      hours: "14",
      minutes: "05",
      seconds: "09",
      creditToUser: paidByUser,
      txId: "tx-1",
      quantity: new BigNumber("7"),
      status: FeeReceiptStatus.Settled
    });
    const { ctx } = fixture(GalaChainFeeContract).savedState(receipt);

    const response = await fetchFeeCreditReceipts(ctx, {
      year: "2026",
      month: "01",
      day: "02",
      hours: "14",
      minutes: "05",
      seconds: "09"
    });

    expect(response.results.map((result) => result.value)).toEqual([receipt]);
  });
});

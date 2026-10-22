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
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import { FeeBalanceCreditReceipt } from "./FeeBalanceCreditReceipt";
import { FeeReceiptStatus } from "./FeeReceiptStatus";
import { FeeThresholdUses } from "./FeeThresholdUses";
import { FeeCreditReceiptKeyValueResult, FeeThresholdUsesKeyValueResult } from "./fee";

describe("fee query response types", () => {
  it("deserializes a credit receipt value as a balance credit receipt", () => {
    const result = plainToInstance(FeeCreditReceiptKeyValueResult, {
      key: "credit-key",
      value: {
        year: "2026",
        month: "01",
        day: "02",
        hours: "14",
        minutes: "05",
        seconds: "09",
        creditToUser: "client|alice",
        txId: "tx-1",
        quantity: "1.5",
        status: FeeReceiptStatus.Settled
      }
    });

    expect(result.value).toBeInstanceOf(FeeBalanceCreditReceipt);
    expect(result.value.seconds).toEqual("09");
    expect(result.value.quantity).toEqual(new BigNumber("1.5"));
  });

  it("deserializes threshold use quantities as big numbers", () => {
    const result = plainToInstance(FeeThresholdUsesKeyValueResult, {
      key: "threshold-key",
      value: {
        feeCode: "TransferToken",
        user: "client|alice",
        cumulativeUses: "4",
        cumulativeFeeQuantity: "1.25"
      }
    });

    expect(result.value).toBeInstanceOf(FeeThresholdUses);
    expect(result.value.cumulativeUses).toEqual(new BigNumber("4"));
    expect(result.value.cumulativeFeeQuantity).toEqual(new BigNumber("1.25"));
  });
});

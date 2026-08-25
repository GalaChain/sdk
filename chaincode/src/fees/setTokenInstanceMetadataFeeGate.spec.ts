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
  FeeAccelerationRateType,
  FeeChannelPaymentReceipt,
  FeeCodeDefinition,
  FeeGateCodes,
  FeePendingBalance,
  FeeReceiptStatus,
  FeeThresholdUses,
  FeeUserPaymentReceipt,
  SetTokenInstanceMetadataDto,
  TokenInstanceMetadataAttribute,
  TokenInstanceMetadataCustomField,
  createValidSubmitDTO
} from "@gala-chain/api";
import { fixture, nft, users, writesMap } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { GalaChainContext } from "../types";
import { txUnixTimeToDateIndexKeys } from "../utils";
import { setTokenInstanceMetadataFeeGate } from "./feeGateImplementations";

describe("setTokenInstanceMetadataFeeGate", () => {
  const feeCode = FeeGateCodes.SetTokenInstanceMetadata;

  const feeCodeDefinition = plainToInstance(FeeCodeDefinition, {
    feeCode,
    feeThresholdUses: new BigNumber("0"),
    feeThresholdTimePeriod: 0,
    baseQuantity: new BigNumber("1"),
    maxQuantity: new BigNumber(Infinity),
    maxUses: new BigNumber(Infinity),
    feeAccelerationRateType: FeeAccelerationRateType.CuratorDefined,
    feeAccelerationRate: new BigNumber("0"),
    isCrossChannel: true
  });

  const attribute = (i: number) =>
    plainToInstance(TokenInstanceMetadataAttribute, { traitType: `trait-${i}`, value: i });

  const customField = (i: number) =>
    plainToInstance(TokenInstanceMetadataCustomField, { key: `key-${i}`, value: `value-${i}` });

  async function setDto(attributeCount: number, customFieldCount = 0): Promise<SetTokenInstanceMetadataDto> {
    return createValidSubmitDTO(SetTokenInstanceMetadataDto, {
      tokenInstance: nft.tokenInstance1Key(),
      project: "TestProject",
      name: "Test Elixir #1",
      attributes:
        attributeCount > 0 ? Array.from({ length: attributeCount }, (_, i) => attribute(i)) : undefined,
      customFields:
        customFieldCount > 0 ? Array.from({ length: customFieldCount }, (_, i) => customField(i)) : undefined
    });
  }

  function expectedReceipts(ctx: GalaChainContext, quantity: BigNumber) {
    const { year, month, day } = txUnixTimeToDateIndexKeys(ctx.txUnixTime);

    const common = {
      year,
      month,
      day,
      paidByUser: users.testUser1.identityKey,
      txId: ctx.stub.getTxID(),
      feeCode,
      quantity,
      status: FeeReceiptStatus.Open
    };

    return {
      channelReceipt: plainToInstance(FeeChannelPaymentReceipt, common),
      userReceipt: plainToInstance(FeeUserPaymentReceipt, common)
    };
  }

  it("should charge the per-use fee plus one base fee per attribute and custom field", async () => {
    // Given
    const userPendingBalance = plainToInstance(FeePendingBalance, {
      owner: users.testUser1.identityKey,
      quantity: new BigNumber("1000")
    });

    const { ctx, getWrites } = fixture<GalaChainContext, GalaChainTokenContract>(GalaChainTokenContract)
      .callingUser(users.testUser1)
      .savedState(feeCodeDefinition, userPendingBalance);

    const dto = await setDto(3, 2);

    // per-use fee 1 + baseQuantity 1 * (3 attributes + 2 custom fields) = 6
    const expectedFeeAmount = new BigNumber("6");

    const expectedUsageWrite = plainToInstance(FeeThresholdUses, {
      feeCode,
      user: users.testUser1.identityKey,
      cumulativeUses: new BigNumber("1"),
      cumulativeFeeQuantity: expectedFeeAmount
    });

    const expectedBalanceWrite = plainToInstance(FeePendingBalance, {
      owner: users.testUser1.identityKey,
      quantity: userPendingBalance.quantity.minus(expectedFeeAmount)
    });

    const { channelReceipt, userReceipt } = expectedReceipts(ctx, expectedFeeAmount);

    // When
    const result = await setTokenInstanceMetadataFeeGate(ctx, dto)
      .then(() => ctx.stub.flushWrites())
      .catch((e) => e);

    // Then
    expect(result).toEqual(undefined);
    expect(getWrites()).toEqual(
      writesMap(expectedBalanceWrite, channelReceipt, userReceipt, expectedUsageWrite)
    );
  });

  it("should charge only the per-use fee when the document has no attributes or custom fields", async () => {
    // Given
    const userPendingBalance = plainToInstance(FeePendingBalance, {
      owner: users.testUser1.identityKey,
      quantity: new BigNumber("1000")
    });

    const { ctx, getWrites } = fixture<GalaChainContext, GalaChainTokenContract>(GalaChainTokenContract)
      .callingUser(users.testUser1)
      .savedState(feeCodeDefinition, userPendingBalance);

    const dto = await setDto(0);

    const expectedFeeAmount = feeCodeDefinition.baseQuantity;

    const expectedUsageWrite = plainToInstance(FeeThresholdUses, {
      feeCode,
      user: users.testUser1.identityKey,
      cumulativeUses: new BigNumber("1"),
      cumulativeFeeQuantity: expectedFeeAmount
    });

    const expectedBalanceWrite = plainToInstance(FeePendingBalance, {
      owner: users.testUser1.identityKey,
      quantity: userPendingBalance.quantity.minus(expectedFeeAmount)
    });

    const { channelReceipt, userReceipt } = expectedReceipts(ctx, expectedFeeAmount);

    // When
    const result = await setTokenInstanceMetadataFeeGate(ctx, dto)
      .then(() => ctx.stub.flushWrites())
      .catch((e) => e);

    // Then
    expect(result).toEqual(undefined);
    expect(getWrites()).toEqual(
      writesMap(expectedBalanceWrite, channelReceipt, userReceipt, expectedUsageWrite)
    );
  });

  it("should not charge when no FeeCodeDefinitions are on chain", async () => {
    // Given
    const { ctx, getWrites } = fixture<GalaChainContext, GalaChainTokenContract>(GalaChainTokenContract)
      .callingUser(users.testUser1)
      .savedState(); // no fee code definitions

    const dto = await setDto(3);

    const expectedUsageWrite = plainToInstance(FeeThresholdUses, {
      feeCode,
      user: users.testUser1.identityKey,
      cumulativeUses: new BigNumber("1"),
      cumulativeFeeQuantity: new BigNumber("0")
    });

    // When
    const result = await setTokenInstanceMetadataFeeGate(ctx, dto)
      .then(() => ctx.stub.flushWrites())
      .catch((e) => e);

    // Then
    expect(result).toEqual(undefined);
    expect(getWrites()).toEqual(writesMap(expectedUsageWrite));
  });
});

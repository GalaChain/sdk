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
  FeePendingBalance,
  FeeReceiptStatus,
  FeeThresholdUses,
  FeeUserPaymentReceipt,
  PaymentRequiredError
} from "@gala-chain/api";
import { GalaChainContext } from "../types";
import { fixture, users, writesMap } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { instanceToInstance, plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";

import { txUnixTimeToDateIndexKeys } from "../utils";
import { galaFeeGate } from "./galaFeeGate";

describe("feeGate", () => {
  const feeCode1 = "testCode";
  const feeThreshold = new BigNumber("10");

  // Imagine an accelerating Fee Code Schedule where:
  // first 10 uses are free.
  // second 10 uses cost 1 $GALA per use.
  // beyond that, 100 $GALA per use.
  const feeCodeDefinition1 = plainToInstance(FeeCodeDefinition, {
    feeCode: feeCode1,
    feeThresholdUses: feeThreshold,
    feeThresholdTimePeriod: 0,
    baseQuantity: new BigNumber("1"),
    maxQuantity: new BigNumber(Infinity),
    maxUses: new BigNumber(Infinity),
    feeAccelerationType: FeeAccelerationRateType.CuratorDefined,
    feeAccelerationRate: new BigNumber("0"),
    isCrossChannel: true
  });

  const feeCodeDefinition2 = instanceToInstance(feeCodeDefinition1);
  feeCodeDefinition2.feeThresholdUses = feeThreshold.plus(feeThreshold);
  feeCodeDefinition2.baseQuantity = new BigNumber("100");

  const feeCodeDefinition3 = instanceToInstance(feeCodeDefinition1);
  feeCodeDefinition3.feeThresholdUses = new BigNumber(0);
  (feeCodeDefinition3.feeAccelerationRateType = FeeAccelerationRateType.Multiplicative),
    (feeCodeDefinition3.baseQuantity = new BigNumber("2"));
  feeCodeDefinition3.feeAccelerationRate = new BigNumber("2");

  it("should proceed when existing usage is below the fee threshold", async () => {
    // Given
    const userThresholdUses = plainToInstance(FeeThresholdUses, {
      feeCode: feeCode1,
      user: users.testUser1Id,
      cumulativeUses: feeThreshold.minus("2"),
      cumulativeFeeQuantity: new BigNumber("0")
    });

    const { ctx, writes } = fixture<GalaChainContext, GalaChainTokenContract>(GalaChainTokenContract)
      .callingUser(users.testUser1Id)
      .savedState(feeCodeDefinition1, userThresholdUses);

    const expectedUsageWrite = instanceToInstance(userThresholdUses);
    expectedUsageWrite.cumulativeUses = userThresholdUses.cumulativeUses.plus("1");

    // When
    const result = await galaFeeGate(ctx, { feeCode: feeCode1 })
      .then(() => ctx.stub.flushWrites())
      .catch((e) => e);

    // Then
    expect(result).toEqual(undefined);
    expect(writes).toEqual(writesMap(expectedUsageWrite));
  });

  it("should deduct fees from the user balance when usage meets or exceeds a fee threshold", async () => {
    // Given
    const userThresholdUses = plainToInstance(FeeThresholdUses, {
      feeCode: feeCode1,
      user: users.testUser1Id,
      cumulativeUses: new BigNumber(feeThreshold),
      cumulativeFeeQuantity: new BigNumber("0")
    });

    const userPendingBalance = plainToInstance(FeePendingBalance, {
      owner: users.testUser1Id,
      quantity: new BigNumber("1000")
    });

    const { ctx, writes } = fixture<GalaChainContext, GalaChainTokenContract>(GalaChainTokenContract)
      .callingUser(users.testUser1Id)
      .savedState(feeCodeDefinition1, userThresholdUses, userPendingBalance);

    const expectedUsageWrite = instanceToInstance(userThresholdUses);
    expectedUsageWrite.cumulativeUses = userThresholdUses.cumulativeUses.plus("1");
    expectedUsageWrite.cumulativeFeeQuantity = userThresholdUses.cumulativeFeeQuantity.plus(
      feeCodeDefinition1.baseQuantity
    );

    const expectedBalanceWrite = instanceToInstance(userPendingBalance);
    expectedBalanceWrite.quantity = userPendingBalance.quantity.minus(feeCodeDefinition1.baseQuantity);

    const { year, month, day } = txUnixTimeToDateIndexKeys(ctx.txUnixTime);

    const expectedChannelPaymentReceipt = plainToInstance(FeeChannelPaymentReceipt, {
      year,
      month,
      day,
      paidByUser: users.testUser1Id,
      txId: ctx.stub.getTxID(),
      feeCode: feeCode1,
      quantity: feeCodeDefinition1.baseQuantity,
      status: FeeReceiptStatus.Open
    });

    const expectedUserPaymentReceipt = plainToInstance(FeeUserPaymentReceipt, {
      year,
      month,
      day,
      paidByUser: users.testUser1Id,
      txId: ctx.stub.getTxID(),
      feeCode: feeCode1,
      quantity: feeCodeDefinition1.baseQuantity,
      status: FeeReceiptStatus.Open
    });

    // When
    const result = await galaFeeGate(ctx, { feeCode: feeCode1 })
      .then(() => ctx.stub.flushWrites())
      .catch((e) => e);

    // Then
    expect(result).toEqual(undefined);
    expect(writes).toEqual(
      writesMap(
        expectedBalanceWrite,
        expectedChannelPaymentReceipt,
        expectedUserPaymentReceipt,
        expectedUsageWrite
      )
    );
  });

  it("should increase cost per use if additional FeeCodeDefinition tiers are defined", async () => {
    // Given
    const cumulativeUses = new BigNumber(feeCodeDefinition2.feeThresholdUses).minus("1");
    const cumulativePaid = cumulativeUses
      .minus(feeCodeDefinition1.feeThresholdUses)
      .times(feeCodeDefinition1.baseQuantity);

    const userThresholdUses = plainToInstance(FeeThresholdUses, {
      feeCode: feeCode1,
      user: users.testUser1Id,
      cumulativeUses: cumulativeUses,
      cumulativeFeeQuantity: cumulativePaid
    });

    const userPendingBalance = plainToInstance(FeePendingBalance, {
      owner: users.testUser1Id,
      quantity: new BigNumber("1000")
    });

    const { ctx, writes } = fixture<GalaChainContext, GalaChainTokenContract>(GalaChainTokenContract)
      .callingUser(users.testUser1Id)
      .savedState(feeCodeDefinition1, feeCodeDefinition2, userThresholdUses, userPendingBalance);

    const expectedUsageWrite = instanceToInstance(userThresholdUses);
    expectedUsageWrite.cumulativeUses = userThresholdUses.cumulativeUses.plus("1");
    expectedUsageWrite.cumulativeFeeQuantity = userThresholdUses.cumulativeFeeQuantity.plus(
      feeCodeDefinition2.baseQuantity
    );

    const expectedBalanceWrite = instanceToInstance(userPendingBalance);
    expectedBalanceWrite.quantity = userPendingBalance.quantity.minus(feeCodeDefinition2.baseQuantity);

    const { year, month, day } = txUnixTimeToDateIndexKeys(ctx.txUnixTime);

    const expectedChannelPaymentReceipt = plainToInstance(FeeChannelPaymentReceipt, {
      year,
      month,
      day,
      paidByUser: users.testUser1Id,
      txId: ctx.stub.getTxID(),
      feeCode: feeCode1,
      quantity: feeCodeDefinition2.baseQuantity,
      status: FeeReceiptStatus.Open
    });

    const expectedUserPaymentReceipt = plainToInstance(FeeUserPaymentReceipt, {
      year,
      month,
      day,
      paidByUser: users.testUser1Id,
      txId: ctx.stub.getTxID(),
      feeCode: feeCode1,
      quantity: feeCodeDefinition2.baseQuantity,
      status: FeeReceiptStatus.Open
    });

    // When
    const result = await galaFeeGate(ctx, { feeCode: feeCode1 })
      .then(() => ctx.stub.flushWrites())
      .catch((e) => e);

    // Then
    expect(result).toEqual(undefined);
    expect(writes).toEqual(
      writesMap(
        expectedBalanceWrite,
        expectedChannelPaymentReceipt,
        expectedUserPaymentReceipt,
        expectedUsageWrite
      )
    );
  });

  it("should charge Multiplicative fee amount", async () => {
    // Given
    const userThresholdUses = plainToInstance(FeeThresholdUses, {
      feeCode: feeCode1,
      user: users.testUser1Id,
      cumulativeUses: new BigNumber("3"),
      cumulativeFeeQuantity: new BigNumber("0")
    });

    const userPendingBalance = plainToInstance(FeePendingBalance, {
      owner: users.testUser1Id,
      quantity: new BigNumber("10000")
    });

    // baseQuantity * (feeAccelerationRate * (cumulativeUses + 1)) = expectedFeeAmount
    // 2 * (2*4) = 16
    const expectedFeeAmount = feeCodeDefinition3.baseQuantity.multipliedBy(
      feeCodeDefinition3.feeAccelerationRate.multipliedBy(userThresholdUses.cumulativeUses.plus("1"))
    );

    const { ctx, writes } = fixture<GalaChainContext, GalaChainTokenContract>(GalaChainTokenContract)
      .callingUser(users.testUser1Id)
      .savedState(feeCodeDefinition3, userThresholdUses, userPendingBalance);

    const expectedUsageWrite = instanceToInstance(userThresholdUses);
    expectedUsageWrite.cumulativeUses = userThresholdUses.cumulativeUses.plus("1");
    expectedUsageWrite.cumulativeFeeQuantity = expectedFeeAmount;

    const expectedBalanceWrite = instanceToInstance(userPendingBalance);
    expectedBalanceWrite.quantity = userPendingBalance.quantity.minus(expectedFeeAmount);

    const { year, month, day } = txUnixTimeToDateIndexKeys(ctx.txUnixTime);

    const expectedChannelPaymentReceipt = plainToInstance(FeeChannelPaymentReceipt, {
      year,
      month,
      day,
      paidByUser: users.testUser1Id,
      txId: ctx.stub.getTxID(),
      feeCode: feeCode1,
      quantity: expectedFeeAmount,
      status: FeeReceiptStatus.Open
    });

    const expectedUserPaymentReceipt = plainToInstance(FeeUserPaymentReceipt, {
      year,
      month,
      day,
      paidByUser: users.testUser1Id,
      txId: ctx.stub.getTxID(),
      feeCode: feeCode1,
      quantity: expectedFeeAmount,
      status: FeeReceiptStatus.Open
    });

    // When
    const result = await galaFeeGate(ctx, { feeCode: feeCode1 })
      .then(() => ctx.stub.flushWrites())
      .catch((e) => e);

    // Then
    expect(result).toEqual(undefined);
    expect(writes).toEqual(
      writesMap(
        expectedBalanceWrite,
        expectedChannelPaymentReceipt,
        expectedUserPaymentReceipt,
        expectedUsageWrite
      )
    );
  });

  it("should charge Exponential fee amount", async () => {
    // Given
    feeCodeDefinition3.feeAccelerationRateType = FeeAccelerationRateType.Exponential;

    const userThresholdUses = plainToInstance(FeeThresholdUses, {
      feeCode: feeCode1,
      user: users.testUser1Id,
      cumulativeUses: new BigNumber("3"),
      cumulativeFeeQuantity: new BigNumber("0")
    });

    const userPendingBalance = plainToInstance(FeePendingBalance, {
      owner: users.testUser1Id,
      quantity: new BigNumber("10000")
    });

    // baseQuantity * (feeAccelerationRate ^ (cumulativeUses + 1)) = expectedFeeAmount
    // 2 * (2^4) = 32
    const expectedFeeAmount = feeCodeDefinition3.baseQuantity.multipliedBy(
      Math.pow(
        feeCodeDefinition3.feeAccelerationRate.toNumber(),
        userThresholdUses.cumulativeUses.plus("1").toNumber()
      )
    );

    const { ctx, writes } = fixture<GalaChainContext, GalaChainTokenContract>(GalaChainTokenContract)
      .callingUser(users.testUser1Id)
      .savedState(feeCodeDefinition3, userThresholdUses, userPendingBalance);

    const expectedUsageWrite = instanceToInstance(userThresholdUses);
    expectedUsageWrite.cumulativeUses = userThresholdUses.cumulativeUses.plus("1");
    expectedUsageWrite.cumulativeFeeQuantity = expectedFeeAmount;

    const expectedBalanceWrite = instanceToInstance(userPendingBalance);
    expectedBalanceWrite.quantity = userPendingBalance.quantity.minus(expectedFeeAmount);

    const { year, month, day } = txUnixTimeToDateIndexKeys(ctx.txUnixTime);

    const expectedChannelPaymentReceipt = plainToInstance(FeeChannelPaymentReceipt, {
      year,
      month,
      day,
      paidByUser: users.testUser1Id,
      txId: ctx.stub.getTxID(),
      feeCode: feeCode1,
      quantity: expectedFeeAmount,
      status: FeeReceiptStatus.Open
    });

    const expectedUserPaymentReceipt = plainToInstance(FeeUserPaymentReceipt, {
      year,
      month,
      day,
      paidByUser: users.testUser1Id,
      txId: ctx.stub.getTxID(),
      feeCode: feeCode1,
      quantity: expectedFeeAmount,
      status: FeeReceiptStatus.Open
    });

    // When
    const result = await galaFeeGate(ctx, { feeCode: feeCode1 })
      .then(() => ctx.stub.flushWrites())
      .catch((e) => e);

    // Then
    expect(result).toEqual(undefined);
    expect(writes).toEqual(
      writesMap(
        expectedBalanceWrite,
        expectedChannelPaymentReceipt,
        expectedUserPaymentReceipt,
        expectedUsageWrite
      )
    );
  });

  it("should charge Logarithmic fee amount", async () => {
    // Given
    feeCodeDefinition3.feeAccelerationRateType = FeeAccelerationRateType.Logarithmic;

    const userThresholdUses = plainToInstance(FeeThresholdUses, {
      feeCode: feeCode1,
      user: users.testUser1Id,
      cumulativeUses: new BigNumber("3"),
      cumulativeFeeQuantity: new BigNumber("0")
    });

    const userPendingBalance = plainToInstance(FeePendingBalance, {
      owner: users.testUser1Id,
      quantity: new BigNumber("10000")
    });

    // baseQuantity + log(feeAccelerationRate * (cumulativeUses + 1)) = expectedFeeAmount
    // 2 + log(2*4) = 4.0794415416798357
    const expectedFeeAmount = feeCodeDefinition3.baseQuantity.plus(
      Math.log(
        userThresholdUses.cumulativeUses
          .plus("1")
          .multipliedBy(feeCodeDefinition3.feeAccelerationRate)
          .toNumber()
      )
    );

    const { ctx, writes } = fixture<GalaChainContext, GalaChainTokenContract>(GalaChainTokenContract)
      .callingUser(users.testUser1Id)
      .savedState(feeCodeDefinition3, userThresholdUses, userPendingBalance);

    const expectedUsageWrite = instanceToInstance(userThresholdUses);
    expectedUsageWrite.cumulativeUses = userThresholdUses.cumulativeUses.plus("1");
    expectedUsageWrite.cumulativeFeeQuantity = expectedFeeAmount;

    const expectedBalanceWrite = instanceToInstance(userPendingBalance);
    expectedBalanceWrite.quantity = userPendingBalance.quantity.minus(expectedFeeAmount);

    const { year, month, day } = txUnixTimeToDateIndexKeys(ctx.txUnixTime);

    const expectedChannelPaymentReceipt = plainToInstance(FeeChannelPaymentReceipt, {
      year,
      month,
      day,
      paidByUser: users.testUser1Id,
      txId: ctx.stub.getTxID(),
      feeCode: feeCode1,
      quantity: expectedFeeAmount,
      status: FeeReceiptStatus.Open
    });

    const expectedUserPaymentReceipt = plainToInstance(FeeUserPaymentReceipt, {
      year,
      month,
      day,
      paidByUser: users.testUser1Id,
      txId: ctx.stub.getTxID(),
      feeCode: feeCode1,
      quantity: expectedFeeAmount,
      status: FeeReceiptStatus.Open
    });

    // When
    const result = await galaFeeGate(ctx, { feeCode: feeCode1 })
      .then(() => ctx.stub.flushWrites())
      .catch((e) => e);

    // Then
    expect(result).toEqual(undefined);
    expect(writes).toEqual(
      writesMap(
        expectedBalanceWrite,
        expectedChannelPaymentReceipt,
        expectedUserPaymentReceipt,
        expectedUsageWrite
      )
    );
  });

  it("should fail the transaction if the user has no pending balance for chain fees", async () => {
    // Given
    const cumulativeUses = new BigNumber(feeCodeDefinition2.feeThresholdUses).minus("1");
    const cumulativePaid = cumulativeUses
      .minus(feeCodeDefinition1.feeThresholdUses)
      .times(feeCodeDefinition1.baseQuantity);

    const userThresholdUses = plainToInstance(FeeThresholdUses, {
      feeCode: feeCode1,
      user: users.testUser1Id,
      cumulativeUses: cumulativeUses,
      cumulativeFeeQuantity: cumulativePaid
    });

    const { ctx, writes } = fixture<GalaChainContext, GalaChainTokenContract>(GalaChainTokenContract)
      .callingUser(users.testUser1Id)
      .savedState(feeCodeDefinition1, feeCodeDefinition2, userThresholdUses);

    const expectedErrorMessage =
      `Payment Required: Transaction requires fee of ` +
      `${feeCodeDefinition2.baseQuantity.toString()}. ` +
      `FeePendingBalance not found on chain for user: ${users.testUser1Id}`;

    // When
    const result = await galaFeeGate(ctx, { feeCode: feeCode1 }).catch((e) => e);

    // Then
    expect(result).toEqual(
      new PaymentRequiredError(expectedErrorMessage, {
        paymentRequired: feeCodeDefinition2.baseQuantity.toString()
      })
    );
    expect(writes).toEqual({});
  });

  it("should fail the transaction if pending balance is less than required fees", async () => {
    // Given
    const cumulativeUses = new BigNumber(feeCodeDefinition2.feeThresholdUses).minus("1");
    const cumulativePaid = cumulativeUses
      .minus(feeCodeDefinition1.feeThresholdUses)
      .times(feeCodeDefinition1.baseQuantity);

    const userThresholdUses = plainToInstance(FeeThresholdUses, {
      feeCode: feeCode1,
      user: users.testUser1Id,
      cumulativeUses: cumulativeUses,
      cumulativeFeeQuantity: cumulativePaid
    });

    const userPendingBalance = plainToInstance(FeePendingBalance, {
      owner: users.testUser1Id,
      quantity: new BigNumber(feeCodeDefinition2.baseQuantity).minus("1")
    });

    const { ctx, writes } = fixture<GalaChainContext, GalaChainTokenContract>(GalaChainTokenContract)
      .callingUser(users.testUser1Id)
      .savedState(feeCodeDefinition1, feeCodeDefinition2, userThresholdUses, userPendingBalance);

    const expectedErrorMessage =
      `Payment Required: Transaction requires fee of ` +
      `${feeCodeDefinition2.baseQuantity.toString()}.  ` +
      `User balance: ${userPendingBalance.quantity.toString()}`;

    // When
    const result = await galaFeeGate(ctx, { feeCode: feeCode1 }).catch((e) => e);

    // Then
    expect(result).toEqual(
      new PaymentRequiredError(expectedErrorMessage, {
        payload: new BigNumber(feeCodeDefinition2.baseQuantity).minus("1").toString()
      })
    );
    expect(writes).toEqual({});
  });

  it("should not prevent user actions if FeeCodeDefinitions are not on chain", async () => {
    // Given
    const cumulativeUses = new BigNumber(feeCodeDefinition2.feeThresholdUses).minus("1");
    const cumulativePaid = cumulativeUses
      .minus(feeCodeDefinition1.feeThresholdUses)
      .times(feeCodeDefinition1.baseQuantity);

    const userThresholdUses = plainToInstance(FeeThresholdUses, {
      feeCode: feeCode1,
      user: users.testUser1Id,
      cumulativeUses: cumulativeUses,
      cumulativeFeeQuantity: cumulativePaid
    });

    const userPendingBalance = plainToInstance(FeePendingBalance, {
      owner: users.testUser1Id,
      quantity: new BigNumber(feeCodeDefinition2.baseQuantity).minus("1")
    });

    const { ctx, writes } = fixture<GalaChainContext, GalaChainTokenContract>(GalaChainTokenContract)
      .callingUser(users.testUser1Id)
      .savedState(userThresholdUses, userPendingBalance);

    const expectedUsageWrite = instanceToInstance(userThresholdUses);
    expectedUsageWrite.cumulativeUses = userThresholdUses.cumulativeUses.plus("1");

    // When
    const result = await galaFeeGate(ctx, { feeCode: feeCode1 })
      .then(() => ctx.stub.flushWrites())
      .catch((e) => e);

    // Then
    expect(result).toEqual(undefined);
    expect(writes).toEqual(writesMap(expectedUsageWrite));
  });
});

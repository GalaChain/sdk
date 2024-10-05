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
  ChainError,
  ChainObject,
  ErrorCode,
  FeeAccelerationRateType,
  FeeCodeDefinition,
  FeeExemption,
  FeeThresholdUses
} from "@gala-chain/api";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import { GalaChainContext } from "../types";
import { getObjectByKey, getObjectsByPartialCompositeKey, putChainObject } from "../utils";
import { payFeeFromCrossChannelAuthorization } from "./payFeeFromCrossChannelAuthorization";
import { payFeeImmediatelyFromBalance } from "./payFeeImmediatelyFromBalance";

export interface GalaFeeGateParams {
  feeCode: string;
  activeUser?: string | undefined;
}

/**
 * A standardized, pre-defined Fee Gate designed to work with `FeeUsageThreshold`,
 * `FeeCodeDefinition`, and `FeeCodeDefintion.FeeAccelerationRateType` schemes to
 * increase fees for heavy, abusive, or denial-of-service level usage by individual
 * identities. Fees will increase by the defined acceleration rate as users hit
 * increasingly high usage thresholds defined by authoritative channel operators.
 *
 * @param ctx
 * @param data
 * @returns
 */
export async function galaFeeGate(ctx: GalaChainContext, data: GalaFeeGateParams) {
  const user = data.activeUser ?? ctx.callingUser;

  const exemption: FeeExemption | ChainError = await getObjectByKey(
    ctx,
    FeeExemption,
    FeeExemption.getCompositeKeyFromParts(FeeExemption.INDEX_KEY, [user])
  ).catch((e) => ChainError.from(e));

  if (exemption instanceof ChainError && exemption.code !== ErrorCode.NOT_FOUND) {
    throw exemption;
  }

  if (exemption instanceof FeeExemption) {
    if (exemption.limitedTo === undefined || exemption.limitedTo?.includes(data.feeCode)) {
      // user is exempt from this fee, end any further fee gate processing
      return;
    }
  }

  const { feeAmount, feeCodeDefinitions } = await writeUsageAndCalculateFeeAmount(ctx, data);

  if (feeAmount.isGreaterThan("0")) {
    const isCrossChannelFee = feeCodeDefinitions[0]?.isCrossChannel ?? false;

    if (isCrossChannelFee) {
      await payFeeFromCrossChannelAuthorization(ctx, { quantity: feeAmount, feeCode: data.feeCode });
    } else {
      await payFeeImmediatelyFromBalance(ctx, { quantity: feeAmount, feeCode: data.feeCode });
    }
  }
}

export interface FeeAmountAndUses {
  feeAmount: BigNumber;
  feeCodeDefinitions: FeeCodeDefinition[];
  cumulativeUses: BigNumber;
}

export async function writeUsageAndCalculateFeeAmount(
  ctx: GalaChainContext,
  data: GalaFeeGateParams
): Promise<FeeAmountAndUses> {
  const user = data.activeUser ?? ctx.callingUser;
  const { feeCode } = data;

  const feeCodeDefinitions = await getObjectsByPartialCompositeKey(
    ctx,
    FeeCodeDefinition.INDEX_KEY,
    [feeCode],
    FeeCodeDefinition
  );

  feeCodeDefinitions.sort((a: FeeCodeDefinition, b: FeeCodeDefinition) => {
    return a.feeThresholdUses.minus(b.feeThresholdUses).toNumber();
  });

  const useThresholdChainKey = ChainObject.getCompositeKeyFromParts(FeeThresholdUses.INDEX_KEY, [
    feeCode,
    user
  ]);

  const existingUseThreshold = await getObjectByKey(ctx, FeeThresholdUses, useThresholdChainKey).catch(
    () => undefined
  );

  const userFeeThresholdUses =
    existingUseThreshold ??
    plainToInstance(FeeThresholdUses, {
      feeCode,
      user,
      cumulativeUses: new BigNumber("0"),
      cumulativeFeeQuantity: new BigNumber("0")
    });

  const { feeAmount, cumulativeUses } = incrementCumulativeUsesAndCalculateFee(
    feeCodeDefinitions,
    userFeeThresholdUses
  );

  const currentCumulativeFees = userFeeThresholdUses.cumulativeFeeQuantity.plus(feeAmount);

  userFeeThresholdUses.cumulativeUses = cumulativeUses;
  userFeeThresholdUses.cumulativeFeeQuantity = currentCumulativeFees;

  await putChainObject(ctx, userFeeThresholdUses);

  return { feeAmount, feeCodeDefinitions, cumulativeUses };
}

export interface cumulativeUsesAndFeeAmount {
  feeAmount: BigNumber;
  cumulativeUses: BigNumber;
}

export function incrementCumulativeUsesAndCalculateFee(
  feeCodeDefinitions: FeeCodeDefinition[],
  userFeeThresholdUses: FeeThresholdUses
): cumulativeUsesAndFeeAmount {
  // for now, billing is more straightforward when this is issued once per use
  // future developments may see a need for multiple billings per transaction,
  // like a batch operation. Initial implementation requires the batch method to
  // call this once per use.
  // This 1) allows defining multiple FeeCodeDefinition objects for fees that increase as
  // usage threshold increases while 2) preventing the need to calculate "buckets" of
  // varying amounts for fees collected below
  const usageQuantity = new BigNumber("1");
  const cumulativeUses = userFeeThresholdUses.cumulativeUses.plus(usageQuantity);

  const feeAmount = calculateFeeAmountBasedOnAccelerationRateType(feeCodeDefinitions, cumulativeUses);

  return { feeAmount, cumulativeUses };
}

function calculateFeeAmountBasedOnAccelerationRateType(
  feeCodeDefinitions: FeeCodeDefinition[],
  cumulativeUses: BigNumber
): BigNumber {
  let feeAmount = new BigNumber("0");

  for (let i = feeCodeDefinitions.length - 1; i >= 0; i--) {
    if (cumulativeUses.isLessThan(feeCodeDefinitions[i].feeThresholdUses)) {
      continue;
    }

    const billableCode: FeeCodeDefinition = feeCodeDefinitions[i];
    const chargeableUses = cumulativeUses.minus(billableCode.feeThresholdUses);

    switch (billableCode.feeAccelerationRateType) {
      case FeeAccelerationRateType.CuratorDefined:
      case FeeAccelerationRateType.Additive:
        feeAmount = billableCode.baseQuantity.plus(
          chargeableUses.multipliedBy(billableCode.feeAccelerationRate)
        ); // baseQuantity + (chargeableUses * feeAccelerationRate)
        break;
      case FeeAccelerationRateType.Multiplicative:
        feeAmount = billableCode.baseQuantity.multipliedBy(
          chargeableUses.multipliedBy(billableCode.feeAccelerationRate)
        ); // baseQuantity * (chargeableUses * feeAccelerationRate)
        break;
      case FeeAccelerationRateType.Exponential:
        feeAmount = billableCode.baseQuantity.multipliedBy(
          Math.pow(billableCode.feeAccelerationRate.toNumber(), chargeableUses.toNumber())
        ); // baseQuantity * feeAccelerationRate^chargeableUses
        break;
      case FeeAccelerationRateType.Logarithmic:
        // feeAmount = baseQuantity * cumulativeUses^feeAccelerationRate + feeThresholdUses
        feeAmount = billableCode.baseQuantity.plus(
          Math.log(chargeableUses.multipliedBy(billableCode.feeAccelerationRate).toNumber())
        ); // baseQuantity + log(chargeableUses * feeAccelerationRate)
        break;
      case FeeAccelerationRateType.Custom:
        // Expect Custom FeeCodeDefintions rate accelerations to be calculated elsewhere
        continue;
      default:
        //feeAmount = feeAmount.plus(billableCode.baseQuantity);
        feeAmount = billableCode.baseQuantity.plus(
          chargeableUses.multipliedBy(billableCode.feeAccelerationRate)
        );
        break;
    }

    break;
  }

  feeAmount = feeAmount.decimalPlaces(FeeCodeDefinition.DECIMAL_PRECISION);

  return feeAmount;
}

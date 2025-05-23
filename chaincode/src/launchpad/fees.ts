import {
  FeeReceiptStatus,
  LaunchpadFeeConfig,
  LaunchpadSale,
  SlippageToleranceExceededError
} from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { writeChannelPaymentReceipt, writeUserPaymentReceipt } from "../fees";
import { transferToken } from "../transfer";
import { GalaChainContext } from "../types";
import { getObjectByKey, txUnixTimeToDateIndexKeys } from "../utils";

const REVERSE_BONDING_CURVE_FEE_ALPHA = new BigNumber("0.5"); // 50% of the amount of native token to be received
const REVERSE_BONDING_CURVE_FEE_CODE = "LaunchpadReverseBondingCurveFee";
const NATIVE_TOKEN_DECIMALS = 8;

export function calculateReverseBondingCurveFee(sale: LaunchpadSale, nativeTokensToReceive: BigNumber) {
  if (
    !sale.reverseBondingCurveConfiguration ||
    sale.reverseBondingCurveConfiguration.maxFeePortion.isZero()
  ) {
    return BigNumber(0);
  }

  const { minFeePortion, maxFeePortion } = sale.reverseBondingCurveConfiguration;
  const feePortionDiff = maxFeePortion.minus(minFeePortion);
  const adjustedAlpha = REVERSE_BONDING_CURVE_FEE_ALPHA.multipliedBy(feePortionDiff);
  const feePortion = minFeePortion.plus(adjustedAlpha);
  const circulatingSupplyProportional = sale.fetchCirculatingSupplyProportional();

  const feeAmount = circulatingSupplyProportional
    .multipliedBy(feePortion)
    .multipliedBy(nativeTokensToReceive)
    .decimalPlaces(NATIVE_TOKEN_DECIMALS, BigNumber.ROUND_UP);

  return feeAmount;
}

export async function payReverseBondingCurveFee(
  ctx: GalaChainContext,
  sale: LaunchpadSale,
  nativeTokensToReceive: BigNumber,
  maxAcceptableFee?: BigNumber
) {
  const feeAmount = await calculateReverseBondingCurveFee(sale, nativeTokensToReceive);

  if (feeAmount.isZero()) {
    return; // No fee
  }

  if (maxAcceptableFee && feeAmount.isGreaterThan(maxAcceptableFee)) {
    throw new SlippageToleranceExceededError("Fee exceeds maximum acceptable amount");
  }

  const launchpadConfigKey = ctx.stub.createCompositeKey(LaunchpadFeeConfig.INDEX_KEY, []);
  const launchpadConfig = await getObjectByKey(ctx, LaunchpadFeeConfig, launchpadConfigKey);
  const nativeToken = sale.fetchNativeTokenInstanceKey();
  const { year, month, day } = txUnixTimeToDateIndexKeys(ctx.txUnixTime);
  const txId = ctx.stub.getTxID();

  await Promise.all([
    writeChannelPaymentReceipt(ctx, {
      year,
      month,
      day,
      feeCode: REVERSE_BONDING_CURVE_FEE_CODE,
      paidByUser: ctx.callingUser,
      txId,
      quantity: feeAmount,
      status: FeeReceiptStatus.Settled
    }),
    writeUserPaymentReceipt(ctx, {
      paidByUser: ctx.callingUser,
      year,
      month,
      day,
      feeCode: REVERSE_BONDING_CURVE_FEE_CODE,
      txId,
      quantity: feeAmount,
      status: FeeReceiptStatus.Settled
    }),
    transferToken(ctx, {
      to: launchpadConfig.feeAddress,
      from: ctx.callingUser,
      tokenInstanceKey: nativeToken,
      quantity: feeAmount,
      allowancesToUse: [],
      authorizedOnBehalf: undefined
    })
  ]);
}

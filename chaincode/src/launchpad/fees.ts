import { FeeReceiptStatus, LaunchpadSale } from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { burnTokens } from "../burns";
import { writeChannelPaymentReceipt, writeUserPaymentReceipt } from "../fees";
import { GalaChainContext } from "../types";
import { txUnixTimeToDateIndexKeys } from "../utils";

const REVERSE_BONDING_CURVE_FEE_ALPHA = new BigNumber("0.5"); // 50% of the amount of native token to be received
const REVERSE_BONDING_CURVE_FEE_CODE = "LaunchpadReverseBondingCurveFee";
const NATIVE_TOKEN_DECIMALS = 8;

export async function payReverseBondingCurveFee(
  ctx: GalaChainContext,
  sale: LaunchpadSale,
  nativeTokensToReceive: BigNumber
) {
  if (!sale.reverseBondingCurveConfiguration) {
    return; // No fee
  }

  const nativeToken = sale.fetchNativeTokenInstanceKey();
  const minFee = nativeTokensToReceive.multipliedBy(sale.reverseBondingCurveConfiguration.minFeePortion);
  const maxFee = nativeTokensToReceive.multipliedBy(sale.reverseBondingCurveConfiguration.maxFeePortion);

  const feeAmountUncoerced = sale
    .fetchCirculatingSupplyProportional()
    .multipliedBy(REVERSE_BONDING_CURVE_FEE_ALPHA)
    .multipliedBy(nativeTokensToReceive)
    .decimalPlaces(NATIVE_TOKEN_DECIMALS, BigNumber.ROUND_UP);

  const feeAmount = BigNumber.max(minFee, BigNumber.min(maxFee, feeAmountUncoerced));

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
    /* TODO: This should be a transfer of some sort - Need to clarify with Sergey where the fee should go */
    burnTokens(ctx, {
      owner: ctx.callingUser,
      toBurn: [
        {
          tokenInstanceKey: nativeToken,
          quantity: feeAmount
        }
      ]
    })
  ]);
}

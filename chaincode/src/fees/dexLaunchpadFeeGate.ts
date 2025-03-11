import { ChainCallDTO, FeeGateCodes } from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { galaFeeGate } from "./galaFeeGate";

export async function createPoolFeeGate(ctx: GalaChainContext, dto: ChainCallDTO) {
  return galaFeeGate(ctx, { feeCode: FeeGateCodes.CreatePool });
}

export async function addLiquidityFeeGate(ctx: GalaChainContext, dto: ChainCallDTO) {
  return galaFeeGate(ctx, { feeCode: FeeGateCodes.AddLiquidity });
}

export async function removeLiquidityFeeGate(ctx: GalaChainContext, dto: ChainCallDTO) {
  return galaFeeGate(ctx, { feeCode: FeeGateCodes.RemoveLiquidity });
}

export async function swapFeeGate(ctx: GalaChainContext, dto: ChainCallDTO) {
  return galaFeeGate(ctx, { feeCode: FeeGateCodes.Swap });
}

export async function collectPositionFeesFeeGate(ctx: GalaChainContext, dto: ChainCallDTO) {
  return galaFeeGate(ctx, { feeCode: FeeGateCodes.CollectPositionFees });
}

export async function createSaleFeeGate(ctx: GalaChainContext, dto: ChainCallDTO) {
  return galaFeeGate(ctx, { feeCode: FeeGateCodes.CreateSale });
}

export async function buyExactTokenFeeGate(ctx: GalaChainContext, dto: ChainCallDTO) {
  return galaFeeGate(ctx, { feeCode: FeeGateCodes.BuyExactToken });
}

export async function sellExactTokenFeeGate(ctx: GalaChainContext, dto: ChainCallDTO) {
  return galaFeeGate(ctx, { feeCode: FeeGateCodes.SellExactToken });
}

export async function buyWithNativeFeeGate(ctx: GalaChainContext, dto: ChainCallDTO) {
  return galaFeeGate(ctx, { feeCode: FeeGateCodes.BuyWithNative });
}

export async function sellWithNativeFeeGate(ctx: GalaChainContext, dto: ChainCallDTO) {
  return galaFeeGate(ctx, { feeCode: FeeGateCodes.SellWithNative });
}

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
  AddLiquidityDTO,
  AddLiquidityResDto,
  BurnDto,
  BurnEstimateDto,
  ChainCallDTO,
  CollectDto,
  CollectTradingFeesDto,
  CollectTradingFeesResDto,
  ConfigureDexFeeAddressDto,
  CreatePoolDto,
  DexFeeConfig,
  GetAddLiquidityEstimationDto,
  GetAddLiquidityEstimationResDto,
  GetLiquidityResDto,
  GetPoolDto,
  GetPositionDto,
  GetPositionResDto,
  GetRemoveLiqEstimationResDto,
  GetUserPositionsDto,
  GetUserPositionsResDto,
  NotFoundError,
  Pool,
  QuoteExactAmountDto,
  QuoteExactAmountResDto,
  SetProtocolFeeDto,
  SetProtocolFeeResDto,
  Slot0ResDto,
  SwapDto,
  SwapResDto,
  UserBalanceResDto
} from "@gala-chain/api";

import { version } from "../../package.json";
import {
  addLiquidity,
  burn,
  collect,
  collectTradingFees,
  configureDexFeeAddress,
  createPool,
  getAddLiquidityEstimation,
  getDexFeesConfigration,
  getLiquidity,
  getPoolData,
  getPositions,
  getRemoveLiquidityEstimation,
  getSlot0,
  getUserPositions,
  quoteExactAmount,
  setProtocolFee,
  swap
} from "../dex";
import {
  addLiquidityFeeGate,
  collectPositionFeesFeeGate,
  createPoolFeeGate,
  removeLiquidityFeeGate,
  swapFeeGate
} from "../fees/dexLaunchpadFeeGate";
import { GalaChainContext } from "../types";
import { GalaContract } from "./GalaContract";
import { EVALUATE, Evaluate, GalaTransaction, Submit } from "./GalaTransaction";

export class DexV3Contract extends GalaContract {
  constructor() {
    super("DexV3Contract", version);
  }

  @Submit({
    in: CreatePoolDto,
    out: Pool,
    before: createPoolFeeGate
  })
  public async CreatePool(ctx: GalaChainContext, dto: CreatePoolDto): Promise<Pool> {
    return await createPool(ctx, dto);
  }

  @Submit({
    in: AddLiquidityDTO,
    out: AddLiquidityResDto,
    before: addLiquidityFeeGate
  })
  public async AddLiquidity(ctx: GalaChainContext, dto: AddLiquidityDTO): Promise<AddLiquidityResDto> {
    return await addLiquidity(ctx, dto);
  }

  @Submit({
    in: SwapDto,
    out: SwapResDto,
    before: swapFeeGate
  })
  public async Swap(ctx: GalaChainContext, dto: SwapDto): Promise<SwapResDto> {
    return await swap(ctx, dto);
  }

  @Submit({
    in: BurnDto,
    out: UserBalanceResDto,
    before: removeLiquidityFeeGate
  })
  public async RemoveLiquidity(ctx: GalaChainContext, dto: BurnDto): Promise<UserBalanceResDto> {
    return await burn(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: GetPoolDto,
    out: Slot0ResDto
  })
  public async GetSlot0(ctx: GalaChainContext, dto: GetPoolDto): Promise<Slot0ResDto> {
    return await getSlot0(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: GetPoolDto,
    out: GetLiquidityResDto
  })
  public async GetLiquidity(ctx: GalaChainContext, dto: GetPoolDto): Promise<GetLiquidityResDto> {
    return await getLiquidity(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: GetPositionDto,
    out: GetPositionResDto
  })
  public async GetPositions(ctx: GalaChainContext, dto: GetPositionDto): Promise<GetPositionResDto> {
    return await getPositions(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: GetUserPositionsDto,
    out: GetUserPositionsResDto
  })
  public async GetUserPositions(
    ctx: GalaChainContext,
    dto: GetUserPositionsDto
  ): Promise<GetUserPositionsResDto> {
    return await getUserPositions(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: GetAddLiquidityEstimationDto,
    out: GetAddLiquidityEstimationResDto
  })
  public async GetAddLiquidityEstimation(
    ctx: GalaChainContext,
    dto: GetAddLiquidityEstimationDto
  ): Promise<GetAddLiquidityEstimationResDto> {
    return await getAddLiquidityEstimation(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: QuoteExactAmountDto,
    out: QuoteExactAmountResDto
  })
  public async QuoteExactAmount(
    ctx: GalaChainContext,
    dto: QuoteExactAmountDto
  ): Promise<QuoteExactAmountResDto> {
    return await quoteExactAmount(ctx, dto);
  }
  @GalaTransaction({
    type: EVALUATE,
    in: GetPoolDto,
    out: Pool
  })
  public async GetPoolData(ctx: GalaChainContext, dto: GetPoolDto): Promise<Pool> {
    return (
      (await getPoolData(ctx, dto)) ??
      (() => {
        throw new NotFoundError("Pool data not found");
      })()
    );
  }

  @GalaTransaction({
    type: EVALUATE,
    in: BurnEstimateDto,
    out: GetRemoveLiqEstimationResDto
  })
  public async GetRemoveLiquidityEstimation(
    ctx: GalaChainContext,
    dto: BurnEstimateDto
  ): Promise<GetRemoveLiqEstimationResDto> {
    return await getRemoveLiquidityEstimation(ctx, dto);
  }

  @Submit({
    in: CollectDto,
    out: UserBalanceResDto,
    before: collectPositionFeesFeeGate
  })
  public async CollectPositionFees(ctx: GalaChainContext, dto: CollectDto): Promise<UserBalanceResDto> {
    return await collect(ctx, dto);
  }

  @Submit({
    in: CollectTradingFeesDto,
    out: CollectTradingFeesResDto,
    allowedOrgs: ["CuratorOrg"]
  })
  public async CollectTradingFees(
    ctx: GalaChainContext,
    dto: CollectTradingFeesDto
  ): Promise<CollectTradingFeesResDto> {
    return await collectTradingFees(ctx, dto);
  }

  @Submit({
    in: SetProtocolFeeDto,
    out: SetProtocolFeeResDto,
    allowedOrgs: ["CuratorOrg"]
  })
  public async SetProtocolFee(ctx: GalaChainContext, dto: SetProtocolFeeDto): Promise<SetProtocolFeeResDto> {
    return await setProtocolFee(ctx, dto);
  }

  @Evaluate({
    in: ChainCallDTO,
    out: DexFeeConfig,
    allowedOrgs: ["CuratorOrg"]
  })
  public async GetDexFeeConfigration(ctx: GalaChainContext, dto: ChainCallDTO): Promise<DexFeeConfig> {
    return getDexFeesConfigration(ctx, dto);
  }

  @Submit({
    in: ConfigureDexFeeAddressDto,
    out: DexFeeConfig,
    allowedOrgs: ["CuratorOrg"]
  })
  public async ConfigureDexFeeAddress(
    ctx: GalaChainContext,
    dto: ConfigureDexFeeAddressDto
  ): Promise<DexFeeConfig> {
    return configureDexFeeAddress(ctx, dto);
  }
}

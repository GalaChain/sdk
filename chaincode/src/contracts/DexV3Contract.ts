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
  AddLiquidityResponseDTO,
  BurnDto,
  ChainCallDTO,
  CollectDTO,
  CollectProtocolFeesDTO,
  ConfigurePlatformFeeAddressDto,
  CreatePoolDto,
  ExpectedTokenDTO,
  GetPoolDto,
  GetPositionDto,
  GetUserPositionResponse,
  GetUserPositionsDto,
  PlatformFeeConfig,
  Pool,
  PositionDataDTO,
  QuoteExactAmountDto,
  SetProtocolFeeDTO,
  Slot0Dto,
  SwapDto,
  SwapResponseDto,
  UserBalanceResponseDto
} from "@gala-chain/api";

import { version } from "../../package.json";
import {
  addLiquidity,
  burn,
  collect,
  createPool,
  getAddLiquidityEstimation,
  getLiquidity,
  getPoolData,
  getPositions,
  getRemoveLiquidityEstimation,
  getSlot0,
  getUserPositions,
  quoteExactAmount,
  swap
} from "../dex";
import { collectProtocolFees } from "../dex/collectProtocolFee";
import { setProtocolFee } from "../dex/setProtocolFee";
import { GalaChainContext } from "../types";
import { GalaContract } from "./GalaContract";
import { EVALUATE, Evaluate, GalaTransaction, Submit } from "./GalaTransaction";
import { configurePlatformFeeAddress, fetchPlatformAddressConfig } from "./platformfee";

export class DexV3Contract extends GalaContract {
  constructor() {
    super("DexV3Contract", version);
  }

  @Submit({
    in: CreatePoolDto,
    out: Pool
  })
  public async CreatePool(ctx: GalaChainContext, dto: CreatePoolDto): Promise<Pool> {
    return await createPool(ctx, dto);
  }

  @Submit({
    in: AddLiquidityDTO,
    out: AddLiquidityResponseDTO
  })
  public async AddLiquidity(ctx: GalaChainContext, dto: AddLiquidityDTO): Promise<AddLiquidityResponseDTO> {
    return await addLiquidity(ctx, dto);
  }

  @Submit({
    in: SwapDto,
    out: SwapResponseDto
  })
  public async Swap(ctx: GalaChainContext, dto: SwapDto): Promise<SwapResponseDto> {
    return await swap(ctx, dto);
  }

  @Submit({
    in: BurnDto,
    out: UserBalanceResponseDto
  })
  public async RemoveLiquidity(ctx: GalaChainContext, dto: BurnDto): Promise<UserBalanceResponseDto> {
    return await burn(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: GetPoolDto,
    out: Slot0Dto
  })
  public async GetSlot0(ctx: GalaChainContext, dto: GetPoolDto): Promise<Slot0Dto> {
    return await getSlot0(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: GetPoolDto,
    out: String
  })
  public async GetLiquidity(ctx: GalaChainContext, dto: GetPoolDto): Promise<string> {
    return await getLiquidity(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: GetPositionDto,
    out: PositionDataDTO
  })
  public async GetPositions(ctx: GalaChainContext, dto: GetPositionDto): Promise<PositionDataDTO> {
    return await getPositions(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: GetUserPositionsDto,
    out: GetUserPositionResponse
  })
  public async GetUserPositions(
    ctx: GalaChainContext,
    dto: GetUserPositionsDto
  ): Promise<GetUserPositionResponse> {
    return await getUserPositions(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: ExpectedTokenDTO,
    out: Array<string>
  })
  public async GetAddLiquidityEstimation(ctx: GalaChainContext, dto: ExpectedTokenDTO): Promise<string[]> {
    return await getAddLiquidityEstimation(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: QuoteExactAmountDto,
    out: Array<string>
  })
  public async QuoteExactAmount(ctx: GalaChainContext, dto: QuoteExactAmountDto) {
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
        throw new Error("Pool data not found");
      })()
    );
  }

  @GalaTransaction({
    type: EVALUATE,
    in: BurnDto,
    out: Array<string[]>
  })
  public async GetRemoveLiquidityEstimation(ctx: GalaChainContext, dto: BurnDto): Promise<string[]> {
    return await getRemoveLiquidityEstimation(ctx, dto);
  }

  @Submit({
    in: CollectDTO,
    out: UserBalanceResponseDto
  })
  public async CollectFees(ctx: GalaChainContext, dto: CollectDTO): Promise<UserBalanceResponseDto> {
    return await collect(ctx, dto);
  }

  @Submit({
    in: CollectProtocolFeesDTO,
    out: Array<string[]>
  })
  public async CollectProtocolFees(ctx: GalaChainContext, dto: CollectProtocolFeesDTO) {
    return await collectProtocolFees(ctx, dto);
  }

  @Submit({
    in: SetProtocolFeeDTO,
    out: Number
  })
  public async SetProtocolFee(ctx: GalaChainContext, dto: SetProtocolFeeDTO) {
    return await setProtocolFee(ctx, dto);
  }

  @Evaluate({
    in: ChainCallDTO,
    out: PlatformFeeConfig,
    allowedOrgs: ["CuratorOrg"]
  })
  public async FetchPlatformAddressConfig(
    ctx: GalaChainContext,
    dto: ChainCallDTO
  ): Promise<PlatformFeeConfig> {
    return fetchPlatformAddressConfig(ctx);
  }

  @Submit({
    in: ConfigurePlatformFeeAddressDto,
    out: PlatformFeeConfig,
    allowedOrgs: ["CuratorOrg"]
  })
  public async ConfigurePlatformFeeAddress(
    ctx: GalaChainContext,
    dto: ConfigurePlatformFeeAddressDto
  ): Promise<PlatformFeeConfig> {
    return configurePlatformFeeAddress(ctx, dto);
  }
}

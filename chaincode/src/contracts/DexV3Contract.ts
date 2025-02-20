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
  CollectDTO,
  CollectProtocolFeesDTO,
  CreatePoolDto,
  ExpectedTokenDTO,
  GetPoolDto,
  GetPositionDto,
  GetUserPositionResponse,
  GetUserPositionsDto,
  Pool,
  PositionDataDTO,
  QuoteExactAmountDto,
  SetProtocolFeeDTO,
  Slot0Dto,
  SwapDto,
  SwapResponseDto,
  UserBalanceResponseDto,
  UserPositionDTO
} from "@gala-chain/api";

import { version } from "../../package.json";
import {
  addLiquidity,
  burn,
  collect,
  createPool,
  getAddLiquidityEstimation,
  getPoolData,
  getRemoveLiquidityEstimation,
  getUserPositions,
  liquidity,
  positions,
  quoteExactAmount,
  slot0,
  swap
} from "../dex";
import { collectProtocolFees } from "../dex/collectProtocolFee";
import { setProtocolFee } from "../dex/setProtocolFee";
import { GalaChainContext } from "../types";
import { GalaContract } from "./GalaContract";
import { EVALUATE, GalaTransaction, Submit } from "./GalaTransaction";

export class DexV3Contract extends GalaContract {
  constructor() {
    super("DexV3Contract", version);
  }

  @Submit({
    in: CreatePoolDto
  })
  public async CreatePool(ctx: GalaChainContext, dto: CreatePoolDto) {
    await createPool(ctx, dto);
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
  public async Slot0(ctx: GalaChainContext, dto: GetPoolDto): Promise<Slot0Dto> {
    return await slot0(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: GetPoolDto,
    out: String
  })
  public async Liquidity(ctx: GalaChainContext, dto: GetPoolDto): Promise<String> {
    return await liquidity(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: GetPositionDto,
    out: PositionDataDTO
  })
  public async Positions(ctx: GalaChainContext, dto: GetPositionDto): Promise<PositionDataDTO> {
    return await positions(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: GetUserPositionsDto,
    out: GetUserPositionResponse
  })
  public async UserPositions(
    ctx: GalaChainContext,
    dto: GetUserPositionsDto
  ): Promise<GetUserPositionResponse> {
    return await getUserPositions(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: ExpectedTokenDTO,
    out: Array<String>
  })
  public async AddLiquidityEstimation(ctx: GalaChainContext, dto: ExpectedTokenDTO): Promise<String[]> {
    return await getAddLiquidityEstimation(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: QuoteExactAmountDto,
    out: Array<String>
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
    out: Array<String[]>
  })
  public async RemoveLiquidityEstimation(ctx: GalaChainContext, dto: BurnDto): Promise<String[]> {
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
    in: CollectProtocolFeesDTO
  })
  public async CollectProtocolFees(ctx: GalaChainContext, dto: CollectProtocolFeesDTO) {
    return await collectProtocolFees(ctx, dto);
  }

  @Submit({
    in: SetProtocolFeeDTO
  })
  public async SetProtocolFee(ctx: GalaChainContext, dto: SetProtocolFeeDTO) {
    return await setProtocolFee(ctx, dto);
  }
}

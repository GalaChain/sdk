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
  ChainCallDTO,
  ConfigureLaunchpadFeeAddressDto,
  CreateSaleResDto,
  CreateTokenSaleDTO,
  ExactTokenQuantityDto,
  FetchSaleDto,
  FinalizeTokenAllocationDto,
  LaunchpadFeeConfig,
  LaunchpadFinalizeFeeAllocation,
  LaunchpadSale,
  NativeTokenQuantityDto,
  PreMintCalculationDto,
  TradeCalculationResDto,
  TradeResDto
} from "@gala-chain/api";

import { version } from "../../package.json";
import {
  buyExactTokenFeeGate,
  buyWithNativeFeeGate,
  createSaleFeeGate,
  sellExactTokenFeeGate,
  sellWithNativeFeeGate
} from "../fees/dexLaunchpadFeeGate";
import {
  buyExactToken,
  buyWithNative,
  calculatePreMintTokens,
  callMemeTokenIn,
  callMemeTokenOut,
  callNativeTokenIn,
  callNativeTokenOut,
  configureLaunchpadFeeAddress,
  createSale,
  fetchLaunchpadFeeConfig,
  fetchSaleDetails,
  finalizeTokenAllocation,
  sellExactToken,
  sellWithNative
} from "../launchpad";
import { GalaChainContext } from "../types";
import { GalaContract } from "./GalaContract";
import { EVALUATE, Evaluate, GalaTransaction, Submit } from "./GalaTransaction";

export class LaunchpadContract extends GalaContract {
  constructor() {
    super("Launchpad", version);
  }

  @Submit({
    in: CreateTokenSaleDTO,
    out: CreateSaleResDto,
    before: createSaleFeeGate
  })
  public async CreateSale(ctx: GalaChainContext, dto: CreateTokenSaleDTO): Promise<CreateSaleResDto> {
    return createSale(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: FetchSaleDto,
    out: LaunchpadSale
  })
  public async FetchSaleDetails(ctx: GalaChainContext, dto: FetchSaleDto): Promise<LaunchpadSale> {
    return fetchSaleDetails(ctx, dto);
  }

  @Submit({
    in: ExactTokenQuantityDto,
    out: TradeResDto,
    before: buyExactTokenFeeGate
  })
  public async BuyExactToken(ctx: GalaChainContext, dto: ExactTokenQuantityDto): Promise<TradeResDto> {
    return buyExactToken(ctx, dto);
  }

  @Submit({
    in: ExactTokenQuantityDto,
    out: TradeResDto,
    before: sellExactTokenFeeGate
  })
  public async SellExactToken(ctx: GalaChainContext, dto: ExactTokenQuantityDto): Promise<TradeResDto> {
    return sellExactToken(ctx, dto);
  }

  @Submit({
    in: NativeTokenQuantityDto,
    out: TradeResDto,
    before: buyWithNativeFeeGate
  })
  public async BuyWithNative(ctx: GalaChainContext, dto: NativeTokenQuantityDto): Promise<TradeResDto> {
    return buyWithNative(ctx, dto);
  }

  @Submit({
    in: NativeTokenQuantityDto,
    out: TradeResDto,
    before: sellWithNativeFeeGate
  })
  public async SellWithNative(ctx: GalaChainContext, dto: NativeTokenQuantityDto): Promise<TradeResDto> {
    return sellWithNative(ctx, dto);
  }

  @Submit({
    in: ConfigureLaunchpadFeeAddressDto,
    out: LaunchpadFeeConfig,
    allowedOrgs: ["CuratorOrg"]
  })
  public async ConfigureLaunchpadFeeAddress(
    ctx: GalaChainContext,
    dto: ConfigureLaunchpadFeeAddressDto
  ): Promise<LaunchpadFeeConfig> {
    return configureLaunchpadFeeAddress(ctx, dto);
  }

  @Submit({
    in: FinalizeTokenAllocationDto,
    out: LaunchpadFinalizeFeeAllocation,
    allowedOrgs: ["CuratorOrg"]
  })
  public async FinalizeTokenAllocation(
    ctx: GalaChainContext,
    dto: FinalizeTokenAllocationDto
  ): Promise<LaunchpadFinalizeFeeAllocation> {
    return finalizeTokenAllocation(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: ExactTokenQuantityDto,
    out: TradeCalculationResDto
  })
  public async CallNativeTokenIn(
    ctx: GalaChainContext,
    dto: ExactTokenQuantityDto
  ): Promise<TradeCalculationResDto> {
    return callNativeTokenIn(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: NativeTokenQuantityDto,
    out: TradeCalculationResDto
  })
  public async CallMemeTokenOut(
    ctx: GalaChainContext,
    dto: NativeTokenQuantityDto
  ): Promise<TradeCalculationResDto> {
    return callMemeTokenOut(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: ExactTokenQuantityDto,
    out: TradeCalculationResDto
  })
  public async CallNativeTokenOut(
    ctx: GalaChainContext,
    dto: ExactTokenQuantityDto
  ): Promise<TradeCalculationResDto> {
    return callNativeTokenOut(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: NativeTokenQuantityDto,
    out: TradeCalculationResDto
  })
  public async CallMemeTokenIn(
    ctx: GalaChainContext,
    dto: NativeTokenQuantityDto
  ): Promise<TradeCalculationResDto> {
    return callMemeTokenIn(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: PreMintCalculationDto,
    out: String
  })
  public async CalculatePreMintTokens(ctx: GalaChainContext, dto: PreMintCalculationDto): Promise<string> {
    return calculatePreMintTokens(dto);
  }

  @Evaluate({
    in: ChainCallDTO,
    out: LaunchpadFeeConfig,
    allowedOrgs: ["CuratorOrg"]
  })
  public async FetchLaunchpadFeeConfig(
    ctx: GalaChainContext,
    dto: ChainCallDTO
  ): Promise<LaunchpadFeeConfig> {
    return fetchLaunchpadFeeConfig(ctx);
  }
}

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
  ConfigurePlatformFeeAddressDto,
  CreateSaleResponse,
  CreateTokenSaleDTO,
  ExactTokenQuantityDto,
  FetchSaleDto,
  FinalizeTokenAllocationDto,
  LaunchpadFinalizeFeeAllocation,
  LaunchpadSale,
  NativeTokenQuantityDto,
  PlatformFeeConfig,
  PreMintCalculationDto,
  TradeResponse
} from "@gala-chain/api";

import { version } from "../../package.json";
import {
  buyExactToken,
  buyWithNative,
  calculatePreMintTokens,
  callMemeTokenIn,
  callMemeTokenOut,
  callNativeTokenIn,
  callNativeTokenOut,
  createSale,
  fetchSaleDetails,
  finalizeTokenAllocation,
  sellExactToken,
  sellWithNative
} from "../launchpad";
import { GalaChainContext } from "../types";
import { GalaContract } from "./GalaContract";
import { EVALUATE, Evaluate, GalaTransaction, Submit } from "./GalaTransaction";
import { configurePlatformFeeAddress, fetchPlatformAddressConfig } from "./platformfee";

export class LaunchpadContract extends GalaContract {
  constructor() {
    super("Launchpad", version);
  }

  @Submit({
    in: CreateTokenSaleDTO,
    out: CreateSaleResponse
  })
  public async CreateSale(ctx: GalaChainContext, dto: CreateTokenSaleDTO): Promise<CreateSaleResponse> {
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
    out: TradeResponse
  })
  public async BuyExactToken(ctx: GalaChainContext, dto: ExactTokenQuantityDto): Promise<TradeResponse> {
    return buyExactToken(ctx, dto);
  }

  @Submit({
    in: ExactTokenQuantityDto,
    out: TradeResponse
  })
  public async SellExactToken(ctx: GalaChainContext, dto: ExactTokenQuantityDto): Promise<TradeResponse> {
    return sellExactToken(ctx, dto);
  }

  @Submit({
    in: NativeTokenQuantityDto,
    out: TradeResponse
  })
  public async BuyWithNative(ctx: GalaChainContext, dto: NativeTokenQuantityDto): Promise<TradeResponse> {
    return buyWithNative(ctx, dto);
  }

  @Submit({
    in: NativeTokenQuantityDto,
    out: TradeResponse
  })
  public async SellWithNative(ctx: GalaChainContext, dto: NativeTokenQuantityDto): Promise<TradeResponse> {
    return sellWithNative(ctx, dto);
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
    out: String
  })
  public async CallNativeTokenIn(ctx: GalaChainContext, dto: ExactTokenQuantityDto): Promise<string> {
    return callNativeTokenIn(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: NativeTokenQuantityDto,
    out: String
  })
  public async CallMemeTokenOut(ctx: GalaChainContext, dto: NativeTokenQuantityDto): Promise<string> {
    return callMemeTokenOut(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: ExactTokenQuantityDto,
    out: String
  })
  public async CallNativeTokenOut(ctx: GalaChainContext, dto: ExactTokenQuantityDto): Promise<string> {
    return callNativeTokenOut(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: NativeTokenQuantityDto,
    out: String
  })
  public async CallMemeTokenIn(ctx: GalaChainContext, dto: NativeTokenQuantityDto): Promise<string> {
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
    out: PlatformFeeConfig,
    allowedOrgs: ["CuratorOrg"]
  })
  public async FetchPlatformAddressConfig(
    ctx: GalaChainContext,
    dto: ChainCallDTO
  ): Promise<PlatformFeeConfig> {
    return fetchPlatformAddressConfig(ctx);
  }
}

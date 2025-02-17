import {
  ConfigurePlatformFeeAddressDto,
  CreateLaunchpadSaleDto,
  CreateLaunchpadSaleResponse,
  ExactTokenAmountDto,
  FetchSaleDto,
  FinalizeTokenAllocationDto,
  LaunchPadFinalizeAllocation,
  LaunchPadSale,
  NativeTokenAmountDto,
  PlatformFeeAddress,
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
  configurePlatformFeeAddress,
  createSale,
  fetchSaleDetails,
  finalizeTokenAllocation,
  sellExactToken,
  sellWithNative
} from "../launchpad";
import { GalaChainContext } from "../types";
import { GalaContract } from "./GalaContract";
import { EVALUATE, GalaTransaction, Submit } from "./GalaTransaction";

export class LaunchPadContract extends GalaContract {
  constructor() {
    super("LaunchPad", version);
  }

  @Submit({
    in: CreateLaunchpadSaleDto,
    out: CreateLaunchpadSaleResponse
  })
  public async CreateSale(
    ctx: GalaChainContext,
    dto: CreateLaunchpadSaleDto
  ): Promise<CreateLaunchpadSaleResponse> {
    return createSale(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: FetchSaleDto,
    out: LaunchPadSale
  })
  public async FetchSaleDetails(ctx: GalaChainContext, dto: FetchSaleDto): Promise<LaunchPadSale> {
    return fetchSaleDetails(ctx, dto);
  }

  @Submit({
    in: ExactTokenAmountDto,
    out: TradeResponse
  })
  public async BuyExactToken(ctx: GalaChainContext, dto: ExactTokenAmountDto): Promise<TradeResponse> {
    return buyExactToken(ctx, dto);
  }

  @Submit({
    in: ExactTokenAmountDto,
    out: TradeResponse
  })
  public async SellExactToken(ctx: GalaChainContext, dto: ExactTokenAmountDto): Promise<TradeResponse> {
    return sellExactToken(ctx, dto);
  }

  @Submit({
    in: NativeTokenAmountDto,
    out: TradeResponse
  })
  public async BuyWithNative(ctx: GalaChainContext, dto: NativeTokenAmountDto): Promise<TradeResponse> {
    return buyWithNative(ctx, dto);
  }

  @Submit({
    in: NativeTokenAmountDto,
    out: TradeResponse
  })
  public async SellWithNative(ctx: GalaChainContext, dto: NativeTokenAmountDto): Promise<TradeResponse> {
    return sellWithNative(ctx, dto);
  }

  @Submit({
    in: ConfigurePlatformFeeAddressDto,
    out: PlatformFeeAddress,
    allowedOrgs: ["CuratorOrg"]
  })
  public async ConfigurePlatformFeeAddress(
    ctx: GalaChainContext,
    dto: ConfigurePlatformFeeAddressDto
  ): Promise<PlatformFeeAddress> {
    return configurePlatformFeeAddress(ctx, dto);
  }

  @Submit({
    in: FinalizeTokenAllocationDto,
    out: LaunchPadFinalizeAllocation,
    allowedOrgs: ["CuratorOrg"]
  })
  public async FinalizeTokenAllocation(
    ctx: GalaChainContext,
    dto: FinalizeTokenAllocationDto
  ): Promise<LaunchPadFinalizeAllocation> {
    return finalizeTokenAllocation(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: ExactTokenAmountDto,
    out: String
  })
  public async CallNativeTokenIn(ctx: GalaChainContext, dto: ExactTokenAmountDto): Promise<String> {
    return callNativeTokenIn(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: NativeTokenAmountDto,
    out: String
  })
  public async CallMemeTokenOut(ctx: GalaChainContext, dto: NativeTokenAmountDto): Promise<String> {
    return callMemeTokenOut(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: ExactTokenAmountDto,
    out: String
  })
  public async CallNativeTokenOut(ctx: GalaChainContext, dto: ExactTokenAmountDto): Promise<String> {
    return callNativeTokenOut(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: NativeTokenAmountDto,
    out: String
  })
  public async CallMemeTokenIn(ctx: GalaChainContext, dto: NativeTokenAmountDto): Promise<String> {
    return callMemeTokenIn(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: PreMintCalculationDto,
    out: String
  })
  public async CalculatePreMintTokens(ctx: GalaChainContext, dto: PreMintCalculationDto): Promise<String> {
    return calculatePreMintTokens(dto);
  }
}

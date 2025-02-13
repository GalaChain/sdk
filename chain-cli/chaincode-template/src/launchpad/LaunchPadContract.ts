import { EVALUATE, GalaChainContext, GalaContract, GalaTransaction, Submit } from "@gala-chain/chaincode";

import { LaunchPadSale } from "./LaunchPadSale";
import { buyExactToken } from "./buyExactToken";
import { buyWithNative } from "./buyWithNative";
import { callMemeTokenIn } from "./callMemeTokenIn";
import { callMemeTokenOut } from "./callMemeTokenOut";
import { callNativeTokenIn } from "./callNativeTokenIn";
import { callNativeTokenOut } from "./callNativeTokenOut";
import { configurePlatformFeeAddress } from "./configurePlatformFeeAddress";
import { createSale } from "./createSale";
import {
  configurePlatformFeeAddressDto,
  createSaleResponse,
  createTokenSaleDTO,
  exactTokenAmountDto,
  fetchSaleDto,
  nativeTokenAmountDto,
  preMintCalculationDto,
  tradeResponse
} from "./dtos";
import { fetchSaleDetails } from "./fetchSaleDetails";
import { PlatformFeeAddress } from "./platformFeeAddress";
import { calculatePreMintTokens } from "./preMintCalculation";
import { sellExactToken } from "./sellExactToken";
import { sellWithNative } from "./sellWithNative";

export class LaunchPadContract extends GalaContract {
  constructor() {
    super("LaunchPad", "1");
  }

  @Submit({
    in: createTokenSaleDTO,
    out: createSaleResponse
  })
  public async CreateSale(ctx: GalaChainContext, dto: createTokenSaleDTO): Promise<createSaleResponse> {
    return createSale(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: fetchSaleDto,
    out: LaunchPadSale
  })
  public async FetchSaleDetails(ctx: GalaChainContext, dto: fetchSaleDto): Promise<LaunchPadSale> {
    return fetchSaleDetails(ctx, dto);
  }

  @Submit({
    in: exactTokenAmountDto,
    out: tradeResponse
  })
  public async BuyExactToken(ctx: GalaChainContext, dto: exactTokenAmountDto): Promise<tradeResponse> {
    return buyExactToken(ctx, dto);
  }

  @Submit({
    in: exactTokenAmountDto,
    out: tradeResponse
  })
  public async SellExactToken(ctx: GalaChainContext, dto: exactTokenAmountDto): Promise<tradeResponse> {
    return sellExactToken(ctx, dto);
  }

  @Submit({
    in: nativeTokenAmountDto,
    out: tradeResponse
  })
  public async BuyWithNative(ctx: GalaChainContext, dto: nativeTokenAmountDto): Promise<tradeResponse> {
    return buyWithNative(ctx, dto);
  }

  @Submit({
    in: nativeTokenAmountDto,
    out: tradeResponse
  })
  public async SellWithNative(ctx: GalaChainContext, dto: nativeTokenAmountDto): Promise<tradeResponse> {
    return sellWithNative(ctx, dto);
  }

  @Submit({
    in: configurePlatformFeeAddressDto,
    out: PlatformFeeAddress
  })
  public async ConfigurePlatformFeeAddress(
    ctx: GalaChainContext,
    dto: configurePlatformFeeAddressDto
  ): Promise<PlatformFeeAddress> {
    return configurePlatformFeeAddress(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: exactTokenAmountDto,
    out: String
  })
  public async CallNativeTokenIn(ctx: GalaChainContext, dto: exactTokenAmountDto): Promise<String> {
    return callNativeTokenIn(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: nativeTokenAmountDto,
    out: String
  })
  public async CallMemeTokenOut(ctx: GalaChainContext, dto: nativeTokenAmountDto): Promise<String> {
    return callMemeTokenOut(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: exactTokenAmountDto,
    out: String
  })
  public async CallNativeTokenOut(ctx: GalaChainContext, dto: exactTokenAmountDto): Promise<String> {
    return callNativeTokenOut(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: nativeTokenAmountDto,
    out: String
  })
  public async CallMemeTokenIn(ctx: GalaChainContext, dto: nativeTokenAmountDto): Promise<String> {
    return callMemeTokenIn(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: preMintCalculationDto,
    out: String
  })
  public async CalculatePreMintTokens(ctx: GalaChainContext, dto: preMintCalculationDto): Promise<String> {
    return calculatePreMintTokens(dto);
  }
}

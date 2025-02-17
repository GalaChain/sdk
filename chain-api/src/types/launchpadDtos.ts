import BigNumber from "bignumber.js";
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

import { BigNumberProperty } from "../validators";
import { IsNonZeroBigNumber } from "../validators";
import { TokenBalance } from "./TokenBalance";
import { ChainCallDTO, SubmitCallDTO } from "./dtos";

export class CreateLaunchpadSaleDto extends SubmitCallDTO {
  @IsString()
  @IsNotEmpty()
  public tokenName: string;

  @IsString()
  @IsNotEmpty()
  public tokenSymbol: string;

  @IsString()
  @IsNotEmpty()
  public tokenDescription: string;

  @IsString()
  @IsNotEmpty()
  public tokenImage: string;

  @BigNumberProperty()
  @IsNotEmpty()
  public preBuyAmount: BigNumber;

  @IsString()
  @IsOptional()
  public websiteUrl?: string;

  @IsString()
  @IsOptional()
  public telegramUrl?: string;

  @IsString()
  @IsOptional()
  public twitterUrl?: string;

  constructor(
    tokenName: string = "",
    tokenSymbol: string = "",
    tokenDescription: string = "",
    tokenImage: string = "",
    preBuyAmount: BigNumber = new BigNumber(0)
  ) {
    super();
    this.tokenName = tokenName;
    this.tokenSymbol = tokenSymbol;
    this.tokenDescription = tokenDescription;
    this.tokenImage = tokenImage;
    this.preBuyAmount = preBuyAmount;
  }
}

export class CreateLaunchpadSaleResponse {
  image: string;
  tokenName: string;
  symbol: string;
  description: string;
  websiteUrl?: string;
  telegramUrl?: string;
  twitterUrl?: string;
  initialBuyAmount: string;
  vaultAddress: string;
  creatorAddress: string;
}

export class ExactTokenAmountDto extends SubmitCallDTO {
  @IsString()
  @IsNotEmpty()
  public vaultAddress: string;

  @BigNumberProperty()
  @IsNonZeroBigNumber({ message: "tokenAmount cannot be zero" })
  @IsNotEmpty()
  public tokenAmount: BigNumber;

  @BigNumberProperty()
  @IsOptional()
  public expectedNativeToken?: BigNumber;

  constructor(vaultAddress: string = "", tokenAmount: BigNumber = new BigNumber(0)) {
    super();
    this.vaultAddress = vaultAddress;
    this.tokenAmount = tokenAmount;
  }
}

export class NativeTokenAmountDto extends SubmitCallDTO {
  @IsString()
  @IsNotEmpty()
  public vaultAddress: string;

  @BigNumberProperty()
  @IsNonZeroBigNumber({ message: "nativeTokenAmount cannot be zero" })
  @IsNotEmpty()
  public nativeTokenAmount: BigNumber;

  @BigNumberProperty()
  @IsOptional()
  public expectedToken?: BigNumber;

  constructor(vaultAddress: string = "", nativeTokenAmount: BigNumber = new BigNumber(0)) {
    super();
    this.vaultAddress = vaultAddress;
    this.nativeTokenAmount = nativeTokenAmount;
  }
}

export class TradeResponse {
  public tokenBalance?: TokenBalance;
  public nativeTokenBalance?: TokenBalance;

  public tokenAmount?: string;
  public nativeTokenAmount?: string;

  inputAmount: string;
  outputAmount: string;
  tokenName: string;
  tradeType: string;
  vaultAddress: string;
  userAddress: string;
}

export class FetchSaleDto extends ChainCallDTO {
  @IsString()
  @IsNotEmpty()
  public vaultAddress: string;
  constructor(vaultAddress: string = "") {
    super();
    this.vaultAddress = vaultAddress;
  }
}

export class PreMintCalculationDto extends ChainCallDTO {
  @BigNumberProperty()
  @IsNonZeroBigNumber()
  @IsNotEmpty()
  public nativeTokenAmount: BigNumber;

  constructor(nativeTokenAmount: BigNumber = new BigNumber(0)) {
    super();
    this.nativeTokenAmount = nativeTokenAmount;
  }
}

export class ConfigurePlatformFeeAddressDto extends SubmitCallDTO {
  @IsNotEmpty()
  @IsString()
  public newAddress: string;
}

export class FinalizeTokenAllocationDto extends SubmitCallDTO {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(1)
  public platformFeePercentage: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(1)
  public ownerFeePercentage: number;
}

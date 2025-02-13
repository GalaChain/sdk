import { BigNumberProperty, ChainCallDTO, ChainObject, TokenBalance } from "@gala-chain/api";
import BigNumber from "bignumber.js";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

import { IsNonZeroBigNumber } from "./validators";

export class createTokenSaleDTO extends ChainCallDTO {
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

export class createSaleResponse {
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

export class exactTokenAmountDto extends ChainCallDTO {
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

export class nativeTokenAmountDto extends ChainCallDTO {
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

export class tradeResponse {
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

export class fetchSaleDto extends ChainCallDTO {
  @IsString()
  @IsNotEmpty()
  public vaultAddress: string;
  constructor(vaultAddress: string = "") {
    super();
    this.vaultAddress = vaultAddress;
  }
}

export class preMintCalculationDto extends ChainCallDTO {
  @BigNumberProperty()
  @IsNonZeroBigNumber()
  @IsNotEmpty()
  public nativeTokenAmount: BigNumber;

  constructor(nativeTokenAmount: BigNumber = new BigNumber(0)) {
    super();
    this.nativeTokenAmount = nativeTokenAmount;
  }
}

export class configurePlatformFeeAddressDto extends ChainCallDTO {
  @IsNotEmpty()
  @IsString()
  public newAddress: string;
}

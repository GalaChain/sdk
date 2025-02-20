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
import BigNumber from "bignumber.js";
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

import { BigNumberProperty } from "../validators";
import { IsNonZeroBigNumber } from "../validators";
import { TokenBalance } from "./TokenBalance";
import { ChainCallDTO } from "./dtos";
import { Type } from "class-transformer";

export class CreateTokenSaleDTO extends ChainCallDTO {
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

export class CreateSaleResponse {
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

export class ExactTokenAmountDto extends ChainCallDTO {
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

export class NativeTokenAmountDto extends ChainCallDTO {
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

export class ConfigurePlatformFeeAddressDto extends ChainCallDTO {
  @IsOptional()
  @IsString()
  public newPlatformFeeAddress?: string;

  @IsOptional()
  @Type(() => String)
  public newAuthorities?: string[];
}

export class FinalizeTokenAllocationDto extends ChainCallDTO {
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

export class CollectFeeAddressDto extends ChainCallDTO {
  @IsNotEmpty()
  @IsString()
  public platformFeeCollectAddress: string;
}

export class WithdrawLaunchpadFeeResponse {
  public recepientBalance: TokenBalance;
  public receivedTokenAmount: string;
}
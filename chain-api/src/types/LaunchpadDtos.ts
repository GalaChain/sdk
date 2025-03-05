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
import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

import { BigNumberProperty } from "../validators";
import { IsNonZeroBigNumber } from "../validators";
import { TokenBalance } from "./TokenBalance";
import { ChainCallDTO } from "./dtos";

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
  public tokenCollection: string;

  @IsString()
  @IsNotEmpty()
  public tokenCategory: string;

  @IsString()
  @IsNotEmpty()
  public tokenImage: string;

  @BigNumberProperty()
  @IsNotEmpty()
  public preBuyQuantity: BigNumber;

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
    tokenName: string,
    tokenSymbol: string,
    tokenDescription: string,
    tokenImage: string,
    preBuyQuantity: BigNumber,
    tokenCollection: string,
    tokenCategory: string
  ) {
    super();
    this.tokenName = tokenName;
    this.tokenSymbol = tokenSymbol;
    this.tokenDescription = tokenDescription;
    this.tokenImage = tokenImage;
    this.preBuyQuantity = preBuyQuantity;
    this.tokenCollection = tokenCollection;
    this.tokenCategory = tokenCategory;
  }
}

export class CreateSaleResDto {
  @IsNotEmpty()
  public image: string;

  @IsNotEmpty()
  public tokenName: string;

  @IsNotEmpty()
  public symbol: string;

  @IsNotEmpty()
  public description: string;

  @IsOptional()
  public websiteUrl?: string;

  @IsOptional()
  public telegramUrl?: string;

  @IsOptional()
  public twitterUrl?: string;

  @IsNotEmpty()
  public initialBuyQuantity: string;

  @IsNotEmpty()
  public vaultAddress: string;

  @IsNotEmpty()
  public creatorAddress: string;

  @IsNotEmpty()
  public collection: string;

  @IsNotEmpty()
  public category: string;
}

export class ExactTokenQuantityDto extends ChainCallDTO {
  @IsString()
  @IsNotEmpty()
  public vaultAddress: string;

  @BigNumberProperty()
  @IsNonZeroBigNumber({ message: "tokenQuantity cannot be zero" })
  @IsNotEmpty()
  public tokenQuantity: BigNumber;

  @BigNumberProperty()
  @IsOptional()
  public expectedNativeToken?: BigNumber;
  tokenAmount: BigNumber;

  constructor(vaultAddress = "", tokenQuantity: BigNumber = new BigNumber(0)) {
    super();
    this.vaultAddress = vaultAddress;
    this.tokenQuantity = tokenQuantity;
  }
}

export class NativeTokenQuantityDto extends ChainCallDTO {
  @IsString()
  @IsNotEmpty()
  public vaultAddress: string;

  @BigNumberProperty()
  @IsNonZeroBigNumber({ message: "nativeTokenQuanity cannot be zero" })
  @IsNotEmpty()
  public nativeTokenQuantity: BigNumber;

  @BigNumberProperty()
  @IsOptional()
  public expectedToken?: BigNumber;

  constructor(vaultAddress = "", nativeTokenQuantity: BigNumber = new BigNumber(0)) {
    super();
    this.vaultAddress = vaultAddress;
    this.nativeTokenQuantity = nativeTokenQuantity;
  }
}

export class TradeResDto {
  @IsOptional()
  public tokenBalance?: TokenBalance;

  @IsOptional()
  public nativeTokenBalance?: TokenBalance;

  @IsOptional()
  public tokenQuantity?: string;

  @IsOptional()
  public nativeTokenAmount?: string;

  @IsNotEmpty()
  public inputQuantity: string;

  @IsNotEmpty()
  public outputQuantity: string;

  @IsNotEmpty()
  public tokenName: string;

  @IsNotEmpty()
  public tradeType: string;

  @IsNotEmpty()
  public vaultAddress: string;

  @IsNotEmpty()
  public userAddress: string;
}

export class FetchSaleDto extends ChainCallDTO {
  @IsString()
  @IsNotEmpty()
  public vaultAddress: string;
  constructor(vaultAddress = "") {
    super();
    this.vaultAddress = vaultAddress;
  }
}

export class PreMintCalculationDto extends ChainCallDTO {
  @BigNumberProperty()
  @IsNonZeroBigNumber()
  @IsNotEmpty()
  public nativeTokenQuantity: BigNumber;

  constructor(nativeTokenQuantity: BigNumber = new BigNumber(0)) {
    super();
    this.nativeTokenQuantity = nativeTokenQuantity;
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

export class TradeCalculationResDto {
  @IsNotEmpty()
  @IsString()
  public calculatedQuantity: string;
}

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
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
  ValidateNested
} from "class-validator";

import { PositionInPool } from "../utils";
import {
  BigNumberIsNegative,
  BigNumberIsPositive,
  BigNumberProperty,
  EnumProperty,
  IsBigNumber,
  IsLessThan,
  IsUserAlias
} from "../validators";
import { TickData } from "./TickData";
import { TokenBalance } from "./TokenBalance";
import { TokenClassKey } from "./TokenClass";
import { ChainCallDTO } from "./dtos";

const f18 = (num: BigNumber, round: BigNumber.RoundingMode = BigNumber.ROUND_DOWN): BigNumber => {
  return new BigNumber(num?.toFixed(18, round) ?? 0);
};

export enum DexFeePercentageTypes {
  FEE_0_05_PERCENT = 500, // 0.05%
  FEE_0_3_PERCENT = 3000, // 0.3%
  FEE_1_PERCENT = 10000 // 1%
}

export class CreatePoolDto extends ChainCallDTO {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TokenClassKey)
  public token0: TokenClassKey;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TokenClassKey)
  public token1: TokenClassKey;

  @EnumProperty(DexFeePercentageTypes)
  public fee: DexFeePercentageTypes;

  @BigNumberIsPositive()
  @BigNumberProperty()
  public initialSqrtPrice: BigNumber;

  constructor(
    token0: TokenClassKey,
    token1: TokenClassKey,
    fee: DexFeePercentageTypes,
    initialSqrtPrice: BigNumber
  ) {
    super();
    this.token0 = token0;
    this.token1 = token1;
    this.fee = fee;
    this.initialSqrtPrice = initialSqrtPrice;
  }
}

export class PositionDto extends ChainCallDTO {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TokenClassKey)
  public token0: TokenClassKey;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TokenClassKey)
  public token1: TokenClassKey;

  @EnumProperty(DexFeePercentageTypes)
  public fee: DexFeePercentageTypes;

  @IsOptional()
  public owner?: string;

  @IsNotEmpty()
  @IsInt()
  @Max(TickData.MAX_TICK)
  public tickUpper: number;

  @IsNotEmpty()
  @IsInt()
  @Min(TickData.MIN_TICK)
  @IsLessThan("tickUpper")
  public tickLower: number;

  constructor(
    token0: TokenClassKey,
    token1: TokenClassKey,
    fee: DexFeePercentageTypes,
    owner: string,
    tickLower: number,
    tickUpper: number
  ) {
    super();
    this.token0 = token0;
    this.token1 = token1;
    this.fee = fee;
    this.owner = owner;
    this.tickLower = tickLower;
    this.tickUpper = tickUpper;
  }
}

export class QuoteExactAmountDto extends ChainCallDTO {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TokenClassKey)
  public token0: TokenClassKey;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TokenClassKey)
  public token1: TokenClassKey;

  @EnumProperty(DexFeePercentageTypes)
  public fee: DexFeePercentageTypes;

  @IsNotEmpty()
  @IsBoolean()
  public zeroForOne: boolean;

  @IsBigNumber()
  @BigNumberProperty()
  public amount: BigNumber;

  constructor(
    token0: TokenClassKey,
    token1: TokenClassKey,
    fee: DexFeePercentageTypes,
    amount: BigNumber,
    zeroForOne: boolean
  ) {
    super();
    this.token0 = token0;
    this.token1 = token1;
    this.fee = fee;
    this.amount = amount;
    this.zeroForOne = zeroForOne;
  }
}

export class SwapDto extends ChainCallDTO {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TokenClassKey)
  public token0: TokenClassKey;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TokenClassKey)
  public token1: TokenClassKey;

  @EnumProperty(DexFeePercentageTypes)
  public fee: DexFeePercentageTypes;

  @IsNotEmpty()
  @IsBoolean()
  public zeroForOne: boolean;

  @IsBigNumber()
  @BigNumberProperty()
  public sqrtPriceLimit: BigNumber;

  @IsBigNumber()
  @BigNumberProperty()
  public amount: BigNumber;

  @BigNumberIsPositive()
  @BigNumberProperty()
  @IsOptional()
  public amountInMaximum?: BigNumber;

  @BigNumberProperty()
  @BigNumberIsNegative()
  @IsOptional()
  public amountOutMinimum?: BigNumber;

  constructor(
    token0: TokenClassKey,
    token1: TokenClassKey,
    fee: DexFeePercentageTypes,
    amount: BigNumber,
    zeroForOne: boolean,
    sqrtPriceLimit: BigNumber
  ) {
    super();
    this.token0 = token0;
    this.token1 = token1;
    this.fee = fee;
    this.amount = amount;
    this.zeroForOne = zeroForOne;
    this.sqrtPriceLimit = sqrtPriceLimit;
  }
}

export class BurnDto extends ChainCallDTO {
  @IsNotEmpty()
  @IsInt()
  @Max(TickData.MAX_TICK)
  public tickUpper: number;

  @IsNotEmpty()
  @IsInt()
  @Min(TickData.MIN_TICK)
  @IsLessThan("tickUpper")
  public tickLower: number;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TokenClassKey)
  public token0: TokenClassKey;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TokenClassKey)
  public token1: TokenClassKey;

  @EnumProperty(DexFeePercentageTypes)
  public fee: DexFeePercentageTypes;

  @BigNumberIsPositive()
  @BigNumberProperty()
  public amount: BigNumber;

  @BigNumberIsPositive()
  @BigNumberProperty()
  public amount0Min: BigNumber;

  @BigNumberIsPositive()
  @BigNumberProperty()
  public amount1Min: BigNumber;

  constructor(
    token0: TokenClassKey,
    token1: TokenClassKey,
    fee: DexFeePercentageTypes,
    amount: BigNumber,
    tickLower: number,
    tickUpper: number,
    amount0Min: BigNumber,
    amount1Min: BigNumber
  ) {
    super();
    this.tickLower = tickLower;
    this.tickUpper = tickUpper;
    this.amount = amount;
    this.token0 = token0;
    this.token1 = token1;
    this.fee = fee;
    this.amount0Min = amount0Min;
    this.amount1Min = amount1Min;
  }
}

export class GetPoolDto extends ChainCallDTO {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TokenClassKey)
  public token0: TokenClassKey;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TokenClassKey)
  public token1: TokenClassKey;

  @EnumProperty(DexFeePercentageTypes)
  public fee: DexFeePercentageTypes;

  constructor(token0: TokenClassKey, token1: TokenClassKey, fee: number) {
    super();
    this.token0 = token0;
    this.token1 = token1;
    this.fee = fee;
  }
}

export class Slot0ResDto extends ChainCallDTO {
  @IsBigNumber()
  @BigNumberProperty()
  public sqrtPrice: BigNumber;

  @IsNotEmpty()
  @IsInt()
  public tick: number;

  @BigNumberIsPositive()
  @BigNumberProperty()
  public liquidity: BigNumber;

  constructor(sqrtPrice: BigNumber, tick: number, liquidity: BigNumber) {
    super();
    this.sqrtPrice = sqrtPrice;
    this.tick = tick;
    this.liquidity = liquidity;
  }
}

export class GetPoolDataDTO extends ChainCallDTO {
  @IsNotEmpty()
  @IsString()
  public address: string;
}

export class GetPositionDto extends ChainCallDTO {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TokenClassKey)
  public token0: TokenClassKey;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TokenClassKey)
  public token1: TokenClassKey;

  @EnumProperty(DexFeePercentageTypes)
  public fee: DexFeePercentageTypes;

  @IsNotEmpty()
  public owner: string;

  @IsNotEmpty()
  @IsInt()
  @Max(TickData.MAX_TICK)
  public tickUpper: number;

  @IsNotEmpty()
  @IsInt()
  @Min(TickData.MIN_TICK)
  @IsLessThan("tickUpper")
  public tickLower: number;

  constructor(
    token0: TokenClassKey,
    token1: TokenClassKey,
    fee: DexFeePercentageTypes,
    tickLower: number,
    tickUpper: number,
    owner: string
  ) {
    super();
    this.token0 = token0;
    this.token1 = token1;
    this.fee = fee;
    this.owner = owner;
    this.tickLower = tickLower;
    this.tickUpper = tickUpper;
  }
}

export class GetUserPositionsDto extends ChainCallDTO {
  @IsNotEmpty()
  @IsUserAlias()
  public user: string;

  @IsInt()
  @Min(1, { message: "Value cannot be zero" })
  @Max(10, { message: "Page can have atmost 10 values" })
  @IsNotEmpty()
  public limit: number;

  @IsOptional()
  @IsString()
  public bookmark?: string;

  constructor(user: string, bookmark?: string, limit = 10) {
    super();
    this.user = user;
    this.bookmark = bookmark;
    this.limit = limit;
  }
}

export class UserPositionDTO extends ChainCallDTO {
  positions: PositionInPool;
}

export class GetAddLiquidityEstimationDto extends ChainCallDTO {
  @BigNumberIsPositive()
  @BigNumberProperty()
  public amount: BigNumber;

  @IsNotEmpty()
  @IsInt()
  @Max(TickData.MAX_TICK)
  public tickUpper: number;

  @IsNotEmpty()
  @IsInt()
  @Min(TickData.MIN_TICK)
  @IsLessThan("tickUpper")
  public tickLower: number;

  @IsNotEmpty()
  @IsBoolean()
  public zeroForOne: boolean;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TokenClassKey)
  public token0: TokenClassKey;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TokenClassKey)
  public token1: TokenClassKey;

  @EnumProperty(DexFeePercentageTypes)
  public fee: DexFeePercentageTypes;

  constructor(
    token0: TokenClassKey,
    token1: TokenClassKey,
    fee: DexFeePercentageTypes,
    amount: BigNumber,
    tickLower: number,
    tickUpper: number,
    zeroForOne: boolean
  ) {
    super();
    this.amount = amount;
    this.zeroForOne = zeroForOne;
    this.tickLower = tickLower;
    this.tickUpper = tickUpper;
    this.token0 = token0;
    this.token1 = token1;
    this.fee = fee;
  }
}

export class UserBalanceResDto extends ChainCallDTO {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TokenBalance)
  public token0Balance: TokenBalance;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TokenBalance)
  public token1Balance: TokenBalance;

  constructor(token0Balance: TokenBalance, token1Balance: TokenBalance) {
    super();
    this.token0Balance = token0Balance;
    this.token1Balance = token1Balance;
  }
}

export class CollectDto extends ChainCallDTO {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TokenClassKey)
  public token0: TokenClassKey;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TokenClassKey)
  public token1: TokenClassKey;

  @EnumProperty(DexFeePercentageTypes)
  public fee: DexFeePercentageTypes;

  @BigNumberIsPositive()
  @BigNumberProperty()
  public amount0Requested: BigNumber;

  @BigNumberIsPositive()
  @BigNumberProperty()
  public amount1Requested: BigNumber;

  @IsNotEmpty()
  @IsInt()
  @Max(TickData.MAX_TICK)
  public tickUpper: number;

  @IsNotEmpty()
  @IsInt()
  @Min(TickData.MIN_TICK)
  @IsLessThan("tickUpper")
  public tickLower: number;

  constructor(
    token0: TokenClassKey,
    token1: TokenClassKey,
    fee: DexFeePercentageTypes,
    amount0Requested: BigNumber,
    amount1Requested: BigNumber,
    tickLower: number,
    tickUpper: number
  ) {
    super();
    this.token0 = token0;
    this.token1 = token1;
    this.fee = fee;
    this.amount0Requested = amount0Requested;
    this.amount1Requested = amount1Requested;
    this.tickLower = tickLower;
    this.tickUpper = tickUpper;
  }
}

export class AddLiquidityDTO extends ChainCallDTO {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TokenClassKey)
  public readonly token0: TokenClassKey;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TokenClassKey)
  public readonly token1: TokenClassKey;

  @EnumProperty(DexFeePercentageTypes)
  public fee: DexFeePercentageTypes;

  @IsNotEmpty()
  @IsInt()
  @Max(TickData.MAX_TICK)
  public readonly tickUpper: number;

  @IsNotEmpty()
  @IsInt()
  @Min(TickData.MIN_TICK)
  @IsLessThan("tickUpper")
  public readonly tickLower: number;

  @BigNumberIsPositive()
  @BigNumberProperty()
  public amount0Desired: BigNumber;

  @BigNumberIsPositive()
  @BigNumberProperty()
  public amount1Desired: BigNumber;

  @BigNumberIsPositive()
  @BigNumberProperty()
  public amount0Min: BigNumber;

  @BigNumberIsPositive()
  @BigNumberProperty()
  public amount1Min: BigNumber;

  constructor(
    token0: TokenClassKey,
    token1: TokenClassKey,
    fee: DexFeePercentageTypes,
    tickLower: number,
    tickUpper: number,
    amount0Desired: BigNumber,
    amount1Desired: BigNumber,
    amount0Min: BigNumber,
    amount1Min: BigNumber
  ) {
    super();
    this.token0 = token0;
    this.token1 = token1;
    this.fee = fee;
    this.tickLower = tickLower;
    this.tickUpper = tickUpper;
    this.amount0Desired = amount0Desired;
    this.amount1Desired = amount1Desired;
    this.amount0Min = amount0Min;
    this.amount1Min = amount1Min;
  }
}

export class SwapResDto extends ChainCallDTO {
  @IsNotEmpty()
  @IsString()
  public token0: string;

  @IsNotEmpty()
  @IsString()
  public token0ImageUrl: string;

  @IsNotEmpty()
  @IsString()
  public token1: string;

  @IsNotEmpty()
  @IsString()
  public token1ImageUrl: string;

  @IsNotEmpty()
  @IsString()
  public amount0: string;

  @IsNotEmpty()
  @IsString()
  public amount1: string;

  @IsNotEmpty()
  @IsString()
  public userAddress: string;

  @IsNotEmpty()
  @IsNumber()
  public timeStamp: number;

  constructor(
    token0: string,
    token0ImageUrl: string,
    token1: string,
    token1ImageUrl: string,
    amount0: string,
    amount1: string,
    userAddress: string,
    timeStamp: number
  ) {
    super();
    this.token0 = token0;
    this.token0ImageUrl = token0ImageUrl;
    this.token1 = token1;
    this.token1ImageUrl = token1ImageUrl;
    this.amount0 = amount0;
    this.amount1 = amount1;
    this.userAddress = userAddress;
    this.timeStamp = timeStamp;
  }
}

export class AddLiquidityResDto extends ChainCallDTO {
  @ValidateNested()
  @Type(() => UserBalanceResDto)
  userBalanceDelta: UserBalanceResDto;

  @IsArray()
  @IsString({ each: true })
  amounts: string[];

  constructor(userBalanceDelta: UserBalanceResDto, amounts: string[]) {
    super();
    this.userBalanceDelta = userBalanceDelta;
    this.amounts = amounts;
  }
}

export class GetUserPositionsResDto extends ChainCallDTO {
  @IsNotEmpty()
  @ArrayMinSize(0)
  positions: IPosition[];

  @IsOptional()
  @IsString()
  nextBookMark?: string;

  constructor(positions: IPosition[], nextBookMark: string) {
    super();
    this.positions = positions;
    this.nextBookMark = nextBookMark;
  }
}

export class CollectTradingFeesDto extends ChainCallDTO {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TokenClassKey)
  public token0: TokenClassKey;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TokenClassKey)
  public token1: TokenClassKey;

  @EnumProperty(DexFeePercentageTypes)
  public fee: DexFeePercentageTypes;

  @IsNotEmpty()
  @IsUserAlias()
  public recepient: string;

  constructor(token0: TokenClassKey, token1: TokenClassKey, fee: DexFeePercentageTypes, recepient: string) {
    super();
    this.token0 = token0;
    this.token1 = token1;
    this.fee = fee;
    this.recepient = recepient;
  }
}

export class SetProtocolFeeDto extends ChainCallDTO {
  @IsNumber()
  public protocolFee: number;

  constructor(protocolFee: number) {
    super();
    this.protocolFee = protocolFee;
  }
}

export interface IPosition {
  poolHash: string;
  tickUpper: number;
  tickLower: number;
  liquidity: string;
  positionId: string;
  token0Img?: string;
  token1Img?: string;
  token0ClassKey?: TokenClassKey;
  token1ClassKey?: TokenClassKey;
  fee?: DexFeePercentageTypes;
  token0Symbol?: string;
  token1Symbol?: string;
}

export class GetLiquidityResDto extends ChainCallDTO {
  @BigNumberIsPositive()
  @BigNumberProperty()
  public liquidity: BigNumber;

  constructor(liquidity: BigNumber) {
    super();
    this.liquidity = liquidity;
  }
}

export class GetAddLiquidityEstimationResDto extends ChainCallDTO {
  @IsBigNumber()
  @BigNumberProperty()
  public amount0: BigNumber;

  @IsBigNumber()
  @BigNumberProperty()
  public amount1: BigNumber;

  @BigNumberIsPositive()
  @BigNumberProperty()
  public liquidity: BigNumber;

  constructor(amount0: BigNumber, amount1: BigNumber, liquidity: BigNumber) {
    super();
    this.amount0 = f18(amount0);
    this.amount1 = f18(amount1);
    this.liquidity = f18(liquidity);
  }
}

export class QuoteExactAmountResDto extends ChainCallDTO {
  @IsBigNumber()
  @BigNumberProperty()
  public amount0: BigNumber;

  @IsBigNumber()
  @BigNumberProperty()
  public amount1: BigNumber;

  @IsBigNumber()
  @BigNumberProperty()
  public currentSqrtPrice: BigNumber;

  @IsBigNumber()
  @BigNumberProperty()
  public newSqrtPrice: BigNumber;

  constructor(amount0: BigNumber, amount1: BigNumber, currentSqrtPrice: BigNumber, newSqrtPrice: BigNumber) {
    super();
    this.amount0 = f18(amount0);
    this.amount1 = f18(amount1);
    this.currentSqrtPrice = f18(currentSqrtPrice);
    this.newSqrtPrice = f18(newSqrtPrice);
  }
}

export class GetRemoveLiqEstimationResDto extends ChainCallDTO {
  @IsString()
  public amount0: string;

  @IsString()
  public amount1: string;

  constructor(amount0: string, amount1: string) {
    super();
    this.amount0 = amount0;
    this.amount1 = amount1;
  }
}

export class CollectTradingFeesResDto extends ChainCallDTO {
  @IsBigNumber()
  @BigNumberProperty()
  public protocolFeesToken0: BigNumber;

  @IsBigNumber()
  @BigNumberProperty()
  public protocolFeesToken1: BigNumber;

  constructor(protocolFeesToken0: BigNumber, protocolFeesToken1: BigNumber) {
    super();
    this.protocolFeesToken0 = f18(protocolFeesToken0);
    this.protocolFeesToken1 = f18(protocolFeesToken1);
  }
}

export class SetProtocolFeeResDto extends ChainCallDTO {
  @IsNumber()
  public protocolFee: number;
  constructor(newFee: number) {
    super();
    this.protocolFee = newFee;
  }
}

export class ConfigureDexFeeAddressDto extends ChainCallDTO {
  @ValidateIf((e) => e.newDexFeeAddress !== undefined)
  @IsUserAlias()
  public newDexFeeAddress?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  public newAuthorities?: string[];
}

export class BurnEstimateDto extends ChainCallDTO {
  @IsNotEmpty()
  @IsInt()
  @Max(TickData.MAX_TICK)
  public tickUpper: number;

  @IsNotEmpty()
  @IsInt()
  @Min(TickData.MIN_TICK)
  @IsLessThan("tickUpper")
  public tickLower: number;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TokenClassKey)
  public token0: TokenClassKey;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TokenClassKey)
  public token1: TokenClassKey;

  @EnumProperty(DexFeePercentageTypes)
  public fee: DexFeePercentageTypes;

  @BigNumberIsPositive()
  @BigNumberProperty()
  public amount: BigNumber;

  @IsNotEmpty()
  @IsUserAlias()
  public owner: string;

  constructor(
    token0: TokenClassKey,
    token1: TokenClassKey,
    fee: DexFeePercentageTypes,
    amount: BigNumber,
    tickLower: number,
    tickUpper: number,
    owner: string
  ) {
    super();
    this.tickLower = tickLower;
    this.tickUpper = tickUpper;
    this.amount = amount;
    this.token0 = token0;
    this.token1 = token1;
    this.fee = fee;
    this.owner = owner;
  }
}

export class TransferDexPositionDto extends ChainCallDTO {
  @IsNotEmpty()
  @IsUserAlias()
  public toAddress: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TokenClassKey)
  public token0: TokenClassKey;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TokenClassKey)
  public token1: TokenClassKey;

  @EnumProperty(DexFeePercentageTypes)
  public fee: DexFeePercentageTypes;

  @IsNotEmpty()
  public positionId: string;
}

export class GetPositionByIdDto extends ChainCallDTO {
  @IsNotEmpty()
  @IsString()
  poolHash: string;

  @IsInt()
  @Max(TickData.MAX_TICK)
  tickUpper: number;

  @IsInt()
  @Min(TickData.MIN_TICK)
  @IsLessThan("tickUpper")
  tickLower: number;

  @IsNotEmpty()
  @IsString()
  public positionId: string;
}

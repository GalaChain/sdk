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

import { PositionInPool } from "../utils";
import { BigNumberArrayProperty, BigNumberProperty } from "../validators";
import { TokenBalance } from "./TokenBalance";
import { TokenClassKey } from "./TokenClass";
import { TokenInstanceKey } from "./TokenInstance";
import { ChainCallDTO } from "./dtos";

export class CreatePoolDto extends ChainCallDTO {
  @IsNotEmpty()
  public token0: TokenClassKey;
  @IsNotEmpty()
  public token1: TokenClassKey;
  @IsNotEmpty()
  public fee: number;
  @BigNumberProperty()
  @IsNotEmpty()
  public initialSqrtPrice: BigNumber;
  @Min(0, { message: "Value cannot less than zero" })
  @Max(1, { message: "Value cannot greater than one" })
  @IsNumber()
  protocolFee: number;

  constructor(
    token0: TokenClassKey,
    token1: TokenClassKey,
    fee: number,
    initialSqrtPrice: BigNumber,
    protocolFee = 0
  ) {
    super();
    this.token0 = token0;
    this.token1 = token1;
    this.fee = fee;
    this.initialSqrtPrice = initialSqrtPrice;
    this.protocolFee = protocolFee;
  }
}

export class PositionDto extends ChainCallDTO {
  @IsNotEmpty()
  public token0: TokenClassKey;
  @IsNotEmpty()
  public token1: TokenClassKey;
  @IsNumber()
  public fee: number;
  @IsOptional()
  public owner: string;
  @IsNotEmpty()
  public tickLower: number;
  @IsNotEmpty()
  public tickUpper: number;
  @IsOptional()
  @BigNumberProperty()
  public liquidity: BigNumber;

  constructor(
    token0: TokenClassKey,
    token1: TokenClassKey,
    fee: number,
    owner: string,
    tickLower: number,
    tickUpper: number,
    liquidity: BigNumber
  ) {
    super();
    this.token0 = token0;
    this.token1 = token1;
    this.fee = fee;
    this.owner = owner;
    this.tickLower = tickLower;
    this.tickUpper = tickUpper;
    this.liquidity = liquidity;
  }
}

export class QuoteExactAmountDto extends ChainCallDTO {
  @IsNotEmpty()
  public token0: TokenClassKey;
  @IsNotEmpty()
  public token1: TokenClassKey;
  @IsNotEmpty()
  public fee: number;
  @IsNotEmpty()
  public zeroForOne: boolean;
  @BigNumberProperty()
  @IsNotEmpty()
  public amount: BigNumber;

  constructor(
    token0: TokenClassKey,
    token1: TokenClassKey,
    fee: number,
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
  public token0: TokenClassKey;
  @IsNotEmpty()
  public token1: TokenClassKey;
  @IsNotEmpty()
  public fee: number;
  @IsNotEmpty()
  public zeroForOne: boolean;

  @BigNumberProperty()
  @IsNotEmpty()
  public sqrtPriceLimit: BigNumber;

  @BigNumberProperty()
  @IsNotEmpty()
  public amount: BigNumber;

  @BigNumberProperty()
  @IsOptional()
  public amountInMaximum: BigNumber;

  @BigNumberProperty()
  @IsOptional()
  public amountOutMinimum: BigNumber;

  constructor(
    token0: TokenClassKey,
    token1: TokenClassKey,
    fee: number,
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
  public tickLower: number;
  @IsNotEmpty()
  public tickUpper: number;
  @IsNotEmpty()
  public token0: TokenClassKey;
  @IsNotEmpty()
  public token1: TokenClassKey;
  @IsNotEmpty()
  public fee: number;
  @BigNumberProperty()
  @IsNotEmpty()
  public amount: BigNumber;

  constructor(
    token0: TokenClassKey,
    token1: TokenClassKey,
    fee: number,
    amount: BigNumber,
    tickLower: number,
    tickUpper: number
  ) {
    super();
    this.tickLower = tickLower;
    this.tickUpper = tickUpper;
    this.amount = amount;
    this.token0 = token0;
    this.token1 = token1;
    this.fee = fee;
  }
}

export class GetPoolDto extends ChainCallDTO {
  @IsNotEmpty()
  public token0: TokenClassKey;
  @IsNotEmpty()
  public token1: TokenClassKey;
  @IsNotEmpty()
  public fee: number;

  constructor(token0: TokenClassKey, token1: TokenClassKey, fee: number) {
    super();
    this.token0 = token0;
    this.token1 = token1;
    this.fee = fee;
  }
}

export class Slot0ResDto extends ChainCallDTO {
  @IsNotEmpty()
  @BigNumberProperty()
  public sqrtPrice: BigNumber;
  @IsNotEmpty()
  public tick: number;
  @IsNotEmpty()
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
  public address: string;
}

export class GetPositionDto extends ChainCallDTO {
  @IsNotEmpty()
  public token0: TokenClassKey;
  @IsNotEmpty()
  public token1: TokenClassKey;
  @IsNotEmpty()
  public fee: number;
  @IsNotEmpty()
  public owner: string;
  @IsNotEmpty()
  public tickLower: number;
  @IsNotEmpty()
  public tickUpper: number;

  constructor(
    token0: TokenClassKey,
    token1: TokenClassKey,
    fee: number,
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

export class positionInfoDto {
  @IsString()
  public owner: string;
  @IsString()
  public liquidity: string;
  @IsString()
  public feeGrowthInside0Last: string;
  @IsString()
  public feeGrowthInside1Last: string;
  @IsString()
  // fees owed to the position owner in token0/token1
  @IsString()
  public tokensOwed0: string;
  @IsString()
  public tokensOwed1: string;
}

export class GetUserPositionsDto extends ChainCallDTO {
  @IsNotEmpty()
  public user: string;

  @Min(1, { message: "Value cannot be zero" })
  @IsOptional()
  public page: number;

  @Min(1, { message: "Value cannot be zero" })
  @IsOptional()
  public limit: number;

  constructor(user: string, page = 1, limit = 10) {
    super();
    this.user = user;
    this.page = page;
    this.limit = limit;
  }
}

export class UserPositionDTO extends ChainCallDTO {
  positions: PositionInPool;
}

export class GetPositionResDto {
  @IsNotEmpty()
  @IsString()
  owner: string;
  @IsNotEmpty()
  @IsString()
  liquidity: string;
  @IsNotEmpty()
  @IsString()
  feeGrowthInside0Last: string;
  @IsString()
  @IsNotEmpty()
  feeGrowthInside1Last: string;
  @IsNotEmpty()
  @IsString()
  tokensOwed0: string;
  @IsNotEmpty()
  @IsString()
  tokensOwed1: string;
}

export class GetAddLiquidityEstimationDto extends ChainCallDTO {
  @BigNumberProperty()
  @IsNotEmpty()
  public amount: BigNumber;
  @IsNotEmpty()
  public tickLower: number;
  @IsNotEmpty()
  public tickUpper: number;
  @IsNotEmpty()
  public zeroForOne: boolean;

  @IsNotEmpty()
  public token0: TokenClassKey;
  @IsNotEmpty()
  public token1: TokenClassKey;
  @IsNotEmpty()
  public fee: number;

  constructor(
    token0: TokenClassKey,
    token1: TokenClassKey,
    fee: number,
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
  public token0Balance: TokenBalance;
  @IsNotEmpty()
  public token1Balance: TokenBalance;

  constructor(token0Balance: TokenBalance, token1Balance: TokenBalance) {
    super();
    this.token0Balance = token0Balance;
    this.token1Balance = token1Balance;
  }
}

export class CollectDto extends ChainCallDTO {
  @IsNotEmpty()
  public token0: TokenClassKey;
  @IsNotEmpty()
  public token1: TokenClassKey;
  @IsNotEmpty()
  public fee: number;
  @BigNumberProperty()
  @IsNotEmpty()
  public amount0Requested: BigNumber;
  @BigNumberProperty()
  @IsNotEmpty()
  public amount1Requested: BigNumber;
  @IsNotEmpty()
  public tickLower: number;
  @IsNotEmpty()
  public tickUpper: number;

  constructor(
    token0: TokenClassKey,
    token1: TokenClassKey,
    fee: number,
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
  public readonly token0: TokenClassKey;
  @IsNotEmpty()
  public readonly token1: TokenClassKey;
  @IsNotEmpty()
  public readonly fee: number;
  @IsNotEmpty()
  public readonly tickLower: number;
  @IsNotEmpty()
  public readonly tickUpper: number;

  @BigNumberProperty()
  public amount0Desired: BigNumber;
  @BigNumberProperty()
  public amount1Desired: BigNumber;
  @BigNumberProperty()
  public amount0Min: BigNumber;
  @BigNumberProperty()
  public amount1Min: BigNumber;

  constructor(
    token0: TokenClassKey,
    token1: TokenClassKey,
    fee: number,
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
  public token0: string;
  @IsNotEmpty()
  public token0ImageUrl: string;
  @IsNotEmpty()
  public token1: string;
  @IsNotEmpty()
  public token1ImageUrl: string;
  @IsNotEmpty()
  public amount0: string;
  @IsNotEmpty()
  public amount1: string;
  @IsNotEmpty()
  public userAddress: string;
  @IsNotEmpty()
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

export class AddLiquidityResDto {
  userBalanceDelta: UserBalanceResDto;
  @BigNumberArrayProperty()
  amounts: BigNumber[];

  constructor(userBalanceDelta: UserBalanceResDto, amounts: BigNumber[]) {
    this.userBalanceDelta = userBalanceDelta;
    this.amounts = amounts;
  }
}

export class PositionsObject {
  [key: string]: IPosition[];
}

export class GetUserPositionsResDto {
  @IsNotEmpty()
  positions: PositionsObject;
  @IsNotEmpty()
  @IsNumber()
  totalCount: number;

  constructor(positions: PositionsObject, totalCount: number) {
    this.positions = positions;
    this.totalCount = totalCount;
  }
}

export class CollectProtocolFeesDto extends ChainCallDTO {
  @IsNotEmpty()
  public token0: TokenClassKey;
  @IsNotEmpty()
  public token1: TokenClassKey;
  @IsNotEmpty()
  public fee: number;
  @IsString()
  @IsNotEmpty()
  public recepient: string;

  constructor(token0: TokenClassKey, token1: TokenClassKey, fee: number, recepient: string) {
    super();
    this.token0 = token0;
    this.token1 = token1;
    this.fee = fee;
    this.recepient = recepient;
  }
}

export class SetProtocolFeeDto extends ChainCallDTO {
  @IsNotEmpty()
  public token0: TokenClassKey;
  @IsNotEmpty()
  public token1: TokenClassKey;
  @IsNotEmpty()
  public fee: number;
  @IsNumber()
  @IsNotEmpty()
  public protocolFee: number;

  constructor(token0: TokenClassKey, token1: TokenClassKey, fee: number, protocolFee: number) {
    super();
    this.token0 = token0;
    this.token1 = token1;
    this.fee = fee;
    this.protocolFee = protocolFee;
  }
}

export interface IPosition {
  tickLower: number;
  tickUpper: number;
  liquidity: string;
  token0Img?: string;
  token1Img?: string;
  token0InstanceKey?: TokenInstanceKey & {
    collection: string;
    category: string;
    type: string;
    additionalKey: string;
    instance: BigNumber;
  };
  token1InstanceKey?: TokenInstanceKey & {
    collection: string;
    category: string;
    type: string;
    additionalKey: string;
    instance: BigNumber;
  };
  token0Symbol?: string;
  token1Symbol?: string;
}

export class GetLiquidityResDto extends ChainCallDTO {
  @IsNotEmpty()
  @BigNumberProperty()
  public liquidity: BigNumber;
  constructor(liquidity: BigNumber) {
    super();
    this.liquidity = liquidity;
  }
}

export class GetAddLiquidityEstimationResDto extends ChainCallDTO {
  @IsNotEmpty()
  @BigNumberProperty()
  public amount0: BigNumber;
  @IsNotEmpty()
  @BigNumberProperty()
  public amount1: BigNumber;
  @IsNotEmpty()
  @BigNumberProperty()
  public liquidity: BigNumber;
  constructor(amount0: BigNumber, amount1: BigNumber, liquidity: BigNumber) {
    super();
    this.amount0 = amount0.f18();
    this.amount1 = amount1.f18();
    this.liquidity = liquidity.f18();
  }
}

export class QuoteExactAmountResDto extends ChainCallDTO {
  @IsNotEmpty()
  @BigNumberProperty()
  public amount0: BigNumber;
  @IsNotEmpty()
  @BigNumberProperty()
  public amount1: BigNumber;
  @IsNotEmpty()
  @BigNumberProperty()
  public currentSqrtPrice: BigNumber;
  @IsNotEmpty()
  @BigNumberProperty()
  public newSqrtPrice: BigNumber;
  constructor(amount0: BigNumber, amount1: BigNumber, currentSqrtPrice: BigNumber, newSqrtPrice: BigNumber) {
    super();
    this.amount0 = amount0.f18();
    this.amount1 = amount1.f18();
    this.currentSqrtPrice = currentSqrtPrice.f18();
    this.newSqrtPrice = newSqrtPrice.f18();
  }
}

export class GetRemoveLiqEstimationResDto extends ChainCallDTO {
  @BigNumberProperty()
  public amount0: BigNumber;
  @BigNumberProperty()
  public amount1: BigNumber;
  constructor(amount0: BigNumber, amount1: BigNumber) {
    super();
    this.amount0 = amount0.f18();
    this.amount1 = amount1.f18();
  }
}

export class CollectProtocolFeesResDto extends ChainCallDTO {
  @IsNotEmpty()
  @BigNumberProperty()
  u;
  public protocolFeesToken0: BigNumber;
  @IsNotEmpty()
  @BigNumberProperty()
  public protocolFeesToken1: BigNumber;
  constructor(protocolFeesToken0: BigNumber, protocolFeesToken1: BigNumber) {
    super();
    this.protocolFeesToken0 = protocolFeesToken0.f18();
    this.protocolFeesToken1 = protocolFeesToken1.f18();
  }
}

export class SetProtocolFeeResDto extends ChainCallDTO {
  @IsNumber()
  @IsNotEmpty()
  public fee: number;
  constructor(newFee: number) {
    super();
    this.fee = newFee;
  }
}

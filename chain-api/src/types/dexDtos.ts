import BigNumber from "bignumber.js";
import { IsNotEmpty, IsOptional, Min } from "class-validator";

import { BigNumberProperty } from "../validators";
import { TokenBalance } from "./TokenBalance";
import { TokenClassKey } from "./TokenClass";
import { ChainCallDTO, SubmitCallDTO } from "./dtos";
import { PositionInPool } from "./dexTypes";

export class CreatePoolDto extends SubmitCallDTO {
  @IsNotEmpty()
  public token0: TokenClassKey;
  @IsNotEmpty()
  public token1: TokenClassKey;
  @IsNotEmpty()
  public fee: number;
  @BigNumberProperty()
  @IsNotEmpty()
  public initialSqrtPrice: BigNumber;

  constructor(token0: TokenClassKey, token1: TokenClassKey, fee: number, initialSqrtPrice: BigNumber) {
    super();
    this.token0 = token0;
    this.token1 = token1;
    this.fee = fee;
    this.initialSqrtPrice = initialSqrtPrice;
  }
}

export class PositionDto extends ChainCallDTO {
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
  @IsNotEmpty()
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

export class SwapDto extends SubmitCallDTO {
  @IsNotEmpty()
  public token0: TokenClassKey;
  @IsNotEmpty()
  public token1: TokenClassKey;
  @IsNotEmpty()
  public fee: number;
  public recipient: string;
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
    recipient: string,
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
    this.recipient = recipient;
  }
}

export class BurnDto extends SubmitCallDTO {
  public recipient: string;
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
    recipient: string,
    amount: BigNumber,
    tickLower: number,
    tickUpper: number
  ) {
    super();
    this.recipient = recipient;
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

export class Slot0Dto extends ChainCallDTO {
  @IsNotEmpty()
  public sqrtPrice: string;
  @IsNotEmpty()
  public tick: number;
  @IsNotEmpty()
  public liquidity: string;

  constructor(sqrtPrice: BigNumber, tick: number, liquidity: BigNumber) {
    super();
    this.sqrtPrice = sqrtPrice.toString();
    this.tick = tick;
    this.liquidity = liquidity.toString();
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

export class positionInfoDto extends ChainCallDTO {
  public owner: string;
  public liquidity: string;
  public feeGrowthInside0Last: string;
  public feeGrowthInside1Last: string;
  // fees owed to the position owner in token0/token1
  public tokensOwed0: string;
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

  constructor(user: string, page: number = 1, limit: number = 10) {
    super();
    this.user = user;
    this.page = page;
    this.limit = limit;
  }
}

export class UserPositionDTO extends ChainCallDTO {
  positions: PositionInPool;
}

export class PositionDataDTO extends ChainCallDTO {
  owner: string;
  liquidity: string;
  feeGrowthInside0Last: string;
  feeGrowthInside1Last: string;
  tokensOwed0: string;
  tokensOwed1: string;
}

export class ExpectedTokenDTO extends ChainCallDTO {
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

export class UserBalanceResponseDto extends ChainCallDTO {
  public token0Balance: TokenBalance;
  public token1Balance: TokenBalance;

  constructor(token0Balance: TokenBalance, token1Balance: TokenBalance) {
    super();
    this.token0Balance = token0Balance;
    this.token1Balance = token1Balance;
  }
}

export class CollectDTO extends SubmitCallDTO {
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

export class AddLiquidityDTO extends SubmitCallDTO {
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

export class SwapResponseDto extends ChainCallDTO {
  public token0: string;
  public token0ImageUrl: string;
  public token1: string;
  public token1ImageUrl: string;
  public amount0: string;
  public amount1: string;
  public userAddress: string;
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

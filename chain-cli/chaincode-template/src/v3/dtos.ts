import { BigNumberProperty, ChainCallDTO, TokenBalance, TokenClassKey } from "@gala-chain/api";
import BigNumber from "bignumber.js";
import { IsOptional, Min } from "class-validator";

import { PositionInPool } from "./types";

export class CreatePoolDto extends ChainCallDTO {
  public  token0: TokenClassKey;
  public  token1: TokenClassKey;
  public  fee: number;
  @BigNumberProperty()
  public  initialSqrtPrice: BigNumber;

  constructor(
    token0: TokenClassKey,
    token1: TokenClassKey,
    fee: number,
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
  public  token0: TokenClassKey;

  public  token1: TokenClassKey;

  public  fee: number;

  public  owner: string;

  public  tickLower: number;

  public  tickUpper: number;

  @BigNumberProperty()
  public  liquidity: BigNumber;

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
  public  token0: TokenClassKey;
  public  token1: TokenClassKey;
  public  fee: number;
  public  zeroForOne: boolean;
  @BigNumberProperty()
  public  amount: BigNumber;
  
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
  public  token0: TokenClassKey;
  public  token1: TokenClassKey;
  public  fee: number;
  public  recipient: string;
  public  zeroForOne: boolean;

  @BigNumberProperty()
  public  sqrtPriceLimit: BigNumber;

  @BigNumberProperty()
  public  amount: BigNumber;

  @BigNumberProperty()
  @IsOptional()
  public  amountInMaximum: BigNumber;

  @BigNumberProperty()
  @IsOptional()
  public  amountOutMinimum: BigNumber;

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

export class BurnDto extends ChainCallDTO {
  public  recipient: string;
  public  tickLower: number;
  public  tickUpper: number;
  public  token0: TokenClassKey;
  public  token1: TokenClassKey;
  public  fee: number;
  @BigNumberProperty()
  public  amount: BigNumber;

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
  public  token0: TokenClassKey;
  public  token1: TokenClassKey;
  public  fee: number;
  constructor(token0: TokenClassKey, token1: TokenClassKey, fee: number) {
    super();
    this.token0 = token0;
    this.token1 = token1;
    this.fee = fee;
  }
}

export class Slot0Dto extends ChainCallDTO {
  public  sqrtPrice: string;
  public  tick: number;
  public  liquidity: string;
  constructor(sqrtPrice: BigNumber, tick: number, liquidity: BigNumber) {
    super();
    this.sqrtPrice = sqrtPrice.toString();
    this.tick = tick;
    this.liquidity = liquidity.toString();
  }
}

export class GetPoolDataDTO extends ChainCallDTO {
  public  address: string;
}

export class GetPositionDto extends ChainCallDTO {
  public  token0: TokenClassKey;
  public  token1: TokenClassKey;
  public  fee: number;
  public  owner: string;
  public  tickLower: number;
  public  tickUpper: number;

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

export class GetLiquidityDTO extends ChainCallDTO {}

export class positionInfoDto extends ChainCallDTO {
  public  owner: string;
  public  liquidity: string;
  public  feeGrowthInside0Last: string;
  public  feeGrowthInside1Last: string;
  // fees owed to the position owner in token0/token1
  public  tokensOwed0: string;
  public  tokensOwed1: string;
}

export class GetUserPositionsDto extends ChainCallDTO {
  public  user: string;

  @Min(1, { message: "Value cannot be zero" })
  @IsOptional()
  public  page: number;

  @Min(1, { message: "Value cannot be zero" })
  @IsOptional()
  public  limit: number;

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
  public amount: BigNumber;
  public tickLower: number;
  public tickUpper: number;
  public zeroForOne: boolean;

  public token0: TokenClassKey;
  public token1: TokenClassKey;
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

export class ExpectedTokenOutDTO extends ChainCallDTO {
  public;
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

export class CollectDTO extends ChainCallDTO {
  public  token0: TokenClassKey;
  public  token1: TokenClassKey;
  public  fee: number;
  @BigNumberProperty()
  public  amount0Requested: BigNumber;
  @BigNumberProperty()
  public  amount1Requested: BigNumber;
  public tickLower: number;
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
  public readonly token0: TokenClassKey;
  public readonly token1: TokenClassKey;
  public readonly fee: number;
  public readonly tickLower: number;
  public readonly tickUpper: number;

  @BigNumberProperty()
  public  amount0Desired: BigNumber;
  @BigNumberProperty()
  public  amount1Desired: BigNumber;
  @BigNumberProperty()
  public  amount0Min: BigNumber;
  @BigNumberProperty()
  public  amount1Min: BigNumber;

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

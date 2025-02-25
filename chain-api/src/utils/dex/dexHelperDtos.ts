import { IsBoolean, IsOptional, IsString } from "class-validator";

export class TickDataObj {
  [key: string]: TickData;
}

export class Bitmap {
  [key: number | string]: string;
}

export class PositionData {
  @IsOptional()
  @IsString()
  owner: string;

  @IsOptional()
  @IsString()
  liquidity: string;

  @IsOptional()
  @IsString()
  feeGrowthInside0Last: string;

  @IsOptional()
  @IsString()
  feeGrowthInside1Last: string;

  @IsOptional()
  @IsString()
  tokensOwed0: string;

  @IsOptional()
  @IsString()
  tokensOwed1: string;
}

export class Positions {
  [key: string]: PositionData;
}

export class TickData {
  @IsOptional()
  @IsString()
  liquidityGross: string;
  @IsOptional()
  @IsBoolean()
  initialised: boolean;
  @IsOptional()
  @IsString()
  liquidityNet: string;
  @IsOptional()
  @IsString()
  feeGrowthOutside0: string;
  @IsOptional()
  @IsString()
  feeGrowthOutside1: string;
}

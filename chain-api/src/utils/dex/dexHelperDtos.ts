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

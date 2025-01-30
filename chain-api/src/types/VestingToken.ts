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
import { JSONSchema } from "class-validator-jsonschema";

import { TokenClassKey } from "./TokenClass";
import { ChainCallDTO } from "./dtos";
import { CreateTokenClassDto } from "./token";
import BigNumber from "bignumber.js";
import { Exclude, Type } from "class-transformer";
import { ArrayMinSize, ArrayUnique, IsDefined, IsInt, IsNotEmpty, IsString, Min, ValidateNested } from "class-validator";
import { BigNumberIsNotNegative, BigNumberProperty, IsUserAlias } from "../validators";

import { ChainKey } from "../utils";
import { ChainObject } from "./ChainObject";
import { TokenBalance } from "./TokenBalance";

export class Allocation {
  @IsString()
  name: string;

  @IsUserAlias()
  owner: string;

  @BigNumberIsNotNegative()
  @BigNumberProperty()
  quantity: BigNumber;

  @Min(0)
  @IsInt()
  cliff: number;

  @Min(0)
  @IsInt()
  vestingDays: number;
}

export class VestingToken extends ChainObject {
  @Exclude()
  public static INDEX_KEY = "GCVT";

  @ChainKey({ position: 0 })
  @IsNotEmpty()
  public collection: string;

  @ChainKey({ position: 1 })
  @IsNotEmpty()
  public category: string;

  @ChainKey({ position: 2 })
  @IsNotEmpty()
  public type: string;

  @ChainKey({ position: 3 })
  @IsDefined()
  public additionalKey: string;

  @IsString()
  vestingName: string;

  @Min(0)
  @IsInt()
  startDate: number;

  @ValidateNested({ each: true })
  @Type(() => Allocation)
  @ArrayMinSize(1)
  @ArrayUnique()
  allocations: Array<Allocation>;
}

// Combines the base VestingToken data with balances for allocations
export class VestingTokenInfo {
  vestingToken: VestingToken

  allocationBalances: Array<TokenBalance>
}

@JSONSchema({
  description: "Fetch vesting info including balances of allocations"
})
export class FetchVestingTokenInfoDto extends ChainCallDTO {
  @JSONSchema({
    description: "The Vested Token Class to be Fetched."
  })
  @ValidateNested()
  @Type(() => TokenClassKey)
  @IsNotEmpty()
  tokenClasses: TokenClassKey;
}

export class FetchVestingTokenInfoResponse extends ChainCallDTO {
  @JSONSchema({ description: "Vesting Token Info." })
  @ValidateNested()
  @Type(() => VestingToken)
  vestingTokenInfo: VestingTokenInfo;
}

@JSONSchema({
  description: "Contains list of objects representing vesting tokens to fetch."
})
export class FetchVestingTokenDto extends ChainCallDTO {
  @JSONSchema({
    description: "The Vested Token Class to be Fetched."
  })
  @ValidateNested()
  @Type(() => TokenClassKey)
  tokenClasses: TokenClassKey;
}

@JSONSchema({
  description:
    "Contains properties of vesting token to be created."
})
export class CreateVestingTokenDto extends ChainCallDTO {
  @JSONSchema({
    description: "The Token Class to be created with Vesting."
  })
  @ValidateNested()
  @Type(() => CreateTokenClassDto)
  @IsNotEmpty()
  tokenClass: CreateTokenClassDto;

  @JSONSchema({
    description:
      "Name for the token holds. This name will be applied to all token holds created."
  })
  @IsString()
  vestingName: string;

  @JSONSchema({
    description:
      "Start date timestamp. Cliff and vesting calculations will use this as the starting point."
  })
  @Min(0)
  @IsInt()
  startDate: number;

  @JSONSchema({
    description: "Allocations."
  })
  @ValidateNested({ each: true })
  @Type(() => Allocation)
  @ArrayMinSize(1)
  @ArrayUnique()
  allocations: Array<Allocation>;
}

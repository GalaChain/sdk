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
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested
} from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import { TokenClassKey } from "./TokenClass";
import { ChainCallDTO } from "./dtos";
import { CreateTokenClassDto } from "./token";
import { Allocation } from "./Allocation";
import { VestingToken } from "./VestingToken";

@JSONSchema({
  description: "Contains list of objects representing token classes to fetch."
})
export class FetchVestingTokensDto extends ChainCallDTO {
  @ValidateNested({ each: true })
  @Type(() => TokenClassKey)
  @ArrayNotEmpty()
  tokenClasses: Array<TokenClassKey>;
}

export class FetchVestingTokensResponse extends ChainCallDTO {
  @JSONSchema({ description: "List of Token Classes." })
  @ValidateNested({ each: true })
  @Type(() => VestingToken)
  tokenClass: VestingToken[];
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

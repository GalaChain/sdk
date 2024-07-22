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
import { IsDefined, IsInt, IsNotEmpty, IsOptional, IsPositive } from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import {
  BigNumberIsInteger,
  BigNumberIsNotNegative,
  BigNumberProperty,
  EnumProperty,
  IsUserAlias
} from "../validators";
import { ChainCallDTO } from "./dtos";

export enum AllowanceType {
  Use = 0,
  Lock = 1,
  // Note: We may want to remove this in the future, as Spend is redundant with transfer allowance
  Spend = 2,
  Transfer = 3,
  Mint = 4,
  Swap = 5,
  Burn = 6
}

@JSONSchema({
  description: "Key fields that identity an existing TokenAllowance."
})
export class AllowanceKey extends ChainCallDTO {
  @IsUserAlias()
  public grantedTo: string;

  @IsNotEmpty()
  public collection: string;

  @IsNotEmpty()
  public category: string;

  @IsNotEmpty()
  public type: string;

  @IsDefined()
  public additionalKey: string;

  @IsNotEmpty()
  @BigNumberIsInteger()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  public instance: BigNumber;

  @EnumProperty(AllowanceType)
  public allowanceType: AllowanceType;

  @IsUserAlias()
  public grantedBy: string;

  @IsPositive()
  @IsInt()
  public created: number;
}

export enum TokenMintStatus {
  Unknown,
  Minted,
  PartiallyMinted,
  AllowanceTotalExceeded,
  SupplyTotalExceeded,
  NullAdministrativePatchEntry
}

// todo: with various other class definitions moving out of common.ts to fix circular dependencies,
// consider where a better home for this definition could be.
@JSONSchema({ description: "Minimal property set represnting a mint request." })
export class MintRequestDto {
  @IsNotEmpty()
  public collection: string;

  @IsNotEmpty()
  public category: string;

  @IsNotEmpty()
  public type: string;

  @IsNotEmpty()
  public additionalKey: string;

  @IsNotEmpty()
  public timeKey: string;

  @BigNumberProperty()
  public totalKnownMintsCount: BigNumber;

  @IsNotEmpty()
  public id: string;

  @JSONSchema({
    description: "The owner of minted tokens. If the value is missing, chaincode caller is used."
  })
  @IsOptional()
  @IsUserAlias()
  owner?: string;

  @JSONSchema({
    description: "(Optional). Specify the TokenAllowance on chain to use for this mint."
  })
  @IsOptional()
  @Type(() => AllowanceKey)
  @IsNotEmpty()
  public allowanceKey?: AllowanceKey;

  public isTimeKeyValid(): boolean {
    try {
      new BigNumber(this.timeKey);
      return true;
    } catch (e) {
      return false;
    }
  }
}

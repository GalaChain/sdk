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
import { BigNumber } from "bignumber.js";
import { Exclude } from "class-transformer";
import { IsDefined, IsInt, IsNotEmpty, IsPositive } from "class-validator";

import { ChainKey } from "../utils";
import {
  BigNumberIsInteger,
  BigNumberIsNotNegative,
  BigNumberProperty,
  EnumProperty,
  IsUserAlias
} from "../validators";
import { ChainObject } from "./ChainObject";
import { AllowanceType } from "./common";

// A Token Claim is the other side of an allowance
// A person may have an allowance to do something,
// but it is not used and the token is not held until
// a claim is made

// This class is a prototype for future use.
// If we need to move away from the Balance approach
// where the Balance is updated with locks/uses then
// we will need to aggregate Claims to determine the
// usable balance

// TODO possible legacy, maybe we can use claims as an array in allowance
export class TokenClaim extends ChainObject {
  @Exclude()
  public static INDEX_KEY = "GCTC";

  // This is the owner of the allowance, not the token
  @ChainKey({ position: 0 })
  @IsUserAlias()
  public ownerKey: string;

  @ChainKey({ position: 1 })
  @IsNotEmpty()
  public collection: string;

  @ChainKey({ position: 2 })
  @IsNotEmpty()
  public category: string;

  @ChainKey({ position: 3 })
  @IsNotEmpty()
  public type: string;

  @ChainKey({ position: 4 })
  @IsDefined()
  public additionalKey: string;

  @ChainKey({ position: 5 })
  @IsNotEmpty()
  @BigNumberIsInteger()
  @BigNumberProperty()
  public instance: BigNumber;

  @ChainKey({ position: 6 })
  @EnumProperty(AllowanceType)
  public action: AllowanceType;

  // This is the person making the claim
  @ChainKey({ position: 7 })
  @IsUserAlias()
  public issuerKey: string;

  @ChainKey({ position: 8 })
  @IsPositive()
  @IsInt()
  public allowanceCreated: number;

  @ChainKey({ position: 9 })
  @BigNumberIsNotNegative()
  @BigNumberIsInteger()
  @BigNumberProperty()
  public claimSequence: BigNumber;

  @IsPositive()
  @IsInt()
  public created: number;

  @IsNotEmpty()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  public quantity: BigNumber;
}

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
import { IsNotEmpty, IsString } from "class-validator";

import { ChainKey } from "../utils";
import { BigNumberIsNotNegative, BigNumberProperty, EnumProperty, IsUserAlias } from "../validators";
import { ChainObject } from "./ChainObject";
import { FeeReceiptStatus } from "./FeeReceiptStatus";

export class FeeBalanceCreditReceipt extends ChainObject {
  public static INDEX_KEY = "GCCR"; // CR = Credit Receipt

  @ChainKey({ position: 0 })
  @IsNotEmpty()
  public year: string;

  @ChainKey({ position: 1 })
  @IsNotEmpty()
  public month: string;

  @ChainKey({ position: 2 })
  @IsNotEmpty()
  public day: string;

  @ChainKey({ position: 3 })
  @IsString()
  @IsNotEmpty()
  public hours: string;

  @ChainKey({ position: 4 })
  @IsString()
  @IsNotEmpty()
  public minutes: string;

  @ChainKey({ position: 5 })
  @IsString()
  @IsNotEmpty()
  public seconds: string;

  @ChainKey({ position: 6 })
  @IsUserAlias()
  public creditToUser: string;

  @ChainKey({ position: 7 })
  @IsNotEmpty()
  public txId: string;

  @IsNotEmpty()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  public quantity: BigNumber;

  @EnumProperty(FeeReceiptStatus)
  public status: FeeReceiptStatus;
}

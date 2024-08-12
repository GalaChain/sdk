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
import { IsDefined, IsNotEmpty } from "class-validator";

import { ChainKey } from "../utils";
import { BigNumberProperty, IsUserAlias } from "../validators";
import { ChainObject } from "./ChainObject";

// Replaces singular TokenClass property totalMintAllowance
// Ledger entry specifying a totalQuantity of a new Mint GiveAllowance req
export class TokenMintAllowance extends ChainObject {
  public static INDEX_KEY = "GCTMA";

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

  @ChainKey({ position: 4 })
  @BigNumberProperty()
  public totalKnownMintAllowancesAtRequest: BigNumber;

  @ChainKey({ position: 5 })
  @IsUserAlias()
  public grantedBy: string;

  @ChainKey({ position: 6 })
  @IsUserAlias()
  public grantedTo: string;

  @ChainKey({ position: 7 })
  @IsNotEmpty()
  public created: number;

  @IsNotEmpty()
  public reqId: string;

  @BigNumberProperty()
  public quantity: BigNumber;
}

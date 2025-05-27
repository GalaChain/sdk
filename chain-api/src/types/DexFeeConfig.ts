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
import { Exclude } from "class-transformer";
import { ArrayNotEmpty, IsNumber, IsString, Max, Min } from "class-validator";

import { ChainObject } from "./ChainObject";

export class DexFeeConfig extends ChainObject {
  @Exclude()
  public static INDEX_KEY = "GCDPFC"; // GalaChain Dex Protocol Fee Configuration

  @ArrayNotEmpty()
  @IsString({ each: true })
  authorities: string[];

  @IsNumber()
  @Min(0)
  @Max(1)
  public protocolFee: number;

  constructor(authorities: string[], protocolFee = 0.1) {
    super();
    this.authorities = authorities;
    this.protocolFee = protocolFee;
  }

  public addOrUpdateAuthorities(newAuthorities: string[]) {
    this.authorities = newAuthorities;
  }

  public setProtocolFees(fee: number) {
    this.protocolFee = fee;
  }
}

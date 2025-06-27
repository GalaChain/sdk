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
import { ArrayNotEmpty, IsString } from "class-validator";

import { ChainObject } from "./ChainObject";

export class BatchSubmitAuthorizations extends ChainObject {
  @Exclude()
  public static INDEX_KEY = "GCBSA"; // GalaChain Batch Submit Authorizations

  @ArrayNotEmpty()
  @IsString({ each: true })
  authorities: string[];

  constructor(authorities: string[]) {
    super();
    this.authorities = authorities;
  }

  public addOrUpdateAuthorities(newAuthorities: string[]) {
    this.authorities = newAuthorities;
  }

  public addAuthority(authority: string) {
    if (!this.authorities.includes(authority)) {
      this.authorities.push(authority);
    }
  }

  public removeAuthority(authority: string) {
    this.authorities = this.authorities.filter(auth => auth !== authority);
  }

  public isAuthorized(authority: string): boolean {
    return this.authorities.includes(authority);
  }

  public getAuthorizedAuthorities(): string[] {
    return [...this.authorities];
  }
} 
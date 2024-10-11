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
import {
  DryRunDto,
  DryRunResultDto,
  FeeAuthorizationDto,
  FeeAuthorizationResDto,
  FeeProperties,
  FeePropertiesDto,
  FetchFeeAuthorizationsDto,
  FetchFeeAuthorizationsResDto,
  FetchFeePropertiesDto,
} from "@gala-chain/api";

import { GalaChainProvider } from "../GalaChainClient";

export class GalaChainFeeApi {
  constructor(
    private chainCodeUrl: string,
    private connection: GalaChainProvider
  ) {}

  public AuthorizeFee(dto: FeeAuthorizationDto) {
    return this.connection.submit<FeeAuthorizationResDto, FeeAuthorizationDto>({
      method: "AuthorizeFee",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public DryRun(dto: DryRunDto) {
    return this.connection.submit<DryRunResultDto, DryRunDto>({
      method: "DryRun",
      payload: dto,
      sign: false,
      url: this.chainCodeUrl
    });
  }

  public FetchFeeAutorizations(dto: FetchFeeAuthorizationsDto) {
    return this.connection.submit<FetchFeeAuthorizationsResDto, FetchFeeAuthorizationsDto>(
      {
        method: "DryRun",
        payload: dto,
        sign: false,
        url: this.chainCodeUrl
      }
    );
  }

  public FetchFeeProperties(dto: FetchFeePropertiesDto) {
    return this.connection.submit<FeeProperties, FetchFeePropertiesDto>({
      method: "FetchFeeProperties",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public SetFeeProperties(dto: FeePropertiesDto) {
    return this.connection.submit<FeeProperties, FeePropertiesDto>({
      method: "FetchFeeProperties",
      payload: dto,
      sign: false,
      url: this.chainCodeUrl
    });
  }
}

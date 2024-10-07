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
  DryRunParams,
  DryRunResponseBody,
  FeeAuthorizationParams,
  FeeAuthorizationResponseBody,
  FeeProperties,
  FetchFeeAuthorizationsParams,
  FetchFeeAuthorizationsResponseBody,
  FetchFeePropertiesParams,
  GalaChainResponse,
  SetFeePropertiesParams
} from "@gala-chain/api";

import { GalaChainProvider } from "../GalaChainClient";

export class GalaChainFeeApi {
  constructor(
    private chainCodeUrl: string,
    private connection: GalaChainProvider
  ) {}

  public AuthorizeFee(dto: FeeAuthorizationParams) {
    return this.connection.submit<GalaChainResponse<FeeAuthorizationResponseBody>, FeeAuthorizationParams>({
      method: "AuthorizeFee",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public DryRun(dto: DryRunParams) {
    return this.connection.submit<GalaChainResponse<DryRunResponseBody>, DryRunParams>({
      method: "DryRun",
      payload: dto,
      sign: false,
      url: this.chainCodeUrl
    });
  }

  public FetchFeeAutorizations(dto: FetchFeeAuthorizationsParams) {
    return this.connection.submit<
      GalaChainResponse<FetchFeeAuthorizationsResponseBody>,
      FetchFeeAuthorizationsParams
    >({
      method: "DryRun",
      payload: dto,
      sign: false,
      url: this.chainCodeUrl
    });
  }

  public FetchFeeProperties(dto: FetchFeePropertiesParams) {
    return this.connection.submit<GalaChainResponse<FeeProperties>, FetchFeePropertiesParams>({
      method: "FetchFeeProperties",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public SetFeeProperties(dto: SetFeePropertiesParams) {
    return this.connection.submit<GalaChainResponse<FeeProperties>, SetFeePropertiesParams>({
      method: "FetchFeeProperties",
      payload: dto,
      sign: false,
      url: this.chainCodeUrl
    });
  }
}

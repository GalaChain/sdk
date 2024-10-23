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
  FeeAuthorizationDto,
  FeePropertiesDto,
  FetchFeeAuthorizationsDto,
  FetchFeePropertiesDto
} from "@gala-chain/api";

import { GalaChainProvider } from "../GalaChainClient";
import {
  FeeAuthorizationRequest,
  FeeProperties,
  FetchFeeAuthorizationsResponse,
  FetchFeePropertiesRequest,
  SetFeePropertiesRequest
} from "../types";
import { GalaChainBaseApi } from "./GalaChainBaseApi";

export class FeeApi extends GalaChainBaseApi {
  constructor(chainCodeUrl: string, connection: GalaChainProvider) {
    super(chainCodeUrl, connection);
  }

  public AuthorizeFee(dto: FeeAuthorizationRequest) {
    return this.connection.submit({
      method: "AuthorizeFee",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: FeeAuthorizationDto,
      responseConstructor: FetchFeeAuthorizationsResponse
    });
  }

  public FetchFeeAutorizations(dto: FetchFeeAuthorizationsResponse) {
    return this.connection.submit({
      method: "DryRun",
      payload: dto,
      sign: false,
      url: this.chainCodeUrl,
      requestConstructor: FetchFeeAuthorizationsDto,
      responseConstructor: FetchFeeAuthorizationsResponse
    });
  }

  public FetchFeeProperties(dto: FetchFeePropertiesRequest) {
    return this.connection.submit({
      method: "FetchFeeProperties",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: FetchFeePropertiesDto,
      responseConstructor: FeeProperties
    });
  }

  public SetFeeProperties(dto: SetFeePropertiesRequest) {
    return this.connection.submit({
      method: "FetchFeeProperties",
      payload: dto,
      sign: false,
      url: this.chainCodeUrl,
      requestConstructor: FeePropertiesDto,
      responseConstructor: FeeProperties
    });
  }
}

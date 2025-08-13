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
  ChainError,
  FeeAuthorizationDto,
  FeeAuthorizationResDto,
  FeeProperties,
  FeePropertiesDto,
  FetchFeeAuthorizationsDto,
  FetchFeeAuthorizationsResDto,
  FetchFeePropertiesDto,
  GalaChainResponse
} from "@gala-chain/api";
import { Info } from "fabric-contract-api";

import {
  EVALUATE,
  GalaChainContext,
  GalaContract,
  GalaTransaction,
  SUBMIT,
  authorizeFee,
  fetchFeeAuthorizations,
  fetchGalaFeeProperties,
  requireCuratorAuth,
  setGalaFeeProperties
} from "../";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { version } from "../../package.json";

@Info({
  title: "GalaChainFee",
  description: "Contract for Authorizing $GALA Fee spends across the GalaChain ecosystem."
})
export class GalaChainFeeContract extends GalaContract {
  constructor() {
    super("GalaChainFee", version);
  }

  @GalaTransaction({
    type: SUBMIT,
    in: FeeAuthorizationDto,
    out: FeeAuthorizationResDto,
    verifySignature: true,
    enforceUniqueKey: true
  })
  public async AuthorizeFee(
    ctx: GalaChainContext,
    dto: FeeAuthorizationDto
  ): Promise<GalaChainResponse<FeeAuthorizationResDto>> {
    return GalaChainResponse.Wrap(authorizeFee(ctx, dto));
  }

  @GalaTransaction({
    type: EVALUATE,
    in: FetchFeeAuthorizationsDto,
    out: FetchFeeAuthorizationsResDto
  })
  public async FetchFeeAuthorizations(
    ctx: GalaChainContext,
    dto: FetchFeeAuthorizationsDto
  ): Promise<GalaChainResponse<FetchFeeAuthorizationsResDto>> {
    return GalaChainResponse.Wrap(fetchFeeAuthorizations(ctx, dto));
  }

  @GalaTransaction({
    type: EVALUATE,
    in: FetchFeePropertiesDto,
    out: FeeProperties,
    verifySignature: true
  })
  public async FetchFeeProperties(
    ctx: GalaChainContext,
    dto: FetchFeePropertiesDto
  ): Promise<GalaChainResponse<FeeProperties | ChainError>> {
    // dto is not used in this method, but it is required by the GalaTransaction decorator
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return GalaChainResponse.Wrap(fetchGalaFeeProperties(ctx));
  }

  @GalaTransaction({
    type: SUBMIT,
    in: FeePropertiesDto,
    out: FeeProperties,
    verifySignature: true,
    ...requireCuratorAuth,
    enforceUniqueKey: true
  })
  public async SetFeeProperties(
    ctx: GalaChainContext,
    dto: FeePropertiesDto
  ): Promise<GalaChainResponse<FeeProperties>> {
    return GalaChainResponse.Wrap(setGalaFeeProperties(ctx, dto));
  }
}

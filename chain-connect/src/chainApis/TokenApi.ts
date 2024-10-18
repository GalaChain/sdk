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
  BatchMintTokenDto,
  BurnTokensDto,
  CreateTokenClassDto,
  DeleteAllowancesDto,
  FetchAllowancesDto,
  FetchBalancesDto,
  FetchBurnsDto,
  FetchMintRequestsDto,
  FetchTokenClassesDto,
  FetchTokenClassesWithPaginationDto,
  FulfillMintDto,
  FullAllowanceCheckDto,
  GrantAllowanceDto,
  HighThroughputMintTokenDto,
  LockTokenDto,
  LockTokensDto,
  MintTokenDto,
  MintTokenWithAllowanceDto,
  RefreshAllowanceDto,
  ReleaseTokenDto,
  TransferTokenDto,
  UnlockTokenDto,
  UnlockTokensDto,
  UpdateTokenClassDto,
  UseTokenDto
} from "@gala-chain/api";

import { GalaChainProvider } from "../GalaChainClient";
import {
  BatchMintTokenRequest,
  BurnTokensRequest,
  CreateTokenClassRequest,
  DeleteAllowancesRequest,
  FetchAllowancesRequest,
  FetchAllowancesResponse,
  FetchBalancesRequest,
  FetchBalancesWithTokenMetadataResponse,
  FetchBurnsRequest,
  FetchMintRequestsRequest,
  FetchTokenClassesRequest,
  FetchTokenClassesResponse,
  FetchTokenClassesWithPaginationRequest,
  FulfillMintRequest,
  FullAllowanceCheckRequest,
  FullAllowanceCheckResponse,
  GrantAllowanceRequest,
  HighThroughputMintTokenRequest,
  HighThroughputMintTokenResponse,
  LockTokenRequest,
  LockTokensRequest,
  MintRequest,
  MintTokenRequest,
  MintTokenWithAllowanceRequest,
  RefreshAllowanceRequest,
  ReleaseTokenRequest,
  TokenAllowance,
  TokenBalance,
  TokenBurn,
  TokenClass,
  TokenClassKey,
  TokenInstanceKey,
  TransferTokenRequest,
  UnlockTokenRequest,
  UnlockTokensRequest,
  UpdateTokenClassRequest,
  UseTokenRequest
} from "../types";

export class TokenApi {
  constructor(
    private chainCodeUrl: string,
    private connection: GalaChainProvider
  ) {}

  // Token Chaincode Calls:
  public CreateTokenClass(dto: CreateTokenClassRequest) {
    return this.connection.submit({
      method: "CreateTokenClass",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: CreateTokenClassDto,
      responseConstructor: TokenClass
    });
  }

  public UpdateTokenClass(dto: UpdateTokenClassRequest) {
    return this.connection.submit({
      method: "UpdateTokenClass",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: UpdateTokenClassDto,
      responseConstructor: TokenClassKey
    });
  }

  public FetchTokenClasses(dto: FetchTokenClassesRequest) {
    return this.connection.submit({
      method: "FetchTokenClasses",
      payload: dto,
      url: this.chainCodeUrl,
      requestConstructor: FetchTokenClassesDto,
      responseConstructor: Array<TokenClass>
    });
  }

  public FetchTokenClassesWithSupply(dto: FetchTokenClassesRequest) {
    return this.connection.submit({
      method: "FetchTokenClassesWithSupply",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: FetchTokenClassesDto,
      responseConstructor: Array<TokenClass>
    });
  }

  public FetchTokenClassesWithPagination(dto: FetchTokenClassesWithPaginationRequest) {
    return this.connection.submit({
      method: "FetchTokenClassesWithPagination",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: FetchTokenClassesWithPaginationDto,
      responseConstructor: FetchTokenClassesResponse
    });
  }

  public GrantAllowance(dto: GrantAllowanceRequest) {
    return this.connection.submit({
      method: "GrantAllowance",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: GrantAllowanceDto,
      responseConstructor: Array<TokenAllowance>
    });
  }

  public RefreshAllowances(dto: RefreshAllowanceRequest) {
    return this.connection.submit({
      method: "RefreshAllowances",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: RefreshAllowanceDto,
      responseConstructor: Array<TokenAllowance>
    });
  }

  public FullAllowanceCheck(dto: FullAllowanceCheckRequest) {
    return this.connection.submit({
      method: "FullAllowanceCheck",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: FullAllowanceCheckDto,
      responseConstructor: FullAllowanceCheckResponse
    });
  }

  public FetchAllowances(dto: FetchAllowancesRequest) {
    return this.connection.submit({
      method: "FetchAllowances",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: FetchAllowancesDto,
      responseConstructor: FetchAllowancesResponse
    });
  }

  public DeleteAllowances(dto: DeleteAllowancesRequest) {
    return this.connection.submit({
      method: "DeleteAllowances",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: DeleteAllowancesDto
    });
  }

  public FetchBalances(dto: FetchBalancesRequest) {
    return this.connection.submit({
      method: "FetchBalances",
      payload: dto,
      url: this.chainCodeUrl,
      requestConstructor: FetchBalancesDto,
      responseConstructor: Array<TokenBalance>
    });
  }

  public FetchBalancesWithTokenMetadata(dto: FetchBalancesRequest) {
    return this.connection.submit({
      method: "FetchBalancesWithTokenMetadata",
      payload: dto,
      url: this.chainCodeUrl,
      requestConstructor: FetchBalancesDto,
      responseConstructor: FetchBalancesWithTokenMetadataResponse
    });
  }

  public RequestMint(dto: HighThroughputMintTokenRequest) {
    return this.connection.submit({
      method: "RequestMint",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: HighThroughputMintTokenDto,
      responseConstructor: HighThroughputMintTokenResponse
    });
  }

  public FulfillMint(dto: FulfillMintRequest) {
    return this.connection.submit({
      method: "FulfillMint",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: FulfillMintDto,
      responseConstructor: Array<TokenInstanceKey>
    });
  }

  public FetchMintRequests(dto: FetchMintRequestsRequest) {
    return this.connection.submit({
      method: "FetchMintRequests",
      payload: dto,
      url: this.chainCodeUrl,
      requestConstructor: FetchMintRequestsDto,
      responseConstructor: Array<MintRequest>
    });
  }

  public MintToken(dto: MintTokenRequest) {
    return this.connection.submit({
      method: "MintToken",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: MintTokenDto,
      responseConstructor: Array<TokenInstanceKey>
    });
  }

  public MintTokenWithAllowance(dto: MintTokenWithAllowanceRequest) {
    return this.connection.submit({
      method: "MintTokenWithAllowance",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: MintTokenWithAllowanceDto,
      responseConstructor: Array<TokenInstanceKey>
    });
  }

  public BatchMintToken(dto: BatchMintTokenRequest) {
    return this.connection.submit({
      method: "BatchMintToken",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: BatchMintTokenDto,
      responseConstructor: Array<TokenInstanceKey>
    });
  }

  public UseToken(dto: UseTokenRequest) {
    return this.connection.submit({
      method: "UseToken",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: UseTokenDto,
      responseConstructor: TokenBalance
    });
  }

  public ReleaseToken(dto: ReleaseTokenRequest) {
    return this.connection.submit({
      method: "ReleaseToken",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: ReleaseTokenDto,
      responseConstructor: TokenBalance
    });
  }

  public LockToken(dto: LockTokenRequest) {
    return this.connection.submit({
      method: "LockToken",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: LockTokenDto,
      responseConstructor: TokenBalance
    });
  }

  public LockTokens(dto: LockTokensRequest) {
    return this.connection.submit({
      method: "LockTokens",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: LockTokensDto,
      responseConstructor: Array<TokenBalance>
    });
  }

  public UnlockToken(dto: UnlockTokenRequest) {
    return this.connection.submit({
      method: "UnlockToken",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: UnlockTokenDto,
      responseConstructor: TokenBalance
    });
  }

  public UnlockTokens(dto: UnlockTokensRequest) {
    return this.connection.submit({
      method: "UnlockTokens",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: UnlockTokensDto,
      responseConstructor: Array<TokenBalance>
    });
  }

  public TransferToken(dto: TransferTokenRequest) {
    return this.connection.submit({
      method: "TransferToken",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: TransferTokenDto,
      responseConstructor: Array<TokenBalance>
    });
  }

  public BurnTokens(dto: BurnTokensRequest) {
    return this.connection.submit({
      method: "BurnTokens",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: BurnTokensDto,
      responseConstructor: Array<TokenBurn>
    });
  }

  public FetchBurns(dto: FetchBurnsRequest) {
    return this.connection.submit({
      method: "FetchBurns",
      payload: dto,
      url: this.chainCodeUrl,
      requestConstructor: FetchBurnsDto,
      responseConstructor: Array<TokenBurn>
    });
  }
}

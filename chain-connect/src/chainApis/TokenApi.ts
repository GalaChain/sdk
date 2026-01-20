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
  FetchBalancesWithPaginationDto,
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
  MintRequestDto,
  MintTokenDto,
  MintTokenWithAllowanceDto,
  RefreshAllowanceDto,
  TransferTokenDto,
  UnlockTokenDto,
  UnlockTokensDto,
  UpdateTokenClassDto
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
  FetchBalancesWithPaginationRequest,
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
  TokenAllowance,
  TokenBalance,
  TokenBurn,
  TokenClass,
  TokenClassKey,
  TokenInstanceKey,
  TransferTokenRequest,
  UnlockTokenRequest,
  UnlockTokensRequest,
  UpdateTokenClassRequest
} from "../types";
import { GalaChainBaseApi } from "./GalaChainBaseApi";

/**
 * API client for token-related operations on the GalaChain network.
 * Provides methods for token lifecycle management including creation, minting, transfers, and burns.
 */
export class TokenApi extends GalaChainBaseApi {
  /**
   * Creates a new TokenApi instance.
   * @param chainCodeUrl - The URL of the token chaincode service
   * @param connection - The GalaChain provider for network communication
   */
  constructor(chainCodeUrl: string, connection: GalaChainProvider) {
    super(chainCodeUrl, connection);
  }

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
    return this.connection.submit<Array<TokenClass>, FetchTokenClassesDto>({
      method: "FetchTokenClasses",
      payload: dto,
      url: this.chainCodeUrl,
      requestConstructor: FetchTokenClassesDto,
      responseConstructor: TokenClass
    });
  }

  public FetchTokenClassesWithSupply(dto: FetchTokenClassesRequest) {
    return this.connection.submit<Array<TokenClass>, FetchTokenClassesDto>({
      method: "FetchTokenClassesWithSupply",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: FetchTokenClassesDto,
      responseConstructor: TokenClass
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
    return this.connection.submit<Array<TokenAllowance>, GrantAllowanceDto>({
      method: "GrantAllowance",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: GrantAllowanceDto,
      responseConstructor: TokenAllowance
    });
  }

  public RefreshAllowances(dto: RefreshAllowanceRequest) {
    return this.connection.submit<Array<TokenAllowance>, RefreshAllowanceDto>({
      method: "RefreshAllowances",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: RefreshAllowanceDto,
      responseConstructor: TokenAllowance
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
    return this.connection.submit<TokenBalance[], FetchBalancesDto>({
      method: "FetchBalances",
      payload: dto,
      url: this.chainCodeUrl,
      requestConstructor: FetchBalancesDto,
      responseConstructor: TokenBalance
    });
  }

  public FetchBalancesWithTokenMetadata(dto: FetchBalancesWithPaginationRequest) {
    return this.connection.submit({
      method: "FetchBalancesWithTokenMetadata",
      payload: dto,
      url: this.chainCodeUrl,
      requestConstructor: FetchBalancesWithPaginationDto,
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
    return this.connection.submit<Array<TokenInstanceKey>, FulfillMintDto>({
      method: "FulfillMint",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: FulfillMintDto,
      responseConstructor: TokenInstanceKey
    });
  }

  public FetchMintRequests(dto: FetchMintRequestsRequest) {
    return this.connection.submit<Array<MintRequest>, FetchMintRequestsDto>({
      method: "FetchMintRequests",
      payload: dto,
      url: this.chainCodeUrl,
      requestConstructor: FetchMintRequestsDto,
      responseConstructor: MintRequestDto
    });
  }

  public MintToken(dto: MintTokenRequest) {
    return this.connection.submit<Array<TokenInstanceKey>, MintTokenDto>({
      method: "MintToken",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: MintTokenDto,
      responseConstructor: TokenInstanceKey
    });
  }

  public MintTokenWithAllowance(dto: MintTokenWithAllowanceRequest) {
    return this.connection.submit<Array<TokenInstanceKey>, MintTokenWithAllowanceDto>({
      method: "MintTokenWithAllowance",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: MintTokenWithAllowanceDto,
      responseConstructor: TokenInstanceKey
    });
  }

  public BatchMintToken(dto: BatchMintTokenRequest) {
    return this.connection.submit<Array<TokenInstanceKey>, BatchMintTokenDto>({
      method: "BatchMintToken",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: BatchMintTokenDto,
      responseConstructor: TokenInstanceKey
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
    return this.connection.submit<Array<TokenBalance>, LockTokensDto>({
      method: "LockTokens",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: LockTokensDto,
      responseConstructor: TokenBalance
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
    return this.connection.submit<Array<TokenBalance>, UnlockTokensDto>({
      method: "UnlockTokens",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: UnlockTokensDto,
      responseConstructor: TokenBalance
    });
  }

  public TransferToken(dto: TransferTokenRequest) {
    return this.connection.submit<Array<TokenBalance>, TransferTokenDto>({
      method: "TransferToken",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: TransferTokenDto,
      responseConstructor: TokenBalance
    });
  }

  public BurnTokens(dto: BurnTokensRequest) {
    return this.connection.submit<Array<TokenBurn>, BurnTokensDto>({
      method: "BurnTokens",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: BurnTokensDto,
      responseConstructor: TokenBurn
    });
  }

  public FetchBurns(dto: FetchBurnsRequest) {
    return this.connection.submit<Array<TokenBurn>, FetchBurnsDto>({
      method: "FetchBurns",
      payload: dto,
      url: this.chainCodeUrl,
      requestConstructor: FetchBurnsDto,
      responseConstructor: TokenBurn
    });
  }
}

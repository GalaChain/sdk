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
  AllowAllTokenBalanceTargetsDto,
  BatchMintTokenDto,
  BurnTokensDto,
  CreateTokenClassDto,
  DeleteAllowancesDto,
  DeleteTokenInstanceMetadataDto,
  FetchAllowancesDto,
  FetchBalancesDto,
  FetchBalancesWithPaginationDto,
  FetchBurnsDto,
  FetchMintRequestsDto,
  FetchTokenClassesDto,
  FetchTokenClassesWithPaginationDto,
  FetchTokenInstanceMetadataDto,
  FetchTokenInstanceMetadataWithPaginationDto,
  FreezeTokenBalanceDto,
  FullAllowanceCheckDto,
  GrantAllowanceDto,
  LockTokenDto,
  LockTokensDto,
  MintRequestDto,
  MintTokenDto,
  MintTokenWithAllowanceDto,
  RefreshAllowancesDto,
  RestrictTokenBalanceTargetsDto,
  SetTokenInstanceMetadataDto,
  TransferTokenDto,
  UnlockTokenDto,
  UnlockTokensDto,
  UpdateBalanceQuantityLimitDto,
  UpdateTokenClassDto
} from "@gala-chain/api";

import { GalaChainProvider } from "../GalaChainClient";
import {
  AllowAllTokenBalanceTargetsRequest,
  BatchMintTokenRequest,
  BurnTokensRequest,
  CreateTokenClassRequest,
  DeleteAllowancesRequest,
  DeleteTokenInstanceMetadataRequest,
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
  FetchTokenInstanceMetadataRequest,
  FetchTokenInstanceMetadataResponse,
  FetchTokenInstanceMetadataWithPaginationRequest,
  FreezeTokenBalanceRequest,
  FullAllowanceCheckRequest,
  FullAllowanceCheckResponse,
  GrantAllowanceRequest,
  LockTokenRequest,
  LockTokensRequest,
  MintRequest,
  MintTokenRequest,
  MintTokenWithAllowanceRequest,
  RefreshAllowancesRequest,
  RestrictTokenBalanceTargetsRequest,
  SetTokenInstanceMetadataRequest,
  TokenAllowance,
  TokenBalance,
  TokenBurn,
  TokenClass,
  TokenClassKey,
  TokenInstanceKey,
  TokenInstanceMetadata,
  TransferTokenRequest,
  UnlockTokenRequest,
  UnlockTokensRequest,
  UpdateBalanceQuantityLimitRequest,
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
  constructor(chainCodeUrl: string, connection: GalaChainProvider, contract?: string) {
    super(chainCodeUrl, connection, contract);
  }

  // Token Chaincode Calls:
  public CreateTokenClass(dto: CreateTokenClassRequest) {
    return this.submit({
      method: "CreateTokenClass",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: CreateTokenClassDto,
      responseConstructor: TokenClassKey
    });
  }

  public UpdateTokenClass(dto: UpdateTokenClassRequest) {
    return this.submit({
      method: "UpdateTokenClass",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: UpdateTokenClassDto,
      responseConstructor: TokenClassKey
    });
  }

  public FetchTokenClasses(dto: FetchTokenClassesRequest) {
    return this.submit<Array<TokenClass>, FetchTokenClassesDto>({
      method: "FetchTokenClasses",
      payload: dto,
      url: this.chainCodeUrl,
      requestConstructor: FetchTokenClassesDto,
      responseConstructor: TokenClass
    });
  }

  public FetchTokenClassesWithSupply(dto: FetchTokenClassesRequest) {
    return this.submit<Array<TokenClass>, FetchTokenClassesDto>({
      method: "FetchTokenClassesWithSupply",
      payload: dto,
      sign: false,
      url: this.chainCodeUrl,
      requestConstructor: FetchTokenClassesDto,
      responseConstructor: TokenClass
    });
  }

  public FetchTokenClassesWithPagination(dto: FetchTokenClassesWithPaginationRequest) {
    return this.submit({
      method: "FetchTokenClassesWithPagination",
      payload: dto,
      sign: false,
      url: this.chainCodeUrl,
      requestConstructor: FetchTokenClassesWithPaginationDto,
      responseConstructor: FetchTokenClassesResponse
    });
  }

  public SetTokenInstanceMetadata(dto: SetTokenInstanceMetadataRequest) {
    return this.submit({
      method: "SetTokenInstanceMetadata",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: SetTokenInstanceMetadataDto,
      responseConstructor: TokenInstanceMetadata
    });
  }

  public FetchTokenInstanceMetadata(dto: FetchTokenInstanceMetadataRequest) {
    return this.submit<Array<TokenInstanceMetadata>, FetchTokenInstanceMetadataDto>({
      method: "FetchTokenInstanceMetadata",
      payload: dto,
      url: this.chainCodeUrl,
      requestConstructor: FetchTokenInstanceMetadataDto,
      responseConstructor: TokenInstanceMetadata
    });
  }

  public FetchTokenInstanceMetadataWithPagination(dto: FetchTokenInstanceMetadataWithPaginationRequest) {
    return this.submit({
      method: "FetchTokenInstanceMetadataWithPagination",
      payload: dto,
      url: this.chainCodeUrl,
      requestConstructor: FetchTokenInstanceMetadataWithPaginationDto,
      responseConstructor: FetchTokenInstanceMetadataResponse
    });
  }

  public DeleteTokenInstanceMetadata(dto: DeleteTokenInstanceMetadataRequest) {
    return this.submit({
      method: "DeleteTokenInstanceMetadata",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: DeleteTokenInstanceMetadataDto,
      responseConstructor: TokenInstanceKey
    });
  }

  public GrantAllowance(dto: GrantAllowanceRequest) {
    return this.submit<Array<TokenAllowance>, GrantAllowanceDto>({
      method: "GrantAllowance",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: GrantAllowanceDto,
      responseConstructor: TokenAllowance
    });
  }

  public RefreshAllowances(dto: RefreshAllowancesRequest) {
    return this.submit<Array<TokenAllowance>, RefreshAllowancesDto>({
      method: "RefreshAllowances",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: RefreshAllowancesDto,
      responseConstructor: TokenAllowance
    });
  }

  public FullAllowanceCheck(dto: FullAllowanceCheckRequest) {
    return this.submit({
      method: "FullAllowanceCheck",
      payload: dto,
      sign: false,
      url: this.chainCodeUrl,
      requestConstructor: FullAllowanceCheckDto,
      responseConstructor: FullAllowanceCheckResponse
    });
  }

  public FetchAllowances(dto: FetchAllowancesRequest) {
    return this.submit({
      method: "FetchAllowances",
      payload: dto,
      sign: false,
      url: this.chainCodeUrl,
      requestConstructor: FetchAllowancesDto,
      responseConstructor: FetchAllowancesResponse
    });
  }

  public DeleteAllowances(dto: DeleteAllowancesRequest) {
    return this.submit({
      method: "DeleteAllowances",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: DeleteAllowancesDto
    });
  }

  public FetchBalances(dto: FetchBalancesRequest) {
    return this.submit<TokenBalance[], FetchBalancesDto>({
      method: "FetchBalances",
      payload: dto,
      url: this.chainCodeUrl,
      requestConstructor: FetchBalancesDto,
      responseConstructor: TokenBalance
    });
  }

  public FetchBalancesWithTokenMetadata(dto: FetchBalancesWithPaginationRequest) {
    return this.submit({
      method: "FetchBalancesWithTokenMetadata",
      payload: dto,
      url: this.chainCodeUrl,
      requestConstructor: FetchBalancesWithPaginationDto,
      responseConstructor: FetchBalancesWithTokenMetadataResponse
    });
  }

  public UpdateBalanceQuantityLimit(dto: UpdateBalanceQuantityLimitRequest) {
    return this.submit({
      method: "UpdateBalanceQuantityLimit",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: UpdateBalanceQuantityLimitDto,
      responseConstructor: TokenBalance
    });
  }

  public RestrictTokenBalanceTargets(dto: RestrictTokenBalanceTargetsRequest) {
    return this.submit({
      method: "RestrictTokenBalanceTargets",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: RestrictTokenBalanceTargetsDto,
      responseConstructor: TokenBalance
    });
  }

  public AllowAllTokenBalanceTargets(dto: AllowAllTokenBalanceTargetsRequest) {
    return this.submit({
      method: "AllowAllTokenBalanceTargets",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: AllowAllTokenBalanceTargetsDto,
      responseConstructor: TokenBalance
    });
  }

  public FreezeTokenBalance(dto: FreezeTokenBalanceRequest) {
    return this.submit({
      method: "FreezeTokenBalance",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: FreezeTokenBalanceDto,
      responseConstructor: TokenBalance
    });
  }

  public FetchMintRequests(dto: FetchMintRequestsRequest) {
    return this.submit<Array<MintRequest>, FetchMintRequestsDto>({
      method: "FetchMintRequests",
      payload: dto,
      url: this.chainCodeUrl,
      requestConstructor: FetchMintRequestsDto,
      responseConstructor: MintRequestDto
    });
  }

  public MintToken(dto: MintTokenRequest) {
    return this.submit<Array<TokenInstanceKey>, MintTokenDto>({
      method: "MintToken",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: MintTokenDto,
      responseConstructor: TokenInstanceKey
    });
  }

  public MintTokenWithAllowance(dto: MintTokenWithAllowanceRequest) {
    return this.submit<Array<TokenInstanceKey>, MintTokenWithAllowanceDto>({
      method: "MintTokenWithAllowance",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: MintTokenWithAllowanceDto,
      responseConstructor: TokenInstanceKey
    });
  }

  public BatchMintToken(dto: BatchMintTokenRequest) {
    return this.submit<Array<TokenInstanceKey>, BatchMintTokenDto>({
      method: "BatchMintToken",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: BatchMintTokenDto,
      responseConstructor: TokenInstanceKey
    });
  }

  public LockToken(dto: LockTokenRequest) {
    return this.submit({
      method: "LockToken",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: LockTokenDto,
      responseConstructor: TokenBalance
    });
  }

  public LockTokens(dto: LockTokensRequest) {
    return this.submit<Array<TokenBalance>, LockTokensDto>({
      method: "LockTokens",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: LockTokensDto,
      responseConstructor: TokenBalance
    });
  }

  public UnlockToken(dto: UnlockTokenRequest) {
    return this.submit({
      method: "UnlockToken",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: UnlockTokenDto,
      responseConstructor: TokenBalance
    });
  }

  public UnlockTokens(dto: UnlockTokensRequest) {
    return this.submit<Array<TokenBalance>, UnlockTokensDto>({
      method: "UnlockTokens",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: UnlockTokensDto,
      responseConstructor: TokenBalance
    });
  }

  public TransferToken(dto: TransferTokenRequest) {
    return this.submit<Array<TokenBalance>, TransferTokenDto>({
      method: "TransferToken",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: TransferTokenDto,
      responseConstructor: TokenBalance
    });
  }

  public BurnTokens(dto: BurnTokensRequest) {
    return this.submit<Array<TokenBurn>, BurnTokensDto>({
      method: "BurnTokens",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: BurnTokensDto,
      responseConstructor: TokenBurn
    });
  }

  public FetchBurns(dto: FetchBurnsRequest) {
    return this.submit<Array<TokenBurn>, FetchBurnsDto>({
      method: "FetchBurns",
      payload: dto,
      url: this.chainCodeUrl,
      requestConstructor: FetchBurnsDto,
      responseConstructor: TokenBurn
    });
  }
}

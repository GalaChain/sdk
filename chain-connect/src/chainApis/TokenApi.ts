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
  BatchMintTokenParams,
  BurnTokensParams,
  CreateTokenClassParams,
  DeleteAllowancesParams,
  FetchAllowancesBody,
  FetchAllowancesParams,
  FetchBalancesParams,
  FetchBalancesWithPaginationParams,
  FetchBalancesWithTokenMetadataBody,
  FetchBurnsParams,
  FetchMintRequestsParams,
  FetchTokenClassesParams,
  FetchTokenClassesResponseBody,
  FetchTokenClassesWithPaginationParams,
  FulfillMintDto,
  FulfillMintParams,
  FullAllowanceCheckParams,
  GalaChainResponse,
  GrantAllowanceParams,
  HighThroughputMintTokenParams,
  LockTokenRequestParams,
  LockTokensParams,
  MintRequestDto,
  MintTokenParams,
  MintTokenWithAllowanceParams,
  RefreshAllowanceParams,
  ReleaseTokenParams,
  TokenAllowanceBody,
  TokenBalanceBody,
  TokenBurnBody,
  TokenClassBody,
  TokenClassKeyBody,
  TokenInstanceKey,
  TokenInstanceKeyBody,
  TransferTokenParams,
  UnlockTokenParams,
  UnlockTokensParams,
  UpdateTokenClassParams,
  UseTokenParams
} from "@gala-chain/api";

import { CustomClient } from "../GalachainClient";

export class TokenApi {
  constructor(
    private chainCodeUrl: string,
    private connection: CustomClient
  ) {}

  // Token Chaincode Calls:
  public CreateTokenClass(dto: CreateTokenClassParams) {
    return this.connection.submit<GalaChainResponse<TokenClassKeyBody>, CreateTokenClassParams>({
      method: "CreateTokenClass",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public UpdateTokenClass(dto: UpdateTokenClassParams) {
    return this.connection.submit<GalaChainResponse<TokenClassKeyBody>, UpdateTokenClassParams>({
      method: "UpdateTokenClass",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public FetchTokenClasses(dto: FetchTokenClassesParams) {
    return this.connection.submit<GalaChainResponse<TokenClassBody[]>, FetchTokenClassesParams>({
      method: "FetchTokenClasses",
      payload: dto,
      url: this.chainCodeUrl
    });
  }

  public FetchTokenClassesWithPagination(dto: FetchTokenClassesWithPaginationParams) {
    return this.connection.submit<
      GalaChainResponse<FetchTokenClassesResponseBody>,
      FetchTokenClassesWithPaginationParams
    >({
      method: "FetchTokenClassesWithPagination",
      payload: dto,
      url: this.chainCodeUrl
    });
  }

  public GrantAllowance(dto: GrantAllowanceParams) {
    return this.connection.submit<GalaChainResponse<TokenAllowanceBody[]>, GrantAllowanceParams>({
      method: "GrantAllowance",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public RefreshAllowances(dto: RefreshAllowanceParams) {
    return this.connection.submit<GalaChainResponse<TokenAllowanceBody[]>, RefreshAllowanceParams>({
      method: "RefreshAllowances",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public FullAllowanceCheck(dto: FullAllowanceCheckParams) {
    return this.connection.submit<GalaChainResponse<FullAllowanceCheckParams>, FullAllowanceCheckParams>({
      method: "FullAllowanceCheck",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public FetchAllowances(dto: FetchAllowancesParams) {
    return this.connection.submit<GalaChainResponse<FetchAllowancesBody>, FetchAllowancesParams>({
      method: "FetchAllowances",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public DeleteAllowances(dto: DeleteAllowancesParams) {
    return this.connection.submit<GalaChainResponse<number>, DeleteAllowancesParams>({
      method: "DeleteAllowances",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public FetchBalances(dto: FetchBalancesParams) {
    return this.connection.submit<GalaChainResponse<TokenBalanceBody[]>, FetchBalancesParams>({
      method: "FetchBalances",
      payload: dto,
      url: this.chainCodeUrl
    });
  }

  public FetchBalancesWithTokenMetadata(dto: FetchBalancesWithPaginationParams) {
    return this.connection.submit<
      GalaChainResponse<FetchBalancesWithTokenMetadataBody>,
      FetchBalancesWithPaginationParams
    >({
      method: "FetchBalancesWithTokenMetadata",
      payload: dto,
      url: this.chainCodeUrl
    });
  }

  public RequestMint(dto: HighThroughputMintTokenParams) {
    // todo: Is fulfillMintDto really the response here?
    return this.connection.submit<GalaChainResponse<FulfillMintDto>, HighThroughputMintTokenParams>({
      method: "RequestMint",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public FulfillMint(dto: FulfillMintParams) {
    return this.connection.submit<GalaChainResponse<TokenInstanceKeyBody[]>, FulfillMintParams>({
      method: "FulfillMint",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public HighThroughputMint(dto: HighThroughputMintTokenParams) {
    return this.connection.submit<GalaChainResponse<TokenInstanceKeyBody[]>, HighThroughputMintTokenParams>({
      method: "HighThroughputMint",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public FetchMintRequests(dto: FetchMintRequestsParams) {
    return this.connection.submit<GalaChainResponse<MintRequestDto[]>, FetchMintRequestsParams>({
      method: "FetchMintRequests",
      payload: dto,
      url: this.chainCodeUrl
    });
  }

  public MintToken(dto: MintTokenParams) {
    return this.connection.submit<GalaChainResponse<TokenInstanceKeyBody[]>, MintTokenParams>({
      method: "MintToken",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public MintTokenWithAllowance(dto: MintTokenWithAllowanceParams) {
    return this.connection.submit<GalaChainResponse<TokenInstanceKey[]>, MintTokenWithAllowanceParams>({
      method: "MintTokenWithAllowance",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public BatchMintToken(dto: BatchMintTokenParams) {
    return this.connection.submit<GalaChainResponse<TokenInstanceKeyBody[]>, BatchMintTokenParams>({
      method: "BatchMintToken",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public UseToken(dto: UseTokenParams) {
    return this.connection.submit<GalaChainResponse<TokenBalanceBody>, UseTokenParams>({
      method: "UseToken",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public ReleaseToken(dto: ReleaseTokenParams) {
    return this.connection.submit<GalaChainResponse<TokenBalanceBody>, ReleaseTokenParams>({
      method: "ReleaseToken",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public LockToken(dto: LockTokenRequestParams) {
    return this.connection.submit<GalaChainResponse<TokenBalanceBody>, LockTokenRequestParams>({
      method: "LockToken",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public LockTokens(dto: LockTokensParams) {
    return this.connection.submit<GalaChainResponse<TokenBalanceBody[]>, LockTokensParams>({
      method: "LockTokens",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public UnlockToken(dto: UnlockTokenParams) {
    return this.connection.submit<GalaChainResponse<TokenBalanceBody>, UnlockTokenParams>({
      method: "UnlockToken",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public UnlockTokens(dto: UnlockTokensParams) {
    return this.connection.submit<GalaChainResponse<TokenBalanceBody[]>, UnlockTokensParams>({
      method: "UnlockTokens",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public TransferToken(dto: TransferTokenParams) {
    return this.connection.submit<GalaChainResponse<TokenBalanceBody[]>, TransferTokenParams>({
      method: "TransferToken",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public BurnTokens(dto: BurnTokensParams) {
    return this.connection.submit<GalaChainResponse<TokenBurnBody[]>, BurnTokensParams>({
      method: "BurnTokens",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public FetchBurns(dto: FetchBurnsParams) {
    return this.connection.submit<GalaChainResponse<TokenBurnBody[]>, FetchBurnsParams>({
      method: "FetchBurns",
      payload: dto,
      url: this.chainCodeUrl
    });
  }
}

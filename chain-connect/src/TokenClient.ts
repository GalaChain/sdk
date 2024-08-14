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

import { GalachainConnectClient } from "./GalachainMetamaskConnectClient";

export class TokenClient {
  constructor(private client: GalachainConnectClient) {}

  public CreateTokenClass(dto: CreateTokenClassParams) {
    return this.client.send<GalaChainResponse<TokenClassKeyBody>, CreateTokenClassParams>({
      method: "CreateTokenClass",
      payload: dto,
      sign: true
    });
  }

  public UpdateTokenClass(dto: UpdateTokenClassParams) {
    return this.client.send<GalaChainResponse<TokenClassKeyBody>, UpdateTokenClassParams>({
      method: "UpdateTokenClass",
      payload: dto,
      sign: true
    });
  }

  public FetchTokenClasses(dto: FetchTokenClassesParams) {
    return this.client.send<GalaChainResponse<TokenClassBody[]>, FetchTokenClassesParams>({
      method: "FetchTokenClasses",
      payload: dto
    });
  }

  public FetchTokenClassesWithPagination(dto: FetchTokenClassesWithPaginationParams) {
    return this.client.send<
      GalaChainResponse<FetchTokenClassesResponseBody>,
      FetchTokenClassesWithPaginationParams
    >({
      method: "FetchTokenClassesWithPagination",
      payload: dto
    });
  }

  public GrantAllowance(dto: GrantAllowanceParams) {
    return this.client.send<GalaChainResponse<TokenAllowanceBody[]>, GrantAllowanceParams>({
      method: "GrantAllowance",
      payload: dto,
      sign: true
    });
  }

  public RefreshAllowances(dto: RefreshAllowanceParams) {
    return this.client.send<GalaChainResponse<TokenAllowanceBody[]>, RefreshAllowanceParams>({
      method: "RefreshAllowances",
      payload: dto,
      sign: true
    });
  }

  public FullAllowanceCheck(dto: FullAllowanceCheckParams) {
    return this.client.send<GalaChainResponse<FullAllowanceCheckParams>, FullAllowanceCheckParams>({
      method: "FullAllowanceCheck",
      payload: dto,
      sign: true
    });
  }

  public FetchAllowances(dto: FetchAllowancesParams) {
    return this.client.send<GalaChainResponse<FetchAllowancesBody>, FetchAllowancesParams>({
      method: "FetchAllowances",
      payload: dto,
      sign: true
    });
  }

  public DeleteAllowances(dto: DeleteAllowancesParams) {
    return this.client.send<GalaChainResponse<number>, DeleteAllowancesParams>({
      method: "DeleteAllowances",
      payload: dto,
      sign: true
    });
  }

  public FetchBalances(dto: FetchBalancesParams) {
    return this.client.send<GalaChainResponse<TokenBalanceBody[]>, FetchBalancesParams>({
      method: "FetchBalances",
      payload: dto
    });
  }

  public FetchBalancesWithTokenMetadata(dto: FetchBalancesWithPaginationParams) {
    return this.client.send<
      GalaChainResponse<FetchBalancesWithTokenMetadataBody>,
      FetchBalancesWithPaginationParams
    >({
      method: "FetchBalancesWithTokenMetadata",
      payload: dto
    });
  }

  public RequestMint(dto: HighThroughputMintTokenParams) {
    // todo: Is fulfillMintDto really the response here?
    return this.client.send<GalaChainResponse<FulfillMintDto>, HighThroughputMintTokenParams>({
      method: "RequestMint",
      payload: dto,
      sign: true
    });
  }

  public FulfillMint(dto: FulfillMintParams) {
    return this.client.send<GalaChainResponse<TokenInstanceKeyBody[]>, FulfillMintParams>({
      method: "FulfillMint",
      payload: dto,
      sign: true
    });
  }

  public HighThroughputMint(dto: HighThroughputMintTokenParams) {
    return this.client.send<GalaChainResponse<TokenInstanceKeyBody[]>, HighThroughputMintTokenParams>({
      method: "HighThroughputMint",
      payload: dto,
      sign: true
    });
  }

  public FetchMintRequests(dto: FetchMintRequestsParams) {
    return this.client.send<GalaChainResponse<MintRequestDto[]>, FetchMintRequestsParams>({
      method: "FetchMintRequests",
      payload: dto
    });
  }

  public MintToken(dto: MintTokenParams) {
    return this.client.send<GalaChainResponse<TokenInstanceKeyBody[]>, MintTokenParams>({
      method: "MintToken",
      payload: dto,
      sign: true
    });
  }

  public MintTokenWithAllowance(dto: MintTokenWithAllowanceParams) {
    return this.client.send<GalaChainResponse<TokenInstanceKey[]>, MintTokenWithAllowanceParams>({
      method: "MintTokenWithAllowance",
      payload: dto,
      sign: true
    });
  }

  public BatchMintToken(dto: BatchMintTokenParams) {
    return this.client.send<GalaChainResponse<TokenInstanceKeyBody[]>, BatchMintTokenParams>({
      method: "BatchMintToken",
      payload: dto,
      sign: true
    });
  }

  public UseToken(dto: UseTokenParams) {
    return this.client.send<GalaChainResponse<TokenBalanceBody>, UseTokenParams>({
      method: "UseToken",
      payload: dto,
      sign: true
    });
  }

  public ReleaseToken(dto: ReleaseTokenParams) {
    return this.client.send<GalaChainResponse<TokenBalanceBody>, ReleaseTokenParams>({
      method: "ReleaseToken",
      payload: dto,
      sign: true
    });
  }

  public LockToken(dto: LockTokenRequestParams) {
    return this.client.send<GalaChainResponse<TokenBalanceBody>, LockTokenRequestParams>({
      method: "LockToken",
      payload: dto,
      sign: true
    });
  }

  public LockTokens(dto: LockTokensParams) {
    return this.client.send<GalaChainResponse<TokenBalanceBody[]>, LockTokensParams>({
      method: "LockTokens",
      payload: dto,
      sign: true
    });
  }

  public UnlockToken(dto: UnlockTokenParams) {
    return this.client.send<GalaChainResponse<TokenBalanceBody>, UnlockTokenParams>({
      method: "UnlockToken",
      payload: dto,
      sign: true
    });
  }

  public UnlockTokens(dto: UnlockTokensParams) {
    return this.client.send<GalaChainResponse<TokenBalanceBody[]>, UnlockTokensParams>({
      method: "UnlockTokens",
      payload: dto,
      sign: true
    });
  }

  public TransferToken(dto: TransferTokenParams) {
    return this.client.send<GalaChainResponse<TokenBalanceBody[]>, TransferTokenParams>({
      method: "TransferToken",
      payload: dto,
      sign: true
    });
  }

  public BurnTokens(dto: BurnTokensParams) {
    return this.client.send<GalaChainResponse<TokenBurnBody[]>, BurnTokensParams>({
      method: "BurnTokens",
      payload: dto,
      sign: true
    });
  }

  public FetchBurns(dto: FetchBurnsParams) {
    return this.client.send<GalaChainResponse<TokenBurnBody[]>, FetchBurnsParams>({
      method: "FetchBurns",
      payload: dto
    });
  }
}

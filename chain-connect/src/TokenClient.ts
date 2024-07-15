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
  BatchMintTokenParams,
  BurnTokensDto,
  BurnTokensParams,
  CreateTokenClassDto,
  CreateTokenClassParams,
  DeleteAllowancesDto,
  DeleteAllowancesParams,
  FetchAllowancesBody,
  FetchAllowancesDto,
  FetchAllowancesParams,
  FetchBalancesDto,
  FetchBalancesParams,
  FetchBalancesWithPaginationDto,
  FetchBalancesWithPaginationParams,
  FetchBalancesWithTokenMetadataBody,
  FetchBurnsDto,
  FetchBurnsParams,
  FetchMintRequestsDto,
  FetchMintRequestsParams,
  FetchTokenClassesDto,
  FetchTokenClassesParams,
  FetchTokenClassesResponseBody,
  FetchTokenClassesWithPaginationDto,
  FetchTokenClassesWithPaginationParams,
  FulfillMintDto,
  FulfillMintParams,
  FullAllowanceCheckDto,
  FullAllowanceCheckParams,
  GrantAllowanceDto,
  GrantAllowanceParams,
  HighThroughputMintTokenDto,
  HighThroughputMintTokenParams,
  LockTokenDto,
  LockTokenRequestParams,
  LockTokensDto,
  LockTokensParams,
  MintRequestDto,
  MintTokenDto,
  MintTokenParams,
  MintTokenWithAllowanceDto,
  MintTokenWithAllowanceParams,
  RefreshAllowanceDto,
  RefreshAllowanceParams,
  ReleaseTokenDto,
  ReleaseTokenParams,
  TokenAllowanceBody,
  TokenBalanceBody,
  TokenBurnBody,
  TokenClassBody,
  TokenClassKeyBody,
  TokenInstanceKey,
  TokenInstanceKeyBody,
  TransferTokenDto,
  TransferTokenParams,
  UnlockTokenDto,
  UnlockTokenParams,
  UnlockTokensDto,
  UnlockTokensParams,
  UpdateTokenClassDto,
  UpdateTokenClassParams,
  UseTokenDto,
  UseTokenParams
} from "@gala-chain/api";

import { GalachainConnectClient } from "./GalachainConnectClient";

export class TokenClient {
  constructor(private client: GalachainConnectClient) {}

  public CreateTokenClass(dto: CreateTokenClassParams) {
    return this.client.send<TokenClassKeyBody, CreateTokenClassParams>({
      method: "CreateTokenClass",
      payload: dto,
      sign: true
    });
  }

  public UpdateTokenClass(dto: UpdateTokenClassParams) {
    return this.client.send<TokenClassKeyBody, UpdateTokenClassParams>({
      method: "UpdateTokenClass",
      payload: dto,
      sign: true
    });
  }

  public FetchTokenClasses(dto: FetchTokenClassesParams) {
    return this.client.send<TokenClassBody[], FetchTokenClassesParams>({
      method: "FetchTokenClasses",
      payload: dto
    });
  }

  public FetchTokenClassesWithPagination(dto: FetchTokenClassesWithPaginationParams) {
    return this.client.send<FetchTokenClassesResponseBody, FetchTokenClassesWithPaginationParams>({
      method: "FetchTokenClassesWithPagination",
      payload: dto
    });
  }

  public GrantAllowance(dto: GrantAllowanceParams) {
    return this.client.send<TokenAllowanceBody[], GrantAllowanceParams>({
      method: "GrantAllowance",
      payload: dto,
      sign: true
    });
  }

  public RefreshAllowances(dto: RefreshAllowanceParams) {
    return this.client.send<TokenAllowanceBody[], RefreshAllowanceParams>({
      method: "RefreshAllowances",
      payload: dto,
      sign: true
    });
  }

  public FullAllowanceCheck(dto: FullAllowanceCheckParams) {
    return this.client.send<FullAllowanceCheckParams, FullAllowanceCheckParams>({
      method: "FullAllowanceCheck",
      payload: dto,
      sign: true
    });
  }

  public FetchAllowances(dto: FetchAllowancesParams) {
    return this.client.send<FetchAllowancesBody, FetchAllowancesParams>({
      method: "FetchAllowances",
      payload: dto,
      sign: true
    });
  }

  public DeleteAllowances(dto: DeleteAllowancesParams) {
    return this.client.send<number, DeleteAllowancesParams>({
      method: "DeleteAllowances",
      payload: dto,
      sign: true
    });
  }

  public FetchBalances(dto: FetchBalancesParams) {
    return this.client.send<TokenBalanceBody[], FetchBalancesParams>({
      method: "FetchBalances",
      payload: dto
    });
  }

  public FetchBalancesWithTokenMetadata(dto: FetchBalancesWithPaginationParams) {
    return this.client.send<FetchBalancesWithTokenMetadataBody, FetchBalancesWithPaginationParams>({
      method: "FetchBalancesWithTokenMetadata",
      payload: dto
    });
  }

  public RequestMint(dto: HighThroughputMintTokenParams) {
    // todo: Is fulfillMintDto really the response here?
    return this.client.send<FulfillMintDto, HighThroughputMintTokenParams>({
      method: "RequestMint",
      payload: dto,
      sign: true
    });
  }

  public FulfillMint(dto: FulfillMintParams) {
    return this.client.send<TokenInstanceKeyBody[], FulfillMintParams>({
      method: "FulfillMint",
      payload: dto,
      sign: true
    });
  }

  public HighThroughputMint(dto: HighThroughputMintTokenParams) {
    return this.client.send<TokenInstanceKeyBody[], HighThroughputMintTokenParams>({
      method: "HighThroughputMint",
      payload: dto,
      sign: true
    });
  }

  public FetchMintRequests(dto: FetchMintRequestsParams) {
    return this.client.send<MintRequestDto[], FetchMintRequestsParams>({
      method: "FetchMintRequests",
      payload: dto
    });
  }

  public MintToken(dto: MintTokenParams) {
    return this.client.send<TokenInstanceKeyBody[], MintTokenParams>({
      method: "MintToken",
      payload: dto,
      sign: true
    });
  }

  public MintTokenWithAllowance(dto: MintTokenWithAllowanceParams) {
    return this.client.send<TokenInstanceKey[], MintTokenWithAllowanceParams>({
      method: "MintTokenWithAllowance",
      payload: dto,
      sign: true
    });
  }

  public BatchMintToken(dto: BatchMintTokenParams) {
    return this.client.send<TokenInstanceKeyBody[], BatchMintTokenParams>({
      method: "BatchMintToken",
      payload: dto,
      sign: true
    });
  }

  public UseToken(dto: UseTokenParams) {
    return this.client.send<TokenBalanceBody, UseTokenParams>({
      method: "UseToken",
      payload: dto,
      sign: true
    });
  }

  public ReleaseToken(dto: ReleaseTokenParams) {
    return this.client.send<TokenBalanceBody, ReleaseTokenParams>({
      method: "ReleaseToken",
      payload: dto,
      sign: true
    });
  }

  public LockToken(dto: LockTokenRequestParams) {
    return this.client.send<TokenBalanceBody, LockTokenRequestParams>({
      method: "LockToken",
      payload: dto,
      sign: true
    });
  }

  public LockTokens(dto: LockTokensParams) {
    return this.client.send<TokenBalanceBody[], LockTokensParams>({
      method: "LockTokens",
      payload: dto,
      sign: true
    });
  }

  public UnlockToken(dto: UnlockTokenParams) {
    return this.client.send<TokenBalanceBody, UnlockTokenParams>({
      method: "UnlockToken",
      payload: dto,
      sign: true
    });
  }

  public UnlockTokens(dto: UnlockTokensParams) {
    return this.client.send<TokenBalanceBody[], UnlockTokensParams>({
      method: "UnlockTokens",
      payload: dto,
      sign: true
    });
  }

  public TransferToken(dto: TransferTokenParams) {
    return this.client.send<TokenBalanceBody[], TransferTokenParams>({
      method: "TransferToken",
      payload: dto,
      sign: true
    });
  }

  public BurnTokens(dto: BurnTokensParams) {
    return this.client.send<TokenBurnBody[], BurnTokensParams>({
      method: "BurnTokens",
      payload: dto,
      sign: true
    });
  }

  public FetchBurns(dto: FetchBurnsParams) {
    return this.client.send<TokenBurnBody[], FetchBurnsParams>({
      method: "FetchBurns",
      payload: dto
    });
  }
}

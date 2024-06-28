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
  FetchAllowancesResponse,
  FetchBalancesDto,
  FetchBalancesWithTokenMetadataResponse,
  FetchBurnsDto,
  FetchMintRequestsDto,
  FetchTokenClassesDto,
  FetchTokenClassesResponse,
  FetchTokenClassesWithPaginationDto,
  FulfillMintDto,
  FullAllowanceCheckDto,
  FullAllowanceCheckResDto,
  GrantAllowanceDto,
  HighThroughputMintTokenDto,
  LockTokenDto,
  LockTokensDto,
  MintRequestDto,
  MintTokenDto,
  MintTokenWithAllowanceDto,
  RefreshAllowanceDto,
  ReleaseTokenDto,
  TokenAllowance,
  TokenBalance,
  TokenBurn,
  TokenClass,
  TokenClassKey,
  TokenInstanceKey,
  TransferTokenDto,
  UnlockTokenDto,
  UnlockTokensDto,
  UpdateTokenClassDto,
  UseTokenDto
} from "@gala-chain/api";

import { GalachainConnectClient } from "./GalachainConnectClient";

export class TokenClient {
  constructor(
    private client: GalachainConnectClient,
    private url: string
  ) {}

  public CreateTokenClass(dto: CreateTokenClassDto) {
    return this.client.sendTransaction<TokenClassKey, CreateTokenClassDto>({
      url: this.url,
      method: "CreateTokenClass",
      payload: dto,
      sign: true
    });
  }

  public UpdateTokenClass(dto: UpdateTokenClassDto) {
    return this.client.sendTransaction<TokenClassKey, UpdateTokenClassDto>({
      url: this.url,
      method: "UpdateTokenClass",
      payload: dto,
      sign: true
    });
  }

  public FetchTokenClasses(dto: FetchTokenClassesDto) {
    return this.client.sendTransaction<TokenClass[], FetchTokenClassesDto>({
      url: this.url,
      method: "FetchTokenClasses",
      payload: dto
    });
  }

  public FetchTokenClassesWithPagination(dto: FetchTokenClassesWithPaginationDto) {
    return this.client.sendTransaction<FetchTokenClassesResponse, FetchTokenClassesWithPaginationDto>({
      url: this.url,
      method: "FetchTokenClassesWithPagination",
      payload: dto
    });
  }

  public GrantAllowance(dto: GrantAllowanceDto) {
    return this.client.sendTransaction<TokenAllowance[], GrantAllowanceDto>({
      url: this.url,
      method: "GrantAllowance",
      payload: dto,
      sign: true
    });
  }

  public RefreshAllowances(dto: RefreshAllowanceDto) {
    return this.client.sendTransaction<TokenAllowance[], RefreshAllowanceDto>({
      url: this.url,
      method: "RefreshAllowances",
      payload: dto,
      sign: true
    });
  }

  public FullAllowanceCheck(dto: FullAllowanceCheckDto) {
    return this.client.sendTransaction<FullAllowanceCheckResDto, FullAllowanceCheckDto>({
      url: this.url,
      method: "FullAllowanceCheck",
      payload: dto,
      sign: true
    });
  }

  public FetchAllowances(dto: FetchAllowancesDto) {
    return this.client.sendTransaction<FetchAllowancesResponse, FetchAllowancesDto>({
      url: this.url,
      method: "FetchAllowances",
      payload: dto,
      sign: true
    });
  }

  public DeleteAllowances(dto: DeleteAllowancesDto) {
    return this.client.sendTransaction<number, DeleteAllowancesDto>({
      url: this.url,
      method: "DeleteAllowances",
      payload: dto,
      sign: true
    });
  }

  public FetchBalances(dto: FetchBalancesDto) {
    return this.client.sendTransaction<TokenBalance[], FetchBalancesDto>({
      url: this.url,
      method: "FetchBalances",
      payload: dto
    });
  }

  public FetchBalancesWithTokenMetadata(dto: FetchBalancesDto) {
    return this.client.sendTransaction<FetchBalancesWithTokenMetadataResponse, FetchBalancesDto>({
      url: this.url,
      method: "FetchBalancesWithTokenMetadata",
      payload: dto
    });
  }

  public RequestMint(dto: HighThroughputMintTokenDto) {
    return this.client.sendTransaction<FulfillMintDto, HighThroughputMintTokenDto>({
      url: this.url,
      method: "RequestMint",
      payload: dto,
      sign: true
    });
  }

  public FulfillMint(dto: FulfillMintDto) {
    return this.client.sendTransaction<TokenInstanceKey[], FulfillMintDto>({
      url: this.url,
      method: "FulfillMint",
      payload: dto,
      sign: true
    });
  }

  public HighThroughputMint(dto: HighThroughputMintTokenDto) {
    return this.client.sendTransaction<TokenInstanceKey[], HighThroughputMintTokenDto>({
      url: this.url,
      method: "HighThroughputMint",
      payload: dto,
      sign: true
    });
  }

  public FetchMintRequests(dto: FetchMintRequestsDto) {
    return this.client.sendTransaction<MintRequestDto[], FetchMintRequestsDto>({
      url: this.url,
      method: "FetchMintRequests",
      payload: dto
    });
  }

  public MintToken(dto: MintTokenDto) {
    return this.client.sendTransaction<TokenInstanceKey[], MintTokenDto>({
      url: this.url,
      method: "MintToken",
      payload: dto,
      sign: true
    });
  }

  public MintTokenWithAllowance(dto: MintTokenWithAllowanceDto) {
    return this.client.sendTransaction<TokenInstanceKey[], MintTokenWithAllowanceDto>({
      url: this.url,
      method: "MintTokenWithAllowance",
      payload: dto,
      sign: true
    });
  }

  public BatchMintToken(dto: BatchMintTokenDto) {
    return this.client.sendTransaction<TokenInstanceKey[], BatchMintTokenDto>({
      url: this.url,
      method: "BatchMintToken",
      payload: dto,
      sign: true
    });
  }

  public UseToken(dto: UseTokenDto) {
    return this.client.sendTransaction<TokenBalance, UseTokenDto>({
      url: this.url,
      method: "UseToken",
      payload: dto,
      sign: true
    });
  }

  public ReleaseToken(dto: ReleaseTokenDto) {
    return this.client.sendTransaction<TokenBalance, ReleaseTokenDto>({
      url: this.url,
      method: "ReleaseToken",
      payload: dto,
      sign: true
    });
  }

  public LockToken(dto: LockTokenDto) {
    return this.client.sendTransaction<TokenBalance, LockTokenDto>({
      url: this.url,
      method: "LockToken",
      payload: dto,
      sign: true
    });
  }

  public LockTokens(dto: LockTokensDto) {
    return this.client.sendTransaction<TokenBalance[], LockTokensDto>({
      url: this.url,
      method: "LockTokens",
      payload: dto,
      sign: true
    });
  }

  public UnlockToken(dto: UnlockTokenDto) {
    return this.client.sendTransaction<TokenBalance, UnlockTokenDto>({
      url: this.url,
      method: "UnlockToken",
      payload: dto,
      sign: true
    });
  }

  public UnlockTokens(dto: UnlockTokensDto) {
    return this.client.sendTransaction<TokenBalance[], UnlockTokensDto>({
      url: this.url,
      method: "UnlockTokens",
      payload: dto,
      sign: true
    });
  }

  public TransferToken(dto: TransferTokenDto) {
    return this.client.sendTransaction<TokenBalance[], TransferTokenDto>({
      url: this.url,
      method: "TransferToken",
      payload: dto,
      sign: true
    });
  }

  public BurnTokens(dto: BurnTokensDto) {
    return this.client.sendTransaction<TokenBurn[], BurnTokensDto>({
      url: this.url,
      method: "BurnTokens",
      payload: dto,
      sign: true
    });
  }

  public FetchBurns(dto: FetchBurnsDto) {
    return this.client.sendTransaction<TokenBurn[], FetchBurnsDto>({
      url: this.url,
      method: "FetchBurns",
      payload: dto
    });
  }
}

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
  constructor(private client: GalachainConnectClient) {}

  public CreateTokenClass(dto: CreateTokenClassDto) {
    return this.client.send<TokenClassKey, CreateTokenClassDto>({
      method: "CreateTokenClass",
      payload: dto,
      sign: true
    });
  }

  public UpdateTokenClass(dto: UpdateTokenClassDto) {
    return this.client.send<TokenClassKey, UpdateTokenClassDto>({
      method: "UpdateTokenClass",
      payload: dto,
      sign: true
    });
  }

  public FetchTokenClasses(dto: FetchTokenClassesDto) {
    return this.client.send<TokenClass[], FetchTokenClassesDto>({
      method: "FetchTokenClasses",
      payload: dto
    });
  }

  public FetchTokenClassesWithPagination(dto: FetchTokenClassesWithPaginationDto) {
    return this.client.send<FetchTokenClassesResponse, FetchTokenClassesWithPaginationDto>({
      method: "FetchTokenClassesWithPagination",
      payload: dto
    });
  }

  public GrantAllowance(dto: GrantAllowanceDto) {
    return this.client.send<TokenAllowance[], GrantAllowanceDto>({
      method: "GrantAllowance",
      payload: dto,
      sign: true
    });
  }

  public RefreshAllowances(dto: RefreshAllowanceDto) {
    return this.client.send<TokenAllowance[], RefreshAllowanceDto>({
      method: "RefreshAllowances",
      payload: dto,
      sign: true
    });
  }

  public FullAllowanceCheck(dto: FullAllowanceCheckDto) {
    return this.client.send<FullAllowanceCheckResDto, FullAllowanceCheckDto>({
      method: "FullAllowanceCheck",
      payload: dto,
      sign: true
    });
  }

  public FetchAllowances(dto: FetchAllowancesDto) {
    return this.client.send<FetchAllowancesResponse, FetchAllowancesDto>({
      method: "FetchAllowances",
      payload: dto,
      sign: true
    });
  }

  public DeleteAllowances(dto: DeleteAllowancesDto) {
    return this.client.send<number, DeleteAllowancesDto>({
      method: "DeleteAllowances",
      payload: dto,
      sign: true
    });
  }

  public FetchBalances(dto: FetchBalancesDto) {
    return this.client.send<TokenBalance[], FetchBalancesDto>({
      method: "FetchBalances",
      payload: dto
    });
  }

  public FetchBalancesWithTokenMetadata(dto: FetchBalancesDto) {
    return this.client.send<FetchBalancesWithTokenMetadataResponse, FetchBalancesDto>({
      method: "FetchBalancesWithTokenMetadata",
      payload: dto
    });
  }

  public RequestMint(dto: HighThroughputMintTokenDto) {
    return this.client.send<FulfillMintDto, HighThroughputMintTokenDto>({
      method: "RequestMint",
      payload: dto,
      sign: true
    });
  }

  public FulfillMint(dto: FulfillMintDto) {
    return this.client.send<TokenInstanceKey[], FulfillMintDto>({
      method: "FulfillMint",
      payload: dto,
      sign: true
    });
  }

  public HighThroughputMint(dto: HighThroughputMintTokenDto) {
    return this.client.send<TokenInstanceKey[], HighThroughputMintTokenDto>({
      method: "HighThroughputMint",
      payload: dto,
      sign: true
    });
  }

  public FetchMintRequests(dto: FetchMintRequestsDto) {
    return this.client.send<MintRequestDto[], FetchMintRequestsDto>({
      method: "FetchMintRequests",
      payload: dto
    });
  }

  public MintToken(dto: MintTokenDto) {
    return this.client.send<TokenInstanceKey[], MintTokenDto>({
      method: "MintToken",
      payload: dto,
      sign: true
    });
  }

  public MintTokenWithAllowance(dto: MintTokenWithAllowanceDto) {
    return this.client.send<TokenInstanceKey[], MintTokenWithAllowanceDto>({
      method: "MintTokenWithAllowance",
      payload: dto,
      sign: true
    });
  }

  public BatchMintToken(dto: BatchMintTokenDto) {
    return this.client.send<TokenInstanceKey[], BatchMintTokenDto>({
      method: "BatchMintToken",
      payload: dto,
      sign: true
    });
  }

  public UseToken(dto: UseTokenDto) {
    return this.client.send<TokenBalance, UseTokenDto>({
      method: "UseToken",
      payload: dto,
      sign: true
    });
  }

  public ReleaseToken(dto: ReleaseTokenDto) {
    return this.client.send<TokenBalance, ReleaseTokenDto>({
      method: "ReleaseToken",
      payload: dto,
      sign: true
    });
  }

  public LockToken(dto: LockTokenDto) {
    return this.client.send<TokenBalance, LockTokenDto>({
      method: "LockToken",
      payload: dto,
      sign: true
    });
  }

  public LockTokens(dto: LockTokensDto) {
    return this.client.send<TokenBalance[], LockTokensDto>({
      method: "LockTokens",
      payload: dto,
      sign: true
    });
  }

  public UnlockToken(dto: UnlockTokenDto) {
    return this.client.send<TokenBalance, UnlockTokenDto>({
      method: "UnlockToken",
      payload: dto,
      sign: true
    });
  }

  public UnlockTokens(dto: UnlockTokensDto) {
    return this.client.send<TokenBalance[], UnlockTokensDto>({
      method: "UnlockTokens",
      payload: dto,
      sign: true
    });
  }

  public TransferToken(dto: TransferTokenDto) {
    return this.client.send<TokenBalance[], TransferTokenDto>({
      method: "TransferToken",
      payload: dto,
      sign: true
    });
  }

  public BurnTokens(dto: BurnTokensDto) {
    return this.client.send<TokenBurn[], BurnTokensDto>({
      method: "BurnTokens",
      payload: dto,
      sign: true
    });
  }

  public FetchBurns(dto: FetchBurnsDto) {
    return this.client.send<TokenBurn[], FetchBurnsDto>({
      method: "FetchBurns",
      payload: dto
    });
  }
}

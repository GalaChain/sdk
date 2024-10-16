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
  FetchBalancesWithPaginationDto,
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

import { GalaChainProvider } from "../GalaChainClient";

export class TokenApi {
  constructor(
    private chainCodeUrl: string,
    private connection: GalaChainProvider
  ) {}

  // Token Chaincode Calls:
  public CreateTokenClass(dto: CreateTokenClassDto) {
    return this.connection.submit<TokenClassKey, CreateTokenClassDto>({
      method: "CreateTokenClass",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public UpdateTokenClass(dto: UpdateTokenClassDto) {
    const test = this.connection.submit<TokenClassKey, UpdateTokenClassDto>({
      method: "UpdateTokenClass",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public FetchTokenClasses(dto: FetchTokenClassesDto) {
    return this.connection.submit<TokenClass[], FetchTokenClassesDto>({
      method: "FetchTokenClasses",
      payload: dto,
      url: this.chainCodeUrl
    });
  }

  public FetchTokenClassesWithPagination(dto: FetchTokenClassesWithPaginationDto) {
    return this.connection.submit<FetchTokenClassesResponse, FetchTokenClassesWithPaginationDto>({
      method: "FetchTokenClassesWithPagination",
      payload: dto,
      url: this.chainCodeUrl
    });
  }

  public GrantAllowance(dto: GrantAllowanceDto) {
    return this.connection.submit<TokenAllowance[], GrantAllowanceDto>({
      method: "GrantAllowance",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public RefreshAllowances(dto: RefreshAllowanceDto) {
    return this.connection.submit<TokenAllowance[], RefreshAllowanceDto>({
      method: "RefreshAllowances",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public FullAllowanceCheck(dto: FullAllowanceCheckDto) {
    return this.connection.submit<FullAllowanceCheckResDto, FullAllowanceCheckDto>({
      method: "FullAllowanceCheck",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public FetchAllowances(dto: FetchAllowancesDto) {
    return this.connection.submit<FetchAllowancesResponse, FetchAllowancesDto>({
      method: "FetchAllowances",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public DeleteAllowances(dto: DeleteAllowancesDto) {
    return this.connection.submit<number, DeleteAllowancesDto>({
      method: "DeleteAllowances",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public FetchBalances(dto: FetchBalancesDto) {
    return this.connection.submit<TokenBalance[], FetchBalancesDto>({
      method: "FetchBalances",
      payload: dto,
      url: this.chainCodeUrl
    });
  }

  public FetchBalancesWithTokenMetadata(dto: FetchBalancesWithPaginationDto) {
    return this.connection.submit<FetchBalancesWithTokenMetadataResponse, FetchBalancesDto>({
      method: "FetchBalancesWithTokenMetadata",
      payload: dto,
      url: this.chainCodeUrl
    });
  }

  public RequestMint(dto: HighThroughputMintTokenDto) {
    return this.connection.submit<FulfillMintDto, HighThroughputMintTokenDto>({
      method: "RequestMint",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public FulfillMint(dto: FulfillMintDto) {
    return this.connection.submit<TokenInstanceKey[], FulfillMintDto>({
      method: "FulfillMint",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public FetchMintRequests(dto: FetchMintRequestsDto) {
    return this.connection.submit<MintRequestDto[], FetchMintRequestsDto>({
      method: "FetchMintRequests",
      payload: dto,
      url: this.chainCodeUrl
    });
  }

  public MintToken(dto: MintTokenDto) {
    return this.connection.submit<TokenInstanceKey[], MintTokenDto>({
      method: "MintToken",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public MintTokenWithAllowance(dto: MintTokenWithAllowanceDto) {
    return this.connection.submit<TokenInstanceKey[], MintTokenWithAllowanceDto>({
      method: "MintTokenWithAllowance",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public BatchMintToken(dto: BatchMintTokenDto) {
    return this.connection.submit<TokenInstanceKey[], BatchMintTokenDto>({
      method: "BatchMintToken",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public UseToken(dto: UseTokenDto) {
    return this.connection.submit<TokenBalance, UseTokenDto>({
      method: "UseToken",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public ReleaseToken(dto: ReleaseTokenDto) {
    return this.connection.submit<TokenBalance, ReleaseTokenDto>({
      method: "ReleaseToken",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public LockToken(dto: LockTokenDto) {
    return this.connection.submit<TokenBalance, LockTokenDto>({
      method: "LockToken",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public LockTokens(dto: LockTokensDto) {
    return this.connection.submit<TokenBalance[], LockTokensDto>({
      method: "LockTokens",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public UnlockToken(dto: UnlockTokenDto) {
    return this.connection.submit<TokenBalance, UnlockTokenDto>({
      method: "UnlockToken",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public UnlockTokens(dto: UnlockTokensDto) {
    return this.connection.submit<TokenBalance[], UnlockTokensDto>({
      method: "UnlockTokens",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public TransferToken(dto: TransferTokenDto) {
    return this.connection.submit<TokenBalance[], TransferTokenDto>({
      method: "TransferToken",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public BurnTokens(dto: BurnTokensDto) {
    return this.connection.submit<TokenBurn[], BurnTokensDto>({
      method: "BurnTokens",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public FetchBurns(dto: FetchBurnsDto) {
    return this.connection.submit<TokenBurn[], FetchBurnsDto>({
      method: "FetchBurns",
      payload: dto,
      url: this.chainCodeUrl
    });
  }
}

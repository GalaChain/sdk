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

import { GalachainConnectClient } from "./GalachainConnectClient";

export class TokenClient {
  constructor(
    private client: GalachainConnectClient,
    private url: string
  ) {}

  public CreateTokenClass(dto: CreateTokenClassDto) {
    return this.client.sendTransaction(this.url, "CreateTokenClass", dto);
  }

  public UpdateTokenClass(dto: UpdateTokenClassDto) {
    return this.client.sendTransaction(this.url, "UpdateTokenClass", dto);
  }

  public FetchTokenClasses(dto: FetchTokenClassesDto) {
    return this.client.sendTransaction(this.url, "FetchTokenClasses", dto);
  }

  public FetchTokenClassesWithPagination(dto: FetchTokenClassesWithPaginationDto) {
    return this.client.sendTransaction(this.url, "FetchTokenClassesWithPagination", dto);
  }

  public GrantAllowance(dto: GrantAllowanceDto) {
    return this.client.sendTransaction(this.url, "GrantAllowance", dto);
  }

  public RefreshAllowances(dto: RefreshAllowanceDto) {
    return this.client.sendTransaction(this.url, "RefreshAllowances", dto);
  }

  public FullAllowanceCheck(dto: FullAllowanceCheckDto) {
    return this.client.sendTransaction(this.url, "FullAllowanceCheck", dto);
  }

  public FetchAllowances(dto: FetchAllowancesDto) {
    return this.client.sendTransaction(this.url, "FetchAllowances", dto);
  }

  public DeleteAllowances(dto: DeleteAllowancesDto) {
    return this.client.sendTransaction(this.url, "DeleteAllowances", dto);
  }

  public FetchBalances(dto: FetchBalancesDto) {
    return this.client.sendTransaction(this.url, "FetchBalances", dto);
  }

  public RequestMint(dto: HighThroughputMintTokenDto) {
    return this.client.sendTransaction(this.url, "RequestMint", dto);
  }

  public FulfillMint(dto: FulfillMintDto) {
    return this.client.sendTransaction(this.url, "FulfillMint", dto);
  }

  public HighThroughputMint(dto: HighThroughputMintTokenDto) {
    return this.client.sendTransaction(this.url, "HighThroughputMint", dto);
  }

  public FetchMintRequests(dto: FetchMintRequestsDto) {
    return this.client.sendTransaction(this.url, "FetchMintRequests", dto);
  }

  public MintToken(dto: MintTokenDto) {
    return this.client.sendTransaction(this.url, "MintToken", dto);
  }

  public MintTokenWithAllowance(dto: MintTokenWithAllowanceDto) {
    return this.client.sendTransaction(this.url, "MintTokenWithAllowance", dto);
  }

  public BatchMintToken(dto: BatchMintTokenDto) {
    return this.client.sendTransaction(this.url, "BatchMintToken", dto);
  }

  public UseToken(dto: UseTokenDto) {
    return this.client.sendTransaction(this.url, "UseToken", dto);
  }

  public ReleaseToken(dto: ReleaseTokenDto) {
    return this.client.sendTransaction(this.url, "ReleaseToken", dto);
  }

  public LockToken(dto: LockTokenDto) {
    return this.client.sendTransaction(this.url, "LockToken", dto);
  }

  public LockTokens(dto: LockTokensDto) {
    return this.client.sendTransaction(this.url, "LockTokens", dto);
  }

  public UnlockToken(dto: UnlockTokenDto) {
    return this.client.sendTransaction(this.url, "UnlockToken", dto);
  }

  public UnlockTokens(dto: UnlockTokensDto) {
    return this.client.sendTransaction(this.url, "UnlockTokens", dto);
  }

  public TransferToken(dto: TransferTokenDto) {
    return this.client.sendTransaction(this.url, "TransferToken", dto);
  }

  public BurnTokens(dto: BurnTokensDto) {
    return this.client.sendTransaction(this.url, "BurnTokens", dto);
  }

  public FetchBurns(dto: FetchBurnsDto) {
    return this.client.sendTransaction(this.url, "FetchBurns", dto);
  }
}

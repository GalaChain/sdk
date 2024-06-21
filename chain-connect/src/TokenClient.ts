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
    return this.client.sendTransaction({ url: this.url, method: "CreateTokenClass", payload: dto });
  }

  public UpdateTokenClass(dto: UpdateTokenClassDto) {
    return this.client.sendTransaction({ url: this.url, method: "UpdateTokenClass", payload: dto });
  }

  public FetchTokenClasses(dto: FetchTokenClassesDto) {
    return this.client.sendTransaction({ url: this.url, method: "FetchTokenClasses", payload: dto });
  }

  public FetchTokenClassesWithPagination(dto: FetchTokenClassesWithPaginationDto) {
    return this.client.sendTransaction({
      url: this.url,
      method: "FetchTokenClassesWithPagination",
      payload: dto
    });
  }

  public GrantAllowance(dto: GrantAllowanceDto) {
    return this.client.sendTransaction({ url: this.url, method: "GrantAllowance", payload: dto });
  }

  public RefreshAllowances(dto: RefreshAllowanceDto) {
    return this.client.sendTransaction({ url: this.url, method: "RefreshAllowances", payload: dto });
  }

  public FullAllowanceCheck(dto: FullAllowanceCheckDto) {
    return this.client.sendTransaction({ url: this.url, method: "FullAllowanceCheck", payload: dto });
  }

  public FetchAllowances(dto: FetchAllowancesDto) {
    return this.client.sendTransaction({ url: this.url, method: "FetchAllowances", payload: dto });
  }

  public DeleteAllowances(dto: DeleteAllowancesDto) {
    return this.client.sendTransaction({ url: this.url, method: "DeleteAllowances", payload: dto });
  }

  public FetchBalances(dto: FetchBalancesDto) {
    return this.client.sendTransaction({ url: this.url, method: "FetchBalances", payload: dto });
  }

  public RequestMint(dto: HighThroughputMintTokenDto) {
    return this.client.sendTransaction({ url: this.url, method: "RequestMint", payload: dto });
  }

  public FulfillMint(dto: FulfillMintDto) {
    return this.client.sendTransaction({ url: this.url, method: "FulfillMint", payload: dto });
  }

  public HighThroughputMint(dto: HighThroughputMintTokenDto) {
    return this.client.sendTransaction({ url: this.url, method: "HighThroughputMint", payload: dto });
  }

  public FetchMintRequests(dto: FetchMintRequestsDto) {
    return this.client.sendTransaction({ url: this.url, method: "FetchMintRequests", payload: dto });
  }

  public MintToken(dto: MintTokenDto) {
    return this.client.sendTransaction({ url: this.url, method: "MintToken", payload: dto });
  }

  public MintTokenWithAllowance(dto: MintTokenWithAllowanceDto) {
    return this.client.sendTransaction({ url: this.url, method: "MintTokenWithAllowance", payload: dto });
  }

  public BatchMintToken(dto: BatchMintTokenDto) {
    return this.client.sendTransaction({ url: this.url, method: "BatchMintToken", payload: dto });
  }

  public UseToken(dto: UseTokenDto) {
    return this.client.sendTransaction({ url: this.url, method: "UseToken", payload: dto });
  }

  public ReleaseToken(dto: ReleaseTokenDto) {
    return this.client.sendTransaction({ url: this.url, method: "ReleaseToken", payload: dto });
  }

  public LockToken(dto: LockTokenDto) {
    return this.client.sendTransaction({ url: this.url, method: "LockToken", payload: dto });
  }

  public LockTokens(dto: LockTokensDto) {
    return this.client.sendTransaction({ url: this.url, method: "LockTokens", payload: dto });
  }

  public UnlockToken(dto: UnlockTokenDto) {
    return this.client.sendTransaction({ url: this.url, method: "UnlockToken", payload: dto });
  }

  public UnlockTokens(dto: UnlockTokensDto) {
    return this.client.sendTransaction({ url: this.url, method: "UnlockTokens", payload: dto });
  }

  public TransferToken(dto: TransferTokenDto) {
    return this.client.sendTransaction({ url: this.url, method: "TransferToken", payload: dto });
  }

  public BurnTokens(dto: BurnTokensDto) {
    return this.client.sendTransaction({ url: this.url, method: "BurnTokens", payload: dto });
  }

  public FetchBurns(dto: FetchBurnsDto) {
    return this.client.sendTransaction({ url: this.url, method: "FetchBurns", payload: dto });
  }
}

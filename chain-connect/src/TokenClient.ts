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
    return this.client.send<TokenClassKeyBody, CreateTokenClassDto>({
      method: "CreateTokenClass",
      payload: new CreateTokenClassDto(dto),
      sign: true
    });
  }

  public UpdateTokenClass(dto: UpdateTokenClassParams) {
    return this.client.send<TokenClassKeyBody, UpdateTokenClassDto>({
      method: "UpdateTokenClass",
      payload: new UpdateTokenClassDto(dto),
      sign: true
    });
  }

  public FetchTokenClasses(dto: FetchTokenClassesParams) {
    return this.client.send<TokenClassBody[], FetchTokenClassesDto>({
      method: "FetchTokenClasses",
      payload: new FetchTokenClassesDto(dto)
    });
  }

  public FetchTokenClassesWithPagination(dto: FetchTokenClassesWithPaginationParams) {
    return this.client.send<FetchTokenClassesResponseBody, FetchTokenClassesWithPaginationDto>({
      method: "FetchTokenClassesWithPagination",
      payload: new FetchTokenClassesWithPaginationDto(dto)
    });
  }

  public GrantAllowance(dto: GrantAllowanceParams) {
    return this.client.send<TokenAllowanceBody[], GrantAllowanceDto>({
      method: "GrantAllowance",
      payload: new GrantAllowanceDto(dto),
      sign: true
    });
  }

  public RefreshAllowances(dto: RefreshAllowanceParams) {
    return this.client.send<TokenAllowanceBody[], RefreshAllowanceDto>({
      method: "RefreshAllowances",
      payload: new RefreshAllowanceDto(dto),
      sign: true
    });
  }

  public FullAllowanceCheck(dto: FullAllowanceCheckParams) {
    return this.client.send<FullAllowanceCheckParams, FullAllowanceCheckDto>({
      method: "FullAllowanceCheck",
      payload: new FullAllowanceCheckDto(dto),
      sign: true
    });
  }

  public FetchAllowances(dto: FetchAllowancesParams) {
    return this.client.send<FetchAllowancesBody, FetchAllowancesDto>({
      method: "FetchAllowances",
      payload: new FetchAllowancesDto(dto),
      sign: true
    });
  }

  public DeleteAllowances(dto: DeleteAllowancesParams) {
    return this.client.send<number, DeleteAllowancesDto>({
      method: "DeleteAllowances",
      payload: new DeleteAllowancesDto(dto),
      sign: true
    });
  }

  public FetchBalances(dto: FetchBalancesParams) {
    return this.client.send<TokenBalanceBody[], FetchBalancesDto>({
      method: "FetchBalances",
      payload: new FetchBalancesDto(dto)
    });
  }

  public FetchBalancesWithTokenMetadata(dto: FetchBalancesWithPaginationParams) {
    return this.client.send<FetchBalancesWithTokenMetadataBody, FetchBalancesWithPaginationDto>({
      method: "FetchBalancesWithTokenMetadata",
      payload: new FetchBalancesWithPaginationDto(dto)
    });
  }

  public RequestMint(dto: HighThroughputMintTokenParams) {
    // todo: Is fulfillMintDto really the response here?
    return this.client.send<FulfillMintDto, HighThroughputMintTokenDto>({
      method: "RequestMint",
      payload: new HighThroughputMintTokenDto(dto),
      sign: true
    });
  }

  public FulfillMint(dto: FulfillMintParams) {
    return this.client.send<TokenInstanceKeyBody[], FulfillMintDto>({
      method: "FulfillMint",
      payload: new FulfillMintDto(dto),
      sign: true
    });
  }

  public HighThroughputMint(dto: HighThroughputMintTokenParams) {
    return this.client.send<TokenInstanceKeyBody[], HighThroughputMintTokenDto>({
      method: "HighThroughputMint",
      payload: new HighThroughputMintTokenDto(dto),
      sign: true
    });
  }

  public FetchMintRequests(dto: FetchMintRequestsParams) {
    return this.client.send<MintRequestDto[], FetchMintRequestsDto>({
      method: "FetchMintRequests",
      payload: new FetchMintRequestsDto(dto)
    });
  }

  public MintToken(dto: MintTokenParams) {
    return this.client.send<TokenInstanceKeyBody[], MintTokenDto>({
      method: "MintToken",
      payload: new MintTokenDto(dto),
      sign: true
    });
  }

  public MintTokenWithAllowance(dto: MintTokenWithAllowanceParams) {
    return this.client.send<TokenInstanceKey[], MintTokenWithAllowanceDto>({
      method: "MintTokenWithAllowance",
      payload: new MintTokenWithAllowanceDto(dto),
      sign: true
    });
  }

  public BatchMintToken(dto: BatchMintTokenParams) {
    return this.client.send<TokenInstanceKeyBody[], BatchMintTokenDto>({
      method: "BatchMintToken",
      payload: new BatchMintTokenDto(dto),
      sign: true
    });
  }

  public UseToken(dto: UseTokenParams) {
    return this.client.send<TokenBalanceBody, UseTokenDto>({
      method: "UseToken",
      payload: new UseTokenDto(dto),
      sign: true
    });
  }

  public ReleaseToken(dto: ReleaseTokenParams) {
    return this.client.send<TokenBalanceBody, ReleaseTokenDto>({
      method: "ReleaseToken",
      payload: new ReleaseTokenDto(dto),
      sign: true
    });
  }

  public LockToken(dto: LockTokenRequestParams) {
    return this.client.send<TokenBalanceBody, LockTokenRequestParams>({
      method: "LockToken",
      payload: new LockTokenDto(dto),
      sign: true
    });
  }

  public LockTokens(dto: LockTokensParams) {
    return this.client.send<TokenBalanceBody[], LockTokensDto>({
      method: "LockTokens",
      payload: new LockTokensDto(dto),
      sign: true
    });
  }

  public UnlockToken(dto: UnlockTokenParams) {
    return this.client.send<TokenBalanceBody, UnlockTokenDto>({
      method: "UnlockToken",
      payload: new UnlockTokenDto(dto),
      sign: true
    });
  }

  public UnlockTokens(dto: UnlockTokensParams) {
    return this.client.send<TokenBalanceBody[], UnlockTokensDto>({
      method: "UnlockTokens",
      payload: new UnlockTokensDto(dto),
      sign: true
    });
  }

  public TransferToken(dto: TransferTokenParams) {
    return this.client.send<TokenBalanceBody[], TransferTokenDto>({
      method: "TransferToken",
      payload: new TransferTokenDto(dto),
      sign: true
    });
  }

  public BurnTokens(dto: BurnTokensParams) {
    return this.client.send<TokenBurnBody[], BurnTokensDto>({
      method: "BurnTokens",
      payload: new BurnTokensDto(dto),
      sign: true
    });
  }

  public FetchBurns(dto: FetchBurnsParams) {
    return this.client.send<TokenBurnBody[], FetchBurnsDto>({
      method: "FetchBurns",
      payload: new FetchBurnsDto(dto)
    });
  }
}

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
  FullAllowanceCheckResDto as FullAllowanceCheckResponse,
  GrantAllowanceDto,
  HighThroughputMintTokenDto,
  FulfillMintDto as HighThroughputMintTokenResponse,
  LockTokenDto,
  LockTokensDto,
  MintRequestDto,
  MintTokenDto,
  MintTokenWithAllowanceDto,
  NonFunctionProperties,
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

type BatchMintTokenRequest = NonFunctionProperties<BatchMintTokenDto>;
type BurnTokensRequest = NonFunctionProperties<BurnTokensDto>;
type CreateTokenClassRequest = NonFunctionProperties<CreateTokenClassDto>;
type DeleteAllowancesRequest = NonFunctionProperties<DeleteAllowancesDto>;
type FetchAllowancesRequest = NonFunctionProperties<FetchAllowancesDto>;
type FetchBalancesRequest = NonFunctionProperties<FetchBalancesDto>;
type FetchBalancesWithPaginationRequest = NonFunctionProperties<FetchBalancesWithPaginationDto>;
type FetchBurnsRequest = NonFunctionProperties<FetchBurnsDto>;
type FetchMintRequestsRequest = NonFunctionProperties<FetchMintRequestsDto>;
type FetchTokenClassesRequest = NonFunctionProperties<FetchTokenClassesDto>;
type FetchTokenClassesWithPaginationRequest = NonFunctionProperties<FetchTokenClassesWithPaginationDto>;
type FulfillMintRequest = NonFunctionProperties<FulfillMintDto>;
type FullAllowanceCheckRequest = NonFunctionProperties<FullAllowanceCheckDto>;
type GrantAllowanceRequest = NonFunctionProperties<GrantAllowanceDto>;
type HighThroughputMintTokenRequest = NonFunctionProperties<HighThroughputMintTokenDto>;
type LockTokenRequest = NonFunctionProperties<LockTokenDto>;
type LockTokensRequest = NonFunctionProperties<LockTokensDto>;
type MintRequest = NonFunctionProperties<MintRequestDto>;
type MintTokenRequest = NonFunctionProperties<MintTokenDto>;
type MintTokenWithAllowanceRequest = NonFunctionProperties<MintTokenWithAllowanceDto>;
type RefreshAllowanceRequest = NonFunctionProperties<RefreshAllowanceDto>;
type ReleaseTokenRequest = NonFunctionProperties<ReleaseTokenDto>;
type TransferTokenRequest = NonFunctionProperties<TransferTokenDto>;
type UnlockTokenRequest = NonFunctionProperties<UnlockTokenDto>;
type UnlockTokensRequest = NonFunctionProperties<UnlockTokensDto>;
type UpdateTokenClassRequest = NonFunctionProperties<UpdateTokenClassDto>;
type UseTokenRequest = NonFunctionProperties<UseTokenDto>;

export {
  BatchMintTokenRequest,
  BurnTokensRequest,
  CreateTokenClassRequest,
  DeleteAllowancesRequest,
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
  FulfillMintRequest,
  FullAllowanceCheckRequest,
  FullAllowanceCheckResponse,
  GrantAllowanceRequest,
  HighThroughputMintTokenRequest,
  HighThroughputMintTokenResponse,
  LockTokenRequest,
  LockTokensRequest,
  MintRequest,
  MintTokenRequest,
  MintTokenWithAllowanceRequest,
  RefreshAllowanceRequest,
  ReleaseTokenRequest,
  TokenAllowance,
  TokenBalance,
  TokenBurn,
  TokenClass,
  TokenClassKey,
  TokenInstanceKey,
  TransferTokenRequest,
  UnlockTokenRequest,
  UnlockTokensRequest,
  UpdateTokenClassRequest,
  UseTokenRequest
};

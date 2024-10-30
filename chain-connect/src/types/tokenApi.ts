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
  BigNumberArrayProperty,
  BigNumberIsNotNegative,
  BigNumberProperty,
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
  IsUserAlias,
  LockTokenDto,
  LockTokensDto,
  MintRequestDto,
  MintTokenDto,
  MintTokenWithAllowanceDto,
  RefreshAllowanceDto,
  ReleaseTokenDto,
  TokenAllowance,
  TokenBalance as TokenBalanceDto,
  TokenBalanceWithMetadata,
  TokenBurn,
  TokenClass,
  TokenClassKey,
  TokenHold,
  TokenInstanceKey,
  TransferTokenDto,
  UnlockTokenDto,
  UnlockTokensDto,
  UpdateTokenClassDto,
  UseTokenDto
} from "@gala-chain/api";
import BigNumber from "bignumber.js";
import { Type } from "class-transformer";
import { IsDefined, IsNotEmpty, IsOptional, ValidateNested } from "class-validator";

import { ConstructorArgs } from "./utils";

type BatchMintTokenRequest = ConstructorArgs<BatchMintTokenDto>;
type BurnTokensRequest = ConstructorArgs<BurnTokensDto>;
type CreateTokenClassRequest = ConstructorArgs<CreateTokenClassDto>;
type DeleteAllowancesRequest = ConstructorArgs<DeleteAllowancesDto>;
type FetchAllowancesRequest = ConstructorArgs<FetchAllowancesDto>;
type FetchBalancesRequest = ConstructorArgs<FetchBalancesDto>;
type FetchBalancesWithPaginationRequest = ConstructorArgs<FetchBalancesWithPaginationDto>;
type FetchBurnsRequest = ConstructorArgs<FetchBurnsDto>;
type FetchMintRequestsRequest = ConstructorArgs<FetchMintRequestsDto>;
type FetchTokenClassesRequest = ConstructorArgs<FetchTokenClassesDto>;
type FetchTokenClassesWithPaginationRequest = ConstructorArgs<FetchTokenClassesWithPaginationDto>;
type FulfillMintRequest = ConstructorArgs<FulfillMintDto>;
type FullAllowanceCheckRequest = ConstructorArgs<FullAllowanceCheckDto>;
type GrantAllowanceRequest = ConstructorArgs<GrantAllowanceDto>;
type HighThroughputMintTokenRequest = ConstructorArgs<HighThroughputMintTokenDto>;
type LockTokenRequest = ConstructorArgs<LockTokenDto>;
type LockTokensRequest = ConstructorArgs<LockTokensDto>;
type MintRequest = ConstructorArgs<MintRequestDto>;
type MintTokenRequest = ConstructorArgs<MintTokenDto>;
type MintTokenWithAllowanceRequest = ConstructorArgs<MintTokenWithAllowanceDto>;
type RefreshAllowanceRequest = ConstructorArgs<RefreshAllowanceDto>;
type ReleaseTokenRequest = ConstructorArgs<ReleaseTokenDto>;
type TransferTokenRequest = ConstructorArgs<TransferTokenDto>;
type UnlockTokenRequest = ConstructorArgs<UnlockTokenDto>;
type UnlockTokensRequest = ConstructorArgs<UnlockTokensDto>;
type UpdateTokenClassRequest = ConstructorArgs<UpdateTokenClassDto>;
type UseTokenRequest = ConstructorArgs<UseTokenDto>;

// Unique case where we need to expose private properties but keep validations
class TokenBalance implements ConstructorArgs<TokenBalanceDto> {
  @IsUserAlias()
  owner: string;

  @IsNotEmpty()
  collection: string;

  @IsNotEmpty()
  category: string;

  @IsNotEmpty()
  type: string;

  @IsDefined()
  additionalKey: string;

  @IsOptional()
  @BigNumberArrayProperty()
  instanceIds?: Array<BigNumber>;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TokenHold)
  lockedHolds?: Array<TokenHold>;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TokenHold)
  inUseHolds?: Array<TokenHold>;

  @BigNumberIsNotNegative()
  @BigNumberProperty()
  quantity: BigNumber;
}

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
  TokenBalanceWithMetadata,
  TokenBurn,
  TokenClass,
  TokenClassKey,
  TokenHold,
  TokenInstanceKey,
  TransferTokenRequest,
  UnlockTokenRequest,
  UnlockTokensRequest,
  UpdateTokenClassRequest,
  UseTokenRequest
};

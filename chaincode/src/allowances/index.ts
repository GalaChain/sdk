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
  AllowanceUsersMismatchError,
  BalanceNotFoundError,
  DuplicateAllowanceError,
  DuplicateUserError,
  GrantAllowanceFailedError,
  InsufficientAllowanceError,
  InsufficientTokenBalanceError,
  InvalidMintError,
  InvalidTokenOwnerError,
  MintCapacityExceededError,
  TotalSupplyExceededError,
  UnauthorizedAllowanceRefreshError
} from "./AllowanceError";
import { checkAllowances } from "./checkAllowances";
import { DeleteAllowancesParams, DeleteOneAllowanceParams, deleteAllowances } from "./deleteAllowances";
import { FetchAllowancesParams, fetchAllowances, fetchAllowancesWithPagination } from "./fetchAllowances";
import { FullAllowanceCheckParams, fullAllowanceCheck } from "./fullAllowanceCheck";
import {
  GrantAllowanceParams,
  PutMintAllowancesOnChainParams,
  ensureQuantityCanBeMinted,
  grantAllowance
} from "./grantAllowance";
import { AllowanceType, refreshAllowances } from "./refreshAllowances";
import { useAllowances } from "./useAllowances";
import { verifyAndUseAllowances } from "./verifyAndUseAllowances";

export {
  InsufficientAllowanceError,
  AllowanceUsersMismatchError,
  DuplicateUserError,
  DuplicateAllowanceError,
  InsufficientTokenBalanceError,
  BalanceNotFoundError,
  InvalidMintError,
  GrantAllowanceFailedError,
  InvalidTokenOwnerError,
  MintCapacityExceededError,
  TotalSupplyExceededError,
  UnauthorizedAllowanceRefreshError,
  checkAllowances,
  useAllowances,
  fetchAllowances,
  fetchAllowancesWithPagination,
  FetchAllowancesParams,
  fullAllowanceCheck,
  FullAllowanceCheckParams,
  refreshAllowances,
  AllowanceType,
  grantAllowance,
  GrantAllowanceParams,
  PutMintAllowancesOnChainParams,
  deleteAllowances,
  DeleteAllowancesParams,
  DeleteOneAllowanceParams,
  ensureQuantityCanBeMinted,
  verifyAndUseAllowances
};

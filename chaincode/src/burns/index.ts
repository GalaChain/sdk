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
  BurnTokensFailedError,
  InsufficientBalanceError,
  InsufficientBurnAllowanceError,
  NftMultipleBurnNotAllowedError,
  UseAllowancesFailedError
} from "./BurnError";
import { BurnsTokensParams, burnTokens } from "./burnTokens";
import { FetchBurnCounterParams, FetchBurnParams, fetchBurns, fetchKnownBurnCount } from "./fetchBurns";

export {
  burnTokens,
  BurnsTokensParams,
  fetchBurns,
  FetchBurnParams,
  fetchKnownBurnCount,
  FetchBurnCounterParams,
  BurnTokensFailedError,
  InsufficientBurnAllowanceError,
  UseAllowancesFailedError,
  InsufficientBalanceError,
  NftMultipleBurnNotAllowedError
};

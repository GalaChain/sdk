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
  ChainError,
  ErrorCode,
  FeePendingBalance,
  FeePendingBalanceKeyValueResult,
  FetchFeePendingBalancesResDto,
  NotFoundError
} from "@gala-chain/api";
import { GalaChainContext } from "../types";
import { getObjectsByPartialCompositeKeyWithPagination, takeUntilUndefined } from "../utils";
import { plainToInstance } from "class-transformer";

export interface FetchFeePendingBalancesParams {
  owner?: string;
  bookmark?: string;
  limit?: number;
}

export async function fetchFeePendingBalances(
  ctx: GalaChainContext,
  data: FetchFeePendingBalancesParams
): Promise<FetchFeePendingBalancesResDto> {
  const queryParams: Array<string> = takeUntilUndefined(data.owner);

  const lookup = await getObjectsByPartialCompositeKeyWithPagination(
    ctx,
    FeePendingBalance.INDEX_KEY,
    queryParams,
    FeePendingBalance,
    data.bookmark,
    data.limit
  ).catch((e) => {
    throw ChainError.map(e, ErrorCode.NOT_FOUND, new NotFoundError(ctx.callingUser));
  });

  const response = new FetchFeePendingBalancesResDto();
  response.results = lookup.results.map((result) => {
    return plainToInstance(FeePendingBalanceKeyValueResult, {
      key: result.getCompositeKey(),
      value: result
    });
  });
  response.nextPageBookmark = lookup.metadata.bookmark;

  return response;
}

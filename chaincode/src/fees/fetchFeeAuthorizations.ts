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
  FeeAuthorization,
  FetchFeeAuthorizationsResDto,
  NotFoundError
} from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { getObjectsByPartialCompositeKeyWithPagination, takeUntilUndefined } from "../utils";

export interface FetchFeeAuthorizationsParams {
  authority?: string;
  year?: string;
  month?: string;
  day?: string;
  hours?: string;
  minutes?: string;
  feeCode?: string;
  txId?: string;
  bookmark?: string;
  limit?: number;
}

export async function fetchFeeAuthorizations(
  ctx: GalaChainContext,
  data: FetchFeeAuthorizationsParams
): Promise<FetchFeeAuthorizationsResDto> {
  const queryParams: Array<string> = takeUntilUndefined(
    data.authority,
    data.year,
    data.month,
    data.day,
    data.hours,
    data.minutes,
    data.feeCode,
    data.txId
  );

  const lookup = await getObjectsByPartialCompositeKeyWithPagination(
    ctx,
    FeeAuthorization.INDEX_KEY,
    queryParams,
    FeeAuthorization,
    data.bookmark,
    data.limit
  ).catch((e) => {
    throw ChainError.map(e, ErrorCode.NOT_FOUND, new NotFoundError(ctx.callingUser));
  });

  const response = new FetchFeeAuthorizationsResDto();
  response.results = lookup.results;
  response.nextPageBookmark = lookup.metadata.bookmark;

  return response;
}

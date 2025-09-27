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
import { FeeAuthorization, FetchFeeAuthorizationsResDto } from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { getObjectsByPartialCompositeKeyWithPagination, takeUntilUndefined } from "../utils";

/**
 * Typed arguments to the `fetchFeeAuthorizations()` function.
 * All parameters are optional; however care should be taken to provide
 * chain keys in order of specificity. Refer to the `FeeAuthorization`
 * class definition for details on the order of `ChainKey`s.
 * Supports pagination -
 * the optional bookmark and limit variables control the starting chainkey and size of the
 * returned page, respectively.
 */

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

/**
 * Fetch `FeeAuthorization` entries previously written on-chain. `FeeAuthorization`
 * entries represent a burn of `$GALA` initiated by a specific user,
 *  intended for use as a cross-channel fee payment. Supports pagination.
 *
 * @param ctx
 * @param data
 * @returns
 */
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
  );

  const response = new FetchFeeAuthorizationsResDto();
  response.results = lookup.results;
  response.nextPageBookmark = lookup.metadata.bookmark;

  return response;
}

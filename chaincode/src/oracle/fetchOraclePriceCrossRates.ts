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
import { FetchOraclePriceCrossRateAssertionsResponse, OraclePriceCrossRateAssertion } from "@gala-chain/api";
import { plainToInstance } from "class-transformer";

import { GalaChainContext } from "../types";
import { getObjectsByPartialCompositeKeyWithPagination, takeUntilUndefined } from "../utils";

export interface IFetchOraclePriceCrossRateAssertions {
  name?: string | undefined;
  bookmark?: string | undefined;
  limit?: number | undefined;
}

export async function fetchOraclePriceCrossRates(
  ctx: GalaChainContext,
  data: IFetchOraclePriceCrossRateAssertions
) {
  const queryParameters = takeUntilUndefined(data.name);

  const query = await getObjectsByPartialCompositeKeyWithPagination(
    ctx,
    OraclePriceCrossRateAssertion.INDEX_KEY,
    queryParameters,
    OraclePriceCrossRateAssertion,
    data.bookmark,
    data.limit
  );

  const response = plainToInstance(FetchOraclePriceCrossRateAssertionsResponse, {
    results: query.results,
    bookmark: query.metadata.bookmark
  });

  return response;
}

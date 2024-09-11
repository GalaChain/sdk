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
import { GalaChainContext } from "../types";
import {
  getObjectsByPartialCompositeKeyWithPagination,
  takeUntilUndefined
} from "../utils";
import { plainToInstance } from "class-transformer";

import { FetchOraclePriceAssertionsResponse, OraclePriceAssertion } from "@gala-chain/api";

export interface IFetchOraclePriceAssertions {
  oracle?: string | undefined;
  identity?: string | undefined;
  txid?: string | undefined;
  bookmark?: string | undefined;
  limit?: number | undefined;
}

export async function fetchOraclePriceAssertions(ctx: GalaChainContext, data: IFetchOraclePriceAssertions) {
  const queryParameters = takeUntilUndefined(data.oracle, data.identity, data.txid);

  const query = await getObjectsByPartialCompositeKeyWithPagination(
    ctx,
    OraclePriceAssertion.INDEX_KEY,
    queryParameters,
    OraclePriceAssertion,
    data.bookmark,
    data.limit
  );

  const response = plainToInstance(FetchOraclePriceAssertionsResponse, {
    results: query.results,
    bookmark: query.metadata.bookmark
  });

  return response;
}

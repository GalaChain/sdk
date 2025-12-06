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
import { FetchOracleDefinitionsResponse, OracleDefinition } from "@gala-chain/api";
import { plainToInstance } from "class-transformer";

import { GalaChainContext } from "../types";
import { getObjectsByPartialCompositeKeyWithPagination, takeUntilUndefined } from "../utils";

export interface IFetchOracleDefinitions {
  name?: string | undefined;
  bookmark?: string | undefined;
  limit?: number | undefined;
}

export async function fetchOracleDefinitions(ctx: GalaChainContext, data: IFetchOracleDefinitions) {
  const queryParameters = takeUntilUndefined(data.name);

  const query = await getObjectsByPartialCompositeKeyWithPagination(
    ctx,
    OracleDefinition.INDEX_KEY,
    queryParameters,
    OracleDefinition,
    data.bookmark,
    data.limit ?? FetchOracleDefinitionsResponse.DEFAULT_LIMIT
  );

  const response = plainToInstance(FetchOracleDefinitionsResponse, {
    results: query.results,
    bookmark: query.metadata.bookmark
  });

  return response;
}

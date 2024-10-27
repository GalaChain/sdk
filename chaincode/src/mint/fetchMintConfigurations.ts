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
    FetchTokenMintConfigurationsDto,
    FetchTokenMintConfigurationsResponse,
    TokenMintConfiguration,
    ValidationFailedError,
    createValidDTO
  } from "@gala-chain/api";
  import { plainToInstance } from "class-transformer";
  
  import { GalaChainContext, createValidChainObject } from "../types";
  import { getObjectsByPartialCompositeKeyWithPagination, takeUntilUndefined } from "../utils";
  
  export interface IFetchTokenMintConfigurations {
    collection?: string | undefined;
    category?: string | undefined;
    type?: string | undefined;
    additionalKey?: string | undefined;
    bookmark?: string | undefined;
    limit?: number | undefined;
  }
  
  export async function fetchTokenMintConfigurations(
    ctx: GalaChainContext,
    data: IFetchTokenMintConfigurations
  ) {
    const { collection, category, type, additionalKey, bookmark, limit } = data;
    const queryParameters = takeUntilUndefined(collection, category, type, additionalKey);
  
    if (limit && limit > FetchTokenMintConfigurationsDto.MAX_LIMIT) {
      throw new ValidationFailedError(
        `${FetchTokenMintConfigurationsDto.MAX_LIMIT} is the maximum number of results ` +
          `per page permitted by this contract method, received request for ${limit} results.`
      );
    }
    const query = await getObjectsByPartialCompositeKeyWithPagination(
      ctx,
      TokenMintConfiguration.INDEX_KEY,
      queryParameters,
      TokenMintConfiguration,
      bookmark,
      limit ?? FetchTokenMintConfigurationsDto.DEFAULT_LIMIT
    );
  
    const response = await createValidDTO(FetchTokenMintConfigurationsResponse, {
      results: query.results,
      bookmark: query.metadata.bookmark
    });
  
    return response;
  }
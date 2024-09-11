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
  ChainObject,
  FeeThresholdUses,
  FeeThresholdUsesKeyValueResult,
  FetchFeeThresholdUsesResDto,
  FetchFeeThresholdUsesWithPaginationResponse
} from "@gala-chain/api";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import { GalaChainContext } from "../types";
import { getObjectByKey, getObjectsByPartialCompositeKeyWithPagination, takeUntilUndefined } from "../utils";

export interface FetchFeeThresholdUsesParams {
  feeCode: string;
  user: string;
}

export async function fetchFeeThresholdUses(
  ctx: GalaChainContext,
  data: FetchFeeThresholdUsesParams
): Promise<FetchFeeThresholdUsesResDto> {
  const useThresholdChainKey = ChainObject.getCompositeKeyFromParts(FeeThresholdUses.INDEX_KEY, [
    data.feeCode,
    data.user
  ]);

  const existingUseThreshold = await getObjectByKey(ctx, FeeThresholdUses, useThresholdChainKey).catch(
    () => undefined
  );

  const userFeeThresholdUses =
    existingUseThreshold ??
    plainToInstance(FeeThresholdUses, {
      feeCode: data.feeCode,
      user: data.user,
      cumulativeUses: new BigNumber("0"),
      cumulativeFeeQuantity: new BigNumber("0")
    });

  const response = new FetchFeeThresholdUsesResDto();
  response.feeCode = userFeeThresholdUses.feeCode;
  response.user = userFeeThresholdUses.user;
  response.cumulativeUses = userFeeThresholdUses.cumulativeUses;
  response.cumulativeFeeQuantity = userFeeThresholdUses.cumulativeFeeQuantity;

  return response;
}

export interface FetchFeeThresholdUsesWithPaginationParams {
  feeCode?: string | undefined;
  bookmark?: string | undefined;
  limit?: number | undefined;
}

export async function fetchFeeThresholdUsesWithPagination(
  ctx: GalaChainContext,
  data: FetchFeeThresholdUsesWithPaginationParams
): Promise<FetchFeeThresholdUsesWithPaginationResponse> {
  const queryParams: string[] = takeUntilUndefined(data.feeCode);

  const getObjectsResponse = await getObjectsByPartialCompositeKeyWithPagination(
    ctx,
    FeeThresholdUses.INDEX_KEY,
    queryParams,
    FeeThresholdUses,
    data.bookmark,
    data.limit
  );

  const response = new FetchFeeThresholdUsesWithPaginationResponse();
  response.nextPageBookmark = getObjectsResponse.metadata.bookmark;
  response.results = getObjectsResponse.results.map((result: FeeThresholdUses) => {
    return plainToInstance(FeeThresholdUsesKeyValueResult, {
      key: result.getCompositeKey(),
      value: result
    });
  });

  return response;
}

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
  FeeChannelPaymentKeyValueResult,
  FeeChannelPaymentReceipt,
  FetchFeeChannelPaymentsResDto,
  NotFoundError
} from "@gala-chain/api";
import { plainToInstance } from "class-transformer";

import { GalaChainContext } from "../types";
import { getObjectsByPartialCompositeKeyWithPagination, takeUntilUndefined } from "../utils";

export interface FetchFeeChannelPaymentReceiptsParams {
  year?: string;
  month?: string;
  day?: string;
  hours?: string;
  minutes?: string;
  feeCode?: string;
  paidByUser?: string;
  txId?: string;
  bookmark?: string;
  limit?: number;
}

export async function fetchFeePayments(
  ctx: GalaChainContext,
  data: FetchFeeChannelPaymentReceiptsParams
): Promise<FetchFeeChannelPaymentsResDto> {
  const queryParams: Array<string> = takeUntilUndefined(
    data.year,
    data.month,
    data.day,
    data.hours,
    data.minutes,
    data.feeCode,
    data.paidByUser,
    data.txId
  );

  const lookup = await getObjectsByPartialCompositeKeyWithPagination(
    ctx,
    FeeChannelPaymentReceipt.INDEX_KEY,
    queryParams,
    FeeChannelPaymentReceipt,
    data.bookmark,
    data.limit
  ).catch((e) => {
    throw ChainError.map(e, ErrorCode.NOT_FOUND, new NotFoundError(ctx.callingUser));
  });

  const response = new FetchFeeChannelPaymentsResDto();
  response.results = lookup.results.map((result) => {
    return plainToInstance(FeeChannelPaymentKeyValueResult, {
      key: result.getCompositeKey(),
      value: result
    });
  });
  response.nextPageBookmark = lookup.metadata.bookmark;

  return response;
}

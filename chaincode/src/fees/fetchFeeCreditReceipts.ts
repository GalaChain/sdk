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
  FeeBalanceCreditReceipt,
  FeeCreditReceiptKeyValueResult,
  FetchFeeCreditReceiptsResponse,
  NotFoundError
} from "@gala-chain/api";
import { plainToInstance } from "class-transformer";

import { GalaChainContext } from "../types";
import { getObjectsByPartialCompositeKeyWithPagination, takeUntilUndefined } from "../utils";

/**
 * Typed arguments to the `fetchFeeCreditReceipts() function.
 * All parameters are optional; however care should be take to provide
 * chain keys in order of specificity. Refer to the `FeeBalanceCreditReceipt`
 * class definition for details on the order of `ChainKey`s.
 * Supports pagination -
 * the optional `bookmark` and `limit` variables control the starting
 * index key and size of the returned page, respectively.
 */
export interface FetchFeeCreditReceiptsParams {
  year?: string;
  month?: string;
  day?: string;
  hours?: string;
  minutes?: string;
  feeCode?: string;
  creditToUser?: string;
  txId?: string;
  bookmark?: string;
  limit?: number;
}

/**
 * Read `FeeBalanceCreditReceipt` entries from the ledger.
 * `FeeBalanceCreditReceipt` entries represent a `FeePendingBalance`
 * that was unused, settled, and designated to be credited back to the
 * end user. Similar to a "Pending authorization" or "Pending hold" that
 * drops off a credit card statement because it was never settled, these
 * credit receipts designate a refund or credit-back of prior `FeeAuthorization`s
 * where $GALA was  burned on Gala's asset channel to cover cross channel fees,
 * but the corresponding  fee was less than expected or never settled.
 * Refer to the `FeeBalanceCreditReceipt` class definition for further
 * details.
 * Supports pagionation -
 * the optional bookmark and limit variables control the starting index key and size of the
 * returned page, respectively.
 *
 * @param ctx
 * @param data
 * @returns
 */
export async function fetchFeeCreditReceipts(
  ctx: GalaChainContext,
  data: FetchFeeCreditReceiptsParams
): Promise<FetchFeeCreditReceiptsResponse> {
  const queryParams: Array<string> = takeUntilUndefined(
    data.year,
    data.month,
    data.day,
    data.hours,
    data.minutes,
    data.feeCode,
    data.creditToUser,
    data.txId
  );

  const lookup = await getObjectsByPartialCompositeKeyWithPagination(
    ctx,
    FeeBalanceCreditReceipt.INDEX_KEY,
    queryParams,
    FeeBalanceCreditReceipt,
    data.bookmark,
    data.limit
  ).catch((e) => {
    throw ChainError.map(e, ErrorCode.NOT_FOUND, new NotFoundError(ctx.callingUser));
  });

  const response = new FetchFeeCreditReceiptsResponse();
  response.results = lookup.results.map((result) => {
    return plainToInstance(FeeCreditReceiptKeyValueResult, {
      key: result.getCompositeKey(),
      value: result
    });
  });
  response.nextPageBookmark = lookup.metadata.bookmark;

  return response;
}

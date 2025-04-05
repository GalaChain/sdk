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

import { ChainError, ErrorCode, NftBatchLimit, NotFoundError } from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { getObjectByKey } from "../utils";

export async function fetchBatchLimit(ctx: GalaChainContext): Promise<NftBatchLimit> {
  const key = ctx.stub.createCompositeKey(NftBatchLimit.INDEX_KEY, []);

  const nftBatchLimit = await getObjectByKey(ctx, NftBatchLimit, key).catch((e) => {
    const chainError = ChainError.from(e);
    if (chainError.matches(ErrorCode.NOT_FOUND)) {
      throw new NotFoundError("Batch Limit Not Found.");
    } else {
      throw chainError;
    }
  });

  return nftBatchLimit;
}

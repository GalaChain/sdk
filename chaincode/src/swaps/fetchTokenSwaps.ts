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
import { TokenSwapRequest } from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { getObjectsByPartialCompositeKey, takeUntilUndefined } from "../utils";

export async function fetchTokenSwaps(
  ctx: GalaChainContext,
  created: number | undefined
): Promise<TokenSwapRequest[]> {
  const createdKey = created && isFinite(created) ? `${created}` : undefined;
  const queryParams = takeUntilUndefined(createdKey);

  const results = await getObjectsByPartialCompositeKey(
    ctx,
    TokenSwapRequest.INDEX_KEY,
    queryParams,
    TokenSwapRequest
  );

  return results;
}

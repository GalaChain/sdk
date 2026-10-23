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
import { ChainObject } from "@gala-chain/api";

import { GalaChainContext } from "../types";

const MAX_RECORD_ORDINAL = 1000;

export async function reserveDistinctOrdinal(
  ctx: GalaChainContext,
  record: ChainObject & { requestOrdinal?: string; fillOrdinal?: string },
  ordinalKey: "requestOrdinal" | "fillOrdinal"
): Promise<void> {
  const writes = ctx.stub.getWrites();
  let ordinal = 0;

  while (ordinal <= MAX_RECORD_ORDINAL) {
    if (ordinal > 0) {
      record[ordinalKey] = String(ordinal);
    }

    if (!(record.getCompositeKey() in writes)) {
      return;
    }

    ordinal += 1;
  }

  throw new Error(`Could not allocate a distinct key for ${record.getCompositeKey()}`);
}

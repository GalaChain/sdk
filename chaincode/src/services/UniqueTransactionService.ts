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
import { ChainError, ErrorCode, RuntimeError } from "@gala-chain/api";
import { Context } from "fabric-contract-api";

import { GalaChainContext } from "../types";
import { getObjectByKey, putChainObject } from "../utils/state";
import { UniqueTransaction } from "./UniqueTransaction";
import { UniqueTransactionConflictError } from "./UniqueTransactionError";

export class MissingUniqueKeyError extends RuntimeError {
  constructor() {
    super("Missing uniqueKey in transaction dto");
  }
}

export class UniqueTransactionService {
  private static UT_INDEX_KEY = UniqueTransaction.INDEX_KEY;

  private static getUniqueTransactionKey(ctx: Context, uniqueKey: string): string {
    return ctx.stub.createCompositeKey(UniqueTransactionService.UT_INDEX_KEY, [uniqueKey]);
  }

  private static async putUniqueTransaction(ctx: GalaChainContext, uniqueKey: string): Promise<void> {
    const dto = new UniqueTransaction();
    dto.uniqueKey = uniqueKey;
    dto.created = ctx.txUnixTime;
    dto.transactionId = ctx.stub.getTxID();
    await putChainObject(ctx, dto);
  }

  private static async ensureUniqueKey(ctx: GalaChainContext, uniqueKey: string): Promise<void> {
    const key = UniqueTransactionService.getUniqueTransactionKey(ctx, uniqueKey);
    await getObjectByKey(ctx, UniqueTransaction, key)
      .then((ut) => {
        throw new UniqueTransactionConflictError(uniqueKey, ut.transactionId);
      })
      .catch((e) => ChainError.ignore(e, ErrorCode.NOT_FOUND));
  }

  public static async ensureUniqueTransaction(ctx: GalaChainContext, uniqueKey: string): Promise<void> {
    await UniqueTransactionService.ensureUniqueKey(ctx, uniqueKey);
    await UniqueTransactionService.putUniqueTransaction(ctx, uniqueKey);
  }
}

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
import { ChainError, ErrorCode } from "@gala-chain/api";
import { Context } from "fabric-contract-api";

import { getCaIdentityAlias } from "../contracts/getCaIdentityAlias";
import { GalaChainContext, GalaChainStub } from "../types";
import { getObjectByKey, putChainObject } from "../utils/state";
import { CallerUniqueTransaction, UniqueTransaction } from "./UniqueTransaction";
import { UniqueTransactionConflictError } from "./UniqueTransactionError";

export class UniqueTransactionService {
  private static UT_INDEX_KEY = UniqueTransaction.INDEX_KEY;

  private static replayCaller(ctx: GalaChainContext): string {
    try {
      return ctx.callingUser;
    } catch {
      return getCaIdentityAlias(ctx);
    }
  }

  private static getUniqueTransactionKey(ctx: Context, parts: string[]): string {
    return ctx.stub.createCompositeKey(UniqueTransactionService.UT_INDEX_KEY, parts);
  }

  private static async putUniqueTransaction(
    ctx: GalaChainContext,
    uniqueKey: string,
    caller: string | undefined
  ): Promise<void> {
    const dto = caller === undefined ? new UniqueTransaction() : new CallerUniqueTransaction();
    dto.uniqueKey = uniqueKey;
    dto.created = ctx.txUnixTime;
    dto.transactionId = ctx.stub.getTxID();
    if (dto instanceof CallerUniqueTransaction && caller !== undefined) {
      dto.caller = caller;
    }
    await putChainObject(ctx, dto);
  }

  private static async ensureUniqueKey(
    ctx: GalaChainContext,
    uniqueKey: string,
    parts: string[]
  ): Promise<void> {
    const key = UniqueTransactionService.getUniqueTransactionKey(ctx, parts);
    const lookupClass = parts.length === 1 ? UniqueTransaction : CallerUniqueTransaction;
    await getObjectByKey(ctx, lookupClass, key)
      .then((ut) => {
        throw new UniqueTransactionConflictError(uniqueKey, ut.transactionId);
      })
      .catch((e) => ChainError.recover(e, ErrorCode.NOT_FOUND));
  }

  public static async ensureUniqueTransaction(
    ctx: GalaChainContext,
    uniqueKey: string,
    options?: { global?: boolean }
  ): Promise<void> {
    const parts = options?.global ? [uniqueKey] : [UniqueTransactionService.replayCaller(ctx), uniqueKey];
    await UniqueTransactionService.ensureUniqueKey(ctx, uniqueKey, parts);
    await UniqueTransactionService.putUniqueTransaction(
      ctx,
      uniqueKey,
      options?.global ? undefined : parts[0]
    );
  }

  public static isUniqueTransactionKey(key: string): boolean {
    return key.startsWith(`\u0000${UniqueTransactionService.UT_INDEX_KEY}\u0000`);
  }

  public static pickUniqueTransactionWrites(writes: Record<string, Uint8Array>): Record<string, Uint8Array> {
    return Object.fromEntries(
      Object.entries(writes).filter(([key]) => UniqueTransactionService.isUniqueTransactionKey(key))
    );
  }

  /**
   * Copy UNTX writes from a sandbox onto the parent context so a failed inner
   * operation still consumes its uniqueKey.
   */
  public static copyUniqueTransactionWrites(from: GalaChainContext, to: GalaChainContext): void {
    const fromStub = from.stub as unknown as GalaChainStub;
    const toStub = to.stub as unknown as GalaChainStub;
    const uniqueKeyWrites = UniqueTransactionService.pickUniqueTransactionWrites(fromStub.getWrites());
    if (Object.keys(uniqueKeyWrites).length === 0) {
      return;
    }
    toStub.setWrites({ ...toStub.getWrites(), ...uniqueKeyWrites });
  }
}

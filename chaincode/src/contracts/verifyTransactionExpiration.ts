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
import { ChainCallDTO, NoLongerAvailableError, ValidationFailedError } from "@gala-chain/api";

import { GalaChainContext } from "../types";

const EXPIRATION_LIMIT_MS = 1000 * 60 * 60 * 24 * 365; // one year

export class TransactionExpiredError extends NoLongerAvailableError {
  constructor(timestap: number) {
    super(`Transaction expired at ${new Date(timestap).toISOString()}`);
  }
}

export class TransactionExpirationTooFarError extends ValidationFailedError {
  constructor(timestap: number) {
    super(`Dto expiration is set too far (over a year) in the future (${new Date(timestap).toISOString()}).`);
  }
}

export function verifyTransactionExpiration(ctx: GalaChainContext, dto: ChainCallDTO | undefined): void {
  if (!dto?.transactionExpiresAt) {
    return;
  }

  const msLeft = dto.transactionExpiresAt - ctx.txUnixTime;

  if (msLeft < 0) {
    throw new TransactionExpiredError(dto.transactionExpiresAt);
  }

  if (msLeft > EXPIRATION_LIMIT_MS) {
    throw new TransactionExpirationTooFarError(dto.transactionExpiresAt);
  }
}

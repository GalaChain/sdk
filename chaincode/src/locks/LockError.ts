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
import { DefaultError, ForbiddenError, NotFoundError, ValidationFailedError } from "@gala-chain/api";
import { BigNumber } from "bignumber.js";

export class UnlockForbiddenUserError extends ForbiddenError {
  constructor(user: string, tokenInstanceKey: string) {
    const message = `User ${user} lacks authority to unlock token ${tokenInstanceKey}`;
    super(message, { user, tokenInstanceKey });
  }
}

export class NftInvalidQuantityLockError extends ValidationFailedError {
  constructor(quantity: BigNumber, tokenInstanceKey: string) {
    super(`Provided non-1 quantity (${quantity.toFixed()}) for lock for NFT token ${tokenInstanceKey}`, {
      quantity,
      tokenInstanceKey
    });
  }
}

export class InvalidExpirationError extends ValidationFailedError {
  constructor(expires: number) {
    super(`Expiration ${expires} cannot be earlier than now.`, { expires });
  }
}

export class LockTokenFailedError extends DefaultError {
  constructor(message: string, payload: Record<string, unknown> | undefined) {
    super(`LockToken failed: ${message}`, payload);
  }
}

export class MissingLockError extends NotFoundError {
  constructor(tokenInstance: BigNumber, name?: string) {
    super(`No lock found for instance ${tokenInstance}, name ${name}`, { tokenInstance, name });
  }
}

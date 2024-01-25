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
import { ForbiddenError, NotFoundError, ValidationFailedError } from "@gala-chain/api";
import { BigNumber } from "bignumber.js";

export class LockNotFoundError extends NotFoundError {
  constructor(tokenInstance: BigNumber) {
    super(`No lock found for instance ${tokenInstance}`, { tokenInstance });
  }
}

export class NftInvalidQuantityUseError extends ValidationFailedError {
  constructor(quantity: BigNumber, tokenInstanceKey: string) {
    super(`Provided non-1 quantity (${quantity.toFixed()}) for use for NFT token ${tokenInstanceKey}`, {
      quantity,
      tokenInstanceKey
    });
  }
}

export class ReleaseForbiddenUserError extends ForbiddenError {
  constructor(user: string, tokenInstanceKey: string) {
    super(`${user} lacks authority to release token ${tokenInstanceKey}`, {
      user,
      tokenInstanceKey
    });
  }
}

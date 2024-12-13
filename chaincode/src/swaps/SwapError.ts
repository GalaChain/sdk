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
import { DefaultError, ValidationFailedError } from "@gala-chain/api";
import { TokenHold } from "@gala-chain/api";
import { BigNumber } from "bignumber.js";

export class InvalidDecimalError extends ValidationFailedError {
  constructor(quantity: BigNumber, decimals: number) {
    super(`Quantity: ${quantity} has more than ${decimals} decimal places.`, { quantity, decimals });
  }
}

export class SwapDtoValidationError extends ValidationFailedError {
  constructor(dtoName: string, errors: string[]) {
    super(`${dtoName} validation failed: ${errors.join(". ")}`, {
      dtoName,
      errors
    });
  }
}

export class TransferLockedTokenError extends ValidationFailedError {
  constructor(lockedHolds: TokenHold[] | undefined) {
    super(`Unable to transfer locked token, fromPersonLockedHolds: ${JSON.stringify(lockedHolds)}`, {
      lockedHolds
    });
  }
}

export class SwapTokenFailedError extends DefaultError {
  constructor(message: string, payload: Record<string, unknown> | undefined) {
    super(`SwapToken failed: ${message}$`, payload);
  }
}

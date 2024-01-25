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
import { ConflictError, ForbiddenError, NotFoundError, ValidationFailedError } from "@gala-chain/api";
import { AllowanceType } from "@gala-chain/api";
import { BigNumber } from "bignumber.js";

export class NftDecimalError extends ValidationFailedError {
  constructor(decimals: number) {
    super(`Decimals for NFT should be 0 (got ${decimals})`, { decimals });
  }
}

export class TokenAlreadyExistsError extends ConflictError {
  constructor(tokenClassKey: string) {
    super(`A token with ID ${tokenClassKey} already exists`, { tokenClassKey });
  }
}

export class TokenClassNotFoundError extends NotFoundError {
  constructor(tokenClassKey: string) {
    super(`Token class not found: ${tokenClassKey}`, { tokenClassKey });
  }
}

export class NotATokenAuthorityError extends ForbiddenError {
  constructor(user: string, tokenClassKey: string, authorities: string[]) {
    super(
      `User ${user} is not an authority for Token ${tokenClassKey}. ` +
        `Authorities: ${authorities.join(", ")}`,
      { user, tokenClassKey, authorities }
    );
  }
}

export class NftInstanceAllowanceMismatchError extends ValidationFailedError {
  constructor(instance: BigNumber, allowanceType: AllowanceType) {
    super(
      `For NFTs Mint Allowances require an instance id of zero. ` +
        `All other allowance types require a non-zero instance id. ` +
        `Instance id: (${instance}). AllowanceType: ${allowanceType}.`,
      { instance }
    );
  }
}

export class InvalidDecimalError extends ValidationFailedError {
  constructor(quantity: BigNumber, decimals: number) {
    super(`Quantity: ${quantity} has more than ${decimals} decimal places.`, { quantity, decimals });
  }
}

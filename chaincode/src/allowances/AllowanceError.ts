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
import {
  AllowanceType,
  ConflictError,
  DefaultError,
  ForbiddenError,
  NotFoundError,
  TokenAllowance,
  TokenInstanceKey,
  ValidationFailedError
} from "@gala-chain/api";
import { BigNumber } from "bignumber.js";

export class BalanceNotFoundError extends NotFoundError {
  constructor(user: string) {
    super(`No balance found for user id ${user}`, { user });
  }
}

export class DuplicateUserError extends ValidationFailedError {
  constructor(users: string[]) {
    super(
      `dto.quantities must contain a unique set of users. Users cannot be duplicated in a single GrantAllowance call: ${users.join(
        ", "
      )}`,
      { users }
    );
  }
}

export class InvalidTokenOwnerError extends ValidationFailedError {
  constructor(
    callingUser: string,
    tokenInstanceKey: string,
    allowanceType: string,
    owner: string | undefined
  ) {
    super(
      `User ${callingUser} does not own the token ${tokenInstanceKey} owned by ${owner} and so cannot grant a ${allowanceType} allowance.`,
      { callingUser, tokenInstanceKey, allowanceType, owner }
    );
  }
}

export class InsufficientTokenBalanceError extends ValidationFailedError {
  constructor(
    callingUser: string,
    tokenInstanceKey: string,
    allowanceType: string,
    userBalance: BigNumber,
    allowanceQuantity: BigNumber,
    lockedQuantity: BigNumber
  ) {
    super(
      `User ${callingUser} has insufficient total balance ${userBalance} minus locked balance ${lockedQuantity} for token ` +
        `${tokenInstanceKey} to grant ${allowanceType} allowance for quantity: ${allowanceQuantity}.`,
      { callingUser, tokenInstanceKey, allowanceType, userBalance, allowanceQuantity }
    );
  }
}

export class DuplicateAllowanceError extends ConflictError {
  constructor(allowanceKey: string, payload: Record<string, unknown>) {
    const msg =
      `An unused allowance exists for the provided key: ${allowanceKey}. ` +
      `Use the existing allowance, or update its properties (if necessary) with ${`RefreshAllowances`}`;

    super(msg, payload);
  }
}

export class InvalidMintError extends ValidationFailedError {
  constructor(msg: string) {
    super(msg);
  }
}

export class MintCapacityExceededError extends ValidationFailedError {
  constructor(tokenClassKey: string, maxCapacity: BigNumber, quantity: BigNumber) {
    super(
      `Mint would exceed token maxCapacity ${tokenClassKey}. Max capacity: ${maxCapacity.toFixed()}. Mint quantity: ${quantity.toFixed()}.`,
      { tokenClassKey, maxCapacity, quantity }
    );
  }
}

export class TotalSupplyExceededError extends ValidationFailedError {
  constructor(tokenClassKey: string, maxSupply: BigNumber, quantity: BigNumber) {
    super(
      `Mint would exceed token maxSupply ${tokenClassKey}. Max Supply: ${maxSupply.toFixed()}. Mint quantity: ${quantity.toFixed()}.`,
      { tokenClassKey, maxSupply, quantity }
    );
  }
}

export class UnauthorizedAllowanceRefreshError extends ForbiddenError {
  constructor(user: string, grantedBy: string) {
    super(`User ${user} attempted to refresh an allowance granted by another user: ${grantedBy}`, {
      user,
      grantedBy
    });
  }
}

export class InsufficientAllowanceError extends ValidationFailedError {
  constructor(
    user: string,
    allowedQuantity: BigNumber,
    allowanceType: AllowanceType,
    quantity: BigNumber,
    tokenInstanceKey: TokenInstanceKey,
    grantedBy: string
  ) {
    const action = AllowanceType[allowanceType];
    const message = `${user} does not have sufficient allowances (${allowedQuantity.toFixed()}) to ${action} ${quantity.toFixed()} of token ${tokenInstanceKey}, grantedBy: ${grantedBy}`;
    super(message, {
      user,
      allowedQuantity: allowedQuantity.toFixed(),
      quantity: quantity.toFixed(),
      tokenInstanceKey: tokenInstanceKey.toStringKey(),
      grantedBy
    });
  }
}

export class GrantAllowanceFailedError extends DefaultError {
  constructor(errors: Array<{ message: string; payload: Record<string, unknown> }>) {
    super(
      `GrantAllowanceByPartialKey failed for ${errors.length} allowances: ${errors
        .map((e) => e.message)
        .join("; ")}`,
      { errorPayloads: errors.map((e) => e.payload) }
    );
  }
}

export class AllowanceUsersMismatchError extends ValidationFailedError {
  constructor(allowance: TokenAllowance, expectedGrantedBy: string, expectedGrantedTo: string) {
    const allowanceKey = allowance.getCompositeKey();
    const message = `Allowance users mismatch. Allowance ${allowanceKey} was granted by ${allowance.grantedBy} (expected: ${expectedGrantedBy}), and granted to ${allowance.grantedTo} (expected: ${expectedGrantedTo})`;
    super(message, {
      allowanceKey,
      grantedBy: allowance.grantedBy,
      grantedTo: allowance.grantedTo,
      expectedGrantedBy,
      expectedGrantedTo
    });
  }
}

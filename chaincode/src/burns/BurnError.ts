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
import { AllowanceType, DefaultError, TokenInstanceKey, ValidationFailedError } from "@gala-chain/api";
import { BigNumber } from "bignumber.js";

import { InsufficientAllowanceError } from "../allowances/AllowanceError";

export class InsufficientBalanceError extends ValidationFailedError {
  constructor(owner: string, spendableQuantity: BigNumber, quantity: BigNumber, tokenInstanceKey: string) {
    super(
      `${owner} does not have sufficient balance (${spendableQuantity.toFixed()}) ` +
        `to Burn ${quantity.toFixed()} of token ${tokenInstanceKey}`,
      { owner, spendableQuantity, quantity, tokenInstanceKey }
    );
  }
}

export class NftMultipleBurnNotAllowedError extends ValidationFailedError {
  constructor(tokenInstanceKey: string) {
    super(`Cannot burn multiple NFT instances at once: ${tokenInstanceKey}`, { tokenInstanceKey });
  }
}

export class BurnTokensFailedError extends DefaultError {
  constructor(message: string, payload: Record<string, unknown> | undefined) {
    super(`BurnTokens failed: ${message}`, payload);
  }
}

export class InsufficientBurnAllowanceError extends InsufficientAllowanceError {
  constructor(
    user: string,
    allowedQuantity: BigNumber,
    quantity: BigNumber,
    tokenInstanceKey: TokenInstanceKey,
    toPersonKey: string
  ) {
    super(user, allowedQuantity, AllowanceType.Burn, quantity, tokenInstanceKey, toPersonKey);
  }
}

export class UseAllowancesFailedError extends DefaultError {
  constructor(quantity: BigNumber, tokenInstanceKey: string, owner: string) {
    super(
      `UseAllowances failed for action: Burn ${quantity.toFixed()} token ${tokenInstanceKey} for ${owner}`,
      { quantity, tokenInstanceKey, owner }
    );
  }
}

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
import { DefaultError, MintTokenDto, TokenInstanceKey, ValidationFailedError } from "@gala-chain/api";
import { BigNumber } from "bignumber.js";

export class NftMaxMintError extends ValidationFailedError {
  constructor(quantity: BigNumber) {
    super(
      `Quantity provided (${quantity}) exceeds max mint size for NFTs: ${MintTokenDto.MAX_NFT_MINT_SIZE}.`,
      {
        quantity,
        maxMint: MintTokenDto.MAX_NFT_MINT_SIZE
      }
    );
  }
}

export class UseAllowancesFailedError extends DefaultError {
  constructor(quantity: BigNumber, tokenInstanceKey: string, owner: string) {
    super(
      `UseAllowances failed for action: Mint ${quantity.toFixed()} token ${tokenInstanceKey} to ${owner}`,
      { quantity, tokenInstanceKey, owner }
    );
  }
}

export class BatchMintError extends DefaultError {
  constructor(errorMessages: string[]) {
    super(`No token was minted. Errors: ${errorMessages.join("; ")}.`, { errorMessages });
  }
}

export class InsufficientMintAllowanceError extends ValidationFailedError {
  constructor(
    grantedTo: string,
    allowedQuantity: BigNumber,
    quantity: BigNumber,
    tokenInstanceKey: TokenInstanceKey,
    owner: string
  ) {
    const message =
      `${grantedTo} does not have sufficient allowances (${allowedQuantity.toFixed()}) to Mint ${quantity.toFixed()} ` +
      `of token ${tokenInstanceKey}, owner: ${owner}`;
    super(message, {
      grantedTo,
      allowedQuantity: allowedQuantity.toFixed(),
      quantity: quantity.toFixed(),
      tokenInstanceKey: tokenInstanceKey.toStringKey(),
      owner
    });
  }
}

export class MintTokenFailedError extends DefaultError {
  constructor(message: string, payload: Record<string, unknown> | undefined) {
    super(`MintToken failed: ${message}`, payload);
  }
}

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
  AuthorizedOnBehalf,
  ChainError,
  TokenClass,
  TokenInstance,
  TokenInstanceKey,
  TokenInstanceQuantity,
  TokenSwapRequest,
  TokenSwapRequestInstanceOffered,
  TokenSwapRequestInstanceWanted,
  TokenSwapRequestOfferedBy,
  TokenSwapRequestOfferedTo,
  UserAlias,
  asValidUserAlias
} from "@gala-chain/api";
import { BigNumber } from "bignumber.js";
import { plainToInstance } from "class-transformer";

import { verifyAndUseAllowances } from "../allowances";
import { fetchOrCreateBalance } from "../balances";
import { LockTokenFailedError, lockToken } from "../locks";
import { fetchTokenInstances } from "../token";
import { GalaChainContext } from "../types";
import { getObjectByKey, putChainObject } from "../utils";
import { SwapDtoValidationError } from "./SwapError";

function validateTokenSwapQuantity(quantity: BigNumber, tokenClass: TokenClass): Array<string> {
  const validationResults: Array<string> = [];

  const genericErrorMessage = `Token quantity must be a positive integer. ${quantity} is not valid.`;

  if (tokenClass.isNonFungible && (quantity.isLessThan(1) || !quantity.isInteger())) {
    validationResults.push(genericErrorMessage);
    // Must be less than or equal to the token info quantity
  } else if (!tokenClass.isNonFungible && quantity.isLessThan(0)) {
    validationResults.push(`Token quantity must be positive. ${quantity} is not valid.`);
  } else if (tokenClass.isNonFungible && !quantity.isEqualTo(1)) {
    validationResults.push(`cannot swap more than 1 Non Fungible Token Instance. ${quantity} is not valid.`);
  } else if (quantity.isGreaterThan(tokenClass.maxSupply) || quantity.isGreaterThan(tokenClass.maxCapacity)) {
    validationResults.push(`Token quantity must not exceed Token max supply and max capacity`);
  }

  return validationResults;
}

interface RequestTokenSwapParams {
  offeredBy: UserAlias;
  offeredTo?: UserAlias;
  offered: TokenInstanceQuantity[];
  wanted: TokenInstanceQuantity[];
  uses: BigNumber;
  expires: number;
}

export async function requestTokenSwap(
  ctx: GalaChainContext,
  { offeredBy, offeredTo, offered, wanted, uses, expires }: RequestTokenSwapParams
): Promise<TokenSwapRequest> {
  const newSwap = new TokenSwapRequest();
  newSwap.offeredBy = asValidUserAlias(offeredBy);
  newSwap.offeredTo = offeredTo ? asValidUserAlias(offeredTo) : undefined;
  newSwap.offered = offered.map((t) => {
    const tokenInstanceQty = new TokenInstanceQuantity();
    const key = new TokenInstanceKey();
    key.collection = t.tokenInstance.collection;
    key.category = t.tokenInstance.category;
    key.type = t.tokenInstance.type;
    key.additionalKey = t.tokenInstance.additionalKey;
    key.instance = t.tokenInstance.instance;
    tokenInstanceQty.tokenInstance = key;
    tokenInstanceQty.quantity = t.quantity;
    return tokenInstanceQty;
  });
  newSwap.wanted = wanted.map((t) => {
    const tokenInstanceQty = new TokenInstanceQuantity();
    const key = new TokenInstanceKey();
    key.collection = t.tokenInstance.collection;
    key.category = t.tokenInstance.category;
    key.type = t.tokenInstance.type;
    key.additionalKey = t.tokenInstance.additionalKey;
    key.instance = t.tokenInstance.instance;
    tokenInstanceQty.tokenInstance = key;
    tokenInstanceQty.quantity = t.quantity;
    return tokenInstanceQty;
  });

  newSwap.txid = ctx.stub.getTxID();
  newSwap.created = ctx.txUnixTime;
  // 2023-11-16: added txid as new chain key because timestamp alone may not be precise enough to ensure uniqueness
  // todo: determine if it would be straightforward to remove created as a ChainKey() from the TokenSwapRequest object
  // i.e. if this feature has never been used in production, it could be easy
  newSwap.txid = ctx.stub.getTxID();
  newSwap.uses = uses;
  newSwap.usesSpent = new BigNumber(0);
  newSwap.expires = expires;
  newSwap.fillIds = [];
  // convenience for downstream client applications
  // its not often feasible or straightforward for a client to construct the composite key outside of a JS/TS environment (with common-api code)
  // if I want to query swaps and then fill one, the necessary id for FillTokenSwap should be in my JSON response
  newSwap.swapRequestId = newSwap.getCompositeKey();

  await newSwap.validateOrReject();

  // the conversion from dto to instance was successful, begin chain-code specific instance validation

  const chainValidationErrors: Array<string> = [];

  let offeredOnBehalfOfOwner = false;
  let verifyAuthorizationForLock: () => Promise<AuthorizedOnBehalf | undefined> = async () => undefined;

  if (newSwap.offeredBy !== ctx.callingUser) {
    offeredOnBehalfOfOwner = true;
    verifyAuthorizationForLock = async () => {
      return {
        callingOnBehalf: newSwap.offeredBy,
        callingUser: ctx.callingUser
      };
    };
  }

  // Check that expires is empty or a valid time
  if (newSwap.expires && newSwap.expires <= ctx.txUnixTime) {
    chainValidationErrors.push(
      `If expiry is provided it must be a valid epoch time in the future: ${newSwap.expires}`
    );
  }

  // Check that token IDs exist
  const offeredInstanceKeys = newSwap.offered.map((t) => t.tokenInstance);
  const offeredInstances = await fetchTokenInstances(ctx, offeredInstanceKeys).catch((e) => {
    chainValidationErrors.push(`Error fetching from tokens: ${e.message}`);
    return [];
  });

  if (offeredInstances.length != newSwap.offered.length) {
    chainValidationErrors.push(`From: Length mismatch on fetched token instances ${offeredInstances.length} 
            and providved token instances ${newSwap.offered.length}`);
  }

  const wantedInstanceKeys = newSwap.wanted.map((t) => t.tokenInstance);
  const wantedInstances = await fetchTokenInstances(ctx, wantedInstanceKeys).catch((e) => {
    chainValidationErrors.push(`Error fetching to tokens: ${e.message}`);
    return [];
  });

  if (wantedInstances.length != newSwap.wanted.length) {
    chainValidationErrors.push(
      `To: Length mismatch on fetched token instances ${wantedInstances.length} ` +
        `and provided token instances ${newSwap.wanted.length}`
    );
  }

  // Check that the swap is not swapping for the same fungible Tokens
  const fungibleTokenKeys: string[] = [];
  for (let index = 0; index < newSwap.offered.length; index += 1) {
    const tokenInstanceKey = newSwap.offered[index].tokenInstance;
    const quantity = newSwap.offered[index].quantity;
    const tokenClassKeyList = TokenClass.buildClassKeyList(tokenInstanceKey);
    const compositeKey = TokenClass.getCompositeKeyFromParts(TokenClass.INDEX_KEY, tokenClassKeyList);

    const tokenClass = await getObjectByKey(ctx, TokenClass, compositeKey);

    if (offeredOnBehalfOfOwner) {
      // todo: unsure why verifyAndUseAllowances() requires *both* the tokenInstanceKey and tokenInstance be supplied -
      // its code appears to just need the string properties not the actual TokenInstance off chain
      const { collection, category, type, additionalKey, instance } = tokenInstanceKey;
      const tokenInstanceKeyList = [collection, category, type, additionalKey, instance.toString()];
      const instanceCompositeKey = TokenInstance.getCompositeKeyFromParts(
        TokenInstance.INDEX_KEY,
        tokenInstanceKeyList
      );
      const tokenInstance = await getObjectByKey(ctx, TokenInstance, instanceCompositeKey);

      await verifyAndUseAllowances(
        ctx,
        newSwap.offeredBy,
        tokenInstanceKey,
        quantity,
        tokenInstance,
        ctx.callingUser,
        AllowanceType.Swap,
        []
      );
    }

    if (tokenClass.isNonFungible === false) {
      fungibleTokenKeys.push(compositeKey);
    }
    const quantityResults = validateTokenSwapQuantity(newSwap.offered[index].quantity, tokenClass);
    for (const validationMessage of quantityResults) {
      chainValidationErrors.push(`From ${validationMessage}`);
    }
  }

  for (let index = 0; index < newSwap.wanted.length; index++) {
    const tokenInstance = wantedInstances[index];
    const tokenInstanceKeyList = TokenClass.buildClassKeyList(tokenInstance);
    const compositeKey = TokenClass.getCompositeKeyFromParts(TokenClass.INDEX_KEY, tokenInstanceKeyList);
    const tokenClass = await getObjectByKey(ctx, TokenClass, compositeKey);

    if (tokenClass.isNonFungible === false && fungibleTokenKeys.includes(compositeKey)) {
      chainValidationErrors.push(
        `Error validating tokens to be swapped: Can not swap two of the same fungible tokens.`
      );
    }

    const quantityResults = validateTokenSwapQuantity(newSwap.wanted[index].quantity, tokenClass);
    for (const validationMessage of quantityResults) {
      chainValidationErrors.push(`To ${validationMessage}`);
    }
  }

  /// /////////////////////////////////////////////////////
  /// ///// NFT
  // if they send in instance id we need to make sure all they are the owner of all these instances
  // if they send in a token class id we need to make sure they own enough of that class here
  // maybe validate spendable quantity instead of GetSpendableQuantity?

  // If we have any errors, don't proceed to check the spendable quantity and
  // issue the transaction
  if (chainValidationErrors.length === 0) {
    // Check from balances
    for (let index = 0; index < newSwap.offered.length; index += 1) {
      const fromToken = newSwap.offered[index].tokenInstance;
      const offeredQuantity = newSwap.offered[index].quantity;
      const balance = await fetchOrCreateBalance(ctx, newSwap.offeredBy, fromToken);
      const isSpendable = fromToken.isFungible()
        ? balance.getQuantityTotal().isGreaterThanOrEqualTo(offeredQuantity)
        : balance.isInstanceSpendable(fromToken.instance, ctx.txUnixTime);

      if (!isSpendable) {
        const fromPersonKey = newSwap.offeredBy;
        chainValidationErrors.push(
          `${fromPersonKey} has insufficient balance to spend ${offeredQuantity} of token ${fromToken.toStringKey()}`
        );
      }
    }
  }

  // Persist the swap request
  await putChainObject(ctx, newSwap);

  const swapRequestId = newSwap.getCompositeKey();

  if (chainValidationErrors.length !== 0) {
    throw new SwapDtoValidationError("requestTokenSwap", chainValidationErrors);
  }

  // Lock the From tokens
  for (let index = 0; index < newSwap.offered.length; index += 1) {
    const offeredTokenInstance = newSwap.offered[index].tokenInstance;
    const quantity = newSwap.offered[index].quantity.times(newSwap.uses);

    const tokenOwner = newSwap.offeredBy;

    await lockToken(ctx, {
      owner: tokenOwner,
      lockAuthority: tokenOwner,
      tokenInstanceKey: offeredTokenInstance,
      quantity,
      allowancesToUse: [],
      expires: newSwap.expires,
      name: swapRequestId,
      verifyAuthorizedOnBehalf: verifyAuthorizationForLock
    }).catch((e) => {
      const chainError = ChainError.from(e);
      throw new LockTokenFailedError(chainError.message, chainError.payload);
    });
  }

  // swap is valid and successfully written. Create index-objects to faciliate performant client application queries
  for (const offered of newSwap.offered) {
    const newSwapInstance = plainToInstance(TokenSwapRequestInstanceOffered, {
      ...offered.tokenInstance,
      swapRequestId: swapRequestId
    });

    await newSwapInstance.validateOrReject();
    await putChainObject(ctx, newSwapInstance);
  }

  for (const wanted of newSwap.wanted) {
    const newSwapInstance = plainToInstance(TokenSwapRequestInstanceWanted, {
      ...wanted.tokenInstance,
      swapRequestId: swapRequestId
    });

    await newSwapInstance.validateOrReject();
    await putChainObject(ctx, newSwapInstance);
  }

  const newSwapOfferedBy: TokenSwapRequestOfferedBy = plainToInstance(TokenSwapRequestOfferedBy, {
    offeredBy: newSwap.offeredBy,
    swapRequestId: swapRequestId
  });

  await newSwapOfferedBy.validateOrReject();
  await putChainObject(ctx, newSwapOfferedBy);

  // offering to a specfic user is not required
  if (newSwap.offeredTo) {
    const newSwapOfferedTo: TokenSwapRequestOfferedTo = plainToInstance(TokenSwapRequestOfferedTo, {
      offeredTo: newSwap.offeredTo,
      swapRequestId: swapRequestId
    });

    await newSwapOfferedTo.validateOrReject();
    await putChainObject(ctx, newSwapOfferedTo);
  }

  return newSwap;
}

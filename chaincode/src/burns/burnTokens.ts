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
  BurnTokenQuantity,
  ChainError,
  ChainObject,
  DefaultError,
  ErrorCode,
  TokenAllowance,
  TokenBurn,
  TokenBurnCounter,
  TokenClass,
  TokenInstanceKey,
  ValidationFailedError
} from "@gala-chain/api";
import { BigNumber } from "bignumber.js";
import { instanceToInstance, plainToInstance } from "class-transformer";

import { checkAllowances, fetchAllowances, useAllowances } from "../allowances";
import { fetchOrCreateBalance } from "../balances";
import { InvalidDecimalError, fetchTokenInstance } from "../token";
import { GalaChainContext, createValidChainObject } from "../types";
import {
  getObjectByKey,
  getRangedObjectByKey,
  inverseEpoch,
  inverseTime,
  putChainObject,
  putRangedChainObject
} from "../utils";
import { InsufficientBurnAllowanceError, UseAllowancesFailedError } from "./BurnError";
import { fetchKnownBurnCount } from "./fetchBurns";

export interface BurnsTokensParams {
  owner: string;
  toBurn: BurnTokenQuantity[];
  preValidated?: boolean;
}

export async function burnTokens(
  ctx: GalaChainContext,
  {
    owner,
    toBurn,
    // NOTE: flag used so burnAndMint and bridgeTokenOut can bypass allowance check.
    // This suggests we might want to refactor burnAndMint, but this was outside the scope of burn allowances
    preValidated
  }: BurnsTokensParams
): Promise<TokenBurn[]> {
  const burnResponses: Array<TokenBurn> = [];

  const burnQuantitiesSummedByInstance = aggregateBurnQuantities(toBurn);

  for (const tokenQuantity of burnQuantitiesSummedByInstance) {
    const tokenInstance = await fetchTokenInstance(ctx, tokenQuantity.tokenInstanceKey);
    const tokenInstanceClassKey = await TokenClass.buildClassKeyObject(tokenInstance);
    const tokenClass = await getObjectByKey(
      ctx,
      TokenClass,
      TokenClass.getCompositeKeyFromParts(
        TokenClass.INDEX_KEY,
        TokenClass.buildClassKeyList(tokenInstanceClassKey)
      )
    );

    let applicableAllowanceResponse: TokenAllowance[] = [];
    // if user is not the owner, check allowances:
    if (ctx.callingUser !== owner && !preValidated) {
      // Get allowances
      const fetchAllowancesData = {
        grantedTo: ctx.callingUser,
        collection: tokenInstanceClassKey.collection,
        category: tokenInstanceClassKey.category,
        type: tokenInstanceClassKey.type,
        additionalKey: tokenInstanceClassKey.additionalKey,
        instance: tokenInstance.instance.toString(),
        allowanceType: AllowanceType.Burn,
        grantedBy: owner
      };

      applicableAllowanceResponse = await fetchAllowances(ctx, fetchAllowancesData);

      // Check allowances
      const totalAllowance: BigNumber = await checkAllowances(
        ctx,
        applicableAllowanceResponse,
        tokenQuantity.tokenInstanceKey,
        AllowanceType.Burn,
        ctx.callingUser
      );

      if (totalAllowance.isLessThan(tokenQuantity.quantity)) {
        throw new InsufficientBurnAllowanceError(
          ctx.callingUser,
          totalAllowance,
          tokenQuantity.quantity,
          tokenQuantity.tokenInstanceKey,
          owner
        );
      }

      // if possible, spend allowances
      const allowancesUsed: boolean = await useAllowances(
        ctx,
        new BigNumber(tokenQuantity.quantity),
        applicableAllowanceResponse,
        AllowanceType.Burn
      );

      if (!allowancesUsed) {
        throw new UseAllowancesFailedError(
          tokenQuantity.quantity,
          tokenQuantity.tokenInstanceKey.toStringKey(),
          owner
        );
      }
    }
    if (tokenInstance.isNonFungible && !tokenQuantity.quantity.isEqualTo(1)) {
      const quantity = tokenQuantity.quantity.toFixed();
      const tokenInstanceKey = TokenInstanceKey.nftKey(tokenInstance, tokenInstance.instance).toStringKey();
      const message = `NFT quantity of ${tokenInstanceKey} must equal 1, but got ${quantity}`;
      throw new ValidationFailedError(message, { tokenInstanceKey, quantity });
    }

    const decimalPlaces = tokenQuantity.quantity.decimalPlaces() ?? 0;
    if (decimalPlaces > tokenClass.decimals) {
      throw new InvalidDecimalError(tokenQuantity.quantity, tokenClass.decimals);
    }

    const userBalance = await fetchOrCreateBalance(ctx, owner, tokenInstanceClassKey);

    if (tokenInstance.isNonFungible) {
      userBalance.ensureCanRemoveInstance(tokenInstance.instance, ctx.txUnixTime).remove();
    } else {
      userBalance.ensureCanSubtractQuantity(tokenQuantity.quantity, ctx.txUnixTime).subtract();
    }

    const newBurn = await incrementOrCreateTokenBurnForTx(
      ctx,
      owner,
      tokenQuantity.tokenInstanceKey,
      tokenQuantity.quantity
    );

    const newBurnCounter = await incrementOrCreateTokenBurnCounterForTx(
      ctx,
      owner,
      tokenQuantity.tokenInstanceKey,
      tokenQuantity.quantity
    );

    await putChainObject(ctx, userBalance);
    await putChainObject(ctx, newBurn);
    await putRangedChainObject(ctx, newBurnCounter);

    burnResponses.push(newBurn);
  }

  return burnResponses;
}

/**
 * Iterate through the provided array of `BurnTokenQuantity` objects, identifying any
 * duplicates by `tokenInstanceKey`. If more than one `BurnTokenQuantity` exist for a
 * given `tokenInstanceKey` combination, sum them together. The output array should have
 * at most one value per unique `tokenInstanceKey`.
 *
 * @param requests: BurnTokenQuantity[]
 * @returns BurnTokenQuantity[]
 */
export function aggregateBurnQuantities(requests: BurnTokenQuantity[]): BurnTokenQuantity[] {
  const summedQuantities: BurnTokenQuantity[] = [];
  const hash = {};

  for (let i = 0; i < requests.length; i++) {
    const { collection, category, type, additionalKey, instance } = requests[i].tokenInstanceKey;

    const key = `${collection}_${category}_${type}_${additionalKey}_${instance.toString()}`;

    hash[key] = hash[key] ?? summedQuantities.length;

    const tokenIndex = hash[key];

    if (summedQuantities[tokenIndex] === undefined) {
      summedQuantities[tokenIndex] = instanceToInstance(requests[i]);
    } else {
      summedQuantities[tokenIndex].quantity = summedQuantities[tokenIndex].quantity.plus(
        requests[i].quantity
      );
    }
  }

  return summedQuantities;
}

/**
 * If the `TokenBurn` can be read, increment the quantity.
 * Otherwise, create a new `TokenBurn` with the quantity set to the provided value.
 *
 * @remarks
 * The ChainKey design of `TokenBurn` objects ensures uniqueness by
 * burnedBy, tokenInstanceKey properties, and a created timestamp.
 * Generally if a `TokenBurn` is read twice in the same transaction it means
 * two `burnQuantities` were provided to `burnTokens` for the same token instance,
 * or two separate functions burned the same token (e.g. a fee and a chaincode main method execution.)
 */
export async function incrementOrCreateTokenBurnForTx(
  ctx: GalaChainContext,
  burnedBy: string,
  { collection, category, type, additionalKey, instance }: TokenInstanceKey,
  quantity: BigNumber
): Promise<TokenBurn> {
  const instanceKey: TokenInstanceKey = plainToInstance(TokenInstanceKey, {
    collection,
    category,
    type,
    additionalKey,
    instance
  });

  const newBurn = await createValidChainObject(TokenBurn, {
    burnedBy,
    collection,
    category,
    type,
    additionalKey,
    instance,
    created: ctx.txUnixTime,
    quantity
  });

  const burnKey = newBurn.getCompositeKey();

  const cachedBurn: TokenBurn | undefined = await getObjectByKey(ctx, TokenBurn, burnKey).catch((e) => {
    const chainError = ChainError.from(e);
    if (chainError.matches(ErrorCode.NOT_FOUND)) {
      return undefined;
    } else {
      throw chainError;
    }
  });

  if (cachedBurn !== undefined) {
    cachedBurn.quantity = cachedBurn.quantity.plus(quantity);

    return cachedBurn;
  } else {
    return newBurn;
  }
}

/**
 * If the `TokenBurnCounter` can be read, increment the quantity.
 * Otherwise, create a new `TokenBurnCounter` with the quantity set to the provided value.
 *
 * @remarks
 * The ChainKey design of `TokenBurnCounter` ranged objects ensures uniqueness by
 * tokenInstanceKey properties, burnedBy, and a timeKey derived from the transaction timestamp.
 * Generally if a `TokenBurnCounter` is read twice in the same transaction it means
 * two `burnQuantities` were provided to `burnTokens` for the same token instance,
 * or two separate functions burned the same token (e.g. a fee and a chaincode main method execution.)
 */
export async function incrementOrCreateTokenBurnCounterForTx(
  ctx: GalaChainContext,
  burnedBy: string,
  { collection, category, type, additionalKey, instance }: TokenInstanceKey,
  quantity: BigNumber
): Promise<TokenBurnCounter> {
  const referenceId = ChainObject.getStringKeyFromParts([
    burnedBy,
    collection,
    category,
    type,
    additionalKey,
    burnedBy,
    `${ctx.txUnixTime}`
  ]);

  const timeKey: string = inverseTime(ctx, 0);
  const epoch: string = inverseEpoch(ctx, 0);

  const totalKnownBurnsCount: BigNumber = await fetchKnownBurnCount(ctx, {
    collection,
    category,
    type,
    additionalKey
  });

  const burnCounter = await createValidChainObject(TokenBurnCounter, {
    collection,
    category,
    type,
    additionalKey,
    timeKey,
    burnedBy,
    instance,
    totalKnownBurnsCount,
    created: ctx.txUnixTime,
    quantity,
    referenceId,
    epoch
  });

  const burnCounterKey = burnCounter.getRangedKey();

  const cachedBurnCounterValue = await getRangedObjectByKey(ctx, TokenBurnCounter, burnCounterKey).catch(
    (e) => {
      const chainError = ChainError.from(e);
      if (chainError.matches(ErrorCode.NOT_FOUND)) {
        return undefined;
      } else {
        throw chainError;
      }
    }
  );

  if (cachedBurnCounterValue !== undefined) {
    cachedBurnCounterValue.quantity = cachedBurnCounterValue.quantity.plus(quantity);

    return cachedBurnCounterValue;
  } else {
    return burnCounter;
  }
}

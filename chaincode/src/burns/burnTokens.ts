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
  ChainObject,
  TokenAllowance,
  TokenBurn,
  TokenBurnCounter,
  TokenClass,
  TokenInstanceKey,
  ValidationFailedError
} from "@gala-chain/api";
import { BigNumber } from "bignumber.js";

import { checkAllowances, fetchAllowances, useAllowances } from "../allowances";
import { fetchOrCreateBalance } from "../balances";
import { InvalidDecimalError, fetchTokenInstance } from "../token";
import { GalaChainContext, createValidChainObject } from "../types";
import { getObjectByKey, inverseEpoch, inverseTime, putChainObject, putRangedChainObject } from "../utils";
import { InsufficientBurnAllowanceError, UseAllowancesFailedError } from "./BurnError";
import { fetchKnownBurnCount } from "./fetchBurns";

async function createTokenBurn(
  ctx: GalaChainContext,
  burnedBy: string,
  { collection, category, type, additionalKey, instance }: TokenInstanceKey,
  quantity: BigNumber
): Promise<TokenBurn> {
  return await createValidChainObject(TokenBurn, {
    burnedBy,
    collection,
    category,
    type,
    additionalKey,
    instance,
    created: ctx.txUnixTime,
    quantity
  });
}

async function createTokenBurnCounter(
  ctx: GalaChainContext,
  tokenBurn: TokenBurn
): Promise<TokenBurnCounter> {
  const { collection, category, type, additionalKey, instance, burnedBy, created, quantity } = tokenBurn;

  const referenceId = ChainObject.getStringKeyFromParts([
    burnedBy,
    collection,
    category,
    type,
    additionalKey,
    burnedBy,
    `${created}`
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
    created,
    quantity,
    referenceId,
    epoch
  });

  return burnCounter;
}

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

  for (const tokenQuantity of toBurn) {
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
        additionalKey: tokenInstanceClassKey.additionalKey
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
        applicableAllowanceResponse
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

    const newBurn = await createTokenBurn(ctx, owner, tokenQuantity.tokenInstanceKey, tokenQuantity.quantity);
    const newBurnCounter = await createTokenBurnCounter(ctx, newBurn);

    await putChainObject(ctx, userBalance);
    await putChainObject(ctx, newBurn);
    await putRangedChainObject(ctx, newBurnCounter);

    burnResponses.push(newBurn);
  }

  return burnResponses;
}

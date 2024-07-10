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
  AllowanceKey,
  AllowanceType,
  ChainObject,
  GrantAllowanceQuantity,
  TokenAllowance,
  TokenClass,
  TokenInstance,
  TokenInstanceKey,
  TokenInstanceQueryKey,
  TokenMintAllowance,
  TokenMintAllowanceRequest,
  TokenMintStatus,
  createValidChainObject,
  createValidRangedChainObject
} from "@gala-chain/api";
import { BigNumber } from "bignumber.js";
import { classToPlain as instanceToPlain, plainToInstance } from "class-transformer";

import { fetchBalances, fetchOrCreateBalance } from "../balances";
import { fetchKnownBurnCount } from "../burns/fetchBurns";
import { fetchMintAllowanceSupply } from "../mint/fetchMintAllowanceSupply";
import { fetchTokenInstance } from "../token";
import {
  InvalidDecimalError,
  NftInstanceAllowanceMismatchError,
  NotATokenAuthorityError
} from "../token/TokenError";
import { GalaChainContext } from "../types/GalaChainContext";
import {
  getObjectByKey,
  getObjectsByPartialCompositeKey,
  inverseEpoch,
  inverseTime,
  putChainObject,
  putRangedChainObject
} from "../utils";
import {
  DuplicateAllowanceError,
  DuplicateUserError,
  GrantAllowanceFailedError,
  InsufficientTokenBalanceError,
  InvalidTokenOwnerError,
  MintCapacityExceededError,
  TotalSupplyExceededError
} from "./AllowanceError";
import { isAllowanceExpired } from "./checkAllowances";
import { refreshAllowances } from "./refreshAllowances";

// this determines how many balances is enough to warrant optimization of allowance fetch
// const BALANCE_COUNT_THRESHOLD = 50;

async function grantAllowanceByPartialKey(
  ctx: GalaChainContext,
  tokenInstance: TokenInstanceQueryKey,
  allowanceType: AllowanceType,
  quantities: Array<GrantAllowanceQuantity>,
  uses: BigNumber,
  expires: number
): Promise<TokenAllowance[]> {
  const tokenBalances = await fetchBalances(ctx, {
    owner: ctx.callingUser,
    ...tokenInstance
  });

  const tokenAllowances: Array<TokenAllowance> = [];

  const fetchAllowanceOps: Promise<TokenAllowance[]>[] = [];

  const grantedToUser = quantities[0].user; // in the context of a partial key grant, only one user should be grantedTo

  for (const balance of tokenBalances) {
    if (balance.containsAnyNftInstanceId()) {
      for (const balanceInstance of balance.getNftInstanceIds()) {
        const allowanceQueryParamsForBalance = [
          grantedToUser,
          balance.collection,
          balance.category,
          balance.type,
          balance.additionalKey,
          balanceInstance.toString(),
          allowanceType.toString(),
          ctx.callingUser // grantedBy ChainKey#7
        ];

        fetchAllowanceOps.push(
          getObjectsByPartialCompositeKey(
            ctx,
            TokenAllowance.INDEX_KEY,
            allowanceQueryParamsForBalance,
            TokenAllowance
          )
        );
      }
    } else {
      // no instanceIds on balance, assume fungible TokenClass
      const allowanceQueryParamsForBalance = [
        grantedToUser,
        balance.collection,
        balance.category,
        balance.type,
        balance.additionalKey,
        TokenInstance.FUNGIBLE_TOKEN_INSTANCE.toString(),
        allowanceType.toString(),
        ctx.callingUser // grantedBy ChainKey#7
      ];

      fetchAllowanceOps.push(
        getObjectsByPartialCompositeKey(
          ctx,
          TokenAllowance.INDEX_KEY,
          allowanceQueryParamsForBalance,
          TokenAllowance
        )
      );
    }
  }

  // execute and aggregate fetch operations
  for (const op of fetchAllowanceOps) {
    await op
      .then((fetched) => {
        tokenAllowances.push(...fetched);
      })
      .catch((e) => {
        failedAllowances.push(e);
      });
  }

  //refresh existing allowances
  await refreshAllowances(
    ctx,
    tokenAllowances.map((allowance) => {
      const allowKey = new AllowanceKey();
      allowKey.grantedTo = allowance.grantedTo;
      allowKey.collection = allowance.collection;
      allowKey.category = allowance.category;
      allowKey.type = allowance.type;
      allowKey.additionalKey = allowance.additionalKey;
      allowKey.instance = allowance.instance;
      allowKey.allowanceType = allowance.allowanceType;
      allowKey.grantedBy = allowance.grantedBy;
      allowKey.created = allowance.created;
      return {
        allowanceKey: allowKey,
        uses,
        expires
      };
    })
  );

  const grantAllowanceOps: Promise<TokenAllowance[]>[] = [];

  tokenBalances.forEach((tokenBalance) => {
    if (tokenBalance.containsAnyNftInstanceId()) {
      // construct a GrantAllowance call per instance / nft
      let allowanceInstanceKeys = tokenBalance.getNftInstanceIds().map((instanceId) => {
        const allowanceTokenInstanceKey = new TokenInstanceQueryKey();
        allowanceTokenInstanceKey.collection = tokenBalance.collection;
        allowanceTokenInstanceKey.category = tokenBalance.category;
        allowanceTokenInstanceKey.type = tokenBalance.type;
        allowanceTokenInstanceKey.additionalKey = tokenBalance.additionalKey;
        allowanceTokenInstanceKey.instance = instanceId;
        return allowanceTokenInstanceKey;
      });

      //filter keys to ones that don't have existing allowances
      allowanceInstanceKeys = allowanceInstanceKeys.filter(
        (allowanceKey) =>
          tokenAllowances.findIndex(
            (allowance) =>
              allowance.collection === allowanceKey.collection &&
              allowance.category === allowanceKey.category &&
              allowance.type === allowanceKey.type &&
              allowance.additionalKey === allowanceKey.additionalKey &&
              allowanceKey.instance &&
              allowance.instance.isEqualTo(allowanceKey.instance)
          ) < 0
      );

      allowanceInstanceKeys.forEach((allowanceKey) => {
        const params = { tokenInstance: allowanceKey, allowanceType, quantities, uses, expires };
        grantAllowanceOps.push(grantAllowance(ctx, params));
      });
    } else {
      // no-op; Partial Allowances don't support or really make sense for Fungible Tokens,
      // which are the primary case of empty instanceIds array.
      // it would be better to verify with the isNonFungible property.
      // However, this property is not present on the TokenBalance class, and looking up
      // every TokenClass for partial allowance grants would be a lot of reads which could
      // contribute to conflicts.
      ctx.logger.info(
        `Skipping GrantAllowanceByPartialKey for tokenBalance with no instanceIds. ` +
          `${JSON.stringify(tokenBalance)}`
      );
    }
  });

  const grantedAllowances: TokenAllowance[] = [];
  const failedAllowances: Array<{ message: string; payload: Record<string, unknown> }> = [];

  for (const op of grantAllowanceOps) {
    await op
      .then((granted) => {
        // throw new Error(`granted ${granted[0].getCompositeKey()}`)

        grantedAllowances.push(...granted);
      })
      .catch((e) => {
        failedAllowances.push(e);
      });
  }

  if (failedAllowances.length > 0) {
    throw new GrantAllowanceFailedError(failedAllowances);
  }

  return grantedAllowances;
}

export function ensureQuantityCanBeMinted(
  tokenClass: TokenClass,
  quantity: BigNumber,
  totalKnownMintAllowanceCount?: BigNumber,
  totalKnownBurnsCount?: BigNumber
): boolean {
  // todo: remove if applicable when totalSupply is fully deprecated
  // temporary hotfix for supporting maxSupply in the legacy MintToken function
  if (
    tokenClass.totalSupply &&
    tokenClass.totalSupply.isGreaterThan("0") &&
    tokenClass.totalSupply.plus(quantity).isGreaterThan(tokenClass.maxSupply)
  ) {
    throw new TotalSupplyExceededError(tokenClass.getCompositeKey(), tokenClass.maxSupply, quantity);
  }

  // todo: totalMintAllowance not being accounted for here in original MintToken implementation.
  // Transitioning to the experimental (as of 2023-03) high-throughput-mint implementation is anticipated to resolve this.
  // currently, using the original MintToken implementation will always end up setting totalKnownMintAllowanceCount to zero,
  // leaving open the possibility of exceeding the maxSupply defined in a token class.
  if (!totalKnownMintAllowanceCount) {
    totalKnownMintAllowanceCount = new BigNumber("0");
  }

  // Note older implementation had checked tokenClass.totalBurned,
  // however `burnTokens` had not been updating this value due to MVCC READ CONFLICTs,
  // so setting a default of 0 for backwards compatibility is the same result.
  // enforcing burns on mint capacity will require moving to the high throughput mint implementation
  if (!totalKnownBurnsCount) {
    totalKnownBurnsCount = new BigNumber("0");
  }

  // If there is a maxCapacity, then total mint allowance cannot exceed that
  // If there is a maxSupply, then total mint allowance - burn quantity cannot exceed that
  if (
    tokenClass.maxCapacity &&
    tokenClass.maxCapacity.isGreaterThan(new BigNumber(0)) &&
    totalKnownMintAllowanceCount.plus(quantity).isGreaterThan(tokenClass.maxCapacity)
  ) {
    throw new MintCapacityExceededError(tokenClass.getCompositeKey(), tokenClass.maxCapacity, quantity);
  }

  if (
    tokenClass.maxSupply &&
    tokenClass.maxSupply.isGreaterThan(new BigNumber(0)) &&
    totalKnownMintAllowanceCount
      .minus(totalKnownBurnsCount)
      .plus(quantity)
      .isGreaterThan(tokenClass.maxSupply)
  ) {
    throw new TotalSupplyExceededError(tokenClass.getCompositeKey(), tokenClass.maxSupply, quantity);
  }

  return true;
}

export interface GrantAllowanceParams {
  tokenInstance: TokenInstanceQueryKey;
  allowanceType: AllowanceType;
  quantities: Array<GrantAllowanceQuantity>;
  uses: BigNumber;
  expires: number;
}

async function putAllowancesOnChain(
  ctx: GalaChainContext,
  { allowanceType, quantities, uses, expires }: Omit<GrantAllowanceParams, "tokenInstance">,
  instanceKey: TokenInstanceKey,
  tokenClass: TokenClass
): Promise<TokenAllowance[]> {
  const returnArray: TokenAllowance[] = [];
  for (let index = 0; index < quantities.length; index++) {
    const decimalPlaces = quantities[index].quantity.decimalPlaces() ?? 0;
    if (decimalPlaces > tokenClass.decimals) {
      throw new InvalidDecimalError(quantities[index].quantity, tokenClass.decimals);
    }

    const grantedTo = quantities[index].user;

    const newAllowance = await createValidChainObject(TokenAllowance, {
      collection: instanceKey.collection,
      category: instanceKey.category,
      type: instanceKey.type,
      additionalKey: instanceKey.additionalKey,
      instance: instanceKey.instance,
      quantity: quantities[index].quantity,
      uses,
      expires,
      quantitySpent: new BigNumber(0),
      usesSpent: new BigNumber(0),
      allowanceType: allowanceType,
      grantedBy: ctx.callingUser,
      created: ctx.txUnixTime,
      grantedTo
    });

    if (allowanceType !== AllowanceType.Mint) {
      // Validate instance
      await newAllowance.validateOrReject();
    }

    if (allowanceType === AllowanceType.Lock) {
      await preventDuplicateAllowance(ctx, newAllowance);
    }

    await putChainObject(ctx, newAllowance);
    // todo: this code appears to be writing an un-modified tokenClass on every mint allowance grant...?
    // I don't see code that increments the totalSupply, totalMintAllowanceSupply, etc.
    // can it just be removed as we migrate to TokenMintAllowanceRequest for knownMintAllowanceRequest totals?
    // if (allowanceType === AllowanceType.Mint) {
    //   await putChainObject(ctx, tokenClass);
    // }
    returnArray.push(newAllowance);
  }

  return returnArray;
}

// todo: when grantAllowance is deprecated for Mints, move this function to ../mint module
export async function putMintAllowanceRequestsOnChain(
  ctx: GalaChainContext,
  { quantities, uses, expires }: Omit<GrantAllowanceParams, "tokenInstance">,
  tokenClass: TokenClass,
  knownMintAllowanceSupply: BigNumber
) {
  const mintAllowanceQtyEntries: TokenMintAllowanceRequest[] = [];

  const epochKey = inverseEpoch(ctx, 0);
  const timeKey = inverseTime(ctx, 0);

  for (let index = 0; index < quantities.length; index++) {
    const decimalPlaces = quantities[index].quantity.decimalPlaces() ?? 0;
    if (decimalPlaces > tokenClass.decimals) {
      throw new InvalidDecimalError(quantities[index].quantity, tokenClass.decimals);
    }

    const grantedTo = quantities[index].user;

    // Ledger entry for new mint allowance qty
    const mintAllowanceEntry = await createValidRangedChainObject(TokenMintAllowanceRequest, {
      id: "-", // hack to avoid compilation error
      collection: tokenClass.collection,
      category: tokenClass.category,
      type: tokenClass.type,
      additionalKey: tokenClass.additionalKey,
      timeKey: timeKey,
      totalKnownMintAllowancesCount: knownMintAllowanceSupply,
      grantedBy: ctx.callingUser,
      grantedTo: grantedTo,
      created: ctx.txUnixTime,
      quantity: quantities[index].quantity,
      uses: uses,
      expires: expires,
      state: TokenMintStatus.Unknown,
      epoch: epochKey
    });

    mintAllowanceEntry.id = mintAllowanceEntry.requestId();

    await putRangedChainObject(ctx, mintAllowanceEntry);

    mintAllowanceQtyEntries.push(mintAllowanceEntry);
  }

  return mintAllowanceQtyEntries;
}

export interface PutMintAllowancesOnChainParams {
  mintAllowanceRequests: Array<TokenMintAllowanceRequest>;
}
// todo: when grantAllowance is deprecated for Mints, move this function to ../mint module
export async function putMintAllowancesOnChain(
  ctx: GalaChainContext,
  { mintAllowanceRequests }: PutMintAllowancesOnChainParams,
  tokenClass: TokenClass,
  knownMintAllowanceSupply: BigNumber
) {
  const mintAllowanceEntries: TokenMintAllowance[] = [];

  for (const mintAllowanceRequest of mintAllowanceRequests) {
    const decimalPlaces = mintAllowanceRequest.quantity.decimalPlaces() ?? 0;
    if (decimalPlaces > tokenClass.decimals) {
      throw new InvalidDecimalError(mintAllowanceRequest.quantity, tokenClass.decimals);
    }

    const grantedTo = mintAllowanceRequest.grantedTo;

    // Ledger entry for new mint allowance chain object for tracking quantity
    const mintAllowanceEntry = await createValidChainObject(TokenMintAllowance, {
      collection: tokenClass.collection,
      category: tokenClass.category,
      type: tokenClass.type,
      additionalKey: tokenClass.additionalKey,
      totalKnownMintAllowancesAtRequest: knownMintAllowanceSupply,
      grantedBy: ctx.callingUser,
      grantedTo: grantedTo,
      created: ctx.txUnixTime,
      quantity: mintAllowanceRequest.quantity,
      reqId: mintAllowanceRequest.requestId()
    });

    await putChainObject(ctx, mintAllowanceEntry);

    mintAllowanceEntries.push(mintAllowanceEntry);
  }

  return mintAllowanceEntries;
}

export async function grantAllowance(
  ctx: GalaChainContext,
  { tokenInstance: tokenInstanceQueryKey, allowanceType, quantities, uses, expires }: GrantAllowanceParams
): Promise<TokenAllowance[]> {
  // This can be batched by passing multiple people

  if (new Set(quantities.map((i) => i.user)).size !== quantities.length) {
    throw new DuplicateUserError(quantities.map((q) => q.user));
  }

  if (!tokenInstanceQueryKey.isCompleteKey()) {
    return grantAllowanceByPartialKey(ctx, tokenInstanceQueryKey, allowanceType, quantities, uses, expires);
  }

  const instanceKey = tokenInstanceQueryKey.toCompleteKey();

  // This will throw an error if it can't be found
  const keyList = TokenClass.buildClassKeyList(instanceKey);

  const compositeKey = ChainObject.getCompositeKeyFromParts(TokenClass.INDEX_KEY, keyList);
  const tokenClass: TokenClass = await getObjectByKey(ctx, TokenClass, compositeKey);
  const totalQuantity = quantities.reduce((a, b) => a.plus(b.quantity), new BigNumber(0));

  // todo: deprecate grantAllowance for Mints
  // migrate all consumers to HighThroughputMintAllowance
  // If the action is to give mint allowance then only the token authorities can do that.
  // Otherwise, use normal permission checks
  if (allowanceType === AllowanceType.Mint) {
    // Check if the caller is an authority on the token
    if (!tokenClass.authorities.includes(ctx.callingUser)) {
      throw new NotATokenAuthorityError(
        ctx.callingUser,
        tokenClass.getCompositeKey(),
        tokenClass.authorities
      );
    }

    if (tokenClass.isNonFungible && !instanceKey.instance.isEqualTo(TokenInstance.FUNGIBLE_TOKEN_INSTANCE)) {
      throw new NftInstanceAllowanceMismatchError(instanceKey.instance, AllowanceType.Mint);
    }

    // fetch known amounts
    // legacy grantAllowance does not account for high throughput concurrency.
    // a value of 1 here is the smallest value we can use that will offset enough to let us write a
    // TokenMintRequest while reading prior requests to get the current known supply.
    // we expect MVCC conflicts in this case when multiple legacy grant mint allowance requests happen in the same block
    // only one will win, and be correct, subsequent requests in the same block would miss the others and potentially oversupply the token
    // using the legacy grantAllowance for mints and patching in an accurate supply counter can't work, supporting this method has the above tradeoff
    const knownMintAllowanceSupply = await fetchMintAllowanceSupply(ctx, tokenClass, 1);
    const knownBurnsCount = await fetchKnownBurnCount(ctx, tokenClass);

    ensureQuantityCanBeMinted(tokenClass, totalQuantity, knownMintAllowanceSupply, knownBurnsCount);

    const tokenAllowances = await putAllowancesOnChain(
      ctx,
      { allowanceType, quantities, uses, expires },
      instanceKey,
      tokenClass
    );

    const mintAllowanceRequests = await putMintAllowanceRequestsOnChain(
      ctx,
      { allowanceType, quantities, uses, expires },
      tokenClass,
      knownMintAllowanceSupply
    );

    await putMintAllowancesOnChain(ctx, { mintAllowanceRequests }, tokenClass, knownMintAllowanceSupply);

    return tokenAllowances;
  } /* Non-Mint Allowances */ else {
    const tokenInstance = await fetchTokenInstance(ctx, instanceKey);

    if (
      tokenInstance.isNonFungible &&
      tokenInstance.instance.isEqualTo(TokenInstance.FUNGIBLE_TOKEN_INSTANCE)
    ) {
      throw new NftInstanceAllowanceMismatchError(tokenInstance.instance, allowanceType);
    }

    // Check that the caller owns the token that they are granting an allowance for:
    if (tokenInstance.isNonFungible) {
      // if the token is non-fungible, then we can check owner on tokenInstance
      if (tokenInstance.owner !== ctx.callingUser) {
        throw new InvalidTokenOwnerError(
          ctx.callingUser,
          instanceKey.toStringKey(),
          AllowanceType[allowanceType],
          tokenInstance.owner
        );
      }
    } else {
      const instanceClassKey = await TokenClass.buildClassKeyObject(tokenInstance);
      const callingUserBalance = await fetchOrCreateBalance(ctx, ctx.callingUser, instanceClassKey);

      // for fungible tokens, we need to check the balance and quantities
      if (callingUserBalance.getSpendableQuantityTotal(ctx.txUnixTime).isLessThan(totalQuantity)) {
        throw new InsufficientTokenBalanceError(
          ctx.callingUser,
          instanceKey.toStringKey(),
          AllowanceType[allowanceType],
          callingUserBalance.getQuantityTotal(),
          totalQuantity,
          callingUserBalance.getLockedQuantityTotal(ctx.txUnixTime)
        );
      }
    }

    return putAllowancesOnChain(ctx, { allowanceType, quantities, uses, expires }, instanceKey, tokenClass);
  }
}

export async function preventDuplicateAllowance(
  ctx: GalaChainContext,
  tokenAllowance: TokenAllowance
): Promise<void> {
  const chainKeys = [
    tokenAllowance.grantedTo,
    tokenAllowance.collection,
    tokenAllowance.category,
    tokenAllowance.type,
    tokenAllowance.additionalKey,
    tokenAllowance.instance.toString(),
    tokenAllowance.allowanceType.toString(),
    tokenAllowance.grantedBy
  ];

  const results = await getObjectsByPartialCompositeKey(
    ctx,
    TokenAllowance.INDEX_KEY,
    chainKeys,
    TokenAllowance
  );

  for (const existingAllowance of results) {
    if (allowanceIsUseable(ctx, existingAllowance)) {
      const payload = instanceToPlain(tokenAllowance);

      throw new DuplicateAllowanceError(chainKeys.join(ChainObject.ID_SPLIT_CHAR), payload);
    }
  }
}

export function allowanceIsUseable(ctx: GalaChainContext, tokenAllowance: TokenAllowance): boolean {
  if (isAllowanceExpired(ctx, tokenAllowance)) {
    return false;
  }

  if (
    tokenAllowance.usesSpent.isGreaterThanOrEqualTo(tokenAllowance.uses) ||
    tokenAllowance.quantitySpent.isGreaterThanOrEqualTo(tokenAllowance.quantity)
  ) {
    return false;
  }

  return true;
}

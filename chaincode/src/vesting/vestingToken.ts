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
  Allocation,
  ChainObject,
  TokenBalance,
  TokenClass,
  TokenClassKey,
  TokenInstance,
  TokenInstanceKey,
  UserAlias,
  VestingToken,
  VestingTokenInfo
} from "@gala-chain/api";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import { fetchBalances } from "../balances";
import { lockToken } from "../locks";
import { MintTokenWithAllowanceParams, mintTokenWithAllowance } from "../mint";
import { CreateTokenClassParams, createTokenClass } from "../token";
import { GalaChainContext } from "../types";
import { getObjectByKey, putChainObject } from "../utils";
import { VestingAllocationError } from "./VestingError";

export interface CreateVestingTokenParams {
  network: string;
  tokenClass: TokenClassKey;
  isNonFungible: boolean;
  decimals: number;
  name: string;
  symbol: string;
  description: string;
  rarity?: string;
  image: string;
  contractAddress?: string;
  metadataAddress?: string;
  maxSupply: BigNumber;
  maxCapacity: BigNumber;
  totalMintAllowance: BigNumber;
  totalSupply: BigNumber;
  totalBurned: BigNumber;
  authorities: UserAlias[];
  startDate: number;
  vestingName: string;
  allocations: Allocation[];
}

export interface FetchVestingTokenParams {
  tokenClass: TokenClassKey;
}

export async function fetchVestingToken(
  ctx: GalaChainContext,
  params: FetchVestingTokenParams
): Promise<VestingTokenInfo> {
  // Get the VestingToken object
  const vestingTokenKey = ChainObject.getCompositeKeyFromParts(VestingToken.INDEX_KEY, [
    params.tokenClass.collection,
    params.tokenClass.category,
    params.tokenClass.type,
    params.tokenClass.additionalKey
  ]);
  const vestingToken = await getObjectByKey(ctx, VestingToken, vestingTokenKey);

  const vestingTokenInfo = new VestingTokenInfo();
  vestingTokenInfo.vestingToken = vestingToken;
  vestingTokenInfo.allocationBalances = new Array<TokenBalance>();

  // Loop through allocations and use them to fetch balances.
  const allocationCount = vestingToken.allocations.length;
  for (let i = 0; i < allocationCount; i++) {
    const allocation = vestingToken.allocations[i];

    const balanceKey = new TokenBalance({
      collection: vestingToken.collection,
      category: vestingToken.category,
      type: vestingToken.type,
      additionalKey: vestingToken.additionalKey,
      owner: allocation.owner
    });

    const allocationBalance = await getObjectByKey(ctx, TokenBalance, balanceKey.getCompositeKey());

    vestingTokenInfo.allocationBalances.push(allocationBalance);
  }

  return vestingTokenInfo;
}

export async function createVestingToken(
  ctx: GalaChainContext,
  params: CreateVestingTokenParams
): Promise<VestingToken> {
  // TODO validations

  // allocations add up to total supply/max cap
  const allocationTotal = params.allocations.reduce(
    (sum, allocation) => sum.plus(allocation.quantity),
    new BigNumber(0)
  );
  if (!allocationTotal.isEqualTo(params.maxSupply)) {
    throw new VestingAllocationError(params.maxSupply, allocationTotal);
  }

  const tokenClassParams: CreateTokenClassParams = {
    ...params
  };
  const tokenClassResponse = await createTokenClass(ctx, tokenClassParams);

  const tokenInstanceKey = plainToInstance(TokenInstanceKey, {
    ...params.tokenClass,
    instance: TokenInstance.FUNGIBLE_TOKEN_INSTANCE
  });

  const allocationCount = params.allocations.length;
  for (let i = 0; i < allocationCount; i++) {
    const allocation: Allocation = params.allocations[i];

    // Mint entire quantity to owner
    const mintParams: MintTokenWithAllowanceParams = {
      tokenClassKey: params.tokenClass,
      tokenInstance: new BigNumber(0),
      owner: allocation.owner,
      quantity: allocation.quantity
    };
    const mintResponse = await mintTokenWithAllowance(ctx, mintParams);

    let vestingPeriodStart = params.startDate;
    let expires = vestingPeriodStart;
    //first lock period vests on startDate + cliff (verify this is right)
    if (allocation.cliff !== 0) {
      vestingPeriodStart += daysToMilliseconds(allocation.cliff);
      expires = vestingPeriodStart + daysToMilliseconds(allocation.vestingDays);
    }

    // if after calculating expiration it turns out that it expires before now, set to now
    expires = Math.max(expires, ctx.txUnixTime);

    const verifyAuthorizedOnBehalf = async () => {
      return {
        callingOnBehalf: allocation.owner,
        callingUser: ctx.callingUser
      };
    };

    const lockResponse = await lockToken(ctx, {
      owner: allocation.owner,
      lockAuthority: ctx.callingUser,
      tokenInstanceKey,
      quantity: allocation.quantity,
      name: `${params.vestingName}-${allocation.name}`,
      expires,
      verifyAuthorizedOnBehalf,
      vestingPeriodStart
    });
  }

  // construct and save VestingToken object
  const vestingToken = new VestingToken();
  vestingToken.collection = params.tokenClass.collection;
  vestingToken.category = params.tokenClass.category;
  vestingToken.type = params.tokenClass.type;
  vestingToken.additionalKey = params.tokenClass.additionalKey;
  vestingToken.vestingName = params.vestingName;
  vestingToken.startDate = params.startDate;
  vestingToken.allocations = params.allocations;

  await putChainObject(ctx, vestingToken);

  return vestingToken;
}

function daysToMilliseconds(days: number): number {
  return days * 1000 * 24 * 60 * 60;
}

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
import { Allocation, MintTokenWithAllowanceDto, TokenBalance, TokenClass, TokenClassKey, TokenInstance, TokenInstanceKey } from "@gala-chain/api";
import BigNumber from "bignumber.js";


import { GalaChainContext, createValidChainObject } from "../types";
import { getObjectByKey, objectExists, putChainObject } from "../utils";
import { NftDecimalError } from "./TokenError";
import { TokenAlreadyExistsError } from "./TokenError";
import { createTokenClass, CreateTokenClassParams, TokenClassNotFoundError } from "../token";
import { mintToken, mintTokenWithAllowance, MintTokenWithAllowanceParams } from "../mint";
import { lockToken } from "../locks";
import { VestingToken } from "chain-api/src/types/VestingToken";
import { plainToInstance } from "class-transformer";
import { fetchBalances } from "../balances";
import { VestingTokenInfo } from "chain-api/src/types/VestingTokenInfo";

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
  authorities: string[];
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
    const vestingToken = await getObjectByKey(ctx, VestingToken, TokenClass.buildTokenClassCompositeKey(params.tokenClass))

    let vestingTokenInfo = new VestingTokenInfo();
    vestingTokenInfo.vestingToken = vestingToken;
    
    // Loop through allocations and use them to fetch balances.
    const allocationCount = vestingToken.allocations.length
    for(let i=0; i< allocationCount;i++) {
        const allocation = vestingToken.allocations[i];

        const allocationBalance = await fetchBalances(ctx, {
            collection: vestingToken.collection,
            category: vestingToken.category,
            type: vestingToken.type,
            additionalKey: vestingToken.additionalKey,
            owner: allocation.owner
        })

        if(allocationBalance.length !== 1){
            // throw some kind of error, this is weird
        }

        vestingTokenInfo.allocationBalances.push(allocationBalance[0])
    }

    return vestingTokenInfo;
}

export async function createVestingToken(
  ctx: GalaChainContext,
  params: CreateVestingTokenParams
): Promise<VestingToken> {
    // TODO validations
    // allocations add up to total supply/max cap

    const tokenClassParams: CreateTokenClassParams = {
        ...params
    }
    const tokenClassResponse = await createTokenClass(ctx, tokenClassParams)

    const tokenInstanceKey = plainToInstance(TokenInstanceKey, {
        ...params.tokenClass,
        instance: "0"
      })

    const allocationCount = params.allocations.length;
    for(let i=0;i<allocationCount;i++){
        const allocation:Allocation = params.allocations[i];

        // Mint entire quantity to owner
        const mintParams: MintTokenWithAllowanceParams = {
            tokenClassKey: params.tokenClass,
            tokenInstance: new BigNumber(0),
            owner: allocation.owner,
            quantity: allocation.quantity
        }
        const mintResponse = await mintTokenWithAllowance(ctx, mintParams)

        //calculate lock amount per day using vesting period
        let perLockQuantity: BigNumber;

        // TODO: Round to decimal limit
        perLockQuantity = ((new BigNumber(allocation.quantity))
            .dividedBy(new BigNumber(allocation.vestingPeriod)))
            .decimalPlaces(params.decimals);

        //first lock expires on startDate + cliff (verify this is right)
        let expiration = params.startDate + daysToMilliseconds(allocation.cliff);

        // Calculate total amount that will be locked based on perLockQuantity
        const totalToLock = perLockQuantity.multipliedBy(allocation.vestingPeriod);
        let remainingQuantity = allocation.quantity;

        for(let i=0;i<allocation.vestingPeriod;i++) {
            // For the last iteration, use remaining quantity instead of perLockQuantity
            const currentLockQuantity = i === allocation.vestingPeriod - 1 
                ? remainingQuantity 
                : perLockQuantity;

            const lockResponse = await lockToken(ctx, {
                owner: allocation.owner,
                lockAuthority: ctx.callingUser,
                tokenInstanceKey,
                quantity: currentLockQuantity,
                allowancesToUse: [],
                name: `${params.vestingName}-${allocation.name}-${i}`,
                expires: expiration + daysToMilliseconds(i),
                verifyAuthorizedOnBehalf: async () => undefined
            });
            
            remainingQuantity = remainingQuantity.minus(currentLockQuantity);
        }
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
    return days * 1000 * 24 * 60 * 60
}

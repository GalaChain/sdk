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
import { createValidChainObject, TokenClass, TokenClassKey, TokenInstance } from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { GalaChainContext } from "../types";
import { objectExists, putChainObject } from "../utils";
import { NftDecimalError } from "./TokenError";
import { TokenAlreadyExistsError } from "./TokenError";

export interface CreateTokenClassParams {
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
}

export async function createTokenClass(
  ctx: GalaChainContext,
  params: CreateTokenClassParams
): Promise<TokenClassKey> {
  if (params.isNonFungible && params.decimals !== 0) {
    throw new NftDecimalError(params.decimals);
  }

  const newToken: TokenClass = await createValidChainObject(TokenClass, {
    network: params.network,
    collection: params.tokenClass.collection,
    category: params.tokenClass.category,
    type: params.tokenClass.type,
    additionalKey: params.tokenClass.additionalKey,
    isNonFungible: params.isNonFungible,
    decimals: params.decimals,
    name: params.name,
    symbol: params.symbol,
    description: params.description,
    rarity: params.rarity,
    image: params.image,
    metadataAddress: params.metadataAddress,
    contractAddress: params.contractAddress,
    maxSupply: params.maxSupply,
    maxCapacity: params.maxCapacity,
    totalMintAllowance: params.totalMintAllowance,
    totalSupply: params.totalSupply,
    totalBurned: params.totalBurned,
    authorities: params.authorities
  });

  // Token ID cannot be duplicated
  // Make sure the ID is not duplicated across networks by only querying for ID
  const tokenAlreadyExists = await objectExists(ctx, newToken.getCompositeKey());

  if (tokenAlreadyExists) {
    throw new TokenAlreadyExistsError(newToken.getCompositeKey());
  }

  // If it's a fungible token, make the default instance for it
  if (!newToken.isNonFungible) {
    const defaultInstance = await createValidChainObject(TokenInstance, {
      collection: newToken.collection,
      category: newToken.category,
      type: newToken.type,
      additionalKey: newToken.additionalKey,
      instance: TokenInstance.FUNGIBLE_TOKEN_INSTANCE,
      isNonFungible: false
    });
    await putChainObject(ctx, defaultInstance);
  }

  // Save token to chain
  await putChainObject(ctx, newToken);

  // Return token ID
  return await TokenClass.buildClassKeyObject(newToken);
}

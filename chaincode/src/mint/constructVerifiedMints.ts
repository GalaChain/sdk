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
  MintTokenDto,
  TokenBalance,
  TokenClass,
  TokenInstance,
  TokenMintFulfillment,
  createValidChainObject
} from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { fetchOrCreateBalance } from "../balances";
import { GalaChainContext } from "../types";

export async function constructVerifiedMints(
  ctx: GalaChainContext,
  dto: TokenMintFulfillment,
  tokenClass: TokenClass,
  instanceCounter: BigNumber
): Promise<[TokenInstance[], TokenBalance]> {
  const callingUser = ctx.callingUser;
  const owner = dto.owner ?? callingUser;
  const { collection, category, type, additionalKey } = dto;
  const tokenClassKey = await TokenClass.buildClassKeyObject({ collection, category, type, additionalKey });

  const quantity = dto.quantity;

  if (tokenClass.isNonFungible) {
    if (quantity.isGreaterThan(MintTokenDto.MAX_NFT_MINT_SIZE)) {
      throw new Error(
        `You can mint only ${MintTokenDto.MAX_NFT_MINT_SIZE} NFTs (quantity provided: ${quantity}).`
      );
    }

    if (callingUser !== dto.owner && !tokenClass.authorities.includes(callingUser)) {
      throw new Error(
        `NFTs can only be minted by token authorities, or with ones own mint allowance. ` +
          `callingUser: ${callingUser}; dto.owner: ${dto.owner}, ` +
          `authorities: ${tokenClass.authorities.join(", ")}`
      );
    }

    const userBalance = await fetchOrCreateBalance(ctx, owner, tokenClassKey);

    const instanceIds: Array<BigNumber> = [];
    const mintedNFTs: Array<TokenInstance> = [];

    for (let i = 0; i < quantity.toNumber(); i += 1) {
      instanceCounter = instanceCounter.plus("1");
      const mintInstance = new BigNumber(instanceCounter);

      const nftInfo = await createValidChainObject(TokenInstance, {
        collection,
        category,
        type,
        additionalKey,
        instance: mintInstance,
        owner,
        isNonFungible: true
      });

      instanceIds.push(nftInfo.instance);
      mintedNFTs.push(nftInfo);
    }

    instanceIds.forEach((instanceId) => {
      userBalance.addInstance(instanceId);
    });

    return [mintedNFTs, userBalance];
  } else {
    const userBalance = await fetchOrCreateBalance(ctx, owner, tokenClassKey);

    userBalance.addQuantity(quantity);

    const fungibleReturnInstance = await createValidChainObject(TokenInstance, {
      collection,
      category,
      type,
      additionalKey,
      instance: TokenInstance.FUNGIBLE_TOKEN_INSTANCE,
      owner,
      isNonFungible: false
    });

    return [[fungibleReturnInstance], userBalance];
  }
}

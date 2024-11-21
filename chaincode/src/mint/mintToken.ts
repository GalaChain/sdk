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
  AuthorizedOnBehalf,
  MintTokenDto,
  TokenAllowance,
  TokenClass,
  TokenClassKey,
  TokenClassKeyProperties,
  TokenInstance,
  TokenInstanceKey,
  TokenMintFulfillment,
  UserAlias
} from "@gala-chain/api";
import { ChainCallDTO, ChainObject } from "@gala-chain/api";
import { BigNumber } from "bignumber.js";

import { checkAllowances, ensureQuantityCanBeMinted, fetchAllowances, useAllowances } from "../allowances";
import { fetchOrCreateBalance } from "../balances";
import { InvalidDecimalError } from "../token/TokenError";
import { GalaChainContext } from "../types/GalaChainContext";
import { getObjectByKey, putChainObject } from "../utils";
import { InsufficientMintAllowanceError, NftMaxMintError, UseAllowancesFailedError } from "./MintError";
import { writeMintRequest } from "./requestMint";

export interface MintTokenParams {
  tokenClassKey: TokenClassKey;
  owner: UserAlias;
  quantity: BigNumber;
  authorizedOnBehalf: AuthorizedOnBehalf | undefined;
  applicableAllowanceKey?: AllowanceKey | undefined;
  applicableAllowances?: TokenAllowance[] | undefined;
  knownTotalSupply?: BigNumber | undefined;
}

export async function mintToken(
  ctx: GalaChainContext,
  {
    tokenClassKey,
    owner,
    quantity,
    authorizedOnBehalf,
    applicableAllowanceKey,
    applicableAllowances,
    knownTotalSupply
  }: MintTokenParams
): Promise<Array<TokenInstanceKey>> {
  const callingOnBehalf = authorizedOnBehalf?.callingOnBehalf ?? ctx.callingUser;

  // This will throw an error if it can't be found
  const tokenClass = await getObjectByKey(
    ctx,
    TokenClass,
    TokenClass.getCompositeKeyFromParts(TokenClass.INDEX_KEY, TokenClass.buildClassKeyList(tokenClassKey))
  );

  const decimalPlaces = quantity.decimalPlaces() ?? 0;
  if (decimalPlaces > tokenClass.decimals) {
    throw new InvalidDecimalError(quantity, tokenClass.decimals);
  }

  // dto is valid, do chain code specific validation
  let applicableAllowanceResponse: TokenAllowance[] = [];

  if (applicableAllowanceKey) {
    const allowance: TokenAllowance = await getObjectByKey(
      ctx,
      TokenAllowance,
      ChainObject.getCompositeKeyFromParts(TokenAllowance.INDEX_KEY, [
        applicableAllowanceKey.grantedTo,
        applicableAllowanceKey.collection,
        applicableAllowanceKey.category,
        applicableAllowanceKey.type,
        applicableAllowanceKey.additionalKey,
        applicableAllowanceKey.instance.toString(),
        applicableAllowanceKey.allowanceType.toString(),
        applicableAllowanceKey.grantedBy,
        applicableAllowanceKey.created.toString()
      ])
    );

    applicableAllowanceResponse = [allowance];
  } else if (Array.isArray(applicableAllowances) && applicableAllowances.length > 0) {
    applicableAllowanceResponse = applicableAllowances;
  } else {
    // Get allowances
    const fetchAllowancesData = {
      grantedTo: callingOnBehalf,
      collection: tokenClassKey.collection,
      category: tokenClassKey.category,
      type: tokenClassKey.type,
      additionalKey: tokenClassKey.additionalKey,
      instance: TokenInstance.FUNGIBLE_TOKEN_INSTANCE.toString(),
      allowanceType: AllowanceType.Mint
    };

    applicableAllowanceResponse = await fetchAllowances(ctx, fetchAllowancesData);
  }

  const dtoInstanceKey = ChainCallDTO.deserialize<TokenInstanceKey>(TokenInstanceKey, {
    ...tokenClassKey,
    instance: TokenInstance.FUNGIBLE_TOKEN_INSTANCE
  });

  // Check allowances
  const totalAllowance: BigNumber = await checkAllowances(
    ctx,
    applicableAllowanceResponse,
    dtoInstanceKey,
    AllowanceType.Mint,
    callingOnBehalf
  );

  if (totalAllowance.isLessThan(quantity)) {
    throw new InsufficientMintAllowanceError(
      callingOnBehalf,
      totalAllowance,
      quantity,
      dtoInstanceKey,
      owner
    );
  }

  // check that mint is valid based on max supply, max capacity, etc
  ensureQuantityCanBeMinted(tokenClass, quantity);

  // if possible, spend allowances
  const allowancesUsed: boolean = await useAllowances(
    ctx,
    new BigNumber(quantity),
    applicableAllowanceResponse,
    AllowanceType.Mint
  );

  if (!allowancesUsed) {
    throw new UseAllowancesFailedError(quantity, dtoInstanceKey.toStringKey(), owner);
  }

  if (tokenClass.isNonFungible) {
    // For NFTs we have an upper limit
    if (quantity.isGreaterThan(MintTokenDto.MAX_NFT_MINT_SIZE)) {
      throw new NftMaxMintError(quantity);
    }

    /*
     * GalaChainTokenAllowances contain an instance property.
     * for fungible tokens, the instance property on the minted token is less important.
     * for NFTs, the Allowance instance should be the generic 0 instance value.
     * And the newly minted NFT token should be a unique, 1-indexed value.
     */

    const userBalance = await fetchOrCreateBalance(
      ctx,
      owner,
      await TokenClass.buildClassKeyObject(tokenClassKey)
    );

    const mintedNFTs: TokenInstance[] = [];

    // Max supply and max capacity are checking when giving allowances
    // so we are not checking it here when we are using allowances to
    // create new tokens
    for (let i = 0; i < quantity.toNumber(); i += 1) {
      // Update Token Class Total Supply
      tokenClass.totalSupply = tokenClass.totalSupply.plus(1);

      // Create Instance of token
      const nftInfo = new TokenInstance();
      nftInfo.owner = owner;
      nftInfo.collection = tokenClassKey.collection;
      nftInfo.category = tokenClassKey.category;
      nftInfo.type = tokenClassKey.type;
      nftInfo.additionalKey = tokenClassKey.additionalKey;
      nftInfo.instance = tokenClass.totalSupply;
      nftInfo.isNonFungible = true;

      mintedNFTs.push(nftInfo);

      // update balance
      userBalance.addInstance(nftInfo.instance);
    }

    // save instances
    await Promise.all(mintedNFTs.map((nft) => putChainObject(ctx, nft)));

    await putChainObject(ctx, userBalance);
    await putChainObject(ctx, tokenClass);

    const returnKeys: Array<TokenInstanceKey> = [];

    for (const nftInfo of mintedNFTs) {
      returnKeys.push(await TokenInstance.buildInstanceKeyObject(nftInfo));
    }

    await updateTotalSupply(ctx, {
      tokenClassKey,
      callingUser: callingOnBehalf,
      owner,
      quantity,
      allowanceKey: applicableAllowanceKey,
      knownTotalSupply: knownTotalSupply
    });

    return returnKeys;
  } else {
    // Update the balance of the target user, or create it.
    const userBalance = await fetchOrCreateBalance(ctx, owner, tokenClassKey);

    userBalance.addQuantity(quantity);

    // Write the balance to the chain
    await putChainObject(ctx, userBalance);

    tokenClass.totalSupply = tokenClass.totalSupply.plus(quantity);

    await putChainObject(ctx, tokenClass);

    await updateTotalSupply(ctx, {
      tokenClassKey,
      callingUser: callingOnBehalf,
      owner,
      quantity,
      allowanceKey: applicableAllowanceKey,
      knownTotalSupply
    });

    return [dtoInstanceKey];
  }
}

export interface UpdateTokenSupplyParams {
  tokenClassKey: TokenClassKeyProperties;
  callingUser: UserAlias;
  owner: UserAlias;
  quantity: BigNumber;
  allowanceKey?: AllowanceKey | undefined;
  knownTotalSupply?: BigNumber | undefined;
}
// for backwards-compatibility with high throughput total supply data structures
export async function updateTotalSupply(
  ctx: GalaChainContext,
  { tokenClassKey, callingUser, owner, quantity, allowanceKey, knownTotalSupply }: UpdateTokenSupplyParams
): Promise<void> {
  const mintRequest = await writeMintRequest(ctx, {
    tokenClassKey,
    callingUser,
    owner,
    quantity,
    allowanceKey,
    knownTotalSupply
  });

  const mintFulfillmentEntry: TokenMintFulfillment = mintRequest.fulfill(quantity);

  await putChainObject(ctx, mintFulfillmentEntry);
}

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
  ChainError,
  DexNftBatchLimit,
  ErrorCode,
  MintTokenDto,
  NotFoundError,
  Pool,
  TokenBalance,
  TokenClassKey,
  TokenInstanceKey
} from "@gala-chain/api";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import { fetchBalances } from "../balances";
import { mintTokenWithAllowance } from "../mint";
import { createTokenClass } from "../token";
import { transferToken } from "../transfer";
import { GalaChainContext } from "../types";
import { genKey, getObjectByKey, parseNftId } from "../utils";

const LIQUIDITY_TOKEN_CATEGORY = "LiquidityPositions";
const LIQUIDITY_TOKEN_COLLECTION = "NFT";

/**
 * @dev Function to assign an NFT position within a specified pool. The assignPositionNft function
 *      retrieves the existing NFTs for the given pool and assigns a new position. If no NFTs are
 *      found, a new batch is generated. If the last NFT contains only one instance, an additional
 *      batch is created.
 *
 * @param ctx GalaChainContext – The execution context that provides access to the GalaChain environment.
 * @param poolAddrKey string – The unique key identifying the NFT pool.
 * @param poolAlias string – The virtual address associated with the pool.
 *
 * @returns string – The transaction result of transferring the assigned NFT.
 */ export async function assignPositionNft(
  ctx: GalaChainContext,
  poolAddrKey: string,
  poolAlias: string
): Promise<string> {
  let nfts = await fetchPositionNfts(ctx, poolAddrKey, poolAlias);
  let lastNft = nfts.at(-1);

  if (!lastNft) {
    await generatePositionNftBatch(ctx, "1", poolAddrKey, poolAlias);
    nfts = await fetchPositionNfts(ctx, poolAddrKey, poolAlias);
    lastNft = nfts.at(-1)!;
  } else if (lastNft.getNftInstanceIds().length === 1) {
    await generatePositionNftBatch(
      ctx,
      new BigNumber(lastNft.additionalKey).plus(1).toString(),
      poolAddrKey,
      poolAlias
    );
  }

  return await transferPositionNft(ctx, poolAddrKey, poolAlias, lastNft!);
}

/**
 * @dev Function to fetch position NFTs for a given pool. The fetchPositionNfts function retrieves
 *      all NFTs associated with a specified pool and owner by querying the blockchain ledger.
 *
 * @param ctx GalaChainContext – The execution context that provides access to the GalaChain environment.
 * @param poolAddrKey string – The unique key identifying the NFT pool.
 * @param owner string – The address of the owner whose NFTs are being retrieved.
 *
 * @returns Promise<TokenBalance[]> – A promise resolving to the list of NFTs associated with the specified pool and owner.
 */
async function fetchPositionNfts(ctx: GalaChainContext, poolAddrKey: string, owner: string) {
  return fetchBalances(ctx, {
    collection: LIQUIDITY_TOKEN_COLLECTION,
    category: LIQUIDITY_TOKEN_CATEGORY,
    type: poolAddrKey,
    owner
  });
}

/**
 * @dev Function to transfer a position NFT. The transferPositionNft function facilitates the
 *      transfer of a specified NFT instance from one owner to another.
 *
 * @param ctx GalaChainContext – The execution context that provides access to the GalaChain environment.
 * @param poolAddrKey string – The unique key identifying the NFT pool.
 * @param from string – The address of the current owner transferring the NFT.
 * @param nft TokenBalance – The NFT token balance containing the instance to be transferred.
 *
 * @returns Promise<string> – A promise resolving to the generated key of the transferred NFT instance.
 */ async function transferPositionNft(
  ctx: GalaChainContext,
  poolAddrKey: string,
  from: string,
  nft: TokenBalance
): Promise<string> {
  const instanceId = nft.getNftInstanceIds()[0];
  const tokenInstanceKey = TokenInstanceKey.nftKey(
    {
      collection: LIQUIDITY_TOKEN_COLLECTION,
      category: LIQUIDITY_TOKEN_CATEGORY,
      type: poolAddrKey,
      additionalKey: nft.additionalKey
    },
    instanceId
  );

  await transferToken(ctx, {
    from,
    to: ctx.callingUser,
    tokenInstanceKey,
    quantity: new BigNumber(1),
    allowancesToUse: [],
    authorizedOnBehalf: {
      callingOnBehalf: from,
      callingUser: from
    }
  });

  return genKey(nft.additionalKey, instanceId.toString());
}

/**
 * @dev Function to generate a batch of position NFTs. The generatePositionNftBatch function
 *      creates a new batch of NFTs representing liquidity positions
 *
 * @param ctx GalaChainContext – The execution context that provides access to the GalaChain environment.
 * @param batchNumber string – The identifier for the NFT batch being generated.
 * @param poolAddrKey string – The unique key identifying the NFT pool.
 * @param poolAlias string – The virtual address associated with the liquidity pool.
 *
 * @returns Promise<void> – A promise that resolves once the NFT batch has been created and minted.
 */
export async function generatePositionNftBatch(
  ctx: GalaChainContext,
  batchNumber: string,
  poolAddrKey: string,
  poolAlias: string
): Promise<void> {
  const holder = poolAlias;
  const tokenClassKey = plainToInstance(TokenClassKey, {
    collection: LIQUIDITY_TOKEN_COLLECTION,
    category: LIQUIDITY_TOKEN_CATEGORY,
    type: poolAddrKey,
    additionalKey: batchNumber
  });

  // Fetch NFT batch configuration
  const key = ctx.stub.createCompositeKey(DexNftBatchLimit.INDEX_KEY, []);

  const nftBatchLimit = await getObjectByKey(ctx, DexNftBatchLimit, key).catch((e) => {
    const chainError = ChainError.from(e);
    if (chainError.matches(ErrorCode.NOT_FOUND)) {
      return undefined;
    } else {
      throw chainError;
    }
  });

  const maxNftLimit = nftBatchLimit?.maxSupply ?? new BigNumber(100);
  await createTokenClass(ctx, {
    network: "GC",
    tokenClass: tokenClassKey,
    isNonFungible: true,
    decimals: 0,
    name: "Dex Liquidity Positions",
    symbol: "DLP",
    description: "NFTs representing liquidity positions in a decentralized exchange",
    image: "https://static.gala.games/images/icons/units/gala.png",
    maxSupply: maxNftLimit,
    maxCapacity: maxNftLimit,
    totalMintAllowance: new BigNumber(0),
    totalSupply: new BigNumber(0),
    totalBurned: new BigNumber(0),
    authorities: [holder, ctx.callingUser]
  });

  // Mint batch limit number of NFTs in each batch
  for (
    let batch = 0;
    maxNftLimit.dividedToIntegerBy(MintTokenDto.MAX_NFT_MINT_SIZE).isGreaterThanOrEqualTo(batch);
    batch++
  ) {
    await mintTokenWithAllowance(ctx, {
      tokenClassKey,
      tokenInstance: new BigNumber(0),
      owner: holder,
      quantity: maxNftLimit.dividedToIntegerBy(1000).isEqualTo(batch)
        ? maxNftLimit.modulo(MintTokenDto.MAX_NFT_MINT_SIZE)
        : new BigNumber(MintTokenDto.MAX_NFT_MINT_SIZE)
    });
  }
}

/**
 * @dev Function to fetch the NFT ID of a user's liquidity position. The fetchUserPositionNftId
 *      function retrieves the NFT instance associated with a specific liquidity position in a pool,
 *      based on tick values.
 *
 * @param ctx GalaChainContext – The execution context that provides access to the GalaChain environment.
 * @param pool Pool – The pool object containing liquidity positions.
 * @param tickUpper string – The upper tick value of the liquidity position.
 * @param tickLower string – The lower tick value of the liquidity position.
 * @param owner string (Optional) – The address of the owner whose position NFT is being retrieved.
 *                                 Defaults to the calling user if not provided.
 *
 * @returns Promise<string | undefined> – The NFT ID if a matching position is found, otherwise undefined.
 */
export async function fetchUserPositionNftId(
  ctx: GalaChainContext,
  pool: Pool,
  tickUpper: string,
  tickLower: string,
  owner?: string
): Promise<string | undefined> {
  const ownerPositions = await fetchPositionNfts(ctx, pool.getPoolAddrKey(), owner ?? ctx.callingUser);
  if (!ownerPositions.length) return undefined;
  for (const nftBatch of ownerPositions) {
    const batchNumber = nftBatch.additionalKey;

    for (const instanceId of nftBatch.getNftInstanceIds()) {
      const nftId = genKey(batchNumber, instanceId.toString());

      if (
        pool.positions[nftId] &&
        pool.positions[nftId].tickUpper == tickUpper &&
        pool.positions[nftId].tickLower == tickLower
      ) {
        return nftId; // This will properly return from fetchUserPositionNftId
      }
    }
  }
}

/**
 * @dev Function to fetch the token instance key of a position NFT.
 *
 * @param ctx GalaChainContext – The execution context that provides access to the GalaChain environment.
 * @param poolAddrKey string – The unique key identifying the NFT pool.
 * @param nftId string – The identifier of the NFT instance.
 *
 * @returns Promise<TokenInstanceKey> – A promise resolving to the instance key of the specified NFT.
 *
 * @throws NotFoundError – If the specified NFT instance cannot be found.
 */ export async function fetchPositionNftInstanceKey(
  ctx: GalaChainContext,
  poolAddrKey: string,
  nftId: string
): Promise<TokenInstanceKey> {
  const { instanceId, batchNumber } = parseNftId(nftId);
  const nft = await fetchBalances(ctx, {
    collection: LIQUIDITY_TOKEN_COLLECTION,
    category: LIQUIDITY_TOKEN_CATEGORY,
    type: poolAddrKey,
    additionalKey: batchNumber,
    owner: ctx.callingUser
  });

  if (!nft[0].getNftInstanceIds().some((instance) => instance.isEqualTo(instanceId)))
    throw new NotFoundError("Cannot find this NFT");

  const instanceKey = new TokenInstanceKey();
  instanceKey.collection = nft[0].collection;
  instanceKey.category = nft[0].category;
  instanceKey.type = nft[0].type;
  instanceKey.additionalKey = nft[0].additionalKey;
  instanceKey.instance = instanceId;
  return instanceKey;
}

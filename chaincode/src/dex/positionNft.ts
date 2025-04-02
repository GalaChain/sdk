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
import { genKey } from "../utils";

const LIQUIDITY_TOKEN_CATEGORY = "LiquidityPositions";
const LIQUIDITY_TOKEN_TYPE = "NFT";
const MAX_SUPPLY = new BigNumber(MintTokenDto.MAX_NFT_MINT_SIZE);

export const assignPositionNft = async (
  ctx: GalaChainContext,
  poolAddrKey: string,
  poolVirtualAddress: string
): Promise<string> => {
  let nfts = await fetchPositionNfts(ctx, poolAddrKey, poolVirtualAddress);
  let lastNft = nfts.at(-1);

  if (!lastNft) {
    await generatePositionNftBatch(ctx, "1", poolAddrKey, poolVirtualAddress);
    nfts = await fetchPositionNfts(ctx, poolAddrKey, poolVirtualAddress);
    lastNft = nfts.at(-1)!; // Recheck
  } else if (lastNft.getNftInstanceIds().length === 1) {
    await generatePositionNftBatch(
      ctx,
      new BigNumber(lastNft.additionalKey).plus(1).toString(),
      poolAddrKey,
      poolVirtualAddress
    );
  }

  return await transferPositionNft(ctx, poolAddrKey, poolVirtualAddress, lastNft!);
};

const fetchPositionNfts = async (ctx: GalaChainContext, poolAddrKey: string, owner: string) => {
  return fetchBalances(ctx, {
    collection: poolAddrKey,
    category: LIQUIDITY_TOKEN_CATEGORY,
    type: LIQUIDITY_TOKEN_TYPE,
    owner
  });
};

const transferPositionNft = async (
  ctx: GalaChainContext,
  poolAddrKey: string,
  from: string,
  nft: TokenBalance
): Promise<string> => {
  const instanceId = nft.getNftInstanceIds()[0];
  const tokenInstanceKey = new TokenInstanceKey();
  Object.assign(tokenInstanceKey, {
    collection: poolAddrKey,
    category: LIQUIDITY_TOKEN_CATEGORY,
    type: LIQUIDITY_TOKEN_TYPE,
    additionalKey: nft.additionalKey,
    instance: instanceId
  });

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

  return `${nft.additionalKey}_${instanceId.toString()}`;
};

export const generatePositionNftBatch = async (
  ctx: GalaChainContext,
  batchNumber: string,
  poolAddrKey: string,
  poolVirtualAddress: string
): Promise<void> => {
  const holder = poolVirtualAddress;
  const tokenClassKey = plainToInstance(TokenClassKey, {
    collection: poolAddrKey,
    category: LIQUIDITY_TOKEN_CATEGORY,
    type: LIQUIDITY_TOKEN_TYPE,
    additionalKey: batchNumber
  });

  await createTokenClass(ctx, {
    network: "GC",
    tokenClass: tokenClassKey,
    isNonFungible: true,
    decimals: 0,
    name: "Dex Liquidity Positions",
    symbol: "DLP",
    description: "NFTs representing liquidity positions in a decentralized exchange",
    image: "https://static.gala.games/images/icons/units/gala.png",
    maxSupply: MAX_SUPPLY,
    maxCapacity: MAX_SUPPLY,
    totalMintAllowance: new BigNumber(0),
    totalSupply: new BigNumber(0),
    totalBurned: new BigNumber(0),
    authorities: [holder, ctx.callingUser]
  });

  // Mint 10,000 NFTs in each batch
  await mintTokenWithAllowance(ctx, {
    tokenClassKey,
    tokenInstance: new BigNumber(0),
    owner: holder,
    quantity: MAX_SUPPLY
  });
};

export const checkUserPositionNft = async (
  ctx: GalaChainContext,
  pool: Pool,
  tickUpper: string,
  tickLower: string,
  owner?: string
): Promise<string | undefined> => {
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
        return nftId; // This will properly return from checkUserPositionNft
      }
    }
  }
};

export const fetchPositionNftInstanceKey = async (
  ctx: GalaChainContext,
  poolAddrKey: string,
  nftId: string
): Promise<TokenInstanceKey> => {
  const batchNumber = nftId.split("_")[0];
  const nft = await fetchBalances(ctx, {
    collection: poolAddrKey,
    category: LIQUIDITY_TOKEN_CATEGORY,
    type: LIQUIDITY_TOKEN_TYPE,
    additionalKey: batchNumber,
    owner: ctx.callingUser
  });

  const instanceId = new BigNumber(nftId.split("_")[1]);
  if (!nft[0].getNftInstanceIds().some((instance) => instance.isEqualTo(instanceId)))
    throw new NotFoundError("Cannot find this NFT");

  const instanceKey = new TokenInstanceKey();
  instanceKey.collection = nft[0].collection;
  instanceKey.category = nft[0].category;
  instanceKey.type = nft[0].type;
  instanceKey.additionalKey = nft[0].additionalKey;
  instanceKey.instance = instanceId;
  return instanceKey;
};

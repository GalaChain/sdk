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
  ChainCallDTO,
  DexFeeConfig,
  GetAddLiquidityEstimationDto,
  GetAddLiquidityEstimationResDto,
  GetLiquidityResDto,
  GetPoolDto,
  GetPositionDto,
  GetPositionWithNftIdDto,
  GetUserPositionsDto,
  GetUserPositionsResDto,
  IPosition,
  NotFoundError,
  Pool,
  PositionData,
  PositionsObject,
  Slot0ResDto,
  TokenClassKey,
  TokenInstanceKey,
  UnauthorizedError,
  ValidationFailedError,
  genKey,
  sqrtPriceToTick
} from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { fetchBalancesWithTokenMetadata } from "../balances";
import { fetchTokenClass } from "../token";
import { GalaChainContext } from "../types";
import {
  fetchDexProtocolFeeConfig,
  genBookMark,
  generateKeyFromClassKey,
  getObjectByKey,
  splitBookmark,
  validateTokenOrder
} from "../utils";
import { fetchUserPositionNftId } from "./positionNft";

/**
 * @dev The getPoolData function retrieves and returns all publicly available state information of a Uniswap V3 pool within the GalaChain ecosystem. It provides insights into the pool's tick map, liquidity positions, and other essential details.
 * @param ctx GalaChainContext – The execution context providing access to the GalaChain environment.
 * @param dto GetPoolDto – A data transfer object containing:
  - Class keys for the tokens – Identifiers for the token pair in the pool.
 * @returns Pool
 */
export async function getPoolData(ctx: GalaChainContext, dto: GetPoolDto): Promise<Pool | undefined> {
  const [token0, token1] = validateTokenOrder(dto.token0, dto.token1);
  const pool = await getObjectByKey(
    ctx,
    Pool,
    ctx.stub.createCompositeKey(Pool.INDEX_KEY, [token0, token1, dto.fee.toString()])
  ).catch(() => undefined);
  return pool;
}

/**
   * @dev The slot0 function retrieves essential state variables from a Uniswap V3 pool within the GalaChain ecosystem. It provides core details such as the current square root price, tick, and liquidity.
   * @param ctx GalaChainContext – The execution context providing access to the GalaChain environment.
   * @param dto GetPoolDto – A data transfer object containing:
    - Pool identifiers – Class keys or token details needed to fetch the pool data.
   * @returns Slot0ResDto
   */
export async function getSlot0(ctx: GalaChainContext, dto: GetPoolDto): Promise<Slot0ResDto> {
  const pool = await getPoolData(ctx, dto);
  if (!pool) throw new NotFoundError("No pool for these tokens and fee exists");
  return new Slot0ResDto(
    new BigNumber(pool.sqrtPrice),
    sqrtPriceToTick(pool.sqrtPrice),
    new BigNumber(pool.liquidity)
  );
}

/**
   * @dev The liquidity function retrieves the total available liquidity for a specific Uniswap V3 pool within the GalaChain ecosystem.
   * @param ctx GalaChainContext – The execution context providing access to the GalaChain environment.
   * @param dto GetPoolDto – A data transfer object containing:
    - Pool identifiers – Class keys or token details required to identify the pool.
   * @returns string
   */
export async function getLiquidity(ctx: GalaChainContext, dto: GetPoolDto): Promise<GetLiquidityResDto> {
  const pool = await getPoolData(ctx, dto);
  if (!pool) throw new NotFoundError("No pool for these tokens and fee exists");
  return new GetLiquidityResDto(pool.liquidity);
}

/**
   * @dev The positions function retrieves details of a specific liquidity position within a Uniswap V3 pool on the GalaChain ecosystem. It provides insights into the user's position, including token amounts, fees, and other state variables.
   * @param ctx GalaChainContext – The execution context providing access to the GalaChain environment.
   * @param dto GetPositionDto - A data transfer object containing:
   - Pool identifiers – Class keys or token details required to identify the pool.
   - Positions identifier - lower tick, upper tick.
   * @returns PositionData
   */
export async function getPositions(ctx: GalaChainContext, dto: GetPositionDto): Promise<PositionData> {
  const pool = await getPoolData(ctx, dto);
  if (!pool) throw new NotFoundError("No pool for these tokens and fee exists");

  const positionNftId = await fetchUserPositionNftId(
    ctx,
    pool,
    dto.tickUpper.toString(),
    dto.tickLower.toString(),
    dto.owner
  );

  if (!positionNftId) {
    throw new NotFoundError(`User doesn't hold any positions with this tick range in this pool`);
  }

  const position = pool.positions[positionNftId];
  if (!position) {
    throw new NotFoundError(`No position with the nftId ${positionNftId} found in this pool`);
  }

  const [tokensOwed0, tokensOwed1] = pool.getFeeCollectedEstimation(
    positionNftId,
    dto.tickLower,
    dto.tickUpper
  );
  position.tokensOwed0 = new BigNumber(position.tokensOwed0).f18().plus(tokensOwed0.f18()).toString();
  position.tokensOwed1 = new BigNumber(position.tokensOwed1).f18().plus(tokensOwed1.f18()).toString();
  position.nftId = positionNftId;
  return position;
}

/**
   * @dev The positions function retrieves details of a specific liquidity position within the Dex pool on the GalaChain ecosystem. It provides insights into the user's position, including token amounts, fees, and other state variables.
   * @param ctx GalaChainContext – The execution context providing access to the GalaChain environment.
   * @param dto GetPositionDto - A data transfer object containing:
   - Pool identifiers – Class keys or token details required to identify the pool.
   - NFT identifier - unique NFT that identifies a position in a pool
   * @returns PositionData
   */
export async function getPositionWithNftId(
  ctx: GalaChainContext,
  dto: GetPositionWithNftIdDto
): Promise<PositionData> {
  const pool = await getPoolData(ctx, dto);
  if (!pool) throw new NotFoundError("No pool for these tokens and fee exists");

  // Each pool has a unique NFT ID that refers to a position within that pool.
  // Multiple pools can have the same NFT ID, each pointing to a different position in their respective pools.
  const positionNftId = dto.nftId;

  const position = pool.positions[positionNftId];
  if (!position) throw new NotFoundError(`No position with the nftId ${positionNftId} found in this pool`);

  const [tokensOwed0, tokensOwed1] = pool.getFeeCollectedEstimation(
    positionNftId,
    Number(position.tickLower),
    Number(position.tickUpper)
  );
  position.tokensOwed0 = new BigNumber(position.tokensOwed0).f18().plus(tokensOwed0.f18()).toString();
  position.tokensOwed1 = new BigNumber(position.tokensOwed1).f18().plus(tokensOwed1.f18()).toString();
  position.nftId = positionNftId;
  return position;
}

export async function getPoolFromAddressKey(ctx: GalaChainContext, poolAddrKey: string): Promise<Pool> {
  const [token0StringKey, token1StringKey, fee] = poolAddrKey.split("_");
  const token0 = new TokenClassKey();
  [token0.collection, token0.category, token0.type, token0.additionalKey] = token0StringKey
    .replace(/\$\$/g, "$|")
    .split("$")
    .map((str) => str.replace(/\|/g, "$"));
  const token1 = new TokenClassKey();
  [token1.collection, token1.category, token1.type, token1.additionalKey] = token1StringKey
    .replace(/\$\$/g, "$|")
    .split("$")
    .map((str) => str.replace(/\|/g, "$"));
  const pool = await getPoolData(ctx, new GetPoolDto(token0, token1, parseInt(fee)));
  if (!pool) throw new NotFoundError("Pool not found");
  return pool;
}

/**
   * 
   * @dev The getUserPositions function retrieves all liquidity positions owned by a specific user across multiple Uniswap V3 pools within the GalaChain ecosystem. It provides details on the user's staked liquidity and associated rewards.
   * @param ctx GalaChainContext – The execution context providing access to the GalaChain environment.
   * @param dto GetUserPositionsDto – A data transfer object containing:
    - User address – The identifier for the user whose positions are being queried.
   * @returns GetUserPositionsResDto
   */
export async function getUserPositions(
  ctx: GalaChainContext,
  dto: GetUserPositionsDto
): Promise<GetUserPositionsResDto> {
  const { chainBookmark, localBookmark } = splitBookmark(dto.bookmark);

  let currentPageBookmark = chainBookmark;
  let positionsToSkip = Number(localBookmark);
  let nftsRequired = dto.limit;
  let newLocalBookmark = positionsToSkip + nftsRequired;
  let isLastIteration = false;
  const userPositions: PositionsObject = {};

  do {
    const userNfts = await fetchBalancesWithTokenMetadata(ctx, {
      collection: "DexNFT",
      category: "LiquidityPositions",
      owner: dto.user,
      limit: dto.limit,
      bookmark: currentPageBookmark
    });
    newLocalBookmark = positionsToSkip + nftsRequired;

    const allNfts = userNfts.results.flatMap(({ balance }) => {
      return balance.getNftInstanceIds().map((nftInstanceId) => ({
        poolAddrKey: balance.type,
        nftInstanceId,
        additionalKey: balance.additionalKey
      }));
    });

    if (positionsToSkip >= allNfts.length) {
      positionsToSkip -= allNfts.length;
      currentPageBookmark = userNfts.nextPageBookmark ?? "";
      continue;
    }

    const selectedNft = allNfts.slice(positionsToSkip);
    positionsToSkip = 0;

    for (const [nftIndex, nft] of selectedNft.entries()) {
      const pool = await getPoolFromAddressKey(ctx, nft.poolAddrKey);
      userPositions[nft.poolAddrKey] = userPositions[nft.poolAddrKey] || [];
      const nftId = genKey(nft.additionalKey, nft.nftInstanceId.toString());
      userPositions[nft.poolAddrKey].push(pool.positions[nftId]);
      nftsRequired--;
      isLastIteration = nftIndex === selectedNft.length - 1;
      if (nftsRequired === 0) break;
    }

    currentPageBookmark = isLastIteration ? userNfts.nextPageBookmark ?? "" : currentPageBookmark;
  } while (nftsRequired && currentPageBookmark);

  if (positionsToSkip) {
    throw new ValidationFailedError("Invalid bookmark");
  }

  const newBookmark =
    !currentPageBookmark && isLastIteration
      ? ""
      : genBookMark(currentPageBookmark, isLastIteration ? "" : newLocalBookmark.toString());

  const userPositionWithMetadata = userPositions
    ? await addMetaDataToPositions(ctx, userPositions)
    : userPositions;
  return new GetUserPositionsResDto(userPositionWithMetadata, newBookmark);
}

/**
   * @dev The getAddLiquidityEstimation function estimates the required token amounts and liquidity when adding liquidity to a Uniswap V3 pool within the GalaChain ecosystem.
   * @param ctx GalaChainContext – The execution context providing access to the GalaChain environment.
   * @param dto GetAddLiquidityEstimationDto – A data transfer object containing:
      token0 – The first token of the pool.
      or
      token1 – The second token of the pool.
      Liquidity parameters – Details related to the amount of liquidity to be added.
   * @returns Promise<String[]> – An array containing:
    - Estimated token0 amount required for the liquidity addition.
    - Estimated token1 amount required for the liquidity addition.
    - Liquidity amount that will be received in return.
  
   */
export async function getAddLiquidityEstimation(
  ctx: GalaChainContext,
  dto: GetAddLiquidityEstimationDto
): Promise<GetAddLiquidityEstimationResDto> {
  const [token0, token1] = [dto.token0, dto.token1].map(generateKeyFromClassKey);
  if (token0.localeCompare(token1) > 0) {
    throw new ValidationFailedError("Token0 must be smaller");
  }
  const zeroForOne = dto.zeroForOne;
  const tickLower = parseInt(dto.tickLower.toString()),
    tickUpper = parseInt(dto.tickUpper.toString());
  const getPool = new GetPoolDto(dto.token0, dto.token1, dto.fee);
  const pool = await getPoolData(ctx, getPool);
  if (!pool) throw new NotFoundError("No pool for these tokens and fee exists");
  const amounts = pool.getAmountForLiquidity(dto.amount, tickLower, tickUpper, zeroForOne);

  return new GetAddLiquidityEstimationResDto(amounts[0], amounts[1], amounts[2]);
}

/**
 *
 * @param ctx GalaChainContext – The execution context providing access to the GalaChain environment.
 * @param dto ChainCallDTO Empty call to verify signature
 * @returns DexFeeConfig
 */
export async function getDexFeesConfigration(
  ctx: GalaChainContext,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  dto: ChainCallDTO
): Promise<DexFeeConfig> {
  const curatorOrgMsp = process.env.CURATOR_ORG_MSP ?? "CuratorOrg";

  const dexConfig = await fetchDexProtocolFeeConfig(ctx);

  if (ctx.clientIdentity.getMSPID() !== curatorOrgMsp) {
    throw new UnauthorizedError(`CallingUser ${ctx.callingUser} is not authorized to create or update`);
  }

  if (!dexConfig) {
    throw new NotFoundError(
      "Platform fee configuration has yet to be defined. Platform fee configuration is not defined."
    );
  } else if (!dexConfig.authorities.includes(ctx.callingUser)) {
    throw new UnauthorizedError(`CallingUser ${ctx.callingUser} is not authorized to create or update`);
  }
  return dexConfig;
}

/**
 *
 * @param ctx GalaChainContext – The execution context providing access to the GalaChain environment.
 * @param positions All user positions
 * @returns Modified user Positions by adding few properites like img, symbol etc.
 */
async function addMetaDataToPositions(
  ctx: GalaChainContext,
  positions: PositionsObject
): Promise<PositionsObject> {
  for (const [key, value] of Object.entries(positions)) {
    const pool = await getPoolFromAddressKey(ctx, key);
    const tokenInstanceKeys = [pool.token0ClassKey, pool.token1ClassKey].map(
      ({ collection, category, type, additionalKey }) =>
        Object.assign(new TokenInstanceKey(), {
          collection,
          category,
          type,
          additionalKey,
          instance: new BigNumber(0)
        })
    );

    const token0Data = await fetchTokenClass(ctx, tokenInstanceKeys[0]);
    const token1Data = await fetchTokenClass(ctx, tokenInstanceKeys[1]);

    value.forEach((e: IPosition) => {
      e.token0Img = token0Data.image;
      e.token1Img = token1Data.image;
      e.token0InstanceKey = tokenInstanceKeys[0];
      e.token1InstanceKey = tokenInstanceKeys[1];
      e.token0Symbol = token0Data.symbol;
      e.token1Symbol = token1Data.symbol;
    });
  }
  return positions;
}

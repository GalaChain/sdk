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
  DefaultError,
  DexFeeConfig,
  GetAddLiquidityEstimationDto,
  GetAddLiquidityEstimationResDto,
  GetLiquidityResDto,
  GetPoolDto,
  GetPositionDto,
  GetUserPositionsDto,
  GetUserPositionsResDto,
  IPosition,
  NotFoundError,
  Pool,
  PositionsObject,
  Slot0ResDto,
  TokenClassKey,
  TokenInstanceKey,
  UnauthorizedError,
  UserPosition,
  positionInfoDto,
  sqrtPriceToTick
} from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { fetchTokenClass } from "../token";
import { GalaChainContext } from "../types";
import {
  fetchDexProtocolFeeConfig,
  genKeyWithPipe,
  generateKeyFromClassKey,
  getObjectByKey,
  validateTokenOrder
} from "../utils";

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
  if (!pool) throw new DefaultError("No pool for these tokens and fee exists");
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
  if (!pool) throw new DefaultError("No pool for these tokens and fee exists");
  return new GetLiquidityResDto(pool.liquidity);
}

/**
   * @dev The positions function retrieves details of a specific liquidity position within a Uniswap V3 pool on the GalaChain ecosystem. It provides insights into the user's position, including token amounts, fees, and other state variables.
   * @param ctx GalaChainContext – The execution context providing access to the GalaChain environment.
   * @param dto GetPositionDto - A data transfer object containing:
   - Pool identifiers – Class keys or token details required to identify the pool.
   - Positions identifier - lower tick, upper tick.
   * @returns positionInfoDto
   */
export async function getPositions(ctx: GalaChainContext, dto: GetPositionDto): Promise<positionInfoDto> {
  const pool = await getPoolData(ctx, dto);
  const key = genKeyWithPipe(dto.owner, dto.tickLower.toString(), dto.tickUpper.toString());
  if (!pool) throw new DefaultError("No pool for these tokens and fee exists");
  return pool.positions[key];
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
  const userPositions = await getObjectByKey(
    ctx,
    UserPosition,
    ctx.stub.createCompositeKey(UserPosition.INDEX_KEY, [dto.user])
  );
  let paginatedPositions: PositionsObject = {};
  if (dto.page && dto.limit) {
    paginatedPositions = paginateLiquidityData(userPositions.positions, dto.page, dto.limit);
  }
  const metaDataPositions = await addMetaDataToPositions(
    ctx,
    paginatedPositions ? paginatedPositions : userPositions.positions
  );
  const count = Object.values(userPositions.positions as PositionsObject).reduce(
    (sum, arr) => sum + arr.length,
    0
  );
  const response: GetUserPositionsResDto = { positions: metaDataPositions, totalCount: count };
  return response;
}
/**
 * @dev The paginateLiquidityData function implements pagination for a list of liquidity positions, allowing users to retrieve position data in smaller, manageable chunks.
 * @param data PositionsObject – The complete dataset containing all liquidity positions.
 * @param page number – The current page number (1-based index).
 * @param limit number – The number of records to return per page.
 * @returns PositionsObject
 */
export function paginateLiquidityData(data: PositionsObject, page: number, limit: number): PositionsObject {
  const startIndex = (page - 1) * limit;
  return Object.entries(data)
    .flatMap(([pair, entries]) => entries.map((entry) => ({ ...entry, pair })))
    .slice(startIndex, startIndex + limit)
    .reduce((acc, entry) => {
      const { pair, ...entryWithoutPair } = entry;
      (acc[pair] ||= []).push(entryWithoutPair);
      return acc;
    }, {} as PositionsObject);
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
    throw new Error("Token0 must be smaller");
  }
  const zeroForOne = dto.zeroForOne;
  const tickLower = parseInt(dto.tickLower.toString()),
    tickUpper = parseInt(dto.tickUpper.toString());
  const getPool = new GetPoolDto(dto.token0, dto.token1, dto.fee);
  const pool = await getPoolData(ctx, getPool);
  if (!pool) throw new DefaultError("No pool for these tokens and fee exists");
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
    const poolKeys = key.split("_");

    const poolToken0ClassKey = new TokenClassKey();
    const token0ClassKeyString = poolKeys[0].split("$");
    poolToken0ClassKey.collection = token0ClassKeyString[0];
    poolToken0ClassKey.category = token0ClassKeyString[1];
    poolToken0ClassKey.type = token0ClassKeyString[2];
    poolToken0ClassKey.additionalKey = token0ClassKeyString[3];

    const poolToken1ClassKey = new TokenClassKey();
    const token1ClassKeyString = poolKeys[1].split("$");
    poolToken1ClassKey.collection = token1ClassKeyString[0];
    poolToken1ClassKey.category = token1ClassKeyString[1];
    poolToken1ClassKey.type = token1ClassKeyString[2];
    poolToken1ClassKey.additionalKey = token1ClassKeyString[3];

    const pool = await getPoolData(
      ctx,
      new GetPoolDto(poolToken0ClassKey, poolToken1ClassKey, Number(poolKeys[2]))
    );
    if (!pool) {
      continue;
    }
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

import {
  DefaultError,
  ExpectedTokenDTO,
  GetPoolDto,
  GetPositionDto,
  GetUserPositionResponse,
  GetUserPositionsDto,
  Pool,
  PositionsObject,
  Slot0Dto,
  TokenClassKey,
  TokenInstanceKey,
  formatBigNumber,
  positionInfoDto,
  sqrtPriceToTick
} from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { fetchTokenClass } from "../token";
import { GalaChainContext } from "../types";
import { genKeyWithPipe, generateKeyFromClassKey, getObjectByKey, validateTokenOrder } from "../utils";
import { UserPosition } from "./userpositions";

/**
 * @dev
 * @param ctx
 * @param dto
 * @returns
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

export async function slot0(ctx: GalaChainContext, dto: GetPoolDto): Promise<Slot0Dto> {
  const pool = await getPoolData(ctx, dto);
  if (!pool) throw new DefaultError("No pool for these tokens and fee exists");
  return new Slot0Dto(
    new BigNumber(pool.sqrtPrice),
    sqrtPriceToTick(pool.sqrtPrice),
    new BigNumber(pool.liquidity)
  );
}

export async function liquidity(ctx: GalaChainContext, dto: GetPoolDto): Promise<string> {
  const pool = await getPoolData(ctx, dto);
  if (!pool) throw new DefaultError("No pool for these tokens and fee exists");
  return pool.liquidity.toString();
}

export async function positions(ctx: GalaChainContext, dto: GetPositionDto): Promise<positionInfoDto> {
  const pool = await getPoolData(ctx, dto);
  let key = genKeyWithPipe(dto.owner, dto.tickLower.toString(), dto.tickUpper.toString());
  if (!pool) throw new DefaultError("No pool for these tokens and fee exists");
  return formatBigNumber(pool.positions[key]);
}

export async function getUserPositions(
  ctx: GalaChainContext,
  dto: GetUserPositionsDto
): Promise<GetUserPositionResponse> {
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
  const count = Object.values(userPositions.positions).reduce((sum, arr) => sum + arr.length, 0);
  const response: GetUserPositionResponse = { positions: metaDataPositions, totalCount: count };
  return response;
}

export function paginateLiquidityData(data: PositionsObject, page: number, limit: number): PositionsObject {
  const startIndex = (page - 1) * limit;
  return Object.entries(data)
    .flatMap(([pair, entries]) => entries.map((entry) => ({ ...entry, pair })))
    .slice(startIndex, startIndex + limit)
    .reduce((acc, entry) => {
      const { pair, ...entryWithoutPair } = entry;
      (acc[entry.pair] ||= []).push(entryWithoutPair);
      return acc;
    }, {} as PositionsObject);
}

export async function getAddLiquidityEstimation(
  ctx: GalaChainContext,
  dto: ExpectedTokenDTO
): Promise<String[]> {
  const [token0, token1] = [dto.token0, dto.token1].map(generateKeyFromClassKey);
  if (token0.localeCompare(token1) > 0) {
    throw new Error("Token0 must be smaller");
  }
  let zeroForOne = dto.zeroForOne;
  let tickLower = parseInt(dto.tickLower.toString()),
    tickUpper = parseInt(dto.tickUpper.toString());
  const getPool = new GetPoolDto(dto.token0, dto.token1, dto.fee);
  const pool = await getPoolData(ctx, getPool);
  if (!pool) throw new DefaultError("No pool for these tokens and fee exists");
  const amounts = pool.getAmountForLiquidity(dto.amount, tickLower, tickUpper, zeroForOne);

  return formatBigNumber(amounts);
}

async function addMetaDataToPositions(ctx: GalaChainContext, positions: PositionsObject) {
  for (let [key, value] of Object.entries(positions)) {
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

    value.forEach((e: any) => {
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

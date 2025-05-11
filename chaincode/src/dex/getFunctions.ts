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
  ChainError,
  DexFeeConfig,
  ErrorCode,
  GetAddLiquidityEstimationDto,
  GetAddLiquidityEstimationResDto,
  GetLiquidityResDto,
  GetPoolDto,
  NotFoundError,
  Pool,
  Slot0ResDto,
  UnauthorizedError,
  ValidationFailedError,
  sqrtPriceToTick
} from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { GalaChainContext } from "../types";
import { getObjectByKey } from "../utils";
import { fetchDexProtocolFeeConfig, generateKeyFromClassKey, validateTokenOrder } from "./dexUtils";

/**
 * @dev The getPoolData function retrieves and returns all publicly available state information of a Decentralized exchange pool within the GalaChain ecosystem. It provides insights into the pool's tick map, liquidity positions, and other essential details.
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
  ).catch((e) => {
    const chainError = ChainError.from(e);
    if (chainError.matches(ErrorCode.NOT_FOUND)) {
      return undefined;
    } else {
      throw chainError;
    }
  });
  return pool;
}

/**
   * @dev The slot0 function retrieves essential state variables from a Decentralized exchange pool within the GalaChain ecosystem. It provides core details such as the current square root price, tick, and liquidity.
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
   * @dev The liquidity function retrieves the total available liquidity for a specific Decentralized exchange pool within the GalaChain ecosystem.
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
   * @dev The getAddLiquidityEstimation function estimates the required token amounts and liquidity when adding liquidity to a Decentralized exchange pool within the GalaChain ecosystem.
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

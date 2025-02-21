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
  AddLiquidityDTO,
  AddLiquidityResponseDTO,
  ConflictError,
  Pool,
  UserBalanceResponseDto,
  UserPosition,
  formatBigNumber,
  getLiquidityForAmounts,
  tickToSqrtPrice
} from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { fetchOrCreateBalance } from "../balances";
import { fetchTokenClass } from "../token";
import { transferToken } from "../transfer";
import { GalaChainContext } from "../types";
import {
  convertToTokenInstanceKey,
  genKey,
  getObjectByKey,
  putChainObject,
  validateTokenOrder,
  virtualAddress
} from "../utils";

/**
 * @dev Function to add Liqudity to v3 pool. The addLiquidity function facilitates the addition of liquidity to a Uniswap V3 pool within the GalaChain ecosystem. It takes in the blockchain context, liquidity parameters, and an optional launchpad address, then executes the necessary operations to deposit assets into the specified liquidity pool.
 * @param ctx GalaChainContext – The execution context that provides access to the GalaChain environment.
 * @param dto AddLiquidityDTO – A data transfer object containing liquidity details such as token amounts, pool parameters, and fee tiers.
 * @param launchpadAddress string – (Optional) The address of a launchpad contract if liquidity is being added via a specific launchpad mechanism.
 * @returns AddLiquidityResponseDTO
 */
export async function addLiquidity(ctx: GalaChainContext, dto: AddLiquidityDTO, launchpadAddress?: string) {
  const [token0, token1] = validateTokenOrder(dto.token0, dto.token1);

  const key = ctx.stub.createCompositeKey(Pool.INDEX_KEY, [token0, token1, dto.fee.toString()]);
  const pool = await getObjectByKey(ctx, Pool, key);

  //If pool does not exist
  if (pool == undefined) throw new ConflictError("Pool does not exist");
  const currentSqrtPrice = pool.sqrtPrice;

  //create tokenInstanceKeys
  const token0InstanceKey = convertToTokenInstanceKey(pool.token0ClassKey);
  const token1InstanceKey = convertToTokenInstanceKey(pool.token1ClassKey);

  //fetch token classes
  const token0Class = await fetchTokenClass(ctx, token0InstanceKey);
  const token1Class = await fetchTokenClass(ctx, token1InstanceKey);

  //get token amounts required for the desired liquidity
  const owner = ctx.callingUser;

  let tickLower = parseInt(dto.tickLower.toString()),
    tickUpper = parseInt(dto.tickUpper.toString());

  let amount0Desired = dto.amount0Desired.f18(),
    amount1Desired = dto.amount1Desired.f18();
  let amount0Min = dto.amount0Min.f18(),
    amount1Min = dto.amount1Min.f18();

  const sqrtRatioA = tickToSqrtPrice(tickLower),
    sqrtRatioB = tickToSqrtPrice(tickUpper);

  const liquidity = getLiquidityForAmounts(
    currentSqrtPrice,
    sqrtRatioA,
    sqrtRatioB,
    amount0Desired,
    amount1Desired
  );
  let [amount0, amount1] = pool.mint(owner, tickLower, tickUpper, liquidity.f18());
  [amount0, amount1] = [amount0.f18(), amount1.f18()];

  if (
    amount0.lt(amount0Min) ||
    amount1.lt(amount1Min) ||
    amount0.gt(amount0Desired) ||
    amount1.gt(amount1Desired)
  ) {
    throw new Error(
      "Slippage check Failed, should be amount0: " +
        amount0Min.toString() +
        " <" +
        amount0.toString() +
        " <= " +
        amount0Desired.toString() +
        " amount1: " +
        amount1Min.toString() +
        " < " +
        amount1.toString() +
        " <= " +
        amount1Desired.toString() +
        " liquidity: " +
        liquidity.toString()
    );
  }

  const userKey = ctx.stub.createCompositeKey(UserPosition.INDEX_KEY, [owner]);
  let userPostion = await getObjectByKey(ctx, UserPosition, userKey).catch(() => undefined);

  const poolAddrKey = genKey(pool.token0, pool.token1, pool.fee.toString());
  const poolVirtualAddress = virtualAddress(poolAddrKey);

  if (userPostion === undefined) userPostion = new UserPosition(owner);
  userPostion.updateOrCreate(poolAddrKey, tickLower, tickUpper, liquidity.f18());

  const liquidityProvider = launchpadAddress ? launchpadAddress : ctx.callingUser;
  if (amount0.isGreaterThan(0)) {
    // transfer token0
    await transferToken(ctx, {
      from: liquidityProvider,
      to: poolVirtualAddress,
      tokenInstanceKey: token0InstanceKey,
      quantity: new BigNumber(amount0).decimalPlaces(token0Class.decimals, BigNumber.ROUND_DOWN),
      allowancesToUse: [],
      authorizedOnBehalf: {
        callingOnBehalf: liquidityProvider,
        callingUser: liquidityProvider
      }
    });
  }
  if (amount1.isGreaterThan(0)) {
    // transfer token1
    await transferToken(ctx, {
      from: liquidityProvider,
      to: poolVirtualAddress,
      tokenInstanceKey: token1InstanceKey,
      quantity: new BigNumber(amount1).decimalPlaces(token1Class.decimals, BigNumber.ROUND_DOWN),
      allowancesToUse: [],
      authorizedOnBehalf: {
        callingOnBehalf: liquidityProvider,
        callingUser: liquidityProvider
      }
    });
  }

  await putChainObject(ctx, pool);
  await putChainObject(ctx, userPostion);

  const liquidityProviderToken0Balance = await fetchOrCreateBalance(ctx, ctx.callingUser, token0InstanceKey);
  const liquidityProviderToken1Balance = await fetchOrCreateBalance(ctx, ctx.callingUser, token1InstanceKey);
  const userBalances = new UserBalanceResponseDto(
    liquidityProviderToken0Balance,
    liquidityProviderToken1Balance
  );
  const response = new AddLiquidityResponseDTO(userBalances, formatBigNumber([amount0, amount1]));
  return response;
}

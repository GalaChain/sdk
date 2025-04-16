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
  BurnDto,
  ConflictError,
  Pool,
  SlippageToleranceExceededError,
  UserBalanceResDto,
  UserPosition
} from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { fetchOrCreateBalance } from "../balances";
import { fetchTokenClass } from "../token";
import { transferToken } from "../transfer";
import { GalaChainContext } from "../types";
import {
  areTicksValid,
  convertToTokenInstanceKey,
  genKey,
  getObjectByKey,
  putChainObject,
  validateTokenOrder,
  virtualAddress
} from "../utils";

/**
 * @dev The burn function is responsible for removing liquidity from a Uniswap V3 pool within the GalaChain ecosystem. It executes the necessary operations to burn the liquidity position and transfer the corresponding tokens back to the user.
 * @param ctx GalaChainContext – The execution context that provides access to the GalaChain environment.
 * @param dto BurnDto – A data transfer object containing the details of the liquidity position to be burned, including the pool, and position ID.
 * @returns UserBalanceResDto
 */
export async function burn(ctx: GalaChainContext, dto: BurnDto): Promise<UserBalanceResDto> {
  areTicksValid(dto.tickLower, dto.tickUpper);
  const [token0, token1] = validateTokenOrder(dto.token0, dto.token1);

  const key = ctx.stub.createCompositeKey(Pool.INDEX_KEY, [token0, token1, dto.fee.toString()]);
  const pool = await getObjectByKey(ctx, Pool, key);

  //If pool does not exist
  if (pool == undefined) throw new ConflictError("Pool does not exist");

  const owner = ctx.callingUser;

  const userKey = ctx.stub.createCompositeKey(UserPosition.INDEX_KEY, [owner]);
  const poolAddrKey = genKey(pool.token0, pool.token1, pool.fee.toString());
  const poolVirtualAddress = virtualAddress(poolAddrKey);
  const userPosition = await getObjectByKey(ctx, UserPosition, userKey).catch(() => undefined);
  if (!userPosition) throw new ConflictError("User position does not exist");

  const tickLower = parseInt(dto.tickLower.toString()),
    tickUpper = parseInt(dto.tickUpper.toString());
  userPosition.removeLiquidity(poolAddrKey, tickLower, tickUpper, dto.amount.f18());

  const amounts = pool.burn(owner, tickLower, tickUpper, dto.amount.f18());
  if (amounts[0].lt(dto.amount0Min) || amounts[1].lt(dto.amount1Min)) {
    throw new SlippageToleranceExceededError(
      `Slippage check failed: amount0: ${dto.amount0Min.toString()} <= ${amounts[0].toString()}, amount1: ${dto.amount1Min.toString()} <= ${amounts[1].toString()}`
    );
  }
  const userPositionKey = `${owner}_${tickLower}_${tickUpper}`;

  const position = pool.positions[userPositionKey];
  const deleteUserPos =
    new BigNumber(position.tokensOwed0).f18().isZero() &&
    new BigNumber(position.tokensOwed1).f18().isZero() &&
    new BigNumber(position.liquidity).f18().isZero();

  if (deleteUserPos) {
    delete pool.positions[userPositionKey];
    userPosition.deletePosition(poolAddrKey, tickLower, tickUpper);
  }

  //create tokenInstanceKeys
  const tokenInstanceKeys = [pool.token0ClassKey, pool.token1ClassKey].map(convertToTokenInstanceKey);

  //fetch token classes
  const tokenClasses = await Promise.all(tokenInstanceKeys.map((key) => fetchTokenClass(ctx, key)));

  for (const [index, amount] of amounts.entries()) {
    if (amount.gt(0)) {
      const poolTokenBalance = await fetchOrCreateBalance(
        ctx,
        poolVirtualAddress,
        tokenInstanceKeys[index].getTokenClassKey()
      );
      const roundedAmount = BigNumber.min(
        new BigNumber(amount.toFixed(tokenClasses[index].decimals)).abs(),
        poolTokenBalance.getQuantityTotal()
      );

      await transferToken(ctx, {
        from: poolVirtualAddress,
        to: ctx.callingUser,
        tokenInstanceKey: tokenInstanceKeys[index],
        quantity: roundedAmount,
        allowancesToUse: [],
        authorizedOnBehalf: {
          callingOnBehalf: poolVirtualAddress,
          callingUser: poolVirtualAddress
        }
      });
    }
  }
  await putChainObject(ctx, userPosition);
  await putChainObject(ctx, pool);

  const liquidityProviderToken0Balance = await fetchOrCreateBalance(
    ctx,
    ctx.callingUser,
    tokenInstanceKeys[0]
  );
  const liquidityProviderToken1Balance = await fetchOrCreateBalance(
    ctx,
    ctx.callingUser,
    tokenInstanceKeys[1]
  );
  const response = new UserBalanceResDto(liquidityProviderToken0Balance, liquidityProviderToken1Balance);
  return response;
}

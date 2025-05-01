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
  BurnTokenQuantity,
  ConflictError,
  NotFoundError,
  Pool,
  UserBalanceResDto
} from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { fetchOrCreateBalance } from "../balances";
import { burnTokens } from "../burns";
import { fetchTokenClass } from "../token";
import { transferToken } from "../transfer";
import { GalaChainContext } from "../types";
import { convertToTokenInstanceKey, getObjectByKey, putChainObject, validateTokenOrder } from "../utils";
import { fetchPositionNftInstanceKey, fetchUserPositionNftId } from "./positionNft";

/**
 * @dev The burn function is responsible for removing liquidity from a Uniswap V3 pool within the GalaChain ecosystem. It executes the necessary operations to burn the liquidity position and transfer the corresponding tokens back to the user.
 * @param ctx GalaChainContext – The execution context that provides access to the GalaChain environment.
 * @param dto BurnDto – A data transfer object containing the details of the liquidity position to be burned, including the pool, and position ID.
 * @returns UserBalanceResDto
 */
export async function burn(ctx: GalaChainContext, dto: BurnDto): Promise<UserBalanceResDto> {
  const [token0, token1] = validateTokenOrder(dto.token0, dto.token1);

  const key = ctx.stub.createCompositeKey(Pool.INDEX_KEY, [token0, token1, dto.fee.toString()]);
  const pool = await getObjectByKey(ctx, Pool, key);

  //If pool does not exist
  if (pool == undefined) throw new ConflictError("Pool does not exist");

  const poolAddrKey = pool.getPoolAddrKey();
  const poolVirtualAddress = pool.getPoolAlias();

  const positionNftId = await fetchUserPositionNftId(
    ctx,
    pool,
    dto.tickUpper.toString(),
    dto.tickLower.toString()
  );

  if (!positionNftId)
    throw new NotFoundError(`User doesn't hold any positions with this tick range in this pool`);

  const tickLower = parseInt(dto.tickLower.toString()),
    tickUpper = parseInt(dto.tickUpper.toString());

  const amounts = pool.burn(positionNftId, tickLower, tickUpper, dto.amount.f18());

  const position = pool.positions[positionNftId];
  const deleteUserPos =
    new BigNumber(position.tokensOwed0).f18().isLessThan(new BigNumber("0.00000001")) &&
    new BigNumber(position.tokensOwed1).f18().isLessThan(new BigNumber("0.00000001")) &&
    new BigNumber(position.liquidity).f18().isLessThan(new BigNumber("0.00000001"));

  if (deleteUserPos) {
    delete pool.positions[positionNftId];
    const burnTokenQuantity = new BurnTokenQuantity();
    burnTokenQuantity.tokenInstanceKey = await fetchPositionNftInstanceKey(ctx, poolAddrKey, positionNftId);
    burnTokenQuantity.quantity = new BigNumber(1);
    await burnTokens(ctx, {
      owner: ctx.callingUser,
      toBurn: [burnTokenQuantity]
    });
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

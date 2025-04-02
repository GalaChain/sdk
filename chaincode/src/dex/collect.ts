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
  BurnTokenQuantity,
  CollectDto,
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
import { checkUserPositionNft, fetchPositionNftInstanceKey } from "./positionNft";

/**
 * @dev The collect function allows a user to claim and withdraw accrued fee tokens from a specific liquidity position in a Uniswap V3 pool within the GalaChain ecosystem. It retrieves earned fees based on the user's position details and transfers them to the user's account.
 * @param ctx  GalaChainContext – The execution context providing access to the GalaChain environment.
 * @param dto Position details (pool information, tickUpper, tickLower).

 * @returns UserBalanceResDto
 */
export async function collect(ctx: GalaChainContext, dto: CollectDto): Promise<UserBalanceResDto> {
  const [token0, token1] = validateTokenOrder(dto.token0, dto.token1);
  const key = ctx.stub.createCompositeKey(Pool.INDEX_KEY, [token0, token1, dto.fee.toString()]);
  const pool = await getObjectByKey(ctx, Pool, key);
  const [amount0Requested, amount1Requested] = [dto.amount0Requested.f18(), dto.amount1Requested.f18()];

  //If pool does not exist
  if (pool == undefined) throw new ConflictError("Pool does not exist");

  const poolAddrKey = pool.getPoolAddrKey();
  const poolVirtualAddress = pool.getPoolVirtualAddress();
  const positionNftId = await checkUserPositionNft(
    ctx,
    pool,
    dto.tickUpper.toString(),
    dto.tickLower.toString()
  );
  if (!positionNftId)
    throw new NotFoundError(`User doesn't hold any positions with this tick range in this pool`);

  const tickLower = parseInt(dto.tickLower.toString()),
    tickUpper = parseInt(dto.tickUpper.toString());

  const amounts = pool.collect(positionNftId, tickLower, tickUpper, amount0Requested, amount1Requested);

  const position = pool.positions[positionNftId];
  const deleteUserPos =
    new BigNumber(position.tokensOwed0).f18().isZero() &&
    new BigNumber(position.tokensOwed1).f18().isZero() &&
    new BigNumber(position.liquidity).f18().isZero();

  if (deleteUserPos) {
    delete pool.positions[positionNftId];
    const burnTokenQuantity = new BurnTokenQuantity();
    burnTokenQuantity.tokenInstanceKey = await fetchPositionNftInstanceKey(ctx, poolAddrKey, positionNftId);
    burnTokenQuantity.quantity = new BigNumber(1);
    await burnTokens(ctx, {
      owner: ctx.callingUser,
      toBurn: [burnTokenQuantity],
      preValidated: true
    });
  }
  await putChainObject(ctx, pool);

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

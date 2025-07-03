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
  CollectDto,
  DexOperationResDto,
  NotFoundError,
  Pool,
  TokenInstanceKey,
  UserBalanceResDto,
  f18
} from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { fetchOrCreateBalance } from "../balances";
import { transferToken } from "../transfer";
import { GalaChainContext } from "../types";
import { getObjectByKey, putChainObject } from "../utils";
import { NegativeAmountError } from "./dexError";
import { getTokenDecimalsFromPool, roundTokenAmount, validateTokenOrder } from "./dexUtils";
import { fetchUserPositionInTickRange } from "./position.helper";
import { fetchOrCreateTickDataPair } from "./tickData.helper";
import { updateOrRemovePosition } from "./updateOrRemovePosition";

/**
 * @dev The collect function allows a user to claim and withdraw accrued fee tokens from a specific liquidity position in a Decentralized exchange pool within the GalaChain ecosystem. It retrieves earned fees based on the user's position details and transfers them to the user's account.
 * @param ctx  GalaChainContext – The execution context providing access to the GalaChain environment.
 * @param dto Position details (pool information, tickUpper, tickLower).

 * @returns DexOperationResDto
 */
export async function collect(ctx: GalaChainContext, dto: CollectDto): Promise<DexOperationResDto> {
  // Validate token order and fetch pool and positions
  const [token0, token1] = validateTokenOrder(dto.token0, dto.token1);
  const key = ctx.stub.createCompositeKey(Pool.INDEX_KEY, [token0, token1, dto.fee.toString()]);
  const pool = await getObjectByKey(ctx, Pool, key);

  const poolHash = pool.genPoolHash();
  const poolAlias = pool.getPoolAlias();
  const position = await fetchUserPositionInTickRange(
    ctx,
    poolHash,
    dto.tickUpper,
    dto.tickLower,
    dto.positionId
  );
  if (!position) throw new NotFoundError(`User doesn't hold any positions with this tick range in this pool`);

  // Create token instance keys and fetch token decimals
  const tokenInstanceKeys = [pool.token0ClassKey, pool.token1ClassKey].map(TokenInstanceKey.fungibleKey);
  const tokenDecimals = await getTokenDecimalsFromPool(ctx, pool);

  // Adjust tokens being payed out to the position holder based on the pool's token balances
  const poolToken0Balance = await fetchOrCreateBalance(
    ctx,
    poolAlias,
    tokenInstanceKeys[0].getTokenClassKey()
  );
  const poolToken1Balance = await fetchOrCreateBalance(
    ctx,
    poolAlias,
    tokenInstanceKeys[1].getTokenClassKey()
  );

  const [amount0Requested, amount1Requested] = [
    BigNumber.min(f18(dto.amount0Requested), poolToken0Balance.getQuantityTotal()),
    BigNumber.min(f18(dto.amount1Requested), poolToken1Balance.getQuantityTotal())
  ];

  const tickLower = parseInt(dto.tickLower.toString()),
    tickUpper = parseInt(dto.tickUpper.toString());

  // Fetch tick data for positions upper and lower tick and receive the amounts that need to be payed out
  const { tickUpperData, tickLowerData } = await fetchOrCreateTickDataPair(
    ctx,
    poolHash,
    tickLower,
    tickUpper
  );
  const amounts = pool.collect(position, tickLowerData, tickUpperData, amount0Requested, amount1Requested);

  // Round down the tokens and transfer the tokens to position holder
  const roundedToken0Amount = BigNumber.min(
    roundTokenAmount(amounts[0], tokenDecimals[0]),
    poolToken0Balance.getQuantityTotal()
  );

  const roundedToken1Amount = BigNumber.min(
    roundTokenAmount(amounts[1], tokenDecimals[1]),
    poolToken1Balance.getQuantityTotal()
  );

  for (const [index, amount] of amounts.entries()) {
    if (amount.lt(0)) {
      throw new NegativeAmountError(index, amount.toString());
    }

    await transferToken(ctx, {
      from: poolAlias,
      to: ctx.callingUser,
      tokenInstanceKey: tokenInstanceKeys[index],
      quantity: index === 0 ? roundedToken0Amount : roundedToken1Amount,
      allowancesToUse: [],
      authorizedOnBehalf: {
        callingOnBehalf: poolAlias,
        callingUser: poolAlias
      }
    });
  }

  // Remove or commit position based on whether its empty
  await updateOrRemovePosition(ctx, poolHash, position);
  await putChainObject(ctx, pool);

  // Return position holder's new token balances
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
  const userBalances = new UserBalanceResDto(liquidityProviderToken0Balance, liquidityProviderToken1Balance);

  return new DexOperationResDto(
    userBalances,
    [roundedToken0Amount.toFixed(), roundedToken1Amount.toFixed()],
    poolHash,
    poolAlias,
    pool.fee,
    ctx.callingUser
  );
}

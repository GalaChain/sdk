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
  NotFoundError,
  Pool,
  SlippageToleranceExceededError,
  TokenInstanceKey,
  UserBalanceResDto,
  liquidity0,
  liquidity1,
  tickToSqrtPrice
} from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { fetchOrCreateBalance } from "../balances";
import { transferToken } from "../transfer";
import { GalaChainContext } from "../types";
import { getObjectByKey, putChainObject } from "../utils";
import { NegativeAmountError } from "./dexError";
import { getTokenDecimalsFromPool, roundTokenAmount, validateTokenOrder } from "./dexUtils";
import { fetchUserPositionInTickRange } from "./position.helper";
import { removePositionIfEmpty } from "./removePositionIfEmpty";
import { fetchOrCreateTickDataPair } from "./tickData.helper";

/**
 * @dev The burn function is responsible for removing liquidity from a Decentralized exchange pool within the GalaChain ecosystem. It executes the necessary operations to burn the liquidity position and transfer the corresponding tokens back to the user.
 * @param ctx GalaChainContext – The execution context that provides access to the GalaChain environment.
 * @param dto BurnDto – A data transfer object containing the details of the liquidity position to be burned, including the pool, and position ID.
 * @returns UserBalanceResDto
 */
export async function burn(ctx: GalaChainContext, dto: BurnDto): Promise<UserBalanceResDto> {
  // Fetch pool and user position
  const [token0, token1] = validateTokenOrder(dto.token0, dto.token1);

  const key = ctx.stub.createCompositeKey(Pool.INDEX_KEY, [token0, token1, dto.fee.toString()]);
  const pool = await getObjectByKey(ctx, Pool, key);

  const poolAlias = pool.getPoolAlias();
  const poolHash = pool.genPoolHash();
  const position = await fetchUserPositionInTickRange(ctx, poolHash, dto.tickUpper, dto.tickLower);

  if (!position)
    throw new NotFoundError(`User doesn't hold any positions with this tick rangeData in thisData pool`);

  const tickLower = parseInt(dto.tickLower.toString()),
    tickUpper = parseInt(dto.tickUpper.toString());

  //Create tokenInstanceKeys
  const tokenInstanceKeys = [pool.token0ClassKey, pool.token1ClassKey].map(TokenInstanceKey.fungibleKey);
  const tokenDecimals = await getTokenDecimalsFromPool(ctx, pool);

  // Estimate how much liquidity can actually be burned based on current pool balances and prices
  let amountToBurn = dto.amount.f18();
  const amountsEstimated = pool.burnEstimate(amountToBurn, tickLower, tickUpper);
  const sqrtPriceA = tickToSqrtPrice(tickLower),
    sqrtPriceB = tickToSqrtPrice(tickUpper);
  const sqrtPrice = pool.sqrtPrice;

  // Adjust burn amount if pool lacks sufficient liquidity
  for (const [index, amount] of amountsEstimated.entries()) {
    if (amount.lt(0)) {
      throw new NegativeAmountError(index, amount.toString());
    }

    const poolTokenBalance = await fetchOrCreateBalance(ctx, poolAlias, tokenInstanceKeys[index]);
    const roundedAmount = roundTokenAmount(amount, tokenDecimals[index]);

    if (!roundedAmount.isGreaterThan(poolTokenBalance.getQuantityTotal())) {
      let maximumBurnableLiquidity: BigNumber;
      if (index === 0) {
        maximumBurnableLiquidity = liquidity0(
          roundedAmount,
          sqrtPrice.gt(sqrtPriceA) ? sqrtPrice : sqrtPriceA,
          sqrtPriceB
        );
      } else {
        maximumBurnableLiquidity = liquidity1(
          roundedAmount,
          sqrtPriceA,
          sqrtPrice.lt(sqrtPriceB) ? sqrtPrice : sqrtPriceB
        );
      }
      amountToBurn = BigNumber.min(amountToBurn, maximumBurnableLiquidity);
    }
  }

  // Burn liquidity and verify whether amounts are valid
  const { tickUpperData, tickLowerData } = await fetchOrCreateTickDataPair(
    ctx,
    poolHash,
    tickLower,
    tickUpper
  );
  const amounts = pool.burn(position, tickLowerData, tickUpperData, dto.amount.f18());

  if (amounts[0].lt(dto.amount0Min) || amounts[1].lt(dto.amount1Min)) {
    throw new SlippageToleranceExceededError(
      `Slippage tolerance exceeded: expected minimums (amount0 ≥ ${dto.amount0Min.toString()}, amount1 ≥ ${dto.amount1Min.toString()}), but received (amount0 = ${amounts[0].toString()}, amount1 = ${amounts[1].toString()})`
    );
  }
  if (amounts[0].isLessThan(0)) {
    throw new NegativeAmountError(0, amounts[0].toString());
  }
  if (amounts[1].isLessThan(0)) {
    throw new NegativeAmountError(1, amounts[1].toString());
  }

  await removePositionIfEmpty(ctx, poolHash, position);

  // Transfer tokens to positon holder
  for (const [index, amount] of amounts.entries()) {
    const poolTokenBalance = await fetchOrCreateBalance(
      ctx,
      poolAlias,
      tokenInstanceKeys[index].getTokenClassKey()
    );
    const roundedAmount = BigNumber.min(
      roundTokenAmount(amount, tokenDecimals[index]),
      poolTokenBalance.getQuantityTotal()
    );

    await transferToken(ctx, {
      from: poolAlias,
      to: ctx.callingUser,
      tokenInstanceKey: tokenInstanceKeys[index],
      quantity: roundedAmount,
      allowancesToUse: [],
      authorizedOnBehalf: {
        callingOnBehalf: poolAlias,
        callingUser: poolAlias
      }
    });
  }

  await putChainObject(ctx, pool);
  await putChainObject(ctx, position);
  await putChainObject(ctx, tickUpperData);
  await putChainObject(ctx, tickLowerData);

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
  const response = new UserBalanceResDto(liquidityProviderToken0Balance, liquidityProviderToken1Balance);
  return response;
}

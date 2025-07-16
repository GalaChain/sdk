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
  DexOperationResDto,
  NotFoundError,
  Pool,
  SlippageToleranceExceededError,
  TokenInstanceKey,
  UserBalanceResDto,
  f18,
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
import { fetchOrCreateTickDataPair } from "./tickData.helper";
import { updateOrRemovePosition } from "./updateOrRemovePosition";

/**
 * @dev The burn function is responsible for removing liquidity from a Decentralized exchange pool within the GalaChain ecosystem. It executes the necessary operations to burn the liquidity position and transfer the corresponding tokens back to the user.
 * @param ctx GalaChainContext – The execution context that provides access to the GalaChain environment.
 * @param dto BurnDto – A data transfer object containing the details of the liquidity position to be burned, including the pool, and position ID.
 * @returns DexOperationResDto
 */
export async function burn(ctx: GalaChainContext, dto: BurnDto): Promise<DexOperationResDto> {
  // Fetch pool and user position
  const [token0, token1] = validateTokenOrder(dto.token0, dto.token1);

  const key = ctx.stub.createCompositeKey(Pool.INDEX_KEY, [token0, token1, dto.fee.toString()]);
  const pool = await getObjectByKey(ctx, Pool, key);

  const poolAlias = pool.getPoolAlias();
  const poolHash = pool.genPoolHash();
  const position = await fetchUserPositionInTickRange(
    ctx,
    poolHash,
    dto.tickUpper,
    dto.tickLower,
    dto.positionId
  );

  if (!position)
    throw new NotFoundError(`User doesn't hold any positions with this tick rangeData in thisData pool`);

  const tickLower = parseInt(dto.tickLower.toString()),
    tickUpper = parseInt(dto.tickUpper.toString());

  //Create tokenInstanceKeys
  const token0InstanceKey = TokenInstanceKey.fungibleKey(pool.token0ClassKey);
  const token1InstanceKey = TokenInstanceKey.fungibleKey(pool.token1ClassKey);
  const tokenDecimals = await getTokenDecimalsFromPool(ctx, pool);

  // Estimate how much liquidity can actually be burned based on current pool balances and prices
  let amountToBurn = f18(dto.amount);
  const amountsEstimated = pool.burnEstimate(amountToBurn, tickLower, tickUpper);
  const sqrtPriceA = tickToSqrtPrice(tickLower),
    sqrtPriceB = tickToSqrtPrice(tickUpper);
  const sqrtPrice = pool.sqrtPrice;

  const poolToken0Balance = await fetchOrCreateBalance(ctx, poolAlias, token0InstanceKey);
  const poolToken1Balance = await fetchOrCreateBalance(ctx, poolAlias, token1InstanceKey);

  // Adjust burn amount if pool lacks sufficient liquidity
  for (const [index, amount] of amountsEstimated.entries()) {
    if (amount.lt(0)) {
      throw new NegativeAmountError(index, amount.toString());
    }

    const roundedAmount = roundTokenAmount(amount, tokenDecimals[index], false);

    if (
      roundedAmount.isGreaterThan(
        index === 0 ? poolToken0Balance.getQuantityTotal() : poolToken1Balance.getQuantityTotal()
      )
    ) {
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
  const amounts = pool.burn(position, tickLowerData, tickUpperData, amountToBurn);

  if (amounts[0].isLessThan(0)) {
    throw new NegativeAmountError(0, amounts[0].toString());
  }
  if (amounts[1].isLessThan(0)) {
    throw new NegativeAmountError(1, amounts[1].toString());
  }

  const roundedToken0Amount = BigNumber.min(
    roundTokenAmount(amounts[0], tokenDecimals[0], false),
    poolToken0Balance.getQuantityTotal()
  );

  const roundedToken1Amount = BigNumber.min(
    roundTokenAmount(amounts[1], tokenDecimals[1], false),
    poolToken1Balance.getQuantityTotal()
  );
  if (roundedToken0Amount.lt(dto.amount0Min) || roundedToken1Amount.lt(dto.amount1Min)) {
    throw new SlippageToleranceExceededError(
      `Slippage tolerance exceeded: expected minimums (amount0 ≥ ${dto.amount0Min.toString()}, amount1 ≥ ${dto.amount1Min.toString()}), but received (amount0 = ${roundedToken0Amount.toString()}, amount1 = ${roundedToken1Amount.toString()})`
    );
  }

  // Transfer tokens to positon holder
  await transferToken(ctx, {
    from: poolAlias,
    to: ctx.callingUser,
    tokenInstanceKey: token0InstanceKey,
    quantity: roundedToken0Amount,
    allowancesToUse: [],
    authorizedOnBehalf: {
      callingOnBehalf: poolAlias,
      callingUser: poolAlias
    }
  });

  await transferToken(ctx, {
    from: poolAlias,
    to: ctx.callingUser,
    tokenInstanceKey: token1InstanceKey,
    quantity: roundedToken1Amount,
    allowancesToUse: [],
    authorizedOnBehalf: {
      callingOnBehalf: poolAlias,
      callingUser: poolAlias
    }
  });

  // Remove or commit position based on whether its empty
  await updateOrRemovePosition(ctx, poolHash, position);
  await putChainObject(ctx, pool);
  await putChainObject(ctx, tickUpperData);
  await putChainObject(ctx, tickLowerData);

  // Return position holder's new token balances
  const liquidityProviderToken0Balance = await fetchOrCreateBalance(ctx, ctx.callingUser, token0InstanceKey);
  const liquidityProviderToken1Balance = await fetchOrCreateBalance(ctx, ctx.callingUser, token1InstanceKey);
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

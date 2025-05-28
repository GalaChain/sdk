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
  DexOperationResDto,
  Pool,
  PreConditionFailedError,
  SlippageToleranceExceededError,
  TokenInstanceKey,
  UserBalanceResDto,
  getLiquidityForAmounts,
  tickToSqrtPrice
} from "@gala-chain/api";

import { fetchOrCreateBalance } from "../balances";
import { transferToken } from "../transfer";
import { GalaChainContext } from "../types";
import { getObjectByKey, putChainObject } from "../utils";
import { NegativeAmountError } from "./dexError";
import { getTokenDecimalsFromPool, roundTokenAmount, validateTokenOrder } from "./dexUtils";
import { fetchOrCreateDexPosition } from "./position.helper";
import { fetchOrCreateTickDataPair } from "./tickData.helper";

/**
 * @dev Function to add Liqudity to v3 pool. The addLiquidity function facilitates the addition of liquidity to a Decentralized exchange pool within the GalaChain ecosystem. It takes in the blockchain context, liquidity parameters, and an optional launchpad address, then executes the necessary operations to deposit assets into the specified liquidity pool.
 * @param ctx GalaChainContext – The execution context that provides access to the GalaChain environment.
 * @param dto AddLiquidityDTO – A data transfer object containing liquidity details such as token amounts, pool parameters, and fee tiers.
 * @param launchpadAddress string – (Optional) The address of a launchpad contract if liquidity is being added via a specific launchpad mechanism.
 * @returns DexOperationResDto
 */
export async function addLiquidity(
  ctx: GalaChainContext,
  dto: AddLiquidityDTO,
  launchpadAddress?: string
): Promise<DexOperationResDto> {
  const [token0, token1] = validateTokenOrder(dto.token0, dto.token1);

  const key = ctx.stub.createCompositeKey(Pool.INDEX_KEY, [token0, token1, dto.fee.toString()]);
  const pool = await getObjectByKey(ctx, Pool, key);
  const currentSqrtPrice = pool.sqrtPrice;

  //create tokenInstanceKeys
  const token0InstanceKey = TokenInstanceKey.fungibleKey(pool.token0ClassKey);
  const token1InstanceKey = TokenInstanceKey.fungibleKey(pool.token1ClassKey);

  const liquidityProvider = launchpadAddress ?? ctx.callingUser;
  const tickLower = parseInt(dto.tickLower.toString()),
    tickUpper = parseInt(dto.tickUpper.toString());

  //calculate token amounts required for the desired liquidity
  const amount0Desired = dto.amount0Desired.f18(),
    amount1Desired = dto.amount1Desired.f18();
  const amount0Min = dto.amount0Min.f18(),
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

  // Fetch or create position and tick data
  const poolHash = pool.genPoolHash();
  const poolAlias = pool.getPoolAlias();
  if (!dto.uniqueKey) throw new PreConditionFailedError("Unique key is required for this function.");
  const position = await fetchOrCreateDexPosition(
    ctx,
    pool,
    tickUpper,
    tickLower,
    dto.uniqueKey,
    dto.positionId
  );
  const { tickUpperData, tickLowerData } = await fetchOrCreateTickDataPair(
    ctx,
    poolHash,
    tickLower,
    tickUpper
  );

  const [amount0, amount1] = pool.mint(position, tickLowerData, tickUpperData, liquidity.f18());

  // Verify whether the amounts are valid
  if (amount0.lt(amount0Min) || amount1.lt(amount1Min)) {
    throw new SlippageToleranceExceededError(
      `Slippage tolerance exceeded: expected minimums (amount0 ≥ ${dto.amount0Min.toString()}, amount1 ≥ ${dto.amount1Min.toString()}), but received (amount0 = ${amount0.toString()}, amount1 = ${amount1.toString()})`
    );
  }
  if (amount0.isLessThan(0)) {
    throw new NegativeAmountError(0, amount0.toString());
  }
  if (amount1.isLessThan(0)) {
    throw new NegativeAmountError(1, amount1.toString());
  }

  const [token0Decimal, token1Decimal] = await getTokenDecimalsFromPool(ctx, pool);
  const roundedToken0Amount = roundTokenAmount(amount0, token0Decimal);
  const roundedToken1Amount = roundTokenAmount(amount1, token1Decimal);
  // transfer token0
  await transferToken(ctx, {
    from: liquidityProvider,
    to: poolAlias,
    tokenInstanceKey: token0InstanceKey,
    quantity: roundedToken0Amount,
    allowancesToUse: [],
    authorizedOnBehalf: {
      callingOnBehalf: liquidityProvider,
      callingUser: liquidityProvider
    }
  });

  // transfer token1
  await transferToken(ctx, {
    from: liquidityProvider,
    to: poolAlias,
    tokenInstanceKey: token1InstanceKey,
    quantity: roundedToken1Amount,
    allowancesToUse: [],
    authorizedOnBehalf: {
      callingOnBehalf: liquidityProvider,
      callingUser: liquidityProvider
    }
  });

  await putChainObject(ctx, pool);
  await putChainObject(ctx, position);
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

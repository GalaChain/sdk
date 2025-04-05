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
  ChainError,
  CollectTradingFeesDto,
  CollectTradingFeesResDto,
  ConflictError,
  ErrorCode,
  NotFoundError,
  Pool,
  TokenInstanceKey,
  UnauthorizedError
} from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { fetchOrCreateBalance } from "../balances";
import { fetchTokenClass } from "../token";
import { transferToken } from "../transfer";
import { GalaChainContext } from "../types";
import {
  fetchDexProtocolFeeConfig,
  genKey,
  getObjectByKey,
  putChainObject,
  validateTokenOrder,
  virtualAddress
} from "../utils";

/**
 * @dev The collectTradingFees function enables the collection of protocol fees accumulated in a Uniswap V3 pool within the GalaChain ecosystem. It retrieves and transfers the protocol's share of the trading fees to the designated recipient.
 * @param ctx GalaChainContext – The execution context providing access to the GalaChain environment.
 * @param dto CollectTradingFeesDto – A data transfer object containing:
   - Pool details (identifying which Uniswap V3 pool the fees are collected from).
   - Recipient address (where the collected protocol fees will be sent).
 * @returns [tokenAmount0, tokenAmount1]
 */
export async function collectTradingFees(
  ctx: GalaChainContext,
  dto: CollectTradingFeesDto
): Promise<CollectTradingFeesResDto> {
  const platformFeeAddress = await fetchDexProtocolFeeConfig(ctx);
  if (!platformFeeAddress) {
    throw new NotFoundError(
      "Protocol fee configuration has yet to be defined. Platform fee configuration is not defined."
    );
  } else if (!platformFeeAddress.authorities.includes(ctx.callingUser)) {
    throw new UnauthorizedError(`CallingUser ${ctx.callingUser} is not authorized to create or update`);
  }
  const [token0, token1] = validateTokenOrder(dto.token0, dto.token1);

  const key = ctx.stub.createCompositeKey(Pool.INDEX_KEY, [token0, token1, dto.fee.toString()]);
  const pool = await getObjectByKey(ctx, Pool, key).catch((e) => {
    const chainError = ChainError.from(e);
    if (chainError.matches(ErrorCode.NOT_FOUND)) {
      throw new ConflictError("Pool does not exist");
    } else {
      throw chainError;
    }
  });

  const poolAddrKey = genKey(pool.token0, pool.token1, pool.fee.toString());
  const poolVirtualAddress = virtualAddress(poolAddrKey);

  const amounts = pool.collectTradingFees();

  //create tokenInstanceKeys
  const tokenInstanceKeys = [pool.token0ClassKey, pool.token1ClassKey].map(TokenInstanceKey.fungibleKey);

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
        to: dto.recepient,
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
  return new CollectTradingFeesResDto(amounts[0], amounts[1]);
}

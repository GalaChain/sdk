import { ConflictError, DefaultError, TokenInstanceKey } from "@gala-chain/api";
import {
  GalaChainContext,
  fetchOrCreateBalance,
  fetchTokenClass,
  getObjectByKey,
  putChainObject,
  transferToken
} from "@gala-chain/chaincode";
import BigNumber from "bignumber.js";

import { SwapDto, UserBalanceResponseDto } from "./dtos";
import { convertToTokenInstanceKey, genKey, validateTokenOrder, virtualAddress } from "./helpers/format.helper";
import { Pool } from "./pool";

export async function swap(ctx: GalaChainContext, dto: SwapDto) {
  const [token0, token1] = validateTokenOrder(dto.token0, dto.token1);
  let zeroForOne = dto.zeroForOne;
  let sqrtPriceLimit = dto.sqrtPriceLimit;

  const key = ctx.stub.createCompositeKey(Pool.INDEX_KEY, [token0, token1, dto.fee.toString()]);
  const pool = await getObjectByKey(ctx, Pool, key);

  //If pool does not exist
  if (pool == undefined) throw new ConflictError("Pool does not exist");

  let amounts = pool.swap(zeroForOne, dto.amount, sqrtPriceLimit);
  const poolAddrKey = genKey(pool.token0, pool.token1, pool.fee.toString());
  // const poolAddrKey = `${pool.token0}_${pool.token1}_${pool.fee}`;
  const poolVirtualAddress = virtualAddress(poolAddrKey);

  //create tokenInstanceKeys
  const tokenInstanceKeys = [pool.token0ClassKey, pool.token1ClassKey].map(convertToTokenInstanceKey);

  //fetch token classes
  const tokenClasses = await Promise.all(tokenInstanceKeys.map((key) => fetchTokenClass(ctx, key)));

  for (const [index, amount] of amounts.entries()) {
    if (amount.gt(0)) {
      if (dto.amountInMaximum && amount.gt(dto.amountInMaximum)) throw new DefaultError("Slippage exceeded");

      await transferToken(ctx, {
        from: ctx.callingUser,
        to: poolVirtualAddress,
        tokenInstanceKey: tokenInstanceKeys[index],
        quantity: new BigNumber(amount.toFixed(tokenClasses[index].decimals)),
        allowancesToUse: [],
        authorizedOnBehalf: undefined
      });
    }
    if (amount.lt(0)) {
      if (dto.amountOutMinimum && amount.gt(dto.amountOutMinimum))
        throw new DefaultError("Slippage exceeded");

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
  const buyerToken0Balance = await fetchOrCreateBalance(ctx, ctx.callingUser, tokenInstanceKeys[0]);
  const buyerToken1Balance = await fetchOrCreateBalance(ctx, ctx.callingUser, tokenInstanceKeys[1]);
  const response = new UserBalanceResponseDto(buyerToken0Balance, buyerToken1Balance);
  return response;
}

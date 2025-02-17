import { ConflictError, DefaultError, Pool, SwapDto, SwapResponseDto } from "@gala-chain/api";
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

  const response = new SwapResponseDto(
    tokenClasses[0].symbol,
    tokenClasses[0].image,
    tokenClasses[1].symbol,
    tokenClasses[1].image,
    amounts[0].toFixed(tokenClasses[0].decimals).toString(),
    amounts[1].toFixed(tokenClasses[1].decimals).toString(),
    ctx.callingUser,
    ctx.txUnixTime
  );

  await putChainObject(ctx, pool);
  return response;
}

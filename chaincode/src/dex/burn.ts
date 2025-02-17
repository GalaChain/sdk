import {
  BurnDto,
  ConflictError,
  Pool,
  UserBalanceResponseDto,
  formatBigNumberDecimals
} from "@gala-chain/api";
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
import { UserPosition } from "./userpositions";

export async function burn(ctx: GalaChainContext, dto: BurnDto) {
  formatBigNumberDecimals(dto);
  const [token0, token1] = validateTokenOrder(dto.token0, dto.token1);

  const key = ctx.stub.createCompositeKey(Pool.INDEX_KEY, [token0, token1, dto.fee.toString()]);
  const pool = await getObjectByKey(ctx, Pool, key);

  //If pool does not exist
  if (pool == undefined) throw new ConflictError("Pool does not exist");

  const owner = ctx.callingUser;

  const userKey = ctx.stub.createCompositeKey(UserPosition.INDEX_KEY, [owner]);
  const poolAddrKey = genKey(pool.token0, pool.token1, pool.fee.toString());
  const poolVirtualAddress = virtualAddress(poolAddrKey);
  let userPosition = await getObjectByKey(ctx, UserPosition, userKey).catch(() => undefined);
  if (!userPosition) throw new ConflictError("User position does not exist");

  let tickLower = parseInt(dto.tickLower.toString()),
    tickUpper = parseInt(dto.tickUpper.toString());
  userPosition.removeLiquidity(poolAddrKey, tickLower, tickUpper, dto.amount.f18());

  const amounts = pool.burn(dto.recipient, tickLower, tickUpper, dto.amount.f18());
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
  const response = new UserBalanceResponseDto(liquidityProviderToken0Balance, liquidityProviderToken1Balance);
  return response;
}

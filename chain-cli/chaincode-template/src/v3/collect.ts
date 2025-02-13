import { ConflictError } from "@gala-chain/api";
import {
  GalaChainContext,
  fetchOrCreateBalance,
  fetchTokenClass,
  getObjectByKey,
  putChainObject,
  transferToken
} from "@gala-chain/chaincode";
import BigNumber from "bignumber.js";

import { CollectDTO, UserBalanceResponseDto } from "./dtos";
import { convertToTokenInstanceKey, genKey, validateTokenOrder, virtualAddress } from "./helpers/format.helper";
import { Pool } from "./pool";
import { UserPosition } from "./userpositions";

export async function collect(ctx: GalaChainContext, dto: CollectDTO) {
  const [token0, token1] = validateTokenOrder(dto.token0, dto.token1);
  const key = ctx.stub.createCompositeKey(Pool.INDEX_KEY, [token0, token1, dto.fee.toString()]);
  const pool = await getObjectByKey(ctx, Pool, key);
  let [amount0Requested, amount1Requested] = [dto.amount0Requested.f18(), dto.amount1Requested.f18()];

  //If pool does not exist
  if (pool == undefined) throw new ConflictError("Pool does not exist");
  const owner = ctx.callingUser;
  const poolAddrKey = genKey(pool.token0, pool.token1, pool.fee.toString());
  const poolVirtualAddress = virtualAddress(poolAddrKey);

  let tickLower = parseInt(dto.tickLower.toString()),
    tickUpper = parseInt(dto.tickUpper.toString());

  const userKey = ctx.stub.createCompositeKey(UserPosition.INDEX_KEY, [owner]);
  let userPosition = await getObjectByKey(ctx, UserPosition, userKey).catch(() => undefined);
  if (!userPosition) throw new ConflictError("user position doesnot exists does not exist");

  const amounts = pool.collect(owner, tickLower, tickUpper, amount0Requested, amount1Requested);

  const userPositionKey = `${owner}_${tickLower}_${tickUpper}`;

  const position = pool.positions[userPositionKey];
  const deleteUserPos =
    new BigNumber(position.tokensOwed0).isZero() &&
    new BigNumber(position.tokensOwed1).isZero() &&
    new BigNumber(position.liquidity).isZero();

  if (deleteUserPos) {
    delete pool.positions[userPositionKey];
    userPosition.deletePosition(poolAddrKey, tickLower, tickUpper);
    await putChainObject(ctx, userPosition);
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
  const response = new UserBalanceResponseDto(liquidityProviderToken0Balance, liquidityProviderToken1Balance);
  return response;
}

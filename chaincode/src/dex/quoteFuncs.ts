import { ConflictError, Pool, QuoteExactAmountDto, formatBigNumber } from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { GalaChainContext } from "../types";
import { getObjectByKey, validateTokenOrder } from "../utils";

export async function quoteExactAmount(
  ctx: GalaChainContext,
  dto: QuoteExactAmountDto
): Promise<[amount0: string, amount1: string, sqrtPriceLimit: string]> {
  const [token0, token1] = validateTokenOrder(dto.token0, dto.token1);

  const zeroForOne = dto.zeroForOne;

  const key = ctx.stub.createCompositeKey(Pool.INDEX_KEY, [token0, token1, dto.fee.toString()]);
  const pool = await getObjectByKey(ctx, Pool, key);
  if (pool == undefined) throw new ConflictError("Pool does not exist");

  let currentSqrtPrice = pool.sqrtPrice;
  const amounts = pool.swap(
    zeroForOne,
    dto.amount.f18(),
    zeroForOne ? new BigNumber("0.000000000000000000054212147") : new BigNumber("18446050999999999999")
  );
  let newSqrtPrice = pool.sqrtPrice;

  return formatBigNumber([...amounts, currentSqrtPrice, newSqrtPrice]);
}

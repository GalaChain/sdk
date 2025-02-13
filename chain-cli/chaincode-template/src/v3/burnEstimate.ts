import { ConflictError } from "@gala-chain/api";
import { GalaChainContext, getObjectByKey } from "@gala-chain/chaincode";

import { BurnDto } from "./dtos";
import { formatBigNumber } from "./helpers/bignumber.helper";
import { validateTokenOrder } from "./helpers/format.helper";
import { Pool } from "./pool";

export async function getRemoveLiquidityEstimation(ctx: GalaChainContext, dto: BurnDto) {
  const [token0, token1] = validateTokenOrder(dto.token0, dto.token1);

  const key = ctx.stub.createCompositeKey(Pool.INDEX_KEY, [token0, token1, dto.fee.toString()]);
  const pool = await getObjectByKey(ctx, Pool, key);

  //If pool does not exist
  if (pool == undefined) throw new ConflictError("Pool does not exist");

  let tickLower = parseInt(dto.tickLower.toString()),
    tickUpper = parseInt(dto.tickUpper.toString());
  const amounts = pool.burn(dto.recipient, tickLower, tickUpper, dto.amount.f18());

  return formatBigNumber(amounts);
}

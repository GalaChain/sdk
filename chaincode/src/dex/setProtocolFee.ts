import { ConflictError, Pool, SetProtocolFeeDTO, formatBigNumberDecimals } from "@gala-chain/api";
import { GalaChainContext } from "../types";
import { getObjectByKey, putChainObject, validateTokenOrder } from "../utils";

/**
 * @dev The setProtocolFee function updates the protocol fee percentage for a Uniswap V3 pool within the GalaChain ecosystem.
 * @param ctx GalaChainContext – The execution context providing access to the GalaChain environment.
 * @param dto SetProtocolFeeDTO – A data transfer object containing:
  - Pool identifier – The specific pool where the protocol fee is being updated.
- fee value – The new protocol fee percentage, ranging from 0 to 1 (0% to 100%).
 * @returns New fee for the pool
 */
export async function setProtocolFee(ctx: GalaChainContext, dto: SetProtocolFeeDTO): Promise<number> {
  formatBigNumberDecimals(dto);
  const [token0, token1] = validateTokenOrder(dto.token0, dto.token1);
  const key = ctx.stub.createCompositeKey(Pool.INDEX_KEY, [token0, token1, dto.fee.toString()]);
  const pool = await getObjectByKey(ctx, Pool, key);
  //If pool does not exist
  if (pool == undefined) throw new ConflictError("Pool does not exist");
  const newFee = pool.configureProtocolFee(dto.protocolFee);
  await putChainObject(ctx, pool);
  return newFee;
}

import { ConflictError } from "@gala-chain/api";
import { GalaChainContext, fetchTokenClass, getObjectByKey, putChainObject } from "@gala-chain/chaincode";

import { CreatePoolDto } from "./dtos";
import { convertToTokenInstanceKey, generateKeyFromClassKey } from "./helpers/format.helper";
import { feeAmountTickSpacing } from "./helpers/tick.helper";
import { Pool } from "./pool";

export async function createPool(ctx: GalaChainContext, dto: CreatePoolDto) {
  // sort the tokens in an order
  const [token0, token1] = [dto.token0, dto.token1].map(generateKeyFromClassKey);
  if (token0.localeCompare(token1) > 0) {
    throw new Error("Token0 must be smaller");
  } else if (token0.localeCompare(token1) === 0) {
    throw new Error("Cannot create pool of same tokens");
  }
  if (!feeAmountTickSpacing[dto.fee]) {
    throw new Error("Fee is not valid it must be 500, 3000, 10000");
  }

  // Create pool
  const pool = new Pool(token0, token1, dto.token0, dto.token1, dto.fee, dto.initialSqrtPrice.f18());

  //create tokenInstanceKeys
  const token0InstanceKey = convertToTokenInstanceKey(pool.token0ClassKey);
  const token1InstanceKey = convertToTokenInstanceKey(pool.token1ClassKey);

  //check if the tokens are valid or not
  const token0Class = await fetchTokenClass(ctx, token0InstanceKey);
  if (token0Class == undefined) throw new ConflictError("Invalid token 0");

  const token1Class = await fetchTokenClass(ctx, token1InstanceKey);
  if (token1Class == undefined) throw new ConflictError("Invalid token 1");

  //Check if the pool already exists
  const existingPool = await getObjectByKey(ctx, Pool, pool.getCompositeKey()).catch(() => undefined);
  if (existingPool !== undefined)
    throw new ConflictError("Pool already exists", existingPool.toPlainObject());

  await putChainObject(ctx, pool);
}

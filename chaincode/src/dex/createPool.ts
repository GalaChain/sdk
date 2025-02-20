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
import { ConflictError, CreatePoolDto, Pool, feeAmountTickSpacing } from "@gala-chain/api";

import { fetchTokenClass } from "../token";
import { GalaChainContext } from "../types";
import { convertToTokenInstanceKey, generateKeyFromClassKey, getObjectByKey, putChainObject } from "../utils";

/**
 * @dev The createPool function initializes a new Uniswap V3 liquidity pool within the GalaChain ecosystem. It sets up the pool with the specified token pair, initial price, fee structure, and protocol fee settings.
 * @param ctx GalaChainContext – The execution context providing access to the GalaChain environment.
 * @param dto CreatePoolDto – A data transfer object containing:
    - Token details – The token class keys.
    - sqrtPrice – The initial square root price of the pool (used for setting up the starting price ratio).
    - Fee tier details – The swap fee tier applied to trades in the pool.
    - Protocol fees – The percentage of fees collected by the protocol.
 */
    export async function createPool(ctx: GalaChainContext, dto: CreatePoolDto) {
      // sort the tokens in an order
      const [token0, token1] = [dto.token0, dto.token1].map(generateKeyFromClassKey);
      if (token0.localeCompare(token1) > 0) {
        throw new Error("Token0 must be smaller");
      } else if (token0.localeCompare(token1) === 0) {
        throw new Error(
          `Cannot create pool of same tokens. Token0 ${token0} and Token1 ${token1} must be different.`
        );
      }
      if (!feeAmountTickSpacing[dto.fee]) {
        throw new Error("Fee is not valid it must be 500, 3000, 10000");
      }
    
      // Create pool
      const pool = new Pool(
        token0,
        token1,
        dto.token0,
        dto.token1,
        dto.fee,
        dto.initialSqrtPrice.f18(),
        dto.protocolFee
      );
    
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
    
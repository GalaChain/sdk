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
import { ChainError, DexNftBatchLimit, ErrorCode, NotFoundError } from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { getObjectByKey } from "../utils";

/**
 * @dev Function to fetch the NFT batch limit configuration. The fetchDexNftBatchLimit function retrieves
 *      the current batch limit setting for position NFTs from the GalaChain ledger.
 *
 * @param ctx GalaChainContext – The execution context that provides access to the GalaChain environment.
 *
 * @returns Promise<DexNftBatchLimit> – A promise resolving to the current NFT batch limit configuration.
 *
 * @throws NotFoundError – If the batch limit configuration is not found on the chain.
 */
export async function fetchDexNftBatchLimit(ctx: GalaChainContext): Promise<DexNftBatchLimit> {
  const key = ctx.stub.createCompositeKey(DexNftBatchLimit.INDEX_KEY, []);

  const dexNftBatchLimit = await getObjectByKey(ctx, DexNftBatchLimit, key).catch((e) => {
    const chainError = ChainError.from(e);
    if (chainError.matches(ErrorCode.NOT_FOUND)) {
      throw new NotFoundError("Nft batch limit configuration not found.");
    } else {
      throw chainError;
    }
  });

  return dexNftBatchLimit;
}

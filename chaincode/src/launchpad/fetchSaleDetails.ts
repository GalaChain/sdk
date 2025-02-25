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
import { FetchSaleDto, LaunchpadSale, NotFoundError } from "@gala-chain/api";
import { BigNumber } from "bignumber.js";

import { GalaChainContext } from "../types";
import { getObjectByKey } from "../utils";

BigNumber.config({
  ROUNDING_MODE: BigNumber.ROUND_UP
});

/**
 * Fetches the details of a specific token sale (LaunchpadSale) using its sale address.
 *
 * This function retrieves the sale object from the chain using a composite key derived
 * from the sale address. If the sale record is not found, an error is thrown.
 *
 * @param ctx - The context object providing access to the GalaChain environment.
 * @param fetchSaleDTO - An object containing the sale address:
 *   - `vaultAddress`: The address of the sale to be fetched.
 *
 * @returns A promise that resolves to a `LaunchpadSale` object containing details about
 *          the specified token sale.
 *
 * @throws NotFoundError if no sale record is found for the provided sale address.
 */
export async function fetchSaleDetails(
  ctx: GalaChainContext,
  fetchSaleDTO: FetchSaleDto
): Promise<LaunchpadSale> {
  const key = ctx.stub.createCompositeKey(LaunchpadSale.INDEX_KEY, [fetchSaleDTO.vaultAddress]);

  const sale = await getObjectByKey(ctx, LaunchpadSale, key);

  if (sale === undefined) {
    throw new NotFoundError("Sale record not found.");
  }

  return sale;
}

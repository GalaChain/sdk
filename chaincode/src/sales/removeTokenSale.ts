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
import {
  TokenAllowance,
  TokenSale,
  TokenSaleDtoValidationError,
  TokenSaleMintAllowance
} from "@gala-chain/api";

import {
  GalaChainContext,
  deleteChainObject,
  getObjectByKey,
  getObjectsByPartialCompositeKey,
  takeUntilUndefined
} from "../";

export async function removeTokenSale(ctx: GalaChainContext, tokenSaleId: string): Promise<TokenSale> {
  const chainValidationErrors: Array<string> = [];

  // This will throw an error if it can't be found
  const tokenSale = await getObjectByKey(ctx, TokenSale, tokenSaleId);

  if (tokenSale.owner !== ctx.callingUser) {
    chainValidationErrors.push(
      `${ctx.callingUser} does not have permission to remove token sale ${tokenSaleId}`
    );
  }

  if (tokenSale.quantity.isEqualTo(tokenSale.quantityFulfilled)) {
    chainValidationErrors.push(`Token sale ${tokenSaleId} has already sold out`);
  }

  if (chainValidationErrors.length === 0) {
    const instanceQueryKeys = takeUntilUndefined(tokenSaleId);
    const tokenSaleMintAllowances = await getObjectsByPartialCompositeKey(
      ctx,
      TokenSaleMintAllowance.INDEX_KEY,
      instanceQueryKeys,
      TokenSaleMintAllowance
    );

    // Remove remaining mint allowances that weren't sold
    await Promise.all(
      tokenSaleMintAllowances.map(async (tokenSaleMintAllowance) => {
        const allowance = await getObjectByKey(
          ctx,
          TokenAllowance,
          tokenSaleMintAllowance.allowanceObjectKey
        );
        await deleteChainObject(ctx, allowance);
      })
    );

    // Remove token
    // TODO: Do we want to end and save state instead of remove?
    await deleteChainObject(ctx, tokenSale);
    return tokenSale;
  } else {
    throw new TokenSaleDtoValidationError("removeTokenSale", chainValidationErrors);
  }
}

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
import { TokenSwapRequest } from "@gala-chain/api";

import { unlockToken } from "../locks";
import { GalaChainContext } from "../types";
import { getObjectByKey, putChainObject } from "../utils";
import { SwapDtoValidationError } from "./SwapError";

export async function terminateTokenSwap(
  ctx: GalaChainContext,
  swapRequestId: string
): Promise<TokenSwapRequest> {
  const transactionTime: number = ctx.txUnixTime;

  const chainValidationErrors: Array<string> = [];

  // This will throw an error if it can't be found
  const tokenSwap = await getObjectByKey(ctx, TokenSwapRequest, swapRequestId);

  if (tokenSwap.offeredBy !== ctx.callingUser) {
    chainValidationErrors.push(
      `${ctx.callingUser} does not have permission to terminate token swap ${swapRequestId}`
    );
  }

  if (tokenSwap.uses.isEqualTo(tokenSwap.usesSpent)) {
    chainValidationErrors.push(`Token swap ${swapRequestId} has already been fully used`);
  }

  if (tokenSwap.expires && tokenSwap.expires <= transactionTime) {
    chainValidationErrors.push(`Token swap ${swapRequestId} has expired`);
  }

  for (const instanceQuantity of tokenSwap.offered) {
    // unlockToken will need one of a) callingUser owns token b) callingUser is lockAuthority
    await unlockToken(ctx, {
      tokenInstanceKey: instanceQuantity.tokenInstance,
      name: tokenSwap.getCompositeKey(),
      quantity: instanceQuantity.quantity.times(tokenSwap.uses.minus(tokenSwap.usesSpent)),
      owner: tokenSwap.offeredBy
    }).catch((e) => {
      chainValidationErrors.push(
        `UnlockToken() failed for token ${instanceQuantity.tokenInstance.toStringKey()}, ` +
          `callingUser: ${ctx.callingUser}, swap: ${tokenSwap.getCompositeKey()}`
      );
    });
  }

  // So we've confirmed that the user owns the swap and
  // the swap can still be cancelled. let's cancel it
  if (chainValidationErrors.length === 0) {
    // Expire it
    tokenSwap.expires = transactionTime;
    await putChainObject(ctx, tokenSwap);

    // todo: consider deleting objects from world state when token swaps are terminated
    // see ./cleanExpiredSwaps.ts
    // await cleanExpiredSwaps(ctx, { swapRequestIds: [ swapRequestId ]});
    return tokenSwap;
  } else {
    throw new SwapDtoValidationError("terminateTokenSwap", chainValidationErrors);
  }
}

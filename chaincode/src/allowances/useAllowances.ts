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
import { TokenAllowance, TokenClaim } from "@gala-chain/api";
import { AllowanceType } from "@gala-chain/api";
import { BigNumber } from "bignumber.js";

import { GalaChainContext } from "../types";
import { putChainObject } from "../utils";
import { isAllowanceExpired } from "./checkAllowances";

// Update allowances according to using an quantity
export async function useAllowances(
  ctx: GalaChainContext,
  quantity: BigNumber,
  applicableAllowances: TokenAllowance[],
  allowanceType: AllowanceType
): Promise<boolean> {
  ctx.logger.info(
    `UseAllowances: quantity: ${quantity.toFixed()}, number of allowances: ${applicableAllowances.length}`
  );

  let hasInfiniteAllowances = false;

  // Iterate through them subtracting the quantity and track total consumed
  let quantityRemaining = quantity;

  for (const tokenAllowance of applicableAllowances) {
    // Check if tokenAllowance is for the correct action type
    if (tokenAllowance.allowanceType !== allowanceType) {
      continue;
    }

    // Check if quantity to consume is 0, then exit.
    if (quantityRemaining.isEqualTo(0)) {
      break;
    } else if (quantityRemaining.isLessThan(0)) {
      throw Error(`Error using allowances. Value went under 0: ${quantityRemaining.toFixed()}`);
    }

    // Skip expired allowances https://app.shortcut.com/gala-games/story/27971/using-mint-allowances-may-debit-expired-allowances
    if (isAllowanceExpired(ctx, tokenAllowance)) {
      continue;
    }

    // Only update chain objects if quantitySpent and usesSpent are defined(and therefore the tokenAllowance quantity is finite)
    if (tokenAllowance.quantitySpent !== undefined && tokenAllowance.usesSpent !== undefined) {
      // we still need to remove
      const quantityToRemove: BigNumber = BigNumber.min.apply(null, [
        quantityRemaining,
        tokenAllowance.quantity.minus(tokenAllowance.quantitySpent)
      ]);

      // Remove it from the allowance
      tokenAllowance.quantitySpent = tokenAllowance.quantitySpent.plus(quantityToRemove);

      // Update running total of quantity to be removed
      quantityRemaining = quantityRemaining.minus(quantityToRemove);

      // Expend a use from the allowance
      tokenAllowance.usesSpent = tokenAllowance.usesSpent.plus(1);

      // TODO consider not doing this, it is not obvious and may complicate reasoning about the code
      // probably we can have tokenAllowance.isStillValid(nowTimestamp) which would check quantities, uses and expiration
      // if all uses are spent, mark the allowance as expired
      if (
        tokenAllowance.usesSpent?.isEqualTo(tokenAllowance.uses) ||
        tokenAllowance.quantitySpent?.isEqualTo(tokenAllowance.quantity)
      ) {
        tokenAllowance.expires = ctx.txUnixTime;
      }

      // Create a claim on the allowance
      const newClaim = new TokenClaim();

      newClaim.ownerKey = tokenAllowance.grantedTo;
      newClaim.issuerKey = tokenAllowance.grantedBy;
      newClaim.collection = tokenAllowance.collection;
      newClaim.category = tokenAllowance.category;
      newClaim.type = tokenAllowance.type;
      newClaim.additionalKey = tokenAllowance.additionalKey;
      newClaim.instance = tokenAllowance.instance;
      newClaim.action = tokenAllowance.allowanceType;
      newClaim.quantity = quantityToRemove;
      newClaim.allowanceCreated = tokenAllowance.created;
      newClaim.claimSequence = tokenAllowance.usesSpent; // 1-based claim sequence
      newClaim.created = ctx.txUnixTime;

      // Validate instance
      await newClaim.validateOrReject();

      await putChainObject(ctx, newClaim);

      await putChainObject(ctx, tokenAllowance);
    } else {
      hasInfiniteAllowances = true;
    }
  }

  // This means there was an exception because we should not have started
  // updating allowances if we didn't have enough and we should not have
  // gotten here unless we removed enough
  if (!quantityRemaining.isEqualTo(0) && !hasInfiniteAllowances) {
    throw Error(`Error using allowances. Quantity remaining did not reach 0: ${quantityRemaining}`);
  }

  return true;
}

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
  ChainError,
  ExpectedTokenSale,
  FulfillTokenSaleDto,
  TokenAllowance,
  TokenClassKey,
  TokenInstanceKey,
  TokenSale,
  TokenSaleDtoValidationError,
  TokenSaleFulfillment,
  TokenSaleMintAllowance,
  TokenSaleQuantity
} from "@gala-chain/api";
import { BigNumber } from "bignumber.js";
import { plainToInstance } from "class-transformer";

import { fetchOrCreateBalance } from "../balances";
import { MintTokenFailedError, mintToken } from "../mint";
import { fetchTokenClasses } from "../token/fetchTokenClasses";
import { TransferTokenFailedError, transferToken } from "../transfer";
import { GalaChainContext, createValidChainObject } from "../types";
import {
  getObjectByKey,
  getObjectsByPartialCompositeKey,
  putChainObject,
  takeUntilUndefined
} from "../utils";

async function getTokenSaleAllowanceForToken(
  ctx: GalaChainContext,
  tokenSaleId: string,
  tokenClassKey: TokenClassKey
) {
  const instanceQueryKeys = takeUntilUndefined(tokenSaleId);
  const tokenSaleMintAllowances = await getObjectsByPartialCompositeKey(
    ctx,
    TokenSaleMintAllowance.INDEX_KEY,
    instanceQueryKeys,
    TokenSaleMintAllowance
  );
  const tokenSaleAllowance = tokenSaleMintAllowances.find(
    (t) =>
      t.collection === tokenClassKey.collection &&
      t.category === tokenClassKey.category &&
      t.type === tokenClassKey.type &&
      t.additionalKey === tokenClassKey.additionalKey
  );
  if (tokenSaleAllowance?.allowanceObjectKey) {
    return await getObjectByKey(ctx, TokenAllowance, tokenSaleAllowance.allowanceObjectKey);
  }
}

export async function fulfillTokenSale(
  ctx: GalaChainContext,
  dto: FulfillTokenSaleDto
): Promise<TokenSaleFulfillment> {
  const fulfilledBy = dto.fulfilledBy ?? ctx.callingUser;
  const { tokenSaleId, quantity, expectedTokenSale } = dto;

  const newTokenSaleFulfillment = await createValidChainObject(TokenSaleFulfillment, {
    tokenSaleId,
    fulfilledBy,
    quantity,
    created: ctx.txUnixTime
  });

  // the conversion from data to instance was successful, begin chaincode-specific instance validation

  const chainValidationErrors: Array<string> = [];
  if (fulfilledBy !== ctx.callingUser) {
    chainValidationErrors.push(
      `Sales cannot be initated on another's behalf at this time. TokenSaleId ${tokenSaleId}`
    );
  }

  // This will throw an error if it can't be found
  const tokenSale = await getObjectByKey(ctx, TokenSale, tokenSaleId);

  // Validate if the expected token sale matches the actual token sale
  if (expectedTokenSale !== undefined) {
    validateTokenSaleFulfillment(tokenSale, expectedTokenSale, chainValidationErrors, tokenSaleId);
  }

  // Should be able to skip validating existence of token classes, since they are already validated in CreateTokenSale

  // TODO: Deal with infinity here https://app.shortcut.com/gala-games/story/4361/ensure-infinity-is-supported-on-uses
  // Check that uses remaining > 0
  if (tokenSale.quantity.minus(tokenSale.quantityFulfilled).isLessThanOrEqualTo(0)) {
    chainValidationErrors.push(
      `Sales quantity remaining must be >= 0 (${tokenSale.quantity} - ${
        tokenSale.quantityFulfilled
      } = ${tokenSale.quantity.minus(tokenSale.quantityFulfilled)}. tokenSaleId ${tokenSaleId})`
    );
  }

  // Check that there are enough uses left
  if (!quantity || !quantity.isInteger() || quantity.isLessThanOrEqualTo(0)) {
    chainValidationErrors.push(`Quantity must be > 0. tokenSaleId ${tokenSaleId}`);
  } else if (tokenSale.quantity.minus(tokenSale.quantityFulfilled).isLessThan(quantity)) {
    chainValidationErrors.push(
      `Insufficient quantity remaining on this sale to fulfill. tokenSaleId ${tokenSaleId}`
    );
  }

  // Check if the sale has started
  if (tokenSale.start && tokenSale.start !== 0 && tokenSale.start >= ctx.txUnixTime) {
    chainValidationErrors.push(`Token sale has not started. tokenSaleId ${tokenSaleId}`);
  }

  // Check if the sale has ended
  if (tokenSale.end && tokenSale.end !== 0 && tokenSale.end <= ctx.txUnixTime) {
    chainValidationErrors.push(`Token sale has ended. tokenSaleId ${tokenSaleId}`);
  }

  // We have established that the sale is still valid.
  // Now we need to ensure that the user has sufficient balances to pay costs

  // Ensure there are still enough mint allowances to fulfill the sale, its possible the owner can use allowances outside of the sale
  const applicableAllowances: TokenAllowance[] = [];
  for (let index = 0; index < tokenSale.selling.length; index++) {
    const tokenSaleQuantity = tokenSale.selling[index];
    const allowance = await getTokenSaleAllowanceForToken(ctx, tokenSaleId, tokenSaleQuantity.tokenClassKey);
    if (!allowance) {
      chainValidationErrors.push(
        `Missing allowance for ${tokenSaleQuantity.tokenClassKey.toStringKey()} on sale ${tokenSaleId}`
      );
    } else {
      const quantityNeeded = tokenSaleQuantity.quantity.multipliedBy(quantity);
      if (allowance.quantity.minus(allowance.quantitySpent ?? 0).isLessThan(quantityNeeded)) {
        chainValidationErrors.push(
          `Insufficient allowance ${
            allowance.quantity
          }, needed: ${quantityNeeded} for ${tokenSaleQuantity.tokenClassKey.toStringKey()} on sale ${tokenSaleId}`
        );
      } else {
        applicableAllowances.push(allowance);
      }
    }
  }

  // If we have any errors, don't proceed to check the cost quantity and
  // issue the transaction
  if (chainValidationErrors.length === 0) {
    const costClassKeys = tokenSale.cost.map((t) => t.tokenClassKey);
    const costTokenClasses = await fetchTokenClasses(ctx, costClassKeys).catch((e) => {
      chainValidationErrors.push(`Error fetching to tokens: ${e.message}. tokenSaleId ${tokenSaleId}`);
      return [];
    });
    // Check from balances
    for (let index = 0; index < costTokenClasses.length; index++) {
      const costToken = costTokenClasses[index];
      const costBalance = await fetchOrCreateBalance(ctx, fulfilledBy, costToken);

      // TODO: non-fungible tokens should not be supported, if this state occurs then a validation failed in CreateTokenSale
      if (costToken.isNonFungible) {
        chainValidationErrors.push(
          `Non-fungible tokens are not supported for cost tokens. tokenSaleId ${tokenSaleId}`
        );
      } else {
        const currentSpendableQuantity = costBalance.getQuantityTotal();
        const totalCostQuantity = tokenSale.cost[index].quantity.times(quantity);

        if (!currentSpendableQuantity.toNumber() || currentSpendableQuantity.isLessThan(totalCostQuantity)) {
          chainValidationErrors.push(
            `${fulfilledBy} has insufficient balance to spend ${totalCostQuantity} of token ${costToken.getCompositeKey()}. tokenSaleId ${tokenSaleId}`
          );
        }
      }
    }
  }

  // If we have any errors after checking balances, don't proceed
  if (chainValidationErrors.length === 0) {
    // Mint Sale Tokens
    for (let index = 0; index < tokenSale.selling.length; index++) {
      const saleTokenClassKey = tokenSale.selling[index].tokenClassKey;
      const currentQuantity = tokenSale.selling[index].quantity;
      const allowance = applicableAllowances.filter(
        (x) =>
          x.collection === saleTokenClassKey.collection &&
          x.category === saleTokenClassKey.category &&
          x.type === saleTokenClassKey.type &&
          x.additionalKey === saleTokenClassKey.additionalKey
      );

      await mintToken(ctx, {
        tokenClassKey: saleTokenClassKey,
        owner: fulfilledBy,
        quantity: currentQuantity,
        applicableAllowances: allowance,
        authorizedOnBehalf: {
          callingOnBehalf: tokenSale.owner,
          callingUser: ctx.callingUser
        }
      }).catch((e) => {
        const chainError = ChainError.from(e);
        throw new MintTokenFailedError(chainError.message + `TokenSaleId ${tokenSaleId}`, chainError.payload);
      });
    }

    for (let index = 0; index < tokenSale.cost.length; index++) {
      const costTokenInstanceKey = plainToInstance(TokenInstanceKey, {
        ...tokenSale.cost[index].tokenClassKey,
        instance: new BigNumber(0)
      });
      const currentQuantity = tokenSale.cost[index].quantity;

      await transferToken(ctx, {
        from: fulfilledBy,
        to: tokenSale.owner,
        tokenInstanceKey: costTokenInstanceKey,
        quantity: currentQuantity,
        allowancesToUse: [],
        authorizedOnBehalf: undefined
      }).catch((e) => {
        const chainError = ChainError.from(e);
        throw new TransferTokenFailedError(
          chainError.message + `TokenSaleId ${tokenSaleId}`,
          chainError.payload
        );
      });
    }

    const newTokenSaleFulfillmentId: string = newTokenSaleFulfillment.getCompositeKey();

    tokenSale.quantityFulfilled = tokenSale.quantityFulfilled.plus(quantity);

    if (!tokenSale.fulfillmentIds) {
      tokenSale.fulfillmentIds = [];
    }
    tokenSale.fulfillmentIds.push(newTokenSaleFulfillmentId);

    // Put the new sale fullfillment
    await putChainObject(ctx, newTokenSaleFulfillment);

    // Put the updated tokenSale
    await putChainObject(ctx, tokenSale);

    return newTokenSaleFulfillment;
  } else {
    throw new TokenSaleDtoValidationError("fulfillTokenSale", chainValidationErrors);
  }
}

function validateTokenSaleFulfillment(
  tokenSale: TokenSale,
  expectedTokenSale: ExpectedTokenSale,
  chainValidationErrors: Array<string>,
  tokenSaleId: string
): void {
  if (expectedTokenSale.selling.length !== tokenSale.selling.length) {
    chainValidationErrors.push(
      `Expected selling token count of ${expectedTokenSale.selling.length} does not match actual count of ${tokenSale.selling.length}. tokenSaleId ${tokenSaleId}`
    );
  }

  if (expectedTokenSale.cost.length !== tokenSale.cost.length) {
    chainValidationErrors.push(
      `Expected cost token count of ${expectedTokenSale.cost.length} does not match actual count of ${tokenSale.cost.length}. tokenSaleId ${tokenSaleId}`
    );
  }

  for (let index = 0; index < expectedTokenSale.selling.length; index++) {
    const expectedselling = plainToInstance(TokenSaleQuantity, {
      tokenClassKey: expectedTokenSale.selling[index].tokenClassKey,
      quantity: expectedTokenSale.selling[index].quantity
    });
    const actualselling = tokenSale.selling[index];

    if (expectedselling.tokenClassKey.toStringKey() !== actualselling.tokenClassKey.toStringKey()) {
      chainValidationErrors.push(
        `Expected selling token tokenClassKey of ${expectedselling.tokenClassKey.toStringKey()} does not match actual tokenClassKey of ${actualselling.tokenClassKey.toStringKey()}. tokenSaleId ${tokenSaleId}`
      );
    }

    if (!expectedselling.quantity.isEqualTo(actualselling.quantity)) {
      chainValidationErrors.push(
        `Expected selling token quantity of ${expectedselling.quantity} does not match actual quantity of ${actualselling.quantity}. tokenSaleId ${tokenSaleId}`
      );
    }
  }

  for (let index = 0; index < expectedTokenSale.cost.length; index++) {
    const expectedcost = plainToInstance(TokenSaleQuantity, {
      tokenClassKey: expectedTokenSale.cost[index].tokenClassKey,
      quantity: expectedTokenSale.cost[index].quantity
    });
    const actualcost = tokenSale.cost[index];

    if (expectedcost.tokenClassKey.toStringKey() !== actualcost.tokenClassKey.toStringKey()) {
      chainValidationErrors.push(
        `Expected cost token tokenClassKeyKey of ${expectedcost.tokenClassKey.toStringKey()} does not match actual tokenClassKey of ${actualcost.tokenClassKey.toStringKey()}. tokenSaleId ${tokenSaleId}`
      );
    }

    if (!expectedcost.quantity.isEqualTo(actualcost.quantity)) {
      chainValidationErrors.push(
        `Expected cost token quantity of ${expectedcost.quantity} does not match actual quantity of ${actualcost.quantity}. tokenSaleId ${tokenSaleId}`
      );
    }
  }
}

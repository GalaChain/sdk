import {
  ExpectedTokenSale,
  TokenInstanceQuantity,
  TokenSale,
  TokenSaleDtoValidationError,
  TokenSaleFulfillment,
  TokenSaleQuantity
} from "@gala-chain/api";
import {
  GalaChainContext,
  createValidChainObject,
  fetchOrCreateBalance,
  fetchTokenClasses,
  getObjectByKey,
  putChainObject,
} from "@gala-chain/chaincode";
import { BigNumber } from "bignumber.js";
import { plainToInstance } from "class-transformer";


interface FillTokenSaleParams {
  fulfilledBy: string;
  quantity: BigNumber;
  tokenSaleId: string;
  expectedTokenSale?: ExpectedTokenSale | undefined;
}

export async function fillTokenSwap(
  ctx: GalaChainContext,
  { fulfilledBy, quantity, tokenSaleId, expectedTokenSale }: FillTokenSaleParams
): Promise<TokenSaleFulfillment> {
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
    validateTokenSaleFill(tokenSale, expectedTokenSale, chainValidationErrors, tokenSaleId);
  }

  // Check that token IDs exist
  const sellingClassKeys = tokenSale.selling.map((t) => t.tokenClassKey);
  await fetchTokenClasses(ctx, sellingClassKeys).catch((e) => {
    chainValidationErrors.push(`Error fetching from tokens: ${e.message}. tokenSaleId ${tokenSaleId}`);
    return [];
  });

  const costClassKeys = tokenSale.cost.map((t) => t.tokenClassKey);
  const costTokenClasses = await fetchTokenClasses(ctx, costClassKeys).catch((e) => {
    chainValidationErrors.push(`Error fetching to tokens: ${e.message}. tokenSaleId ${tokenSaleId}`);
    return [];
  });

  // TODO: Deal with infinity here https://app.shortcut.com/gala-games/story/4361/ensure-infinity-is-supported-on-uses
  // Check that uses remaining > 0
  if (tokenSale.quantity.minus(tokenSale.quantityFulfilled).isLessThanOrEqualTo(0)) {
    chainValidationErrors.push(
      `Sales quantity remaining must be >= 0 (${tokenSale.quantity} - ${tokenSale.quantityFulfilled} = ${tokenSale.quantity.minus(
        tokenSale.quantityFulfilled
      )}. tokenSaleId ${tokenSaleId})`
    );
  }

  // Check that there are enough uses left
  // This is separate in case we decide to short circuit later
  if (!quantity || !quantity.isInteger() || quantity.isLessThanOrEqualTo(0)) {
    chainValidationErrors.push(`Quantity must be > 0. tokenSaleId ${tokenSaleId}`);
  } else if (tokenSale.quantity.minus(tokenSale.quantityFulfilled).isLessThan(quantity)) {
    chainValidationErrors.push(`Insufficient quantity remaining on this sale. tokenSaleId ${tokenSaleId}`);
  }

  // Check if the swap has started
  if (tokenSale.start && tokenSale.start !== 0 && tokenSale.start <= ctx.txUnixTime) {
    chainValidationErrors.push(`Token sale has not started. tokenSaleId ${tokenSaleId}`);
  }

  // Check if the swap has ended
  if (tokenSale.end && tokenSale.end !== 0 && tokenSale.end <= ctx.txUnixTime) {
    chainValidationErrors.push(`Token sale has ended. tokenSaleId ${tokenSaleId}`);
  }

  // We have established that the sale is still valid.
  // Now we need to ensure that the user has sufficient balances to pay costs

  // TODO: Ensure there are still enough mint allowances to fufill the sale
  //

  // If we have any errors, don't proceed to check the spendable quantity and
  // issue the transaction
  if (chainValidationErrors.length === 0) {
    // Check from balances
    for (let index = 0; index < costTokenClasses.length; index++) {
      const costToken = costTokenClasses[index];
      const balance = await fetchOrCreateBalance(ctx, fulfilledBy, costToken);

      // TODO: non-fungible tokens should not be supported, if this state occurs than a validation error failed in CreateTokenSale
      if (costToken.isNonFungible) {
        chainValidationErrors.push(`Non-fungible tokens are not supported for cost tokens. tokenSaleId ${tokenSaleId}`);
      } else {
        const currentSpendableQuantity = balance.getQuantityTotal();
        const currentQuantity = tokenSale.cost[index].quantity.times(quantity);

        if (!currentSpendableQuantity.toNumber() || currentSpendableQuantity.isLessThan(currentQuantity)) {
          chainValidationErrors.push(
            `${fulfilledBy} has insufficient balance to spend ${currentQuantity} of token ${costToken.getCompositeKey()}. tokenSaleId ${tokenSaleId}`
          );
        }
      }
    }
  }

  // If we have any errors after checking balances, don't proceed
  if (chainValidationErrors.length === 0) {
    // TODO: use transfer and mint function to fulfill the sale

    const newTokenSaleFulfillmentId: string = newTokenSaleFulfillment.getCompositeKey();

    tokenSale.quantityFulfilled = tokenSale.quantityFulfilled.plus(quantity);

    if (!tokenSale.fulfillmentIds) {
      tokenSale.fulfillmentIds = [];
    }
    tokenSale.fulfillmentIds.push(newTokenSaleFulfillmentId);

    // Put the new swap fill
    await putChainObject(ctx, newTokenSaleFulfillment);

    // Put the updated swap request
    await putChainObject(ctx, tokenSale);

    return newTokenSaleFulfillment;
  } else {
    throw new TokenSaleDtoValidationError("fulfillTokenSale", chainValidationErrors);
  }
}

function validateTokenSaleFill(
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
        `Expected cost token tokenClassKey of ${expectedcost.tokenClassKey.toStringKey()} does not match actual tokenClassKey of ${actualcost.tokenClassKey.toStringKey()}. tokenSaleId ${tokenSaleId}`
      );
    }

    if (!expectedcost.quantity.isEqualTo(actualcost.quantity)) {
      chainValidationErrors.push(
        `Expected cost token quantity of ${expectedcost.quantity} does not match actual quantity of ${actualcost.quantity}. tokenSaleId ${tokenSaleId}`
      );
    }
  }
}

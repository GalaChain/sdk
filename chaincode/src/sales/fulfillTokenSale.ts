import {
  ChainError,
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
  mintToken,
  putChainObject,
  transferToken
} from "@gala-chain/chaincode";
import { BigNumber } from "bignumber.js";
import { plainToInstance } from "class-transformer";

import { MintTokenFailedError } from "../mint/MintError";
import { TransferTokenFailedError } from "../transfer/TransferError";

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
  } else if (tokenSale.quantity.minus(tokenSale.quantityFulfilled).isGreaterThanOrEqualTo(quantity)) {
    chainValidationErrors.push(
      `Insufficient quantity remaining on this sale to fulfill. tokenSaleId ${tokenSaleId}`
    );
  }

  // Check if the swap has started
  if (tokenSale.start && tokenSale.start !== 0 && tokenSale.start <= ctx.txUnixTime) {
    chainValidationErrors.push(`Token sale has not started. tokenSaleId ${tokenSaleId}`);
  }

  // Check if the sale has ended
  if (tokenSale.end && tokenSale.end !== 0 && tokenSale.end <= ctx.txUnixTime) {
    chainValidationErrors.push(`Token sale has ended. tokenSaleId ${tokenSaleId}`);
  }

  // We have established that the sale is still valid.
  // Now we need to ensure that the user has sufficient balances to pay costs

  // TODO: Ensure there are still enough mint allowances to fufill the sale, its possible the owner can use allowance outside of the sale
  //

  const costClassKeys = tokenSale.cost.map((t) => t.getTokenClassKey());
  const costTokenClasses = await fetchTokenClasses(ctx, costClassKeys).catch((e) => {
    chainValidationErrors.push(`Error fetching to tokens: ${e.message}. tokenSaleId ${tokenSaleId}`);
    return [];
  });

  // If we have any errors, don't proceed to check the cost quantity and
  // issue the transaction
  if (chainValidationErrors.length === 0) {
    // Check from balances
    for (let index = 0; index < costTokenClasses.length; index++) {
      const costToken = costTokenClasses[index];
      const costBalance = await fetchOrCreateBalance(ctx, fulfilledBy, costToken);

      // TODO: non-fungible tokens should not be supported, if this state occurs than a validation failed in CreateTokenSale
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

      await mintToken(ctx, {
        tokenClassKey: saleTokenClassKey,
        owner: tokenSale.owner,
        quantity: currentQuantity,
        // used to allow user to mint on behalf of the seller if cost requirements are met
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
      const costTokenInstanceKey = tokenSale.cost[index].tokenInstance;
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

    // Put the new swap fill
    await putChainObject(ctx, newTokenSaleFulfillment);

    // Put the updated swap request
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
    const expectedcost = plainToInstance(TokenInstanceQuantity, {
      tokenInstance: expectedTokenSale.cost[index].tokenInstance,
      quantity: expectedTokenSale.cost[index].quantity
    });
    const actualcost = tokenSale.cost[index];

    if (expectedcost.tokenInstance.toStringKey() !== actualcost.tokenInstance.toStringKey()) {
      chainValidationErrors.push(
        `Expected cost token tokenInstanceKey of ${expectedcost.tokenInstance.toStringKey()} does not match actual tokenClassKey of ${actualcost.tokenInstance.toStringKey()}. tokenSaleId ${tokenSaleId}`
      );
    }

    if (!expectedcost.quantity.isEqualTo(actualcost.quantity)) {
      chainValidationErrors.push(
        `Expected cost token quantity of ${expectedcost.quantity} does not match actual quantity of ${actualcost.quantity}. tokenSaleId ${tokenSaleId}`
      );
    }
  }
}

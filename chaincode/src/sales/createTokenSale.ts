import { AllowanceType, createValidDTO, TokenClass, TokenInstanceQueryKey, TokenSaleDtoValidationError, TokenSaleMintAllowance, TokenSaleOwner, TokenSaleTokenCost, TokenSaleTokenSold } from "@gala-chain/api";
import {
  GalaChainContext,
  fetchTokenClasses,
  getObjectByKey,
  grantAllowance,
  putChainObject
} from "@gala-chain/chaincode";
import { BigNumber } from "bignumber.js";
import { plainToInstance } from "class-transformer";

import { CreateTokenSaleDto, TokenSale } from "@gala-chain/api";

function validateTokenSaleQuantity(quantity: BigNumber, tokenClass: TokenClass): Array<string> {
  const validationResults: Array<string> = [];
  const genericErrorMessage = `Token quantity must be a positive integer. ${quantity} is not valid.`;

  if (tokenClass.isNonFungible && (quantity.isLessThan(1) || !quantity.isInteger())) {
    validationResults.push(genericErrorMessage);
  } else if (!tokenClass.isNonFungible && quantity.isLessThan(0)) {
    validationResults.push(`Token quantity must be positive. ${quantity} is not valid.`);
  } else if (quantity.isGreaterThan(tokenClass.maxSupply) || quantity.isGreaterThan(tokenClass.maxCapacity)) {
    validationResults.push(`Token quantity must not exceed Token max supply and max capacity`);
  }

  return validationResults;
}

export async function createTokenSale(
  ctx: GalaChainContext,
  { selling, cost, owner, quantity, start, end }: CreateTokenSaleDto
): Promise<TokenSale> {
  const newSale = new TokenSale();
  newSale.owner = owner ?? ctx.callingUser;
  newSale.txid = ctx.stub.getTxID();
  newSale.created = ctx.txUnixTime;
  newSale.quantity = quantity;
  newSale.quantityFulfilled = new BigNumber(0);
  newSale.end = end ?? CreateTokenSaleDto.DEFAULT_END;
  newSale.start = start ?? CreateTokenSaleDto.DEFAULT_END
  newSale.fulfillmentIds = [];
  newSale.selling = selling;
  newSale.cost = cost;
  newSale.txid = ctx.stub.getTxID();
  newSale.tokenSaleId = newSale.getCompositeKey();

  const tokenSaleId = newSale.tokenSaleId;

  await newSale.validateOrReject();

  // the conversion from dto to instance was successful, begin chain-code specific instance validation

  const chainValidationErrors: Array<string> = [];

  if (newSale.owner !== ctx.callingUser) {
    chainValidationErrors.push("Sales cannot be initated on another's behalf at this time");
  }

  // Check that end is empty or a valid time
  if (newSale.end && newSale.end <= ctx.txUnixTime) {
    chainValidationErrors.push(
      `If end is provided it must be a valid epoch time in the future: ${newSale.end}`
    );
  }

  // Check that start is empty or a valid time
  if (newSale.start && newSale.start <= ctx.txUnixTime) {
    chainValidationErrors.push(
      `If start is provided it must be a valid epoch time in the future: ${newSale.start}`
    );
  }

  // Check that token IDs exist
  const sellingTokenClassKeys = newSale.selling.map((t) => t.tokenClassKey);
  const sellingTokenClasses = await fetchTokenClasses(ctx, sellingTokenClassKeys).catch((e) => {
    chainValidationErrors.push(`Error fetching from tokens: ${e.message}`);
    return [];
  });

  if (sellingTokenClasses.length != newSale.selling.length) {
    chainValidationErrors.push(`From: Length mismatch on fetched token classes ${sellingTokenClasses.length}` + 
      `and providved token classes ${newSale.selling.length}`);
  }

  const costTokenClassKeys = newSale.cost.map((t) => t.tokenClassKey);
  const costTokenClasses = await fetchTokenClasses(ctx, costTokenClassKeys).catch((e) => {
    chainValidationErrors.push(`Error fetching to tokens: ${e.message}`);
    return [];
  });

  if (costTokenClasses.length != newSale.cost.length) {
    chainValidationErrors.push(
      `To: Length mismatch on fetched token classes ${costTokenClasses.length} ` +
        `and provided token classes ${newSale.cost.length}`
    );
  }

  // Only allow cost tokens that are non-fungible 
  // TODO: Eventually we will support non-fungible cost tokens
  for (let index = 0; index < costTokenClasses.length; index += 1) {
    const costTokenClass = costTokenClasses[index];
    if (costTokenClass.isNonFungible) {
      chainValidationErrors.push("Sales cannot be made with non-fungible cost tokens at this time.");
    }
  }

  // Check that the sale tokens and cost tokens are not the same
  // Both sold and cost token lists must contain unique token class keys
  const soldTokenClasssKeys: string[] = [];
  for (let index = 0; index < newSale.selling.length; index += 1) {
    const tokenClassKey = newSale.selling[index].tokenClassKey;
    const compositeKey = TokenClass.buildTokenClassCompositeKey(tokenClassKey);
    const tokenClass = await getObjectByKey(ctx, TokenClass, compositeKey);
    soldTokenClasssKeys.push(compositeKey);

    const quantityResults = validateTokenSaleQuantity(newSale.selling[index].quantity, tokenClass);
    for (const validationMessage of quantityResults) {
      chainValidationErrors.push(`Selling: ${validationMessage}`);
    }
  }

  // All sold tokens in array must be unique
  const uniqueSoldTokenCompositeKeys = soldTokenClasssKeys.filter((v, i, a) => a.indexOf(v) === i);
  if(uniqueSoldTokenCompositeKeys.length != soldTokenClasssKeys.length) {
    chainValidationErrors.push(`Length mismatch on sold token classes ${soldTokenClasssKeys.length} ` +
        `and unique sold token classes ${uniqueSoldTokenCompositeKeys.length}. All tokens must be unique.`);
  }

  for (let index = 0; index < newSale.cost.length; index++) {
    const tokenClassKey = newSale.cost[index].tokenClassKey;
    const compositeKey = TokenClass.buildTokenClassCompositeKey(tokenClassKey);
    const tokenClass = await getObjectByKey(ctx, TokenClass, compositeKey);

    // Cost and sold tokens cannot be the same
    if (soldTokenClasssKeys.includes(compositeKey)) {
      chainValidationErrors.push(
        `Error validating tokens to being offered: cost and purchase tokens cannot be the same.`
      );
    }

    const quantityResults = validateTokenSaleQuantity(newSale.cost[index].quantity, tokenClass);
    for (const validationMessage of quantityResults) {
      chainValidationErrors.push(`Cost: ${validationMessage}`);
    }
  }

  // All cost tokens in array must be unique
  const uniqueCostTokenCompositeKeys = costTokenClassKeys.filter((v, i, a) => a.indexOf(v) === i);
  if(uniqueCostTokenCompositeKeys.length != costTokenClassKeys.length) {
    chainValidationErrors.push(`Length mismatch on cost token classes ${costTokenClassKeys.length} ` +
        `and unique cost token classes ${uniqueCostTokenCompositeKeys.length}. All tokens must be unique.`);
  }

  // Ensure that the sale token is one that the user is an authority of 
  // At a later date we can support users with mint allowances as well
  // Also ensure enough supply remains to mint the token with granted allowances
  if (chainValidationErrors.length === 0) {
    // Check from balances
    for (let index = 0; index < newSale.selling.length; index += 1) {
      const tokenClassKey = newSale.selling[index].tokenClassKey;
      const compositeKey = TokenClass.buildTokenClassCompositeKey(tokenClassKey);
      const tokenClass = await getObjectByKey(ctx, TokenClass, compositeKey);

      if(!tokenClass.authorities.includes(newSale.owner)) {
        chainValidationErrors.push(
          `${newSale.owner} is not an authority on ${tokenClassKey.toStringKey()}`
        );
      }

      // TODO: Is this the correct way to check for remaining supply?
      const saleQuantity = newSale.selling[index].quantity;
      const totalSaleQuantity = newSale.quantity.multipliedBy(saleQuantity);
      const saleQuantityDelta = totalSaleQuantity.plus(tokenClass.knownMintSupply ?? 0).minus(tokenClass.maxSupply);

      if (saleQuantityDelta.isNegative()) {
        chainValidationErrors.push(
          `Token ${tokenClassKey.toStringKey()} has insufficient supply to sell ${totalSaleQuantity} of token`
        );
      }
    }
  }

  // Grant mint allowances for sale items to be used during fulfillment
  Promise.all(newSale.selling.map(async (tokenSaleQuantity) => {
    const tokenInstanceQueryKey = await createValidDTO(TokenInstanceQueryKey, {
      ...tokenSaleQuantity.tokenClassKey,
      instance: BigNumber(0)
    });
    const allowances = await grantAllowance(ctx, {
      tokenInstance: tokenInstanceQueryKey,
      allowanceType: AllowanceType.Mint,
      expires: 0,
      quantities: [{
        user: newSale.owner,
        quantity: tokenSaleQuantity.quantity
      }],
      uses: newSale.quantity, // Number of uses is the number of items to be sold
    });

    // Create index-objects of allowance keys so they can be removed later if sale is manually removed
    await Promise.all(allowances.map(async (allowance) => {
      const allowanceObjectKey = allowance.getCompositeKey();
      const newSaleInstance = plainToInstance(TokenSaleMintAllowance, {
        allowanceObjectKey,
        tokenSaleId
      });
      await newSaleInstance.validateOrReject();
      await putChainObject(ctx, newSaleInstance);
    }));
  }));

  // Persist the sale request
  await putChainObject(ctx, newSale);

  if (chainValidationErrors.length !== 0) {
    throw new TokenSaleDtoValidationError("createTokenSale", chainValidationErrors);
  }

  // sale is valid and successfully written. Create index-objects to faciliate performant client application queries
  // TODO: not sure if TokenSaleTokenSold and TokenSaleTokenCost are needed, surrently not used in other methods
  for (const selling of newSale.selling) {
    const newSaleInstance = plainToInstance(TokenSaleTokenSold, {
      ...selling.tokenClassKey,
      quantity: selling.quantity,
      tokenSaleId
    });

    await newSaleInstance.validateOrReject();
    await putChainObject(ctx, newSaleInstance);
  }

  for (const cost of newSale.cost) {
    const newSaleInstance = plainToInstance(TokenSaleTokenCost, {
      ...cost.tokenClassKey,
      quantity: cost.quantity,
      tokenSaleId
    });

    await newSaleInstance.validateOrReject();
    await putChainObject(ctx, newSaleInstance);
  }

  const newSaleOwner: TokenSaleOwner = plainToInstance(TokenSaleOwner, {
    owner: newSale.owner,
    tokenSaleId
  });

  await newSaleOwner.validateOrReject();
  await putChainObject(ctx, newSaleOwner);

  return newSale;
}

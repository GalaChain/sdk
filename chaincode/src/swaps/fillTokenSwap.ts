import {
  AllowanceType,
  ChainError,
  ExpectedTokenSwap,
  TokenBalance,
  TokenClass,
  TokenInstance,
  TokenInstanceKey,
  TokenInstanceQuantity,
  TokenSwapFill,
  TokenSwapRequest,
  UserAlias,
  createValidChainObject
} from "@gala-chain/api";
import { BigNumber } from "bignumber.js";
import { plainToInstance } from "class-transformer";

import { verifyAndUseAllowances } from "../allowances";
import { fetchOrCreateBalance } from "../balances";
import { fetchTokenInstance, fetchTokenInstances } from "../token";
import { TransferTokenFailedError, transferToken } from "../transfer";
import { GalaChainContext } from "../types";
import { getObjectByKey, putChainObject } from "../utils";
import { InvalidDecimalError, SwapDtoValidationError, SwapTokenFailedError } from "./SwapError";

async function swapToken(
  ctx: GalaChainContext,
  fromPersonKey: UserAlias,
  toPersonKey: UserAlias,
  tokenInstanceKey: TokenInstanceKey,
  quantity: BigNumber,
  swapRequestId: string,
  skipUnlockForFillSide?: boolean | undefined
): Promise<TokenBalance[]> {
  const logger = ctx.logger;
  const callingUser = ctx.callingUser;

  const message = `SwapToken: , ${fromPersonKey} -> ${toPersonKey}, ${quantity.toFixed()} of ${tokenInstanceKey.toStringKey()}`;
  logger.info(message);

  if (fromPersonKey === undefined) {
    logger.info(`FromPerson is not provided, setting to calling user (${callingUser})`);
    fromPersonKey = callingUser;
  }

  // Get the token instance
  const tokenInstance = await fetchTokenInstance(ctx, tokenInstanceKey);
  const instanceClassKey = await TokenClass.buildClassKeyObject(tokenInstance);

  const tokenClass = await getObjectByKey(
    ctx,
    TokenClass,
    TokenClass.getCompositeKeyFromParts(TokenClass.INDEX_KEY, TokenClass.buildClassKeyList(instanceClassKey))
  );

  const decimalPlaces = quantity.decimalPlaces() ?? 0;
  if (decimalPlaces > tokenClass.decimals) {
    throw new InvalidDecimalError(quantity, tokenClass.decimals).logError(ctx.logger);
  }

  const fromPersonBalance = await fetchOrCreateBalance(ctx, fromPersonKey, instanceClassKey);
  const toPersonBalance = await fetchOrCreateBalance(ctx, toPersonKey, instanceClassKey);

  if (tokenInstance.isNonFungible) {
    if (!skipUnlockForFillSide) {
      fromPersonBalance.unlockInstance(tokenInstance.instance, swapRequestId, ctx.txUnixTime);
    }

    fromPersonBalance.removeInstance(tokenInstance.instance, ctx.txUnixTime);
    toPersonBalance.addInstance(tokenInstance.instance);
  } else {
    if (!skipUnlockForFillSide) {
      fromPersonBalance.unlockQuantity(quantity, ctx.txUnixTime, swapRequestId, fromPersonKey);
    }

    fromPersonBalance.subtractQuantity(quantity, ctx.txUnixTime);
    toPersonBalance.addQuantity(quantity);
  }

  await putChainObject(ctx, fromPersonBalance);
  await putChainObject(ctx, toPersonBalance);

  if (tokenInstance.isNonFungible) {
    tokenInstance.owner = toPersonKey;
    await putChainObject(ctx, tokenInstance);
  }

  return [fromPersonBalance, toPersonBalance];
}

interface FillTokenSwapParams {
  filledBy: UserAlias;
  uses: BigNumber;
  swapRequestId: string;
  expectedTokenSwap?: ExpectedTokenSwap | undefined;
}

export async function fillTokenSwap(
  ctx: GalaChainContext,
  { filledBy, uses, swapRequestId, expectedTokenSwap }: FillTokenSwapParams
): Promise<TokenSwapFill> {
  const newSwapFill = await createValidChainObject(TokenSwapFill, {
    swapRequestId,
    filledBy,
    uses,
    created: ctx.txUnixTime
  });

  // the conversion from data to instance was successful, begin chaincode-specific instance validation

  const chainValidationErrors: Array<string> = [];

  let filledOnBehalfOfOwner = false;

  if (filledBy !== ctx.callingUser) {
    filledOnBehalfOfOwner = true;
  }

  // This will throw an error if it can't be found
  const tokenSwap = await getObjectByKey(ctx, TokenSwapRequest, swapRequestId);

  // Validate if the expected token swap matches the actual token swap
  if (expectedTokenSwap !== undefined) {
    validateTokenSwapFill(tokenSwap, expectedTokenSwap, chainValidationErrors, swapRequestId);
  }

  // If ToPerson is set on the token swap, only that person can fill it
  if (tokenSwap.offeredTo && tokenSwap.offeredTo.length > 0 && filledBy !== tokenSwap.offeredTo) {
    chainValidationErrors.push(
      `User ${filledBy} does not have permission to fill this swap. SwapRequestId ${swapRequestId}`
    );
  }

  // FromPerson and ToPerson cannot be the same
  // ToPerson cannot be empty
  if (filledBy === tokenSwap.offeredBy) {
    chainValidationErrors.push(`From Person cannot be the same as To Person. SwapRequestId ${swapRequestId}`);
  }

  // Check that token IDs exist
  const offeredInstanceKeys = tokenSwap.offered.map((t) => t.tokenInstance);
  await fetchTokenInstances(ctx, offeredInstanceKeys).catch((e) => {
    chainValidationErrors.push(`Error fetching from tokens: ${e.message}. SwapRequestId ${swapRequestId}`);
    return [];
  });

  const wantedInstanceKeys = tokenSwap.wanted.map((t) => t.tokenInstance);
  const wantedTokenInstances = await fetchTokenInstances(ctx, wantedInstanceKeys).catch((e) => {
    chainValidationErrors.push(`Error fetching to tokens: ${e.message}. SwapRequestId ${swapRequestId}`);
    return [];
  });

  if (tokenSwap.uses.minus(tokenSwap.usesSpent).isLessThanOrEqualTo(0)) {
    chainValidationErrors.push(
      `Swap Uses remaining must be >= 0 (${tokenSwap.uses} - ${tokenSwap.usesSpent} = ${tokenSwap.uses.minus(
        tokenSwap.usesSpent
      )}. SwapRequestId ${swapRequestId})`
    );
  }

  // Check that there are enough uses left
  // This is separate in case we decide to short circuit later
  if (!uses || !uses.isInteger() || uses.isLessThanOrEqualTo(0)) {
    chainValidationErrors.push(`Uses must be > 0. SwapRequestId ${swapRequestId}`);
  } else if (tokenSwap.uses.minus(tokenSwap.usesSpent).isLessThan(uses)) {
    chainValidationErrors.push(`Insufficient uses remaining on this swap. SwapRequestId ${swapRequestId}`);
  }

  // Check if the swap has expired
  if (tokenSwap.expires && tokenSwap.expires !== 0 && tokenSwap.expires <= ctx.txUnixTime) {
    chainValidationErrors.push(`Token swap has expired. SwapRequestId ${swapRequestId}`);
  }

  // We have established that the swap is still valid.
  // Now we need to ensure that the user has sufficient balances to invoke the swap

  // We are not checking the From balances because that should already be ensured by the SwapRequest call

  // If we have any errors, don't proceed to check the spendable quantity and
  // issue the transaction
  if (chainValidationErrors.length === 0) {
    // Check from balances
    for (let index = 0; index < wantedTokenInstances.length; index++) {
      const toToken = wantedTokenInstances[index];
      const balance = await fetchOrCreateBalance(ctx, filledBy, toToken);

      if (toToken.isNonFungible) {
        if (!balance.isInstanceSpendable(toToken.instance, ctx.txUnixTime)) {
          chainValidationErrors.push(
            `${filledBy} has insufficient balance to spend 1 of token ${toToken.GetCompositeKeyString()}. SwapRequestId ${swapRequestId}`
          );
        }
      } else {
        const currentSpendableQuantity = balance.getQuantityTotal();
        const currentQuantity = tokenSwap.wanted[index].quantity.times(uses);

        if (!currentSpendableQuantity.toNumber() || currentSpendableQuantity.isLessThan(currentQuantity)) {
          chainValidationErrors.push(
            `${filledBy} has insufficient balance to spend ${currentQuantity} of token ${toToken.GetCompositeKeyString()}. SwapRequestId ${swapRequestId}`
          );
        }
      }
    }
  }

  // If we have any errors after checking balances, don't proceed
  if (chainValidationErrors.length === 0) {
    // Transfer From Tokens
    for (let index = 0; index < tokenSwap.offered.length; index++) {
      const fromTokenId = tokenSwap.offered[index].tokenInstance;
      const currentQuantity = tokenSwap.offered[index].quantity.times(uses);

      ///////////////////////////////
      // We are skipping user validation because the quantities have already
      // been validated by the swap
      ///////////////////////////////
      // TODO: This should eventually use the transfer Token function when there is a better solution for normalizing
      // validation for swaps and transfers
      await swapToken(ctx, tokenSwap.offeredBy, filledBy, fromTokenId, currentQuantity, swapRequestId).catch(
        (e) => {
          const chainError = ChainError.from(e);
          throw new SwapTokenFailedError(
            chainError.message + `SwapRequestId ${swapRequestId}`,
            chainError.payload
          );
        }
      );
    }

    // Transfer To Tokens - note that filledBy user doesn't have locked tokens
    for (let index = 0; index < tokenSwap.wanted.length; index++) {
      const toTokenId = tokenSwap.wanted[index].tokenInstance;
      const currentQuantity = tokenSwap.wanted[index].quantity.times(uses);

      if (filledOnBehalfOfOwner) {
        // todo: unsure why verifyAndUseAllowances() requires *both* the tokenInstanceKey and tokenInstance be supplied -
        // its code appears to just need the string properties not the actual TokenInstance off chain
        // that might be worth reworking in the future
        const { collection, category, type, additionalKey, instance } = toTokenId;
        const tokenInstanceKeyList = [collection, category, type, additionalKey, instance.toString()];
        const instanceCompositeKey = TokenInstance.getCompositeKeyFromParts(
          TokenInstance.INDEX_KEY,
          tokenInstanceKeyList
        );
        const tokenInstance = await getObjectByKey(ctx, TokenInstance, instanceCompositeKey);

        await verifyAndUseAllowances(
          ctx,
          filledBy,
          toTokenId,
          currentQuantity,
          tokenInstance,
          ctx.callingUser,
          AllowanceType.Swap,
          []
        );

        ///////////////////////////////
        // Same as above, because we are relying on Swap Allowances here,
        // We are skipping user validation because the quantities have already
        // been validated by the swap and the allowance check
        // This bypasses the need for the filling user to *also* have a transfer allowance,
        // which could be mis-used. This allows a swap allowance to transfer the owned token
        // in the context of a swap without
        // needing the full permissions of a transfer allowance.
        ///////////////////////////////
        const skipUnlockForFillSide = true;
        await swapToken(
          ctx,
          filledBy,
          tokenSwap.offeredBy,
          toTokenId,
          currentQuantity,
          swapRequestId,
          skipUnlockForFillSide
        ).catch((e) => {
          const chainError = ChainError.from(e);
          throw new SwapTokenFailedError(
            chainError.message + `SwapRequestId ${swapRequestId}`,
            chainError.payload
          );
        });
      } else {
        await transferToken(ctx, {
          from: filledBy,
          to: tokenSwap.offeredBy,
          tokenInstanceKey: toTokenId,
          quantity: currentQuantity,
          allowancesToUse: [],
          authorizedOnBehalf: undefined // swap should not involve bridge
        }).catch((e) => {
          const chainError = ChainError.from(e);
          throw new TransferTokenFailedError(
            chainError.message + `SwapRequestId ${swapRequestId}`,
            chainError.payload
          );
        });
      }
    }

    const newSwapFillId: string = newSwapFill.getCompositeKey();

    tokenSwap.usesSpent = tokenSwap.usesSpent.plus(uses);

    if (!tokenSwap.fillIds) {
      tokenSwap.fillIds = [];
    }
    tokenSwap.fillIds.push(newSwapFillId);

    // Put the new swap fill
    await putChainObject(ctx, newSwapFill);

    // Put the updated swap request
    await putChainObject(ctx, tokenSwap);

    return newSwapFill;
  } else {
    throw new SwapDtoValidationError("fillTokenSwap", chainValidationErrors);
  }
}

function validateTokenSwapFill(
  tokenSwap: TokenSwapRequest,
  expectedTokenSwap: ExpectedTokenSwap,
  chainValidationErrors: Array<string>,
  swapRequestId: string
): void {
  if (expectedTokenSwap.offered.length !== tokenSwap.offered.length) {
    chainValidationErrors.push(
      `Expected offered token count of ${expectedTokenSwap.offered.length} does not match actual count of ${tokenSwap.offered.length}. SwapRequestId ${swapRequestId}`
    );
  }

  if (expectedTokenSwap.wanted.length !== tokenSwap.wanted.length) {
    chainValidationErrors.push(
      `Expected wanted token count of ${expectedTokenSwap.wanted.length} does not match actual count of ${tokenSwap.wanted.length}. SwapRequestId ${swapRequestId}`
    );
  }

  for (let index = 0; index < expectedTokenSwap.offered.length; index++) {
    const expectedOffered = plainToInstance(TokenInstanceQuantity, {
      tokenInstance: expectedTokenSwap.offered[index].tokenInstance,
      quantity: expectedTokenSwap.offered[index].quantity
    });
    const actualOffered = tokenSwap.offered[index];

    if (expectedOffered.tokenInstance.toStringKey() !== actualOffered.tokenInstance.toStringKey()) {
      chainValidationErrors.push(
        `Expected offered token instance of ${expectedOffered.tokenInstance.toStringKey()} does not match actual instance of ${actualOffered.tokenInstance.toStringKey()}. SwapRequestId ${swapRequestId}`
      );
    }

    if (!expectedOffered.quantity.isEqualTo(actualOffered.quantity)) {
      chainValidationErrors.push(
        `Expected offered token quantity of ${expectedOffered.quantity} does not match actual quantity of ${actualOffered.quantity}. SwapRequestId ${swapRequestId}`
      );
    }
  }

  for (let index = 0; index < expectedTokenSwap.wanted.length; index++) {
    const expectedWanted = plainToInstance(TokenInstanceQuantity, {
      tokenInstance: expectedTokenSwap.wanted[index].tokenInstance,
      quantity: expectedTokenSwap.wanted[index].quantity
    });
    const actualWanted = tokenSwap.wanted[index];

    if (expectedWanted.tokenInstance.toStringKey() !== actualWanted.tokenInstance.toStringKey()) {
      chainValidationErrors.push(
        `Expected wanted token instance of ${expectedWanted.tokenInstance.toStringKey()} does not match actual instance of ${actualWanted.tokenInstance.toStringKey()}. SwapRequestId ${swapRequestId}`
      );
    }

    if (!expectedWanted.quantity.isEqualTo(actualWanted.quantity)) {
      chainValidationErrors.push(
        `Expected wanted token quantity of ${expectedWanted.quantity} does not match actual quantity of ${actualWanted.quantity}. SwapRequestId ${swapRequestId}`
      );
    }
  }
}

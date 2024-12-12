import {
  ChainError,
  ChainObject,
  EnsureTokenSwapIndexingResponse,
  ErrorCode,
  TokenSwapRequest,
  TokenSwapRequestInstanceOffered,
  TokenSwapRequestOfferedBy,
  TokenSwapRequestOfferedTo
} from "@gala-chain/api";
import { plainToInstance } from "class-transformer";

import { getObjectByKey, getObjectsByKeys, putChainObject } from "../utils";

export interface EnsureTokenSwapIndexing {
  swapRequestIds: string[];
}

function acceptNotFoundError(e: Error) {
  const chainError = ChainError.from(e);
  if (chainError.matches(ErrorCode.NOT_FOUND)) {
    return null;
  } else {
    throw chainError;
  }
}

export async function ensureTokenSwapIndexing(
  ctx,
  params: EnsureTokenSwapIndexing
): Promise<EnsureTokenSwapIndexingResponse> {
  const results: TokenSwapRequest[] = await getObjectsByKeys(ctx, TokenSwapRequest, params.swapRequestIds);

  let noOp = true;
  const writes: ChainObject[] = [];

  for (const swap of results) {
    let swapRequestId = swap.swapRequestId;

    if (!swapRequestId) {
      swapRequestId = swap.getCompositeKey();
      swap.swapRequestId = swap.getCompositeKey();
      await putChainObject(ctx, swap);
    }

    for (const offered of swap.offered) {
      const expectedSwapInstance = plainToInstance(TokenSwapRequestInstanceOffered, {
        ...offered.tokenInstance,
        swapRequestId: swapRequestId
      });

      const existingSwapInstance = await getObjectByKey(
        ctx,
        TokenSwapRequestInstanceOffered,
        expectedSwapInstance.getCompositeKey()
      ).catch(acceptNotFoundError);

      if (!existingSwapInstance) {
        await expectedSwapInstance.validateOrReject();
        await putChainObject(ctx, expectedSwapInstance);

        noOp = false;
        writes.push(expectedSwapInstance);
      }
    }

    const expectedSwapOfferedBy: TokenSwapRequestOfferedBy = plainToInstance(TokenSwapRequestOfferedBy, {
      offeredBy: swap.offeredBy,
      swapRequestId: swapRequestId
    });

    const existingSwapOfferedBy = await getObjectByKey(
      ctx,
      TokenSwapRequestOfferedBy,
      expectedSwapOfferedBy.getCompositeKey()
    ).catch(acceptNotFoundError);

    if (!existingSwapOfferedBy) {
      await expectedSwapOfferedBy.validateOrReject();
      await putChainObject(ctx, expectedSwapOfferedBy);

      noOp = false;
      writes.push(expectedSwapOfferedBy);
    }

    // offering to a specfic user is not required
    if (swap.offeredTo) {
      const expectedSwapOfferedTo: TokenSwapRequestOfferedTo = plainToInstance(TokenSwapRequestOfferedTo, {
        offeredTo: swap.offeredTo,
        swapRequestId: swapRequestId
      });

      const existingSwapOfferedTo = await getObjectByKey(
        ctx,
        TokenSwapRequestOfferedTo,
        expectedSwapOfferedTo.getCompositeKey()
      ).catch(acceptNotFoundError);

      if (!existingSwapOfferedTo) {
        await expectedSwapOfferedTo.validateOrReject();
        await putChainObject(ctx, expectedSwapOfferedTo);

        noOp = false;
        writes.push(expectedSwapOfferedTo);
      }
    }
  }

  const response = plainToInstance(EnsureTokenSwapIndexingResponse, {
    noOp: noOp,
    writes: writes
  });

  return response;
}

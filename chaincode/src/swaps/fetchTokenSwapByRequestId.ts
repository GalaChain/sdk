import { TokenSwapRequest } from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { getObjectByKey } from "../utils";

export async function fetchTokenSwapByRequestId(
  ctx: GalaChainContext,
  swapRequestId: string
): Promise<TokenSwapRequest> {
  let tokenSwap: TokenSwapRequest;

  try {
    tokenSwap = await getObjectByKey(ctx, TokenSwapRequest, swapRequestId);
  } catch (error) {
    throw new Error(`Token swap with swapRequestId ${swapRequestId} not found.`);
  }

  return tokenSwap;
}

import { ExpectedTokenSwap, TokenSwapFill, UserAlias } from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { GalaChainContext } from "../types";
import { fillTokenSwap } from "./fillTokenSwap";

export interface SwapFillParams {
  swapRequestId: string;
  filledBy: UserAlias;
  uses: BigNumber;
  expectedTokenSwap?: ExpectedTokenSwap | undefined;
}

export async function batchFillTokenSwaps(ctx: GalaChainContext, swapFills: SwapFillParams[]) {
  const results: TokenSwapFill[] = [];

  for (const swap of swapFills) {
    const result = await fillTokenSwap(ctx, swap);

    results.push(result);
  }

  return results;
}

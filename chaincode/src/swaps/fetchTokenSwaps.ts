import { TokenSwapRequest } from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { getObjectsByPartialCompositeKey, takeUntilUndefined } from "../utils";

export async function fetchTokenSwaps(
  ctx: GalaChainContext,
  created: number | undefined
): Promise<TokenSwapRequest[]> {
  const createdKey = created && isFinite(created) ? `${created}` : undefined;
  const queryParams = takeUntilUndefined(createdKey);

  const results = await getObjectsByPartialCompositeKey(
    ctx,
    TokenSwapRequest.INDEX_KEY,
    queryParams,
    TokenSwapRequest
  );

  return results;
}

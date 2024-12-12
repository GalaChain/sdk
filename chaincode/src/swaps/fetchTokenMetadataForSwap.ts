import { ChainObject, TokenClass, TokenSwapRequest } from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { getObjectByKey } from "../utils";

export async function fetchTokenMetadataForSwap(ctx: GalaChainContext, swap: TokenSwapRequest) {
  for (const tokenQuantity of swap.offered) {
    const keyList = [
      tokenQuantity.tokenInstance.collection,
      tokenQuantity.tokenInstance.category,
      tokenQuantity.tokenInstance.type,
      tokenQuantity.tokenInstance.additionalKey
    ];

    const compositeKey = ChainObject.getCompositeKeyFromParts(TokenClass.INDEX_KEY, keyList);
    const tokenClass: TokenClass = await getObjectByKey(ctx, TokenClass, compositeKey);

    tokenQuantity.tokenMetadata = tokenClass;
  }

  for (const tokenQuantity of swap.wanted) {
    const keyList = [
      tokenQuantity.tokenInstance.collection,
      tokenQuantity.tokenInstance.category,
      tokenQuantity.tokenInstance.type,
      tokenQuantity.tokenInstance.additionalKey
    ];

    const compositeKey = ChainObject.getCompositeKeyFromParts(TokenClass.INDEX_KEY, keyList);
    const tokenClass: TokenClass = await getObjectByKey(ctx, TokenClass, compositeKey);

    tokenQuantity.tokenMetadata = tokenClass;
  }
}

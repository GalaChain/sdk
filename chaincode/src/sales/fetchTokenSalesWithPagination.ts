import { FetchTokenSalesWithPaginationDto, FetchTokenSalesWithPaginationResponse, TokenSale, TokenSaleOwner, ValidationFailedError } from "@gala-chain/api";
import { GalaChainContext } from "../types";
import { getObjectsByKeys, getObjectsByPartialCompositeKeyWithPagination, takeUntilUndefined } from "../utils";
import { plainToInstance } from "class-transformer";

export async function fetchTokenSalesWithPagination(
  ctx: GalaChainContext,
  params: FetchTokenSalesWithPaginationDto
): Promise<FetchTokenSalesWithPaginationResponse> {
  const instanceQueryKeys = takeUntilUndefined(params.owner);

  const limit = params.limit ?? FetchTokenSalesWithPaginationDto.DEFAULT_LIMIT;

  if (limit > FetchTokenSalesWithPaginationDto.MAX_LIMIT) {
    throw new ValidationFailedError(`FetchTokenSalesWithPaginationDto.MAX_LIMIT exceeded: ${limit}`);
  }

  const tokenSaleOwnerObjects = await getObjectsByPartialCompositeKeyWithPagination(
    ctx,
    TokenSaleOwner.INDEX_KEY,
    instanceQueryKeys,
    TokenSaleOwner,
    params.bookmark,
    limit
  );

  const tokenSaleIds = tokenSaleOwnerObjects.results.map((tokenSaleOwner) => {
    return tokenSaleOwner.tokenSaleId;
  });

  if (tokenSaleIds.length === 0) {
    return plainToInstance(FetchTokenSalesWithPaginationResponse, {
      nextPageBookMark: tokenSaleOwnerObjects.metadata.bookmark,
      results: []
    });
  }

  const results = await getObjectsByKeys(ctx, TokenSale, tokenSaleIds);


  // TODO: not sure what metadata get is for here, taken from swap code
  // for (const result of results) {
  //   await fetchTokenMetadataForSwap(ctx, result);
  // }

  const response = plainToInstance(FetchTokenSalesWithPaginationResponse, {
    nextPageBookMark: tokenSaleOwnerObjects.metadata.bookmark,
    results: results
  });

  return response;
}
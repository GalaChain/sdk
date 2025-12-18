import { GalaChainContext, getObjectsByPartialCompositeKeyWithPagination, } from "@gala-chain/chaincode";
import { NftCollectionAuthorization, FetchNftCollectionAuthorizationsResponse } from "@gala-chain/api";
import { plainToInstance } from "class-transformer";

export interface FetchNftCollectionAuthorizationsWithPaginationParams {
  bookmark?: string;
  limit?: number;
}

export async function fetchNftCollectionAuthorizationsWithPagination(
  ctx: GalaChainContext,
  data: FetchNftCollectionAuthorizationsWithPaginationParams
): Promise<FetchNftCollectionAuthorizationsResponse> {
  // Use empty array to fetch all collections (no filtering)
  const queryParams: string[] = [];

  const lookupResult = await getObjectsByPartialCompositeKeyWithPagination(
    ctx,
    NftCollectionAuthorization.INDEX_KEY,
    queryParams,
    NftCollectionAuthorization,
    data.bookmark,
    data.limit
  );

  const results = lookupResult.results;
  const bookmark = lookupResult.metadata.bookmark;

  const response = plainToInstance(FetchNftCollectionAuthorizationsResponse, {
    results: results,
    nextPageBookmark: bookmark
  });

  return response;
}

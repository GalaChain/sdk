/*
 * Copyright (c) Gala Games Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
  FetchTokenClassesDto,
  FetchTokenClassesResponse,
  FetchTokenClassesWithPaginationDto,
  GalaChainResponse,
  createValidDTO
} from "@gala-chain/api";
import { currency, fixture, nft } from "@gala-chain/test";
import { plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { TokenClassNotFoundError } from "./TokenError";

it("should FetchTokenClasses", async () => {
  // Given
  const currencyClass = currency.tokenClass();
  const nftClass = nft.tokenClass();

  const { ctx, contract } = fixture(GalaChainTokenContract).savedState(currencyClass, nftClass);

  const dto: FetchTokenClassesDto = await createValidDTO(FetchTokenClassesDto, {
    tokenClasses: [await currencyClass.getKey(), await nftClass.getKey()]
  });

  // When
  const response = await contract.FetchTokenClasses(ctx, dto);

  // Then
  expect(response).toEqual(GalaChainResponse.Success([currencyClass, nftClass]));
});

it("should throw an error if a key is missing", async () => {
  // Given
  const savedClass = nft.tokenClass();

  const { ctx, contract } = fixture(GalaChainTokenContract).savedState(savedClass);

  const missingKey = await savedClass.getKey();
  missingKey.collection = "Missing";

  const dto: FetchTokenClassesDto = await createValidDTO(FetchTokenClassesDto, {
    tokenClasses: [missingKey]
  });

  // When
  const response = await contract.FetchTokenClasses(ctx, dto).catch((e) => e);

  // Then
  expect(response).toEqual(GalaChainResponse.Error(new TokenClassNotFoundError(missingKey.toStringKey())));
});

it("should FetchTokenClassesWithPagination", async () => {
  // Given
  const currencyClass = currency.tokenClass();
  const nftClass = nft.tokenClass();

  const { ctx, contract } = fixture(GalaChainTokenContract).savedState(currencyClass, nftClass);

  const dto: FetchTokenClassesWithPaginationDto = await createValidDTO(
    FetchTokenClassesWithPaginationDto,
    {}
  );

  const expectedResponse = plainToInstance(FetchTokenClassesResponse, {
    nextPageBookmark: "",
    results: [currencyClass, nftClass]
  });

  // When
  const response = await contract.FetchTokenClassesWithPagination(ctx, dto);

  // Then
  expect(response).toEqual(GalaChainResponse.Success(expectedResponse));
});

it("should limit results for FetchTokenClassesWithPagination", async () => {
  // Given
  const currencyClass = currency.tokenClass();
  const nftClass = nft.tokenClass();

  const searchCollection = "TestCollectionFiltering";
  nftClass.collection = searchCollection;
  currencyClass.collection = "NotTestCollectionFiltering";

  const { ctx, contract } = fixture(GalaChainTokenContract).savedState(currencyClass, nftClass);

  const dto: FetchTokenClassesWithPaginationDto = await createValidDTO(FetchTokenClassesWithPaginationDto, {
    collection: searchCollection
  });

  const expectedResponse = plainToInstance(FetchTokenClassesResponse, {
    nextPageBookmark: "",
    results: [nftClass]
  });

  // When
  const response = await contract.FetchTokenClassesWithPagination(ctx, dto);

  // Then
  expect(response).toEqual(GalaChainResponse.Success(expectedResponse));
});

it("should not throw a 404 error if no tokens are found when using the Pagination method", async () => {
  // Given
  const savedClass = nft.tokenClass();

  const { ctx, contract } = fixture(GalaChainTokenContract).savedState(savedClass);

  const missingKey = await savedClass.getKey();
  missingKey.collection = "Missing";

  const dto: FetchTokenClassesWithPaginationDto = await createValidDTO(FetchTokenClassesWithPaginationDto, {
    collection: missingKey.collection
  });

  const expectedResponse = plainToInstance(FetchTokenClassesResponse, {
    nextPageBookmark: "",
    results: []
  });

  // When
  const response: GalaChainResponse<FetchTokenClassesResponse> = await contract
    .FetchTokenClassesWithPagination(ctx, dto)
    .catch((e) => e);

  // Then
  expect(response).toEqual(GalaChainResponse.Success(expectedResponse));

  const responseIsValid: boolean | undefined = await response.Data?.validateOrReject()
    .then(() => true)
    .catch(() => false);

  expect(responseIsValid).toBe(true);
});

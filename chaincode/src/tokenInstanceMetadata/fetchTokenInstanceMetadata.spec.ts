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
  FetchTokenInstanceMetadataDto,
  FetchTokenInstanceMetadataResponse,
  FetchTokenInstanceMetadataWithPaginationDto,
  GalaChainResponse,
  TokenInstanceMetadata,
  createValidDTO
} from "@gala-chain/api";
import { fixture, nft } from "@gala-chain/test";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { TokenInstanceMetadataNotFoundError } from "./TokenInstanceMetadataError";

it("should fetch metadata documents of all projects for an instance", async () => {
  // Given
  const savedMetadata = nft.tokenInstance1Metadata(); // project "TestProject"
  const otherProjectMetadata = nft.tokenInstance1Metadata((plain) => ({
    ...plain,
    project: "OtherProject",
    name: "Other Project View"
  }));

  const { ctx, contract, getWrites } = fixture(GalaChainTokenContract).savedState(
    savedMetadata,
    otherProjectMetadata
  );

  const dto = await createValidDTO(FetchTokenInstanceMetadataDto, {
    tokenInstance: nft.tokenInstance1Key()
  });

  // When
  const response = await contract.FetchTokenInstanceMetadata(ctx, dto);

  // Then
  expect(response).toEqual(
    GalaChainResponse.Success(expect.arrayContaining([savedMetadata, otherProjectMetadata]))
  );
  expect((response.Data as TokenInstanceMetadata[]).length).toEqual(2);
  expect(getWrites()).toEqual({});
});

it("should fetch metadata document of a single project", async () => {
  // Given
  const savedMetadata = nft.tokenInstance1Metadata();

  const { ctx, contract } = fixture(GalaChainTokenContract).savedState(savedMetadata);

  const dto = await createValidDTO(FetchTokenInstanceMetadataDto, {
    tokenInstance: nft.tokenInstance1Key(),
    project: savedMetadata.project
  });

  // When
  const response = await contract.FetchTokenInstanceMetadata(ctx, dto);

  // Then
  expect(response).toEqual(GalaChainResponse.Success([savedMetadata]));
});

it("should throw an error if project metadata is missing", async () => {
  // Given
  const { ctx, contract } = fixture(GalaChainTokenContract); // no saved metadata

  const missingKey = nft.tokenInstance1Key();
  const dto = await createValidDTO(FetchTokenInstanceMetadataDto, {
    tokenInstance: missingKey,
    project: "TestProject"
  });

  // When
  const response = await contract.FetchTokenInstanceMetadata(ctx, dto).catch((e) => e);

  // Then
  expect(response).toEqual(
    GalaChainResponse.Error(new TokenInstanceMetadataNotFoundError(missingKey.toStringKey(), "TestProject"))
  );
});

it("should return an empty list if instance has no metadata", async () => {
  // Given
  const { ctx, contract } = fixture(GalaChainTokenContract); // no saved metadata

  const dto = await createValidDTO(FetchTokenInstanceMetadataDto, {
    tokenInstance: nft.tokenInstance1Key()
  });

  // When
  const response = await contract.FetchTokenInstanceMetadata(ctx, dto);

  // Then
  expect(response).toEqual(GalaChainResponse.Success([]));
});

it("should FetchTokenInstanceMetadataWithPagination", async () => {
  // Given
  const savedMetadata = nft.tokenInstance1Metadata();

  const { ctx, contract } = fixture(GalaChainTokenContract).savedState(savedMetadata);

  const dto = await createValidDTO(FetchTokenInstanceMetadataWithPaginationDto, {
    collection: savedMetadata.collection
  });

  const expectedResponse = await createValidDTO(FetchTokenInstanceMetadataResponse, {
    nextPageBookmark: "",
    results: [savedMetadata]
  });

  // When
  const response = await contract.FetchTokenInstanceMetadataWithPagination(ctx, dto);

  // Then
  expect(response).toEqual(GalaChainResponse.Success(expectedResponse));
});

it("should not throw a 404 error if no metadata is found when using the pagination method", async () => {
  // Given
  const savedMetadata = nft.tokenInstance1Metadata();

  const { ctx, contract } = fixture(GalaChainTokenContract).savedState(savedMetadata);

  const dto = await createValidDTO(FetchTokenInstanceMetadataWithPaginationDto, {
    collection: "Missing"
  });

  const expectedResponse = await createValidDTO(FetchTokenInstanceMetadataResponse, {
    nextPageBookmark: "",
    results: []
  });

  // When
  const response = await contract.FetchTokenInstanceMetadataWithPagination(ctx, dto).catch((e) => e);

  // Then
  expect(response).toEqual(GalaChainResponse.Success(expectedResponse));
});

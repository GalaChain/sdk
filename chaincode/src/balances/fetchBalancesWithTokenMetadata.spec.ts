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
  FetchBalancesDto,
  FetchBalancesWithTokenMetadataResponse,
  GalaChainResponse,
  TokenBalanceWithMetadata,
  createValidDTO
} from "@gala-chain/api";
import { currency, fixture, nft } from "@gala-chain/test";
import { plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";

it("should Fetch Token Balances with Token Class Metadata", async () => {
  // Given
  const currencyClass = currency.tokenClass();
  const currencyBalance = currency.tokenBalance();
  const nftClass = nft.tokenClass();
  const nftBalance = nft.tokenBalance();

  const { ctx, contract } = fixture(GalaChainTokenContract).savedState(
    currencyClass,
    nftClass,
    currencyBalance,
    nftBalance
  );

  const dto: FetchBalancesDto = await createValidDTO(FetchBalancesDto, {
    owner: currency.tokenBalance().owner
  });

  const curencyBalanceWithMetadata = plainToInstance(TokenBalanceWithMetadata, {
    balance: currencyBalance,
    token: currencyClass
  });

  const nftBalanceWithMetadata = plainToInstance(TokenBalanceWithMetadata, {
    balance: nftBalance,
    token: nftClass
  });

  const expectedResponse = await createValidDTO(FetchBalancesWithTokenMetadataResponse, {
    results: [curencyBalanceWithMetadata, nftBalanceWithMetadata],
    nextPageBookmark: ""
  });

  // When
  const response = await contract.FetchBalancesWithTokenMetadata(ctx, dto);

  // Then
  expect(response).toEqual(GalaChainResponse.Success(expectedResponse));
});

it("should validate the response DTO if the nextPageBookmark is the empty string", async () => {
  // Given
  const currencyClass = currency.tokenClass();
  const nftClass = nft.tokenClass();

  const curencyBalanceWithMetadata = plainToInstance(TokenBalanceWithMetadata, {
    balance: currency.tokenBalance(),
    token: currencyClass
  });

  const nftBalanceWithMetadata = plainToInstance(TokenBalanceWithMetadata, {
    balance: nft.tokenBalance(),
    token: nftClass
  });

  const dto = await createValidDTO(FetchBalancesWithTokenMetadataResponse, {
    results: [curencyBalanceWithMetadata, nftBalanceWithMetadata],
    nextPageBookmark: ""
  });

  // Then
  const dtoIsValid = await dto
    .validateOrReject()
    .then(() => true)
    .catch((e) => e);

  expect(dtoIsValid).toBe(true);
});

it("should validate the response DTO if the nextPageBookmark is undefined", async () => {
  // Given
  const currencyClass = currency.tokenClass();
  const nftClass = nft.tokenClass();

  const curencyBalanceWithMetadata = plainToInstance(TokenBalanceWithMetadata, {
    balance: currency.tokenBalance(),
    token: currencyClass
  });

  const nftBalanceWithMetadata = plainToInstance(TokenBalanceWithMetadata, {
    balance: nft.tokenBalance(),
    token: nftClass
  });

  const dto = await createValidDTO(FetchBalancesWithTokenMetadataResponse, {
    results: [curencyBalanceWithMetadata, nftBalanceWithMetadata]
  });

  // When
  const dtoIsValid = await dto
    .validateOrReject()
    .then(() => true)
    .catch((e) => e);

  // Then
  expect(dtoIsValid).toBe(true);
});

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
  ContractAPI,
  FetchBalancesDto,
  FetchBalancesWithPaginationDto,
  FetchBalancesWithTokenMetadataResponse,
  GalaChainResponse,
  GalaChainSuccessResponse,
  TokenBalance,
  TokenBalanceWithMetadata,
  TokenClass,
  createValidDTO,
  generateResponseSchema
} from "@gala-chain/api";
import { fixture } from "@gala-chain/test";
import { plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { currency, nft } from "../testdata/index";
import { getObjectByKey } from "../utils";

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
  const response = await contract.FetchBalancesWithTokenMetadata(ctx, dto).catch((e) => e);

  // Then
  expect(response).toEqual(GalaChainResponse.Success(expectedResponse));
});

it("should fetch balances with legacy properties in saved state", async () => {
  // Given - balance state with fields removed from TokenBalance over the years,
  // including pre-open-source ones the SDK has no declaration for
  const currencyClass = currency.tokenClass();
  const currentBalance = currency.tokenBalance();
  const legacyBalance = plainToInstance(TokenBalance, {
    ...currentBalance.toPlainObject(),
    inUseHolds: [],
    quantityLocked: "5",
    quantityInUse: "2"
  });

  const { ctx, contract } = fixture(GalaChainTokenContract)
    .savedState(currencyClass)
    .savedKVState({
      key: currentBalance.getCompositeKey(),
      value: JSON.stringify({
        ...currentBalance.toPlainObject(),
        inUseHolds: [],
        quantityLocked: "5",
        quantityInUse: "2"
      })
    });

  const dto: FetchBalancesDto = await createValidDTO(FetchBalancesDto, {
    owner: legacyBalance.owner
  });

  // When
  const fetched = await getObjectByKey(ctx, TokenBalance, currentBalance.getCompositeKey());
  const response = await contract.FetchBalancesWithTokenMetadata(ctx, dto).catch((e) => e);

  // Then - undeclared fields are dropped on read
  expect(fetched).not.toHaveProperty("quantityLocked");
  expect(fetched).not.toHaveProperty("quantityInUse");
  expect(fetched.getQuantityTotal()).toEqual(currentBalance.getQuantityTotal());

  const expectedResponse = await createValidDTO(FetchBalancesWithTokenMetadataResponse, {
    results: [plainToInstance(TokenBalanceWithMetadata, { balance: fetched, token: currencyClass })],
    nextPageBookmark: ""
  });
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

  // When
  const dtoIsValid = await createValidDTO(FetchBalancesWithTokenMetadataResponse, {
    results: [curencyBalanceWithMetadata, nftBalanceWithMetadata],
    nextPageBookmark: ""
  })
    .then(() => true)
    .catch((e) => e);

  // Then
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

  // When
  const dtoIsValid = await createValidDTO(FetchBalancesWithTokenMetadataResponse, {
    results: [curencyBalanceWithMetadata, nftBalanceWithMetadata]
  })
    .then(() => true)
    .catch((e) => e);

  // Then
  expect(dtoIsValid).toBe(true);
});

it("uses the default page size when a balance metadata query omits limit", async () => {
  // Given
  const currencyClass = currency.tokenClass();
  const currencyBalance = currency.tokenBalance();
  const { ctx, contract } = fixture(GalaChainTokenContract).savedState(currencyClass, currencyBalance);
  const dto = await createValidDTO(FetchBalancesWithPaginationDto, {
    owner: currencyBalance.owner
  });
  const page = jest.spyOn(ctx.stub, "getStateByPartialCompositeKeyWithPagination");

  // When
  await contract.FetchBalancesWithTokenMetadata(ctx, dto);

  // Then
  expect(page.mock.calls[0]?.[0]).toEqual(TokenBalance.INDEX_KEY);
  expect(page.mock.calls[0]?.[2]).toEqual(FetchBalancesWithPaginationDto.DEFAULT_LIMIT);
  expect(page.mock.calls[0]?.[3]).toBeUndefined();
});

it("forwards a provided balance metadata page size", async () => {
  // Given
  const currencyClass = currency.tokenClass();
  const currencyBalance = currency.tokenBalance();
  const { ctx, contract } = fixture(GalaChainTokenContract).savedState(currencyClass, currencyBalance);
  const dto = await createValidDTO(FetchBalancesWithPaginationDto, {
    owner: currencyBalance.owner,
    limit: 2
  });
  const page = jest.spyOn(ctx.stub, "getStateByPartialCompositeKeyWithPagination");

  // When
  await contract.FetchBalancesWithTokenMetadata(ctx, dto);

  // Then
  expect(page.mock.calls[0]?.[2]).toEqual(2);
});

it("deserializes the published balance metadata response", async () => {
  // Given
  const { ctx, contract } = fixture(GalaChainTokenContract);
  const published = (await contract.GetContractAPI(ctx)) as unknown as GalaChainSuccessResponse<ContractAPI>;
  const method = published.Data.methods.find(
    (entry) => entry.methodName === "FetchBalancesWithTokenMetadata"
  );

  // Then
  expect(method?.responseSchema).toEqual(generateResponseSchema(FetchBalancesWithTokenMetadataResponse));

  const deserialized = await createValidDTO(FetchBalancesWithTokenMetadataResponse, {
    results: [
      {
        balance: currency.tokenBalance().toPlainObject(),
        token: currency.tokenClass().toPlainObject()
      }
    ],
    nextPageBookmark: "next"
  } as unknown as FetchBalancesWithTokenMetadataResponse);

  expect(deserialized.results[0].balance).toBeInstanceOf(TokenBalance);
  expect(deserialized.results[0].token).toBeInstanceOf(TokenClass);
  expect(deserialized.results[0].token.decimals).toEqual(currency.tokenClass().decimals);
  expect(deserialized.nextPageBookmark).toEqual("next");
});

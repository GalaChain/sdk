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
  FulfillMintDto,
  GalaChainResponse,
  MintRequestDto,
  MintTokenDto,
  TokenMintRequest,
  TokenMintStatus,
  createValidDTO
} from "@gala-chain/api";
import { currency, fixture, nft, users, writesMap } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { inverseEpoch, inverseTime } from "../utils";

describe("MintToken", () => {
  test("request mint for currency, i.e. FTs", async () => {
    // Given
    const currencyInstance = currency.tokenInstance();
    const currencyClass = currency.tokenClass();
    const mintQty = new BigNumber("1000000000000");
    const tokenAllowance = currency.tokenAllowance();

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testAdminId)
      .savedState(currencyClass, currencyInstance, tokenAllowance)
      .savedRangeState([]);

    // todo: figure out how to mock `putState` or code an alternative for simple keys
    // below does not actually work, the mocked function reports 0 calls
    // import { fixture } from "../../__test__";
    // fixture implementation does not support direct calls to ctx.stub.putState
    // this spy is not actually called, possibly because using jest.MockClass will
    // not also mock the underlying ChaincodeStub class?
    // https://chrisboakes.com/mocking-javascript-class-inner-functions-with-jest/
    // const putState = jest
    //   .spyOn(ctx.stub, "putState")
    //   .mockImplementation(() => Promise.resolve());

    const epochKey = inverseEpoch(ctx, 0);
    const timeKey = inverseTime(ctx, 0);

    const { collection, category, type, additionalKey } = currencyClass;

    const dto = await createValidDTO(MintTokenDto, {
      tokenClass: currency.tokenClassKey(),
      owner: users.testUser1Id,
      quantity: mintQty
    });

    const mintRequest = plainToInstance(TokenMintRequest, {
      collection,
      category,
      type,
      additionalKey,
      timeKey,
      totalKnownMintsCount: new BigNumber("0"),
      requestor: users.testAdminId,
      owner: users.testUser1Id,
      created: ctx.txUnixTime,
      quantity: mintQty,
      state: TokenMintStatus.Unknown,
      epoch: epochKey
    });

    mintRequest.id = mintRequest.requestId();

    const fulfillmentDto = plainToInstance(FulfillMintDto, {
      requests: [
        plainToInstance(MintRequestDto, {
          collection,
          category,
          type,
          additionalKey,
          timeKey,
          totalKnownMintsCount: new BigNumber("0"),
          id: mintRequest.requestId(),
          owner: users.testUser1Id
        })
      ]
    });

    // When
    const response = await contract.RequestMint(ctx, dto);

    // Then
    expect(response).toEqual(GalaChainResponse.Success(fulfillmentDto));
    expect(writes).toEqual(writesMap(mintRequest));
  });

  test("request mint for unique items, i.e. NFTs", async () => {
    // Given
    const nftInstance = nft.tokenInstance1();
    const nftClass = nft.tokenClass();
    const mintQty = new BigNumber("2");
    const tokenAllowance = nft.tokenMintAllowance();

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testAdminId)
      .savedState(nftClass, nftInstance, tokenAllowance)
      .savedRangeState([]);

    const epochKey = inverseEpoch(ctx, 0);
    const timeKey = inverseTime(ctx, 0);

    const { collection, category, type, additionalKey } = nftClass;

    const dto = await createValidDTO(MintTokenDto, {
      tokenClass: nft.tokenClassKey(),
      owner: users.testUser1Id,
      quantity: mintQty
    });

    const mintRequest = plainToInstance(TokenMintRequest, {
      collection,
      category,
      type,
      additionalKey,
      timeKey,
      totalKnownMintsCount: new BigNumber("0"),
      requestor: users.testAdminId,
      owner: users.testUser1Id,
      created: ctx.txUnixTime,
      quantity: mintQty,
      state: TokenMintStatus.Unknown,
      epoch: epochKey
    });

    mintRequest.id = mintRequest.requestId();

    const fulfillmentDto = plainToInstance(FulfillMintDto, {
      requests: [
        plainToInstance(MintRequestDto, {
          collection,
          category,
          type,
          additionalKey,
          timeKey,
          totalKnownMintsCount: new BigNumber("0"),
          id: mintRequest.requestId(),
          owner: users.testUser1Id
        })
      ]
    });

    const response = await contract.RequestMint(ctx, dto);

    expect(response).toEqual(GalaChainResponse.Success(fulfillmentDto));
    expect(writes).toEqual(writesMap(mintRequest));
  });

  test("does not mint lower than decimal limit (10)", async () => {
    // Given
    const currencyInstance = currency.tokenInstance();
    const currencyClass = currency.tokenClass();
    const tokenAllowance = currency.tokenAllowance();
    const decimalQuantity = new BigNumber("0.000000000001");

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testUser1Id)
      .savedState(currencyClass, currencyInstance, tokenAllowance);

    const dto = await createValidDTO(MintTokenDto, {
      tokenClass: currency.tokenClassKey(),
      owner: users.testUser1Id,
      quantity: decimalQuantity
    });

    // When
    const response = await contract.RequestMint(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(
        new Error(
          `ValidateMintRequest failure: Quantity: ${decimalQuantity} has more than ${currencyClass.decimals} decimal places.`
        )
      )
    );
    expect(writes).toEqual({});
  });
});

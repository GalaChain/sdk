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
  AllowanceKey,
  GalaChainResponse,
  MintTokenDto,
  TokenAllowance,
  TokenBalance,
  TokenClaim,
  TokenClass,
  TokenInstance,
  TokenInstanceKey,
  TokenMintFulfillment,
  TokenMintRequest,
  TokenMintStatus,
  createValidDTO
} from "@gala-chain/api";
import { currency, fixture, nft, users, writesMap } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { TotalSupplyExceededError } from "../allowances/AllowanceError";
import { InvalidDecimalError } from "../token";
import { inverseEpoch, inverseTime } from "../utils";

describe("MintToken", () => {
  test("mints currency, i.e. FTs", async () => {
    // Given
    const currencyInstance = currency.tokenInstance();
    const currencyInstanceKey = currency.tokenInstanceKey();
    const currencyClass = currency.tokenClass();
    const mintQty = new BigNumber("1000000000000");
    const tokenAllowance = currency.tokenAllowance();

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.admin)
      .savedState(currencyClass, currencyInstance, tokenAllowance)
      .savedRangeState([]);

    const dto = await createValidDTO(MintTokenDto, {
      tokenClass: currency.tokenClassKey(),
      owner: users.testUser1,
      quantity: mintQty
    });

    const tokenClaim = plainToInstance(TokenClaim, {
      ...currencyInstanceKey,
      ownerKey: users.admin,
      issuerKey: users.admin,
      instance: new BigNumber("0"),
      action: 4,
      quantity: mintQty,
      allowanceCreated: 1,
      claimSequence: new BigNumber("1"),
      created: ctx.txUnixTime
    });

    const { collection, category, type, additionalKey } = currencyClass;
    const timeKey = inverseTime(ctx, 0);
    const epochKey = inverseEpoch(ctx, 0);

    const mintRequest = plainToInstance(TokenMintRequest, {
      collection,
      category,
      type,
      additionalKey,
      timeKey,
      totalKnownMintsCount: new BigNumber("0"),
      requestor: users.admin,
      owner: users.testUser1,
      created: ctx.txUnixTime,
      quantity: mintQty,
      state: TokenMintStatus.Unknown,
      epoch: epochKey
    });

    mintRequest.id = mintRequest.requestId();

    const mintFulfillment: TokenMintFulfillment = mintRequest.fulfill(mintRequest.quantity);

    const expectedClass = plainToInstance(TokenClass, { ...currencyClass, totalSupply: mintQty });

    const expectedBalance = plainToInstance(TokenBalance, { ...currency.tokenBalance(), quantity: mintQty });

    const expectedAllowance = plainToInstance(TokenAllowance, {
      ...tokenAllowance,
      quantitySpent: mintQty,
      usesSpent: new BigNumber("1"),
      expires: ctx.txUnixTime
    });

    // When
    const response = await contract.MintToken(ctx, dto);

    // Then
    expect(response).toEqual(GalaChainResponse.Success([currency.tokenInstanceKey()]));

    expect(writes).toEqual(
      writesMap(tokenClaim, expectedAllowance, expectedBalance, expectedClass, mintRequest, mintFulfillment)
    );
  });

  test("mints unique items, i.e. NFTs", async () => {
    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();
    const mintQty = new BigNumber("2");
    const tokenAllowance = nft.tokenMintAllowance();

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.admin)
      .savedState(nftClass, nftInstance, tokenAllowance)
      .savedRangeState([]);

    const dto = await createValidDTO(MintTokenDto, {
      tokenClass: nft.tokenClassKey(),
      owner: users.testUser1,
      quantity: mintQty
    });
    const nft1Key = plainToInstance(TokenInstanceKey, {
      ...nftInstanceKey,
      instance: new BigNumber("1")
    });
    const nft1 = plainToInstance(TokenInstance, {
      ...nftInstanceKey,
      instance: new BigNumber("1"),
      isNonFungible: true,
      owner: users.testUser1
    });
    const nft2Key = plainToInstance(TokenInstanceKey, {
      ...nftInstanceKey,
      instance: new BigNumber("2")
    });
    const nft2 = plainToInstance(TokenInstance, {
      ...nftInstanceKey,
      instance: new BigNumber("2"),
      isNonFungible: true,
      owner: users.testUser1
    });
    const expectedBalance = plainToInstance(TokenBalance, {
      ...nft.tokenBalance(),
      quantity: new BigNumber("2"),
      instanceIds: [new BigNumber("1"), new BigNumber("2")]
    });

    const expectedAllowance = plainToInstance(TokenAllowance, {
      ...tokenAllowance,
      usesSpent: new BigNumber("1"),
      quantitySpent: mintQty,
      expires: ctx.txUnixTime
    });

    const expectedClass = plainToInstance(TokenClass, { ...nftClass, totalSupply: new BigNumber("2") });

    const tokenClaim = plainToInstance(TokenClaim, {
      ...nftInstanceKey,
      ownerKey: users.admin,
      issuerKey: users.admin,
      instance: new BigNumber("0"),
      action: 4,
      quantity: mintQty,
      allowanceCreated: 1,
      claimSequence: new BigNumber("1"),
      created: ctx.txUnixTime
    });

    const { collection, category, type, additionalKey } = nftClass;
    const timeKey = inverseTime(ctx, 0);
    const epochKey = inverseEpoch(ctx, 0);

    const mintRequest = plainToInstance(TokenMintRequest, {
      collection,
      category,
      type,
      additionalKey,
      timeKey,
      totalKnownMintsCount: new BigNumber("0"),
      requestor: users.admin,
      owner: users.testUser1,
      created: ctx.txUnixTime,
      quantity: mintQty,
      state: TokenMintStatus.Unknown,
      epoch: epochKey
    });

    mintRequest.id = mintRequest.requestId();

    const mintFulfillment: TokenMintFulfillment = mintRequest.fulfill(mintRequest.quantity);

    // When
    const response = await contract.MintToken(ctx, dto);

    // Then
    expect(response).toEqual(GalaChainResponse.Success([nft1Key, nft2Key]));

    expect(writes).toEqual(
      writesMap(
        tokenClaim,
        expectedAllowance,
        nft1,
        nft2,
        expectedBalance,
        expectedClass,
        mintRequest,
        mintFulfillment
      )
    );
  });

  test("does not mint lower than decimal limit (10)", async () => {
    // Given
    const currencyInstance = currency.tokenInstance();
    const currencyClass = currency.tokenClass();
    const tokenAllowance = currency.tokenAllowance();
    const decimalQuantity = new BigNumber("0.000000000001");

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testUser1)
      .savedState(currencyClass, currencyInstance, tokenAllowance)
      .savedRangeState([]);

    const dto = await createValidDTO(MintTokenDto, {
      tokenClass: currency.tokenClassKey(),
      owner: users.testUser1,
      quantity: decimalQuantity
    });

    // When
    const response = await contract.MintToken(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(new InvalidDecimalError(decimalQuantity, currencyClass.decimals))
    );
    expect(writes).toEqual({});
  });

  test("does not mint if quantity exceeds maxSupply", async () => {
    // Given
    const currencyInstance = currency.tokenInstance();
    const currencyClass = currency.tokenClass();
    currencyClass.maxSupply = new BigNumber("100");
    const tokenAllowance = currency.tokenAllowance();
    tokenAllowance.uses = new BigNumber("1000");
    const mintQuantity = new BigNumber("1000");

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.admin)
      .savedState(currencyClass, currencyInstance, tokenAllowance)
      .savedRangeState([]);

    const dto = await createValidDTO(MintTokenDto, {
      tokenClass: currency.tokenClassKey(),
      owner: users.admin,
      quantity: mintQuantity
    });

    // When
    const response = await contract.MintToken(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(
        new TotalSupplyExceededError(
          currencyClass.getCompositeKey(),
          currencyClass.maxSupply,
          new BigNumber("1000")
        )
      )
    );
    expect(writes).toEqual({});
  });

  it("mints NFTs with an explicitly specified admin allowance", async () => {
    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();
    const mintQty = new BigNumber("2");
    const tokenAllowance = nft.tokenMintAllowance();
    const allowanceKey = plainToInstance(AllowanceKey, {
      grantedTo: tokenAllowance.grantedTo,
      collection: tokenAllowance.collection,
      category: tokenAllowance.category,
      type: tokenAllowance.type,
      additionalKey: tokenAllowance.additionalKey,
      instance: tokenAllowance.instance,
      allowanceType: tokenAllowance.allowanceType,
      grantedBy: tokenAllowance.grantedBy,
      created: tokenAllowance.created
    });

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.admin)
      .savedState(nftClass, nftInstance, tokenAllowance)
      .savedRangeState([]);

    const dto = await createValidDTO(MintTokenDto, {
      tokenClass: nft.tokenClassKey(),
      owner: users.testUser1,
      quantity: mintQty,
      allowanceKey: allowanceKey
    });
    const nft1Key = plainToInstance(TokenInstanceKey, {
      ...nftInstanceKey,
      instance: new BigNumber("1")
    });
    const nft1 = plainToInstance(TokenInstance, {
      ...nftInstanceKey,
      instance: new BigNumber("1"),
      isNonFungible: true,
      owner: users.testUser1
    });
    const nft2Key = plainToInstance(TokenInstanceKey, {
      ...nftInstanceKey,
      instance: new BigNumber("2")
    });
    const nft2 = plainToInstance(TokenInstance, {
      ...nftInstanceKey,
      instance: new BigNumber("2"),
      isNonFungible: true,
      owner: users.testUser1
    });
    const expectedBalance = plainToInstance(TokenBalance, {
      ...nft.tokenBalance(),
      quantity: new BigNumber("2"),
      instanceIds: [new BigNumber("1"), new BigNumber("2")]
    });

    const expectedAllowance = plainToInstance(TokenAllowance, {
      ...tokenAllowance,
      usesSpent: new BigNumber("1"),
      quantitySpent: mintQty,
      expires: ctx.txUnixTime
    });

    const expectedClass = plainToInstance(TokenClass, { ...nftClass, totalSupply: new BigNumber("2") });

    const tokenClaim = plainToInstance(TokenClaim, {
      ...nftInstanceKey,
      ownerKey: users.admin,
      issuerKey: users.admin,
      instance: new BigNumber("0"),
      action: 4,
      quantity: mintQty,
      allowanceCreated: 1,
      claimSequence: new BigNumber("1"),
      created: ctx.txUnixTime
    });

    const { collection, category, type, additionalKey } = nftClass;
    const timeKey = inverseTime(ctx, 0);
    const epochKey = inverseEpoch(ctx, 0);

    const mintRequest = plainToInstance(TokenMintRequest, {
      collection,
      category,
      type,
      additionalKey,
      timeKey,
      allowanceKey,
      totalKnownMintsCount: new BigNumber("0"),
      requestor: users.admin,
      owner: users.testUser1,
      created: ctx.txUnixTime,
      quantity: mintQty,
      state: TokenMintStatus.Unknown,
      epoch: epochKey
    });

    mintRequest.id = mintRequest.requestId();

    const mintFulfillment: TokenMintFulfillment = mintRequest.fulfill(mintRequest.quantity);

    const response = await contract.MintToken(ctx, dto);

    expect(response).toEqual(GalaChainResponse.Success([nft1Key, nft2Key]));
    expect(writes).toEqual(
      writesMap(
        tokenClaim,
        expectedAllowance,
        nft1,
        nft2,
        expectedBalance,
        expectedClass,
        mintRequest,
        mintFulfillment
      )
    );
  });
});

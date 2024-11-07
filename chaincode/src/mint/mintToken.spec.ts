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
  TokenMintFulfillment,
  TokenMintRequest,
  TokenMintStatus,
  createValidChainObject,
  createValidDTO,
  createValidRangedChainObject,
  createValidSubmitDTO
} from "@gala-chain/api";
import { currency, fixture, nft, users, writesMap } from "@gala-chain/test";
import BigNumber from "bignumber.js";

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

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.admin)
      .savedState(currencyClass, currencyInstance, tokenAllowance)
      .savedRangeState([]);

    const dto = await createValidSubmitDTO(MintTokenDto, {
      tokenClass: currency.tokenClassKey(),
      owner: users.testUser1.identityKey,
      quantity: mintQty
    }).signed(users.admin.privateKey);

    const tokenClaim = await createValidChainObject(TokenClaim, {
      ...currencyInstanceKey,
      ownerKey: users.admin.identityKey,
      issuerKey: users.admin.identityKey,
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

    const mintRequest = await createValidRangedChainObject(TokenMintRequest, {
      id: "-", // will be set in the mintRequest.requestId() call
      collection,
      category,
      type,
      additionalKey,
      timeKey,
      totalKnownMintsCount: new BigNumber("0"),
      requestor: users.admin.identityKey,
      owner: users.testUser1.identityKey,
      created: ctx.txUnixTime,
      quantity: mintQty,
      state: TokenMintStatus.Unknown,
      epoch: epochKey
    });

    mintRequest.id = mintRequest.requestId();

    const mintFulfillment: TokenMintFulfillment = mintRequest.fulfill(mintRequest.quantity);

    const expectedClass = await createValidChainObject(TokenClass, {
      ...currencyClass,
      totalSupply: mintQty
    });

    const expectedBalance = new TokenBalance({ ...currencyClass, owner: users.testUser1.identityKey });
    expectedBalance.addQuantity(mintQty);

    const expectedAllowance = await createValidChainObject(TokenAllowance, {
      ...tokenAllowance,
      quantitySpent: mintQty,
      usesSpent: new BigNumber("1"),
      expires: ctx.txUnixTime
    });

    // When
    const response = await contract.MintToken(ctx, dto);

    // Then
    expect(response).toEqual(GalaChainResponse.Success([currency.tokenInstanceKey()]));

    expect(getWrites()).toEqual(
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

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.admin)
      .savedState(nftClass, nftInstance, tokenAllowance)
      .savedRangeState([]);

    const dto = await createValidSubmitDTO(MintTokenDto, {
      tokenClass: nft.tokenClassKey(),
      owner: users.testUser1.identityKey,
      quantity: mintQty
    }).signed(users.admin.privateKey);

    const nft1 = await createValidChainObject(TokenInstance, {
      ...nftInstanceKey,
      instance: new BigNumber("1"),
      isNonFungible: true,
      owner: users.testUser1.identityKey
    });

    const nft2 = await createValidChainObject(TokenInstance, {
      ...nftInstanceKey,
      instance: new BigNumber("2"),
      isNonFungible: true,
      owner: users.testUser1.identityKey
    });

    const expectedBalance = new TokenBalance({ ...nftClass, owner: users.testUser1.identityKey });
    expectedBalance.addInstance(new BigNumber("1"));
    expectedBalance.addInstance(new BigNumber("2"));

    const expectedAllowance = await createValidChainObject(TokenAllowance, {
      ...tokenAllowance,
      usesSpent: new BigNumber("1"),
      quantitySpent: mintQty,
      expires: ctx.txUnixTime
    });

    const expectedClass = await createValidChainObject(TokenClass, {
      ...nftClass,
      totalSupply: new BigNumber("2")
    });

    const tokenClaim = await createValidChainObject(TokenClaim, {
      ...nftInstanceKey,
      ownerKey: users.admin.identityKey,
      issuerKey: users.admin.identityKey,
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

    const mintRequest = await createValidRangedChainObject(TokenMintRequest, {
      id: "-", // will be set in the mintRequest.requestId() call
      collection,
      category,
      type,
      additionalKey,
      timeKey,
      totalKnownMintsCount: new BigNumber("0"),
      requestor: users.admin.identityKey,
      owner: users.testUser1.identityKey,
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
    expect(response).toEqual(GalaChainResponse.Success([nft1.instanceKeyObj(), nft2.instanceKeyObj()]));

    expect(getWrites()).toEqual(
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

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser1)
      .savedState(currencyClass, currencyInstance, tokenAllowance)
      .savedRangeState([]);

    const dto = await createValidSubmitDTO(MintTokenDto, {
      tokenClass: currency.tokenClassKey(),
      owner: users.testUser1.identityKey,
      quantity: decimalQuantity
    }).signed(users.testUser1.privateKey);

    // When
    const response = await contract.MintToken(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(new InvalidDecimalError(decimalQuantity, currencyClass.decimals))
    );
    expect(getWrites()).toEqual({});
  });

  test("does not mint if quantity exceeds maxSupply", async () => {
    // Given
    const currencyInstance = currency.tokenInstance();
    const currencyClass = currency.tokenClass();
    currencyClass.maxSupply = new BigNumber("100");
    const tokenAllowance = currency.tokenAllowance();
    tokenAllowance.uses = new BigNumber("1000");
    const mintQuantity = new BigNumber("1000");

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.admin)
      .savedState(currencyClass, currencyInstance, tokenAllowance)
      .savedRangeState([]);

    const dto = await createValidSubmitDTO(MintTokenDto, {
      tokenClass: currency.tokenClassKey(),
      owner: users.admin.identityKey,
      quantity: mintQuantity
    }).signed(users.admin.privateKey);

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
    expect(getWrites()).toEqual({});
  });

  it("mints NFTs with an explicitly specified admin allowance", async () => {
    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();
    const mintQty = new BigNumber("2");
    const tokenAllowance = nft.tokenMintAllowance();
    const allowanceKey = await createValidDTO(AllowanceKey, {
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

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.admin)
      .savedState(nftClass, nftInstance, tokenAllowance)
      .savedRangeState([]);

    const dto = await createValidSubmitDTO(MintTokenDto, {
      tokenClass: nft.tokenClassKey(),
      owner: users.testUser1.identityKey,
      quantity: mintQty,
      allowanceKey: allowanceKey
    }).signed(users.admin.privateKey);

    const nft1 = await createValidChainObject(TokenInstance, {
      ...nftInstanceKey,
      instance: new BigNumber("1"),
      isNonFungible: true,
      owner: users.testUser1.identityKey
    });

    const nft2 = await createValidChainObject(TokenInstance, {
      ...nftInstanceKey,
      instance: new BigNumber("2"),
      isNonFungible: true,
      owner: users.testUser1.identityKey
    });

    const expectedBalance = new TokenBalance({ ...nftClass, owner: users.testUser1.identityKey });
    expectedBalance.addInstance(new BigNumber("1"));
    expectedBalance.addInstance(new BigNumber("2"));

    const expectedAllowance = await createValidChainObject(TokenAllowance, {
      ...tokenAllowance,
      usesSpent: new BigNumber("1"),
      quantitySpent: mintQty,
      expires: ctx.txUnixTime
    });

    const expectedClass = await createValidChainObject(TokenClass, {
      ...nftClass,
      totalSupply: new BigNumber("2")
    });

    const tokenClaim = await createValidChainObject(TokenClaim, {
      ...nftInstanceKey,
      ownerKey: users.admin.identityKey,
      issuerKey: users.admin.identityKey,
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

    const mintRequest = await createValidRangedChainObject(TokenMintRequest, {
      id: "-", // will be set in the mintRequest.requestId() call
      collection,
      category,
      type,
      additionalKey,
      timeKey,
      allowanceKey,
      totalKnownMintsCount: new BigNumber("0"),
      requestor: users.admin.identityKey,
      owner: users.testUser1.identityKey,
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
    expect(response).toEqual(GalaChainResponse.Success([nft1.instanceKeyObj(), nft2.instanceKeyObj()]));
    expect(getWrites()).toEqual(
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

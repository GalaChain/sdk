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
  FetchMintRequestsDto,
  FulfillMintDto,
  GalaChainResponse,
  MintRequestDto,
  TokenAllowance,
  TokenBalance,
  TokenBurnCounter,
  TokenClaim,
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
import { generateInverseTimeKey, inverseEpoch, inverseTime } from "../utils";

describe("FulfillMint", () => {
  it("should fetch TokenMintRequest chain objects", async () => {
    // Given
    const currencyClassKey = currency.tokenClassKey();

    const testFixture = fixture(GalaChainTokenContract).callingUser(users.testAdminId);

    const { ctx, contract } = testFixture;

    const epochKey = inverseEpoch(ctx, 0);
    const timeKey = inverseTime(ctx, 0);

    const recentTime = ctx.txUnixTime;
    const oldestTime = recentTime - 2000;

    const recentTimeKey = generateInverseTimeKey(recentTime);
    const oldestTimeKey = generateInverseTimeKey(oldestTime);

    const { collection, category, type, additionalKey } = currencyClassKey;

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
      quantity: new BigNumber("1"),
      state: TokenMintStatus.Unknown,
      epoch: epochKey
    });

    mintRequest.id = mintRequest.requestId();

    testFixture.savedRangeState([mintRequest]);

    const dto = await createValidDTO(FetchMintRequestsDto, {
      collection,
      category,
      type,
      additionalKey,
      endTimestamp: recentTime,
      startTimestamp: oldestTime
    });

    // When
    const response = await contract.FetchMintRequests(ctx, dto);

    // Then
    expect(timeKey >= recentTimeKey && timeKey < oldestTimeKey).toBe(true);
    expect(response).toEqual(GalaChainResponse.Success([mintRequest]));
  });

  test("mints currency, i.e. FTs", async () => {
    // Given
    const currencyInstance = currency.tokenInstance();
    const currencyInstanceKey = currency.tokenInstanceKey();
    const currencyClass = currency.tokenClass();
    const mintQty = new BigNumber("1000000000000");
    const tokenAllowance = currency.tokenAllowance();

    const testFixture = fixture(GalaChainTokenContract).callingUser(users.testAdminId);

    const { ctx, contract, writes } = testFixture;

    const epochKey = inverseEpoch(ctx, 0);
    const timeKey = inverseTime(ctx, 0);

    const { collection, category, type, additionalKey } = currencyClass;

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

    const mintFulfillment: TokenMintFulfillment = mintRequest.fulfill(mintRequest.quantity);

    const tokenBurnCounter = plainToInstance(TokenBurnCounter, {
      collection,
      category,
      type,
      additionalKey,
      timeKey,
      instance: TokenInstance.FUNGIBLE_TOKEN_INSTANCE,
      totalKnownBurnsCount: new BigNumber("0"),
      burnedBy: users.testUser2Id,
      created: ctx.txUnixTime,
      quantity: new BigNumber("1"),
      epoch: epochKey
    });

    tokenBurnCounter.referenceId = tokenBurnCounter.referencedBurnId();

    const tokenClaim = plainToInstance(TokenClaim, {
      ...currencyInstanceKey,
      ownerKey: users.testAdminId,
      issuerKey: users.testAdminId,
      instance: new BigNumber("0"),
      action: 4,
      quantity: mintQty,
      allowanceCreated: 1,
      claimSequence: new BigNumber("1"),
      created: ctx.txUnixTime
    });

    testFixture
      .savedState(currencyClass, currencyInstance, tokenAllowance, tokenClaim)
      .savedRangeState([mintRequest, tokenBurnCounter]);

    const dto = plainToInstance(FulfillMintDto, {
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

    const expectedBalance = plainToInstance(TokenBalance, {
      ...currency.tokenBalance(),
      quantity: mintQty
    });

    const expectedAllowance = plainToInstance(TokenAllowance, {
      ...tokenAllowance,
      quantitySpent: mintQty,
      usesSpent: new BigNumber("1"),
      expires: ctx.txUnixTime
    });

    // When
    const response = await contract.FulfillMint(ctx, dto);

    // Then
    expect(response).toEqual(GalaChainResponse.Success([currency.tokenInstanceKey()]));
    expect(writes).toEqual(writesMap(tokenClaim, expectedAllowance, expectedBalance, mintFulfillment));
  });

  test("mints unique items, i.e. NFTs", async () => {
    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();
    const mintQty = new BigNumber("2");
    const tokenAllowance = nft.tokenMintAllowance();

    const { collection, category, type, additionalKey } = nftClass;

    const testFixture = fixture(GalaChainTokenContract).callingUser(users.testAdminId);

    const { ctx, contract, writes } = testFixture;

    const nft1Key = plainToInstance(TokenInstanceKey, {
      ...nftInstanceKey,
      instance: new BigNumber("1")
    });
    const nft1 = plainToInstance(TokenInstance, {
      ...nftInstanceKey,
      instance: new BigNumber("1"),
      isNonFungible: true,
      owner: users.testUser1Id
    });
    const nft2Key = plainToInstance(TokenInstanceKey, {
      ...nftInstanceKey,
      instance: new BigNumber("2")
    });
    const nft2 = plainToInstance(TokenInstance, {
      ...nftInstanceKey,
      instance: new BigNumber("2"),
      isNonFungible: true,
      owner: users.testUser1Id
    });
    const expectedBalance = plainToInstance(TokenBalance, {
      ...nft.tokenBalance(),
      quantity: new BigNumber("2"),
      instanceIds: [new BigNumber("1"), new BigNumber("2")]
    });

    const tokenClaim = plainToInstance(TokenClaim, {
      ...nftInstanceKey,
      ownerKey: users.testAdminId,
      issuerKey: users.testAdminId,
      instance: new BigNumber("0"),
      action: 4,
      quantity: mintQty,
      allowanceCreated: 1,
      claimSequence: new BigNumber("1"),
      created: ctx.txUnixTime
    });

    const expectedAllowance = plainToInstance(TokenAllowance, {
      ...tokenAllowance,
      quantitySpent: mintQty,
      usesSpent: new BigNumber("1"),
      expires: ctx.txUnixTime
    });

    const epochKey = inverseEpoch(ctx, 0);
    const timeKey = inverseTime(ctx, 0);

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

    const mintFulfillment: TokenMintFulfillment = mintRequest.fulfill(mintRequest.quantity);

    const dto = plainToInstance(FulfillMintDto, {
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

    testFixture.savedState(nftClass, nftInstance, tokenAllowance, tokenClaim).savedRangeState([mintRequest]);

    // When
    const response = await contract.FulfillMint(ctx, dto);

    // Then
    expect(response).toEqual(GalaChainResponse.Success([nft1Key, nft2Key]));
    expect(writes).toEqual(
      writesMap(tokenClaim, expectedAllowance, nft1, nft2, expectedBalance, mintFulfillment)
    );
  });

  it("should not mint lower than decimal limit (10)", async () => {
    // Given
    const currencyInstance = currency.tokenInstance();
    const currencyClass = currency.tokenClass();
    const tokenAllowance = currency.tokenAllowance();
    const decimalQuantity = new BigNumber("0.000000000001");

    const testFixture = fixture(GalaChainTokenContract)
      .callingUser(users.testUser1Id)
      .savedState(currencyClass, currencyInstance, tokenAllowance);

    const { ctx, contract, writes } = testFixture;

    const epochKey = inverseEpoch(ctx, 0);
    const timeKey = inverseTime(ctx, 0);

    const { collection, category, type, additionalKey } = currencyClass;

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
      quantity: decimalQuantity,
      state: TokenMintStatus.Unknown,
      epoch: epochKey
    });

    mintRequest.id = mintRequest.requestId();

    testFixture.savedRangeState([mintRequest]);

    const dto = plainToInstance(FulfillMintDto, {
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
    const response = await contract.FulfillMint(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(
        new Error(`Quantity: ${decimalQuantity} has more than ${currencyClass.decimals} decimal places.`)
      )
    );
    expect(writes).toEqual({});
  });

  it("prevents attackers from exploiting the lack of signing requirement", async () => {
    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();
    const mintQty = new BigNumber("2");
    const tokenAllowance = nft.tokenMintAllowance();

    const { collection, category, type, additionalKey } = nftClass;

    const testFixture = fixture(GalaChainTokenContract).callingUser(users.attacker);

    const { ctx, contract, writes } = testFixture;

    const tokenClaim = plainToInstance(TokenClaim, {
      ...nftInstanceKey,
      ownerKey: users.testAdminId,
      issuerKey: users.testAdminId,
      instance: new BigNumber("0"),
      action: 4,
      quantity: mintQty,
      allowanceCreated: 1,
      claimSequence: new BigNumber("1"),
      created: ctx.txUnixTime
    });

    const epochKey = inverseEpoch(ctx, 0);
    const timeKey = inverseTime(ctx, 0);

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

    const tokenBurnCounter = plainToInstance(TokenBurnCounter, {
      collection,
      category,
      type,
      additionalKey,
      timeKey,
      totalKnownBurnsCount: new BigNumber("0"),
      instance: nftInstance.instance,
      burnedBy: users.testUser2Id,
      created: ctx.txUnixTime,
      quantity: new BigNumber("1"),
      epoch: epochKey
    });

    tokenBurnCounter.referenceId = tokenBurnCounter.referencedBurnId();

    const dto = plainToInstance(FulfillMintDto, {
      requests: [
        plainToInstance(MintRequestDto, {
          collection,
          category,
          type,
          additionalKey,
          timeKey,
          totalKnownMintsCount: new BigNumber("0"),
          id: mintRequest.requestId(),
          owner: users.attacker // <- tampered here. code expects users.testUser1Id
        })
      ]
    });

    testFixture
      .savedState(nftClass, nftInstance, tokenAllowance, tokenClaim)
      .savedRangeState([mintRequest, tokenBurnCounter]);

    // When
    const response = await contract.FulfillMint(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(
        new Error(
          `client|maliciousUser does not have sufficient allowances 0 to Mint 2 token TEST$Item$Potion$Elixir$0 to client|testUser1`
        )
      )
    );

    expect(writes).toEqual({});
  });
});

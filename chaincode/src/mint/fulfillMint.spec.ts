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
  createValidChainObject,
  createValidDTO,
  createValidRangedChainObject,
  createValidSubmitDTO
} from "@gala-chain/api";
import { currency, fixture, nft, users, writesMap } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { generateInverseTimeKey, inverseEpoch, inverseTime, lookbackTimeOffset } from "../utils";

describe("FulfillMint", () => {
  it("should fetch TokenMintRequest chain objects", async () => {
    // Given
    const testFixture = fixture(GalaChainTokenContract).registeredUsers(users.admin);
    const { ctx, contract } = testFixture;

    const epochKey = inverseEpoch(ctx, 0);
    const timeKey = inverseTime(ctx, 0);

    const recentTime = ctx.txUnixTime;
    const oldestTime = recentTime - 2000;

    const recentTimeKey = generateInverseTimeKey(recentTime);
    const oldestTimeKey = generateInverseTimeKey(oldestTime);

    const { collection, category, type, additionalKey } = currency.tokenClassKey();

    const mintRequest = await createValidRangedChainObject(TokenMintRequest, {
      id: "-", // will be set later
      collection,
      category,
      type,
      additionalKey,
      timeKey,
      totalKnownMintsCount: new BigNumber("0"),
      requestor: users.admin.identityKey,
      owner: users.testUser1.identityKey,
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
    }).signed(users.admin.privateKey);

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

    const testFixture = fixture(GalaChainTokenContract)
      .registeredUsers(users.admin)
      .caClientIdentity("admin", "CuratorOrg");
    const { ctx, contract, getWrites } = testFixture;

    const epochKey = inverseEpoch(ctx, 0);
    const timeKey = inverseTime(ctx, 0);

    const { collection, category, type, additionalKey } = currencyClass;

    const mintRequest = await createValidRangedChainObject(TokenMintRequest, {
      id: "-", // will be set later
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

    const tokenBurnCounter = await createValidRangedChainObject(TokenBurnCounter, {
      referenceId: "-", // will be set later
      collection,
      category,
      type,
      additionalKey,
      timeKey,
      instance: TokenInstance.FUNGIBLE_TOKEN_INSTANCE,
      totalKnownBurnsCount: new BigNumber("0"),
      burnedBy: users.testUser2.identityKey,
      created: ctx.txUnixTime,
      quantity: new BigNumber("1"),
      epoch: epochKey
    });

    tokenBurnCounter.referenceId = tokenBurnCounter.referencedBurnId();

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

    testFixture
      .savedState(currencyClass, currencyInstance, tokenAllowance, tokenClaim)
      .savedRangeState([mintRequest, tokenBurnCounter]);

    const dto = await createValidSubmitDTO(FulfillMintDto, {
      requests: [
        plainToInstance(MintRequestDto, {
          collection,
          category,
          type,
          additionalKey,
          timeKey,
          totalKnownMintsCount: new BigNumber("0"),
          id: mintRequest.requestId(),
          owner: users.testUser1.identityKey
        })
      ]
    }).signed(users.admin.privateKey);

    const expectedBalance = new TokenBalance({ ...currency.tokenBalance() });
    expectedBalance.addQuantity(mintQty);

    const expectedAllowance = await createValidChainObject(TokenAllowance, {
      ...tokenAllowance,
      quantitySpent: mintQty,
      usesSpent: new BigNumber("1"),
      expires: ctx.txUnixTime
    });

    // When
    const response = await contract.FulfillMint(ctx, dto);

    // Then
    expect(response).toEqual(GalaChainResponse.Success([currency.tokenInstanceKey()]));
    expect(getWrites()).toEqual(writesMap(tokenClaim, expectedAllowance, expectedBalance, mintFulfillment));
  });

  test("mints unique items, i.e. NFTs", async () => {
    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();
    const mintQty = new BigNumber("2");
    const tokenAllowance = nft.tokenMintAllowance();

    const { collection, category, type, additionalKey } = nftClass;

    const testFixture = fixture(GalaChainTokenContract)
      .registeredUsers(users.admin)
      .caClientIdentity("admin", "CuratorOrg");

    const { ctx, contract, getWrites } = testFixture;

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

    const expectedAllowance = await createValidChainObject(TokenAllowance, {
      ...tokenAllowance,
      quantitySpent: mintQty,
      usesSpent: new BigNumber("1"),
      expires: ctx.txUnixTime
    });

    const epochKey = inverseEpoch(ctx, 0);
    const timeKey = inverseTime(ctx, 0);

    const pastMintRequests: TokenMintRequest[] = [5, 6, 7, 8].map((i) => {
      const distantPastTimestamp = ctx.txUnixTime - (lookbackTimeOffset * 5 - i);
      const distantPastTimeKey = inverseTime(ctx, lookbackTimeOffset * 5 - i);

      const mintRequest = plainToInstance(TokenMintRequest, {
        collection,
        category,
        type,
        additionalKey,
        timeKey: distantPastTimeKey,
        totalKnownMintsCount: new BigNumber("0"),
        requestor: users.admin.identityKey,
        owner: users.testUser2.identityKey,
        created: distantPastTimestamp,
        quantity: new BigNumber("1"),
        state: TokenMintStatus.Unknown,
        epoch: epochKey
      });

      mintRequest.id = mintRequest.requestId();

      return mintRequest;
    });

    expect(pastMintRequests.length).toBe(4);

    const mintRequestInterval = 500;
    const mintRequestsInLookbackRange = Math.round(lookbackTimeOffset / mintRequestInterval);
    let mintRequestIntervalMultipliers: number[] = new Array(mintRequestsInLookbackRange);
    mintRequestIntervalMultipliers = mintRequestIntervalMultipliers
      .fill(0, 0, mintRequestsInLookbackRange)
      .map((_, index) => {
        return index + 1;
      });

    expect(mintRequestIntervalMultipliers).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);

    const concurrentMintRequests: TokenMintRequest[] = mintRequestIntervalMultipliers.map((i) => {
      const nearbyTimestamp = ctx.txUnixTime - i * 500;
      const nearbyTimeKey = inverseTime(ctx, i * 500);

      const mintRequest = plainToInstance(TokenMintRequest, {
        collection,
        category,
        type,
        additionalKey,
        timeKey: nearbyTimeKey,
        totalKnownMintsCount: new BigNumber(pastMintRequests.length),
        requestor: users.admin.identityKey,
        owner: users.testUser2.identityKey,
        created: nearbyTimestamp,
        quantity: new BigNumber("1"),
        state: TokenMintStatus.Unknown,
        epoch: epochKey
      });

      mintRequest.id = mintRequest.requestId();

      return mintRequest;
    });

    const mintRequest = plainToInstance(TokenMintRequest, {
      collection,
      category,
      type,
      additionalKey,
      timeKey,
      totalKnownMintsCount: new BigNumber(pastMintRequests.length),
      requestor: users.admin.identityKey,
      owner: users.testUser1.identityKey,
      created: ctx.txUnixTime,
      quantity: mintQty,
      state: TokenMintStatus.Unknown,
      epoch: epochKey
    });

    mintRequest.id = mintRequest.requestId();

    const allMintRequests = pastMintRequests.concat(concurrentMintRequests.concat([mintRequest]));

    const mintFulfillment: TokenMintFulfillment = mintRequest.fulfill(mintRequest.quantity);

    const dto = await createValidSubmitDTO(FulfillMintDto, {
      requests: [
        plainToInstance(MintRequestDto, {
          collection,
          category,
          type,
          additionalKey,
          timeKey,
          totalKnownMintsCount: new BigNumber(pastMintRequests.length),
          id: mintRequest.requestId(),
          owner: users.testUser1.identityKey
        })
      ]
    }).signed(users.admin.privateKey);

    testFixture
      .savedState(nftClass, nftInstance, tokenAllowance, tokenClaim)
      .savedRangeState(allMintRequests);

    const expectedStartingInstance = new BigNumber(pastMintRequests.length).plus(
      concurrentMintRequests.length
    );

    const expectedNft1Key = await createValidDTO(TokenInstanceKey, {
      ...nftInstanceKey,
      instance: expectedStartingInstance.plus("1")
    });

    const expectedNft1 = await createValidChainObject(TokenInstance, {
      ...nftInstanceKey,
      instance: expectedStartingInstance.plus("1"),
      isNonFungible: true,
      owner: users.testUser1.identityKey
    });
    const expectedNft2Key = await createValidDTO(TokenInstanceKey, {
      ...nftInstanceKey,
      instance: expectedStartingInstance.plus("2")
    });

    const expectedNft2 = await createValidChainObject(TokenInstance, {
      ...nftInstanceKey,
      instance: expectedStartingInstance.plus("2"),
      isNonFungible: true,
      owner: users.testUser1.identityKey
    });

    const expectedBalance = new TokenBalance({ ...nftInstance, owner: users.testUser1.identityKey });
    expectedBalance.addInstance(expectedStartingInstance.plus("1"));
    expectedBalance.addInstance(expectedStartingInstance.plus("2"));

    // When
    const response = await contract.FulfillMint(ctx, dto);

    // Then
    expect(response).toEqual(GalaChainResponse.Success([expectedNft1Key, expectedNft2Key]));
    expect(getWrites()).toEqual(
      writesMap(tokenClaim, expectedAllowance, expectedNft1, expectedNft2, expectedBalance, mintFulfillment)
    );
  });

  it("should not mint lower than decimal limit (10)", async () => {
    // Given
    const currencyInstance = currency.tokenInstance();
    const currencyClass = currency.tokenClass();
    const tokenAllowance = currency.tokenAllowance();
    const decimalQuantity = new BigNumber("0.000000000001");

    const testFixture = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser1)
      .caClientIdentity("admin", "CuratorOrg")
      .savedState(currencyClass, currencyInstance, tokenAllowance);

    const { ctx, contract, getWrites } = testFixture;

    const epochKey = inverseEpoch(ctx, 0);
    const timeKey = inverseTime(ctx, 0);

    const { collection, category, type, additionalKey } = currencyClass;

    const mintRequest = await createValidRangedChainObject(TokenMintRequest, {
      id: "-", // will be set later
      collection,
      category,
      type,
      additionalKey,
      timeKey,
      totalKnownMintsCount: new BigNumber("0"),
      requestor: users.admin.identityKey,
      owner: users.testUser1.identityKey,
      created: ctx.txUnixTime,
      quantity: decimalQuantity,
      state: TokenMintStatus.Unknown,
      epoch: epochKey
    });

    mintRequest.id = mintRequest.requestId();

    testFixture.savedRangeState([mintRequest]);

    const dto = await createValidSubmitDTO(FulfillMintDto, {
      requests: [
        plainToInstance(MintRequestDto, {
          collection,
          category,
          type,
          additionalKey,
          timeKey,
          totalKnownMintsCount: new BigNumber("0"),
          id: mintRequest.requestId(),
          owner: users.testUser1.identityKey
        })
      ]
    }).signed(users.testUser1.privateKey);

    // When
    const response = await contract.FulfillMint(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(
        new Error(`Quantity: ${decimalQuantity} has more than ${currencyClass.decimals} decimal places.`)
      )
    );
    expect(getWrites()).toEqual({});
  });

  it("prevents attackers from exploiting the lack of signing requirement", async () => {
    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();
    const mintQty = new BigNumber("2");
    const tokenAllowance = nft.tokenMintAllowance();

    const { collection, category, type, additionalKey } = nftClass;

    const testFixture = fixture(GalaChainTokenContract)
      .registeredUsers(users.attacker)
      .caClientIdentity("admin", "CuratorOrg");
    const { ctx, contract, getWrites } = testFixture;

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

    const epochKey = inverseEpoch(ctx, 0);
    const timeKey = inverseTime(ctx, 0);

    const mintRequest = await createValidRangedChainObject(TokenMintRequest, {
      id: "-", // will be set later
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

    const tokenBurnCounter = await createValidRangedChainObject(TokenBurnCounter, {
      referenceId: "-", // will be set later
      collection,
      category,
      type,
      additionalKey,
      timeKey,
      totalKnownBurnsCount: new BigNumber("0"),
      instance: nftInstance.instance,
      burnedBy: users.testUser2.identityKey,
      created: ctx.txUnixTime,
      quantity: new BigNumber("1"),
      epoch: epochKey
    });

    tokenBurnCounter.referenceId = tokenBurnCounter.referencedBurnId();

    const dto = await createValidSubmitDTO(FulfillMintDto, {
      requests: [
        plainToInstance(MintRequestDto, {
          collection,
          category,
          type,
          additionalKey,
          timeKey,
          totalKnownMintsCount: new BigNumber("0"),
          id: mintRequest.requestId(),
          owner: users.attacker.identityKey // <- tampered here. code expects users.testUser1Id
        })
      ]
    }).signed(users.attacker.privateKey);

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

    expect(getWrites()).toEqual({});
  });
});

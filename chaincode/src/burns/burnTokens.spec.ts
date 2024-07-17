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
  BurnTokensDto,
  GalaChainResponse,
  TokenAllowance,
  TokenBalance,
  TokenBurn,
  TokenBurnCounter,
  TokenClaim,
  createValidDTO
} from "@gala-chain/api";
import { currency, fixture, nft, users, writesMap } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { InvalidDecimalError } from "../token";
import { inverseEpoch, inverseTime } from "../utils";
import { InsufficientBurnAllowanceError } from "./BurnError";

describe("BurnTokens", () => {
  it("should BurnTokens", async () => {
    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();
    const tokenBalance = nft.tokenBalance();

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testUser1Id)
      .savedState(nftClass, nftInstance, tokenBalance)
      .savedRangeState([]);

    const dto = await createValidDTO(BurnTokensDto, {
      tokenInstances: [{ tokenInstanceKey: nftInstanceKey, quantity: new BigNumber("1") }]
    });

    const totalKnownBurns = new BigNumber("0");
    const nftTokenBurn = plainToInstance(TokenBurn, nft.tokenBurnPlain(ctx.txUnixTime));

    const nftTokenBurnCounterPlain = nft.tokenBurnCounterPlain(
      ctx.txUnixTime,
      inverseTime(ctx, 0),
      inverseEpoch(ctx, 0),
      totalKnownBurns
    );
    const nftTokenBurnCounter = plainToInstance(TokenBurnCounter, nftTokenBurnCounterPlain);
    nftTokenBurnCounter.referenceId = nftTokenBurnCounter.referencedBurnId();

    // When
    const response = await contract.BurnTokens(ctx, dto);

    // Then
    expect(response).toEqual(GalaChainResponse.Success([nftTokenBurn]));
    expect(writes).toEqual(
      writesMap(
        plainToInstance(TokenBalance, { ...tokenBalance, quantity: new BigNumber(0), instanceIds: [] }),
        nftTokenBurn,
        nftTokenBurnCounter
      )
    );
  });

  it("should fail to BurnTokens with quantity lower than decimal limit (10)", async () => {
    // Given
    const currencyInstance = currency.tokenInstance();
    const currencyInstanceKey = currency.tokenInstanceKey();
    const currencyClass = currency.tokenClass();
    const tokenBalance = currency.tokenBalance();

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testUser1Id)
      .savedState(currencyClass, currencyInstance, tokenBalance)
      .savedRangeState([]);

    const decimalQuantity = new BigNumber("0.00000000001");
    const dto = await createValidDTO(BurnTokensDto, {
      tokenInstances: [{ tokenInstanceKey: currencyInstanceKey, quantity: decimalQuantity }]
    });

    // When
    const response = await contract.BurnTokens(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(new InvalidDecimalError(decimalQuantity, currencyClass.decimals))
    );
    expect(writes).toEqual({});
  });

  test("burns currency with burn allowance", async () => {
    // Given
    const currencyInstance = currency.tokenInstance();
    const currencyInstanceKey = currency.tokenInstanceKey();
    const currencyClass = currency.tokenClass();
    const tokenBalance = currency.tokenBalance();
    const burnQty = new BigNumber("1");
    const tokenBurnAllowance = currency.tokenBurnAllowance();

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testUser2Id)
      .savedState(currencyClass, currencyInstance, tokenBurnAllowance, tokenBalance)
      .savedRangeState([]);

    const dto = await createValidDTO(BurnTokensDto, {
      tokenInstances: [{ tokenInstanceKey: currencyInstanceKey, quantity: burnQty }],
      owner: users.testUser1Id
    });

    const tokenBurn = currency.tokenBurn();
    tokenBurn.created = ctx.txUnixTime;
    const tokenBurnCounter = plainToInstance(
      TokenBurnCounter,
      currency.tokenBurnCounterPlain(
        ctx.txUnixTime,
        inverseTime(ctx, 0),
        inverseEpoch(ctx, 0),
        new BigNumber("0")
      )
    );
    tokenBurnCounter.referenceId = tokenBurnCounter.referencedBurnId();

    const tokenClaim = plainToInstance(TokenClaim, {
      ...currencyInstanceKey,
      ownerKey: users.testUser2Id,
      issuerKey: users.testUser1Id,
      instance: new BigNumber("0"),
      action: 6,
      quantity: burnQty,
      allowanceCreated: 1,
      claimSequence: new BigNumber("1"),
      created: ctx.txUnixTime
    });

    const expectedAllowance = plainToInstance(TokenAllowance, {
      ...tokenBurnAllowance,
      usesSpent: new BigNumber("1"),
      quantitySpent: burnQty,
      expires: ctx.txUnixTime
    });

    // When
    const response = await contract.BurnTokens(ctx, dto);

    // Then
    expect(response).toEqual(GalaChainResponse.Success([tokenBurn]));
    expect(writes).toEqual(
      writesMap(
        tokenClaim,
        expectedAllowance,
        plainToInstance(TokenBalance, { ...currency.tokenBalance(), quantity: new BigNumber("999") }),
        tokenBurn,
        tokenBurnCounter
      )
    );
  });

  test("burns currency with infinite burn allowance", async () => {
    // Given
    const currencyInstance = currency.tokenInstance();
    const currencyInstanceKey = currency.tokenInstanceKey();
    const currencyClass = currency.tokenClass();
    const tokenBalance = currency.tokenBalance();
    const burnQty = new BigNumber("1");
    const tokenBurnAllowance = currency.tokenBurnAllowance();
    tokenBurnAllowance.quantity = new BigNumber(Infinity);
    delete tokenBurnAllowance.usesSpent;
    delete tokenBurnAllowance.quantitySpent;

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testUser2Id)
      .savedState(currencyClass, currencyInstance, tokenBurnAllowance, tokenBalance)
      .savedRangeState([]);

    const dto = await createValidDTO(BurnTokensDto, {
      tokenInstances: [{ tokenInstanceKey: currencyInstanceKey, quantity: burnQty }],
      owner: users.testUser1Id
    });

    const tokenBurn = currency.tokenBurn();
    tokenBurn.created = ctx.txUnixTime;
    const tokenBurnCounter = plainToInstance(
      TokenBurnCounter,
      currency.tokenBurnCounterPlain(
        ctx.txUnixTime,
        inverseTime(ctx, 0),
        inverseEpoch(ctx, 0),
        new BigNumber("0")
      )
    );
    tokenBurnCounter.referenceId = tokenBurnCounter.referencedBurnId();

    // When
    const response = await contract.BurnTokens(ctx, dto);

    // Then
    expect(response).toEqual(GalaChainResponse.Success([tokenBurn]));
    expect(writes).toEqual(
      writesMap(
        plainToInstance(TokenBalance, { ...currency.tokenBalance(), quantity: new BigNumber("999") }),
        tokenBurn,
        tokenBurnCounter
      )
    );
  });

  test("burns currency with multiple allowances", async () => {
    // Given
    const currencyInstance = currency.tokenInstance();
    const currencyInstanceKey = currency.tokenInstanceKey();
    const currencyClass = currency.tokenClass();
    const tokenBalance = currency.tokenBalance();
    const burnQty = new BigNumber("1");
    const tokenMintAllowance = currency.tokenMintAllowance();
    const tokenBurnAllowance = currency.tokenBurnAllowance();

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testUser2Id)
      .savedState(currencyClass, currencyInstance, tokenMintAllowance, tokenBurnAllowance, tokenBalance)
      .savedRangeState([]);

    const dto = await createValidDTO(BurnTokensDto, {
      tokenInstances: [{ tokenInstanceKey: currencyInstanceKey, quantity: burnQty }],
      owner: users.testUser1Id
    });

    const tokenBurn = currency.tokenBurn();
    tokenBurn.created = ctx.txUnixTime;
    const tokenBurnCounter = plainToInstance(
      TokenBurnCounter,
      currency.tokenBurnCounterPlain(
        ctx.txUnixTime,
        inverseTime(ctx, 0),
        inverseEpoch(ctx, 0),
        new BigNumber("0")
      )
    );
    tokenBurnCounter.referenceId = tokenBurnCounter.referencedBurnId();

    const tokenClaim = plainToInstance(TokenClaim, {
      ...currencyInstanceKey,
      ownerKey: users.testUser2Id,
      issuerKey: users.testUser1Id,
      instance: new BigNumber("0"),
      action: 6,
      quantity: burnQty,
      allowanceCreated: 1,
      claimSequence: new BigNumber("1"),
      created: ctx.txUnixTime
    });

    const expectedAllowance = plainToInstance(TokenAllowance, {
      ...tokenBurnAllowance,
      usesSpent: new BigNumber("1"),
      quantitySpent: burnQty,
      expires: ctx.txUnixTime
    });

    // When
    const response = await contract.BurnTokens(ctx, dto);

    // Then
    expect(response).toEqual(GalaChainResponse.Success([tokenBurn]));
    expect(writes).toEqual(
      writesMap(
        tokenClaim,
        expectedAllowance,
        plainToInstance(TokenBalance, { ...currency.tokenBalance(), quantity: new BigNumber("999") }),
        tokenBurn,
        tokenBurnCounter
      )
    );
  });

  test("should filter allowances by owner (grantedBy)", async () => {
    // Given
    const currencyInstance = currency.tokenInstance();
    const currencyInstanceKey = currency.tokenInstanceKey();
    const currencyClass = currency.tokenClass();
    const tokenBalance = currency.tokenBalance();
    const burnQty = new BigNumber("1");
    const tokenBurnAllowanceUser3 = currency.tokenBurnAllowanceUser3();
    const tokenBurnAllowance = currency.tokenBurnAllowance();

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testUser2Id)
      .savedState(currencyClass, currencyInstance, tokenBurnAllowanceUser3, tokenBurnAllowance, tokenBalance)
      .savedRangeState([]);

    const dto = await createValidDTO(BurnTokensDto, {
      tokenInstances: [{ tokenInstanceKey: currencyInstanceKey, quantity: burnQty }],
      owner: users.testUser1Id
    });

    const tokenBurn = currency.tokenBurn();
    tokenBurn.created = ctx.txUnixTime;
    const tokenBurnCounter = plainToInstance(
      TokenBurnCounter,
      currency.tokenBurnCounterPlain(
        ctx.txUnixTime,
        inverseTime(ctx, 0),
        inverseEpoch(ctx, 0),
        new BigNumber("0")
      )
    );
    tokenBurnCounter.referenceId = tokenBurnCounter.referencedBurnId();

    const tokenClaim = plainToInstance(TokenClaim, {
      ...currencyInstanceKey,
      ownerKey: users.testUser2Id,
      issuerKey: users.testUser1Id,
      instance: new BigNumber("0"),
      action: 6,
      quantity: burnQty,
      allowanceCreated: 1,
      claimSequence: new BigNumber("1"),
      created: ctx.txUnixTime
    });

    const expectedAllowance = plainToInstance(TokenAllowance, {
      ...tokenBurnAllowance,
      usesSpent: new BigNumber("1"),
      quantitySpent: burnQty,
      expires: ctx.txUnixTime
    });

    // When
    const response = await contract.BurnTokens(ctx, dto);

    // Then
    expect(response).toEqual(GalaChainResponse.Success([tokenBurn]));
    expect(writes).toEqual(
      writesMap(
        tokenClaim,
        expectedAllowance,
        plainToInstance(TokenBalance, { ...currency.tokenBalance(), quantity: new BigNumber("999") }),
        tokenBurn,
        tokenBurnCounter
      )
    );
  });

  test("should fail to burn currency with wrong allowance", async () => {
    // Given
    const currencyInstance = currency.tokenInstance();
    const currencyInstanceKey = currency.tokenInstanceKey();
    const currencyClass = currency.tokenClass();
    const tokenBalance = currency.tokenBalance();
    const burnQty = new BigNumber("1");
    const tokenMintAllowance = currency.tokenMintAllowance();

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testUser2Id)
      .savedState(currencyClass, currencyInstance, tokenMintAllowance, tokenBalance)
      .savedRangeState([]);

    const dto = await createValidDTO(BurnTokensDto, {
      tokenInstances: [{ tokenInstanceKey: currencyInstanceKey, quantity: burnQty }],
      owner: users.testUser1Id
    });

    const tokenBurn = currency.tokenBurn();
    tokenBurn.created = ctx.txUnixTime;
    const tokenBurnCounter = plainToInstance(
      TokenBurnCounter,
      currency.tokenBurnCounterPlain(
        ctx.txUnixTime,
        inverseTime(ctx, 0),
        inverseEpoch(ctx, 0),
        new BigNumber("0")
      )
    );
    tokenBurnCounter.referenceId = tokenBurnCounter.referencedBurnId();

    // When
    const response = await contract.BurnTokens(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(
        new InsufficientBurnAllowanceError(
          users.testUser2Id,
          new BigNumber("0"),
          burnQty,
          currencyInstanceKey,
          users.testUser1Id
        )
      )
    );
    expect(writes).toEqual({});
  });

  test("fails to burn currency with no allowance", async () => {
    // Given
    const currencyInstance = currency.tokenInstance();
    const currencyInstanceKey = currency.tokenInstanceKey();
    const currencyClass = currency.tokenClass();
    const tokenBalance = currency.tokenBalance();
    const burnQty = new BigNumber("1");

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testUser2Id)
      .savedState(currencyClass, currencyInstance, tokenBalance)
      .savedRangeState([]);

    const dto = await createValidDTO(BurnTokensDto, {
      tokenInstances: [{ tokenInstanceKey: currencyInstanceKey, quantity: burnQty }],
      owner: users.testUser1Id
    });

    // When
    const response = await contract.BurnTokens(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(
        new InsufficientBurnAllowanceError(
          users.testUser2Id,
          new BigNumber("0"),
          burnQty,
          currencyInstanceKey,
          users.testUser1Id
        )
      )
    );
    expect(writes).toEqual({});
  });
});

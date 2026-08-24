/*
 * Copyright (c) Gala Games Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
  AllowAllTokenBalanceTargetsDto,
  BurnTokensDto,
  FreezeTokenBalanceDto,
  GalaChainResponse,
  RestrictTokenBalanceTargetsDto,
  TokenBalance,
  TokenBalanceTargetNotAllowedError,
  TokenBalanceTargets,
  TransferTokenDto,
  createValidSubmitDTO
} from "@gala-chain/api";
import { currency, fixture, users } from "@gala-chain/test";
import BigNumber from "bignumber.js";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";

it("should delay RestrictTokenBalanceTargets", async () => {
  // Given
  const savedTokenClass = currency.tokenClass();
  const { ctx, contract } = fixture(GalaChainTokenContract)
    .caClientIdentity("curator", "CuratorOrg")
    .registeredUsers(users.admin, users.testUser1, users.testUser2)
    .savedState(savedTokenClass);

  const dto = await createValidSubmitDTO(RestrictTokenBalanceTargetsDto, {
    user: users.testUser1.identityKey,
    tokenClass: currency.tokenClassKey(),
    targets: [users.testUser2.identityKey]
  }).signed(users.admin.privateKey);

  // When
  const response = await contract.RestrictTokenBalanceTargets(ctx, dto);

  // Then
  const balance = response.Data as TokenBalance;
  expect(response.Status).toEqual(1);
  expect(balance.targets?.allowed).toBeUndefined();
  expect(balance.targets?.pendingAllowed).toEqual([users.testUser2.identityKey]);
  expect(balance.targets?.pendingAppliesAt).toEqual(ctx.txUnixTime + TokenBalanceTargets.CHANGE_DELAY_MS);
});

it("should keep allowing any transfer until restrict delay elapses", async () => {
  // Given
  const currencyInstance = currency.tokenInstance();
  const currencyInstanceKey = currency.tokenInstanceKey();
  const currencyClass = currency.tokenClass();
  const ownerBalance = currency.tokenBalance();

  const { ctx, contract } = fixture(GalaChainTokenContract)
    .caClientIdentity("curator", "CuratorOrg")
    .registeredUsers(users.admin, users.testUser1, users.testUser2, users.testUser3)
    .savedState(currencyClass, currencyInstance, ownerBalance);

  const restrictDto = await createValidSubmitDTO(RestrictTokenBalanceTargetsDto, {
    user: users.testUser1.identityKey,
    tokenClass: currency.tokenClassKey(),
    targets: [users.testUser2.identityKey]
  }).signed(users.admin.privateKey);

  await contract.RestrictTokenBalanceTargets(ctx, restrictDto);

  const transferDto = await createValidSubmitDTO(TransferTokenDto, {
    from: users.testUser1.identityKey,
    to: users.testUser3.identityKey,
    tokenInstance: currencyInstanceKey,
    quantity: new BigNumber("11")
  }).signed(users.testUser1.privateKey);

  // When
  const response = await contract.TransferToken(ctx, transferDto);

  // Then
  expect(response.Status).toEqual(1);
});

it("should apply pending restrict after the delay has elapsed", async () => {
  // Given
  const currencyInstance = currency.tokenInstance();
  const currencyInstanceKey = currency.tokenInstanceKey();
  const currencyClass = currency.tokenClass();
  const ownerBalance = currency.tokenBalance();
  ownerBalance.targets = new TokenBalanceTargets();
  ownerBalance.targets.pendingAllowed = [users.testUser2.identityKey];
  ownerBalance.targets.pendingAppliesAt = 0;

  const { ctx, contract } = fixture(GalaChainTokenContract)
    .registeredUsers(users.testUser1, users.testUser2, users.testUser3)
    .savedState(currencyClass, currencyInstance, ownerBalance);

  const transferDto = await createValidSubmitDTO(TransferTokenDto, {
    from: users.testUser1.identityKey,
    to: users.testUser3.identityKey,
    tokenInstance: currencyInstanceKey,
    quantity: new BigNumber("11")
  }).signed(users.testUser1.privateKey);

  // When
  const response = await contract.TransferToken(ctx, transferDto);

  // Then
  expect(response).toEqual(
    GalaChainResponse.Error(
      new TokenBalanceTargetNotAllowedError(
        users.testUser1.identityKey,
        currencyClass,
        users.testUser3.identityKey,
        [users.testUser2.identityKey]
      )
    )
  );
});

it("should allow a transfer to a pending restrict target after the delay has elapsed", async () => {
  // Given
  const currencyInstance = currency.tokenInstance();
  const currencyInstanceKey = currency.tokenInstanceKey();
  const currencyClass = currency.tokenClass();
  const ownerBalance = currency.tokenBalance();
  ownerBalance.targets = new TokenBalanceTargets();
  ownerBalance.targets.pendingAllowed = [users.testUser2.identityKey];
  ownerBalance.targets.pendingAppliesAt = 0;

  const { ctx, contract } = fixture(GalaChainTokenContract)
    .registeredUsers(users.testUser1, users.testUser2)
    .savedState(currencyClass, currencyInstance, ownerBalance);

  const transferDto = await createValidSubmitDTO(TransferTokenDto, {
    from: users.testUser1.identityKey,
    to: users.testUser2.identityKey,
    tokenInstance: currencyInstanceKey,
    quantity: new BigNumber("11")
  }).signed(users.testUser1.privateKey);

  // When
  const response = await contract.TransferToken(ctx, transferDto);

  // Then
  expect(response.Status).toEqual(1);
  const [fromBalance] = response.Data as TokenBalance[];
  expect(fromBalance.targets?.allowed).toEqual([users.testUser2.identityKey]);
  expect(fromBalance.targets?.pendingAllowed).toBeUndefined();
});

it("should freeze immediately so transfers are rejected", async () => {
  // Given
  const currencyInstance = currency.tokenInstance();
  const currencyInstanceKey = currency.tokenInstanceKey();
  const currencyClass = currency.tokenClass();
  const ownerBalance = currency.tokenBalance();

  const { ctx, contract } = fixture(GalaChainTokenContract)
    .caClientIdentity("curator", "CuratorOrg")
    .registeredUsers(users.admin, users.testUser1, users.testUser2)
    .savedState(currencyClass, currencyInstance, ownerBalance)
    .savedRangeState([]);

  const freezeDto = await createValidSubmitDTO(FreezeTokenBalanceDto, {
    user: users.testUser1.identityKey,
    tokenClass: currency.tokenClassKey()
  }).signed(users.admin.privateKey);

  const freezeResponse = await contract.FreezeTokenBalance(ctx, freezeDto);
  expect(freezeResponse.Status).toEqual(1);
  expect((freezeResponse.Data as TokenBalance).targets?.allowed).toEqual([]);

  const transferDto = await createValidSubmitDTO(TransferTokenDto, {
    from: users.testUser1.identityKey,
    to: users.testUser2.identityKey,
    tokenInstance: currencyInstanceKey,
    quantity: new BigNumber("11")
  }).signed(users.testUser1.privateKey);

  // When
  const transferResponse = await contract.TransferToken(ctx, transferDto);

  // Then
  expect(transferResponse).toEqual(
    GalaChainResponse.Error(
      new TokenBalanceTargetNotAllowedError(
        users.testUser1.identityKey,
        currencyClass,
        users.testUser2.identityKey,
        []
      )
    )
  );

  const burnDto = await createValidSubmitDTO(BurnTokensDto, {
    tokenInstances: [{ tokenInstanceKey: currencyInstanceKey, quantity: new BigNumber("11") }]
  }).signed(users.testUser1.privateKey);

  const burnResponse = await contract.BurnTokens(ctx, burnDto);
  expect(burnResponse.Status).toEqual(1);
});

it("should delay AllowAllTokenBalanceTargets", async () => {
  // Given
  const savedTokenClass = currency.tokenClass();
  const ownerBalance = currency.tokenBalance();
  ownerBalance.targets = new TokenBalanceTargets();
  ownerBalance.targets.allowed = [users.testUser2.identityKey];

  const { ctx, contract } = fixture(GalaChainTokenContract)
    .caClientIdentity("curator", "CuratorOrg")
    .registeredUsers(users.admin, users.testUser1, users.testUser2)
    .savedState(savedTokenClass, ownerBalance);

  const dto = await createValidSubmitDTO(AllowAllTokenBalanceTargetsDto, {
    user: users.testUser1.identityKey,
    tokenClass: currency.tokenClassKey()
  }).signed(users.admin.privateKey);

  // When
  const response = await contract.AllowAllTokenBalanceTargets(ctx, dto);

  // Then
  const balance = response.Data as TokenBalance;
  expect(response.Status).toEqual(1);
  expect(balance.targets?.allowed).toEqual([users.testUser2.identityKey]);
  expect(balance.targets?.pendingAllowAll).toEqual(true);
  expect(balance.targets?.pendingAppliesAt).toEqual(ctx.txUnixTime + TokenBalanceTargets.CHANGE_DELAY_MS);
});

it("should allow any transfer after pending allow-all has elapsed", async () => {
  // Given
  const currencyInstance = currency.tokenInstance();
  const currencyInstanceKey = currency.tokenInstanceKey();
  const currencyClass = currency.tokenClass();
  const ownerBalance = currency.tokenBalance();
  ownerBalance.targets = new TokenBalanceTargets();
  ownerBalance.targets.allowed = [users.testUser2.identityKey];
  ownerBalance.targets.pendingAllowAll = true;
  ownerBalance.targets.pendingAppliesAt = 0;

  const { ctx, contract } = fixture(GalaChainTokenContract)
    .registeredUsers(users.testUser1, users.testUser2, users.testUser3)
    .savedState(currencyClass, currencyInstance, ownerBalance);

  const transferDto = await createValidSubmitDTO(TransferTokenDto, {
    from: users.testUser1.identityKey,
    to: users.testUser3.identityKey,
    tokenInstance: currencyInstanceKey,
    quantity: new BigNumber("11")
  }).signed(users.testUser1.privateKey);

  // When
  const response = await contract.TransferToken(ctx, transferDto);

  // Then
  expect(response.Status).toEqual(1);
  const [fromBalance] = response.Data as TokenBalance[];
  expect(fromBalance.targets?.allowed).toBeUndefined();
  expect(fromBalance.targets?.pendingAllowAll).toBeUndefined();
});

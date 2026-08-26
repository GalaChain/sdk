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
  GalaChainResponse,
  TokenBalance,
  TokenBalanceLimit,
  TokenQuantityLimitExceededError,
  TransferTokenDto,
  UpdateBalanceQuantityLimitDto,
  createValidSubmitDTO
} from "@gala-chain/api";
import { currency, fixture, users } from "@gala-chain/test";
import BigNumber from "bignumber.js";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";

it("should apply an owner quantityLimit immediately when it is not higher than the class limit", async () => {
  // Given
  const savedTokenClass = currency.tokenClass((c) => ({ ...c, quantityLimit: new BigNumber("10") }));
  const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
    .registeredUsers(users.testUser1)
    .savedState(savedTokenClass);

  const dto = await createValidSubmitDTO(UpdateBalanceQuantityLimitDto, {
    tokenClass: currency.tokenClassKey(),
    quantityLimit: new BigNumber("5")
  }).signed(users.testUser1.privateKey);

  // When
  const response = await contract.UpdateBalanceQuantityLimit(ctx, dto);

  // Then
  const balance = response.Data as TokenBalance;
  expect(response.Status).toEqual(1);
  expect(balance.limit?.quantity).toEqual(new BigNumber("5"));
  expect(balance.limit?.pendingQuantity).toBeUndefined();
  expect(Object.keys(getWrites()).length).toBeGreaterThan(0);
});

it("should delay an owner quantityLimit that is higher than the class limit", async () => {
  // Given
  const savedTokenClass = currency.tokenClass((c) => ({ ...c, quantityLimit: new BigNumber("10") }));
  const { ctx, contract } = fixture(GalaChainTokenContract)
    .registeredUsers(users.testUser1)
    .savedState(savedTokenClass);

  const dto = await createValidSubmitDTO(UpdateBalanceQuantityLimitDto, {
    tokenClass: currency.tokenClassKey(),
    quantityLimit: new BigNumber("50")
  }).signed(users.testUser1.privateKey);

  // When
  const response = await contract.UpdateBalanceQuantityLimit(ctx, dto);

  // Then
  const balance = response.Data as TokenBalance;
  expect(response.Status).toEqual(1);
  expect(balance.limit?.quantity).toBeUndefined();
  expect(balance.limit?.pendingQuantity).toEqual(new BigNumber("50"));
  expect(balance.limit?.pendingAppliesAt).toEqual(ctx.txUnixTime + TokenBalanceLimit.INCREASE_DELAY_MS);
});

it("should keep using the class limit until the owner increase delay elapses", async () => {
  // Given
  const currencyInstance = currency.tokenInstance();
  const currencyInstanceKey = currency.tokenInstanceKey();
  const currencyClass = currency.tokenClass((c) => ({ ...c, quantityLimit: new BigNumber("10") }));
  const ownerBalance = currency.tokenBalance((b) => ({
    ...b,
    owner: users.testUser1.identityKey,
    quantity: new BigNumber("100000")
  }));

  const { ctx, contract } = fixture(GalaChainTokenContract)
    .registeredUsers(users.testUser1, users.testUser2)
    .savedState(currencyClass, currencyInstance, ownerBalance);

  const limitDto = await createValidSubmitDTO(UpdateBalanceQuantityLimitDto, {
    tokenClass: currency.tokenClassKey(),
    quantityLimit: new BigNumber("50")
  }).signed(users.testUser1.privateKey);

  await contract.UpdateBalanceQuantityLimit(ctx, limitDto);

  const transferDto = await createValidSubmitDTO(TransferTokenDto, {
    from: users.testUser1.identityKey,
    to: users.testUser2.identityKey,
    tokenInstance: currencyInstanceKey,
    quantity: new BigNumber("11")
  }).signed(users.testUser1.privateKey);

  // When
  const response = await contract.TransferToken(ctx, transferDto);

  // Then
  expect(response).toEqual(
    GalaChainResponse.Error(
      new TokenQuantityLimitExceededError(
        users.testUser1.identityKey,
        currencyClass,
        new BigNumber("11"),
        new BigNumber("10"),
        new BigNumber("0")
      )
    )
  );
});

it("should apply a pending owner quantityLimit after the delay has elapsed", async () => {
  // Given
  const currencyInstance = currency.tokenInstance();
  const currencyInstanceKey = currency.tokenInstanceKey();
  const currencyClass = currency.tokenClass((c) => ({ ...c, quantityLimit: new BigNumber("10") }));
  const ownerBalance = currency.tokenBalance((b) => ({
    ...b,
    owner: users.testUser1.identityKey,
    quantity: new BigNumber("100000")
  }));
  ownerBalance.limit = new TokenBalanceLimit();
  ownerBalance.limit.pendingQuantity = new BigNumber("50");
  ownerBalance.limit.pendingAppliesAt = 0;

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
  expect(fromBalance.limit?.quantity).toEqual(new BigNumber("50"));
  expect(fromBalance.limit?.pendingQuantity).toBeUndefined();
});

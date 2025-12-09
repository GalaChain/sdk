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
import { FetchBalancesDto, TokenBalance, asValidUserRef, createValidDTO } from "@gala-chain/api";
import { currency, fixture, transactionSuccess, users } from "@gala-chain/test";
import BigNumber from "bignumber.js";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";

it("should fetch balances by user alias", async () => {
  // Given
  const user = users.testUser1;
  const balance = new TokenBalance({ ...currency.tokenClassKey(), owner: user.identityKey });
  balance.addQuantity(new BigNumber(1000));

  const { contract, ctx } = fixture(GalaChainTokenContract).registeredUsers(user).savedState(balance);

  const dto = await createValidDTO(FetchBalancesDto, { owner: user.identityKey });

  // When
  const result = await contract.FetchBalances(ctx, dto);

  // Then
  expect(result).toEqual(transactionSuccess([balance]));
});

it("should fetch balances by empty signed dto", async () => {
  // Given
  const user = users.testUser1;
  const balance = new TokenBalance({ ...currency.tokenClassKey(), owner: user.identityKey });
  balance.addQuantity(new BigNumber(1000));

  const { contract, ctx } = fixture(GalaChainTokenContract).registeredUsers(user).savedState(balance);

  const dto = await createValidDTO(FetchBalancesDto, {}).signed(user.privateKey);

  // When
  const result = await contract.FetchBalances(ctx, dto);

  // Then
  expect(result).toEqual(transactionSuccess([balance]));
});

it("should fetch balances by any user ref", async () => {
  // Given
  const user = users.testUser1;

  const balance = new TokenBalance({ ...currency.tokenClassKey(), owner: user.identityKey });
  balance.addQuantity(new BigNumber(1000));

  const { contract, ctx } = fixture(GalaChainTokenContract).registeredUsers(user).savedState(balance);

  const validUserRefs = [
    user.identityKey,
    user.ethAddress,
    user.ethAddress.toLowerCase(),
    `0x${user.ethAddress}`,
    `eth|${user.ethAddress}`
  ].map(asValidUserRef);

  const dtos = await Promise.all(validUserRefs.map((owner) => createValidDTO(FetchBalancesDto, { owner })));

  // When
  const results = await Promise.all(dtos.map((dto) => contract.FetchBalances(ctx, dto)));

  // Then
  expect(results).toEqual(validUserRefs.map(() => transactionSuccess([balance])));
});

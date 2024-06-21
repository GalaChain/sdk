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
import { GalaChainResponse, TokenClass, UpdateTokenClassDto, createValidDTO } from "@gala-chain/api";
import { currency, fixture, users, writesMap } from "@gala-chain/test";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { createValidChainObject } from "../types";
import { NotATokenAuthorityError, TokenClassNotFoundError } from "./TokenError";

const defaultUpdate = () => ({
  name: "UPDATEDTESTCURRENCY",
  description: "UPDATED: A mock currency for automated tests.",
  image: "http://app.gala.games/UPDATED-image-url",
  symbol: "UPDATEDAUTOTESTCOIN",
  rarity: "Updateable",
  authorities: [users.admin, "client|new-admin"]
});

it("should update token class", async () => {
  // Given
  const savedTokenClass = currency.tokenClass();

  const { ctx, contract, writes } = fixture(GalaChainTokenContract)
    .callingUser(users.admin)
    .savedState(savedTokenClass);

  const dto: UpdateTokenClassDto = await createValidDTO(UpdateTokenClassDto, {
    tokenClass: await savedTokenClass.getKey(),
    ...defaultUpdate()
  });

  // When
  const response = await contract.UpdateTokenClass(ctx, dto);

  // Then
  expect(response).toEqual(GalaChainResponse.Success(dto.tokenClass));

  const expectedWrite = await createValidChainObject(TokenClass, {
    ...savedTokenClass,
    ...defaultUpdate()
  });
  expect(writes).toEqual(writesMap(expectedWrite));
});

it("should fail if callingUser is not token authority", async () => {
  // Given
  const savedTokenClass = currency.tokenClass();
  const callingUser = users.testUser1;
  expect(savedTokenClass.authorities).not.toContain(callingUser);

  const { ctx, contract, writes } = fixture(GalaChainTokenContract)
    .callingUser(callingUser)
    .savedState(savedTokenClass);

  const dto: UpdateTokenClassDto = await createValidDTO(UpdateTokenClassDto, {
    tokenClass: await savedTokenClass.getKey(),
    ...defaultUpdate()
  });

  // When
  const response = await contract.UpdateTokenClass(ctx, dto);

  // Then
  const [key, authorities] = [savedTokenClass.getCompositeKey(), savedTokenClass.authorities];
  expect(response).toEqual(
    GalaChainResponse.Error(new NotATokenAuthorityError(callingUser, key, authorities))
  );

  expect(writes).toEqual({});
});

it("should fail if token does not exist", async () => {
  // Given
  const tokenClassKey = currency.tokenClassKey();
  const { ctx, contract, writes } = fixture(GalaChainTokenContract); // no saved token class

  const dto: UpdateTokenClassDto = await createValidDTO(UpdateTokenClassDto, {
    tokenClass: tokenClassKey,
    ...defaultUpdate()
  });

  // When
  const response = await contract.UpdateTokenClass(ctx, dto);

  // Then
  expect(response).toEqual(GalaChainResponse.Error(new TokenClassNotFoundError(tokenClassKey.toStringKey())));

  expect(writes).toEqual({});
});

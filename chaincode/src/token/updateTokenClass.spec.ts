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
  TokenClass,
  TokenClassKey,
  UpdateTokenClassDto,
  createValidChainObject,
  createValidSubmitDTO
} from "@gala-chain/api";
import { currency, fixture, users, writesMap } from "@gala-chain/test";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { OrganizationNotAllowedError } from "../contracts";
import { NotATokenAuthorityError, TokenClassNotFoundError } from "./TokenError";

it("should update token class", async () => {
  // Given
  const savedTokenClass = currency.tokenClass();
  const savedTokenClassKey = await savedTokenClass.getKey();

  const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
    .caClientIdentity("curator", "CuratorOrg")
    .registeredUsers(users.admin)
    .savedState(savedTokenClass);

  const update = defaultUpdate();
  const dto: UpdateTokenClassDto = await defaultUpdateDto(savedTokenClassKey, update).signed(
    users.admin.privateKey
  );

  const expectedWrite = await createValidChainObject(TokenClass, {
    ...savedTokenClass,
    ...update
  });

  // When
  const response = await contract.UpdateTokenClass(ctx, dto);

  // Then
  expect(response).toEqual(GalaChainResponse.Success(savedTokenClassKey));
  expect(getWrites()).toEqual(writesMap(expectedWrite));
});

it("should fail if callingUser is not token authority", async () => {
  // Given
  const savedTokenClass = currency.tokenClass();
  const savedTokenClassKey = await savedTokenClass.getKey();
  const callingUser = users.testUser1;
  expect(savedTokenClass.authorities).not.toContain(callingUser.identityKey);

  const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
    .caClientIdentity("curator", "CuratorOrg")
    .registeredUsers(callingUser)
    .savedState(savedTokenClass);

  const dto: UpdateTokenClassDto = await defaultUpdateDto(savedTokenClassKey).signed(callingUser.privateKey);

  // When
  const response = await contract.UpdateTokenClass(ctx, dto);

  // Then
  const [key, authorities] = [savedTokenClass.getCompositeKey(), savedTokenClass.authorities];
  expect(response).toEqual(
    GalaChainResponse.Error(new NotATokenAuthorityError(callingUser.identityKey, key, authorities))
  );

  expect(getWrites()).toEqual({});
});

it("should fail if CA client is not a member of CuratorOrg", async () => {
  // Given
  const savedTokenClass = currency.tokenClass();
  const savedTokenClassKey = await savedTokenClass.getKey();

  const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
    .caClientIdentity("non-curator", "NonCuratorOrg")
    .registeredUsers(users.admin)
    .savedState(savedTokenClass);

  const dto: UpdateTokenClassDto = await defaultUpdateDto(savedTokenClassKey).signed(users.admin.privateKey);

  // When
  const response = await contract.UpdateTokenClass(ctx, dto);

  // Then
  expect(response).toEqual(
    GalaChainResponse.Error(
      new OrganizationNotAllowedError(
        "Members of organization NonCuratorOrg do not have sufficient permissions. Required one of [CuratorOrg].",
        { userMsp: "NonCuratorOrg" }
      )
    )
  );

  expect(getWrites()).toEqual({});
});

it("should fail if token does not exist", async () => {
  // Given
  const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
    .caClientIdentity("curator", "CuratorOrg")
    .registeredUsers(users.admin); // no saved token class

  const tokenClassKey = currency.tokenClassKey();
  const dto: UpdateTokenClassDto = await defaultUpdateDto(tokenClassKey).signed(users.admin.privateKey);

  // When
  const response = await contract.UpdateTokenClass(ctx, dto);

  // Then
  expect(response).toEqual(GalaChainResponse.Error(new TokenClassNotFoundError(tokenClassKey.toStringKey())));
  expect(getWrites()).toEqual({});
});

function defaultUpdate() {
  return {
    name: "UPDATEDTESTCURRENCY",
    description: "UPDATED: A mock currency for automated tests.",
    image: "http://app.gala.games/UPDATED-image-url",
    symbol: "UPDATEDAUTOTESTCOIN",
    rarity: "Updateable",
    authorities: [users.admin.identityKey, "client|new-admin"]
  };
}

function defaultUpdateDto(tokenClassKey: TokenClassKey, update = defaultUpdate()) {
  return createValidSubmitDTO(UpdateTokenClassDto, {
    tokenClass: tokenClassKey,
    ...update
  });
}

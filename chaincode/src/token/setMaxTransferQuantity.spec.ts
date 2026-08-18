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
  ClearMaxTransferQuantityDto,
  GalaChainResponse,
  SetMaxTransferQuantityDto,
  TokenClass,
  UserRole,
  createValidChainObject,
  createValidSubmitDTO
} from "@gala-chain/api";
import { currency, fixture, randomUser, users, writesMap } from "@gala-chain/test";
import BigNumber from "bignumber.js";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { MissingRoleError } from "../contracts";
import { NotATokenAuthorityError } from "./TokenError";

it("should set maxTransferQuantity on the token class", async () => {
  // Given
  const savedTokenClass = currency.tokenClass();
  const savedTokenClassKey = await savedTokenClass.getKey();

  const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
    .caClientIdentity("curator", "CuratorOrg")
    .registeredUsers(users.admin)
    .savedState(savedTokenClass);

  const dto = await createValidSubmitDTO(SetMaxTransferQuantityDto, {
    tokenClass: savedTokenClassKey,
    maxTransferQuantity: new BigNumber("100")
  }).signed(users.admin.privateKey);

  const expectedWrite = await createValidChainObject(TokenClass, {
    ...savedTokenClass,
    maxTransferQuantity: new BigNumber("100")
  });

  // When
  const response = await contract.SetMaxTransferQuantity(ctx, dto);

  // Then
  expect(response).toEqual(GalaChainResponse.Success(savedTokenClassKey));
  expect(getWrites()).toEqual(writesMap(expectedWrite));
});

it("should clear maxTransferQuantity from the token class", async () => {
  // Given
  const savedTokenClass = currency.tokenClass();
  savedTokenClass.maxTransferQuantity = new BigNumber("100");
  const savedTokenClassKey = await savedTokenClass.getKey();

  const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
    .caClientIdentity("curator", "CuratorOrg")
    .registeredUsers(users.admin)
    .savedState(savedTokenClass);

  const dto = await createValidSubmitDTO(ClearMaxTransferQuantityDto, {
    tokenClass: savedTokenClassKey
  }).signed(users.admin.privateKey);

  const expectedWrite = await createValidChainObject(TokenClass, { ...savedTokenClass });
  delete expectedWrite.maxTransferQuantity;

  // When
  const response = await contract.ClearMaxTransferQuantity(ctx, dto);

  // Then
  expect(response).toEqual(GalaChainResponse.Success(savedTokenClassKey));
  expect(getWrites()).toEqual(writesMap(expectedWrite));
});

it("should fail if callingUser is not token authority", async () => {
  // Given
  const savedTokenClass = currency.tokenClass();
  const savedTokenClassKey = await savedTokenClass.getKey();
  const callingUser = randomUser("client|calling-user", [UserRole.CURATOR]);
  expect(savedTokenClass.authorities).not.toContain(callingUser.identityKey);

  const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
    .registeredUsers(callingUser)
    .savedState(savedTokenClass);

  const dto = await createValidSubmitDTO(SetMaxTransferQuantityDto, {
    tokenClass: savedTokenClassKey,
    maxTransferQuantity: new BigNumber("1")
  }).signed(callingUser.privateKey);

  // When
  const response = await contract.SetMaxTransferQuantity(ctx, dto);

  // Then
  const [key, authorities] = [savedTokenClass.getCompositeKey(), savedTokenClass.authorities];
  expect(response).toEqual(
    GalaChainResponse.Error(new NotATokenAuthorityError(callingUser.identityKey, key, authorities))
  );
  expect(getWrites()).toEqual({});
});

it("should fail if CA client is not authorized as curator", async () => {
  // Given
  const savedTokenClass = currency.tokenClass();
  const savedTokenClassKey = await savedTokenClass.getKey();
  const callingUser = users.testUser1;
  expect(callingUser.roles).not.toContain(UserRole.CURATOR);

  const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
    .registeredUsers(callingUser)
    .savedState(savedTokenClass);

  const dto = await createValidSubmitDTO(SetMaxTransferQuantityDto, {
    tokenClass: savedTokenClassKey,
    maxTransferQuantity: new BigNumber("1")
  }).signed(callingUser.privateKey);

  // When
  const response = await contract.SetMaxTransferQuantity(ctx, dto);

  // Then
  expect(response).toEqual(
    GalaChainResponse.Error(
      new MissingRoleError(callingUser.identityKey, callingUser.roles, [UserRole.CURATOR])
    )
  );
  expect(getWrites()).toEqual({});
});

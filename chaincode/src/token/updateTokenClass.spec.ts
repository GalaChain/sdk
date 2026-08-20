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
  TokenQuantityLimitExceededError,
  TransferTokenDto,
  UpdateTokenClassDto,
  UserAlias,
  UserRole,
  createValidChainObject,
  createValidSubmitDTO
} from "@gala-chain/api";
import { currency, fixture, randomUser, users, writesMap } from "@gala-chain/test";
import BigNumber from "bignumber.js";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { MissingRoleError } from "../contracts";
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
  const callingUser = randomUser("client|calling-user", [UserRole.CURATOR]);
  expect(savedTokenClass.authorities).not.toContain(callingUser.identityKey);

  const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
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

it("should fail if CA client is not authorized as curator", async () => {
  // Given
  const savedTokenClass = currency.tokenClass();
  const savedTokenClassKey = await savedTokenClass.getKey();
  const callingUser = users.testUser1;
  expect(callingUser.roles).not.toContain(UserRole.CURATOR);

  const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
    .registeredUsers(callingUser)
    .savedState(savedTokenClass);

  const dto: UpdateTokenClassDto = await defaultUpdateDto(savedTokenClassKey).signed(callingUser.privateKey);

  // When
  const response = await contract.UpdateTokenClass(ctx, dto);

  // Then
  expect(response).toEqual(
    GalaChainResponse.Error(
      new MissingRoleError(callingUser.identityKey, callingUser.roles, [UserRole.CURATOR])
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

it("should apply a new class quantityLimit to subsequent transfers immediately", async () => {
  // Given
  const currencyInstance = currency.tokenInstance();
  const currencyInstanceKey = currency.tokenInstanceKey();
  const savedTokenClass = currency.tokenClass();
  const savedTokenClassKey = await savedTokenClass.getKey();
  const ownerBalance = currency.tokenBalance((b) => ({
    ...b,
    owner: users.tokenHolder.identityKey,
    quantity: new BigNumber("100000")
  }));

  const { ctx, contract } = fixture(GalaChainTokenContract)
    .caClientIdentity("curator", "CuratorOrg")
    .registeredUsers(users.admin, users.tokenHolder, users.testUser2)
    .savedState(savedTokenClass, currencyInstance, ownerBalance);

  const updateDto: UpdateTokenClassDto = await createValidSubmitDTO(UpdateTokenClassDto, {
    tokenClass: savedTokenClassKey,
    quantityLimit: new BigNumber("10")
  }).signed(users.admin.privateKey);

  await contract.UpdateTokenClass(ctx, updateDto);

  const transferDto = await createValidSubmitDTO(TransferTokenDto, {
    from: users.tokenHolder.identityKey,
    to: users.testUser2.identityKey,
    tokenInstance: currencyInstanceKey,
    quantity: new BigNumber("11")
  }).signed(users.tokenHolder.privateKey);

  // When
  const response = await contract.TransferToken(ctx, transferDto);

  // Then
  expect(response).toEqual(
    GalaChainResponse.Error(
      new TokenQuantityLimitExceededError(
        users.tokenHolder.identityKey,
        savedTokenClass,
        new BigNumber("11"),
        new BigNumber("10"),
        new BigNumber("0")
      )
    )
  );
});

it("should apply a raised class quantityLimit to subsequent transfers immediately", async () => {
  // Given
  const currencyInstance = currency.tokenInstance();
  const currencyInstanceKey = currency.tokenInstanceKey();
  const savedTokenClass = currency.tokenClass((c) => ({ ...c, quantityLimit: new BigNumber("10") }));
  const savedTokenClassKey = await savedTokenClass.getKey();
  const ownerBalance = currency.tokenBalance((b) => ({
    ...b,
    owner: users.tokenHolder.identityKey,
    quantity: new BigNumber("100000")
  }));

  const { ctx, contract } = fixture(GalaChainTokenContract)
    .caClientIdentity("curator", "CuratorOrg")
    .registeredUsers(users.admin, users.tokenHolder, users.testUser2)
    .savedState(savedTokenClass, currencyInstance, ownerBalance);

  const updateDto: UpdateTokenClassDto = await createValidSubmitDTO(UpdateTokenClassDto, {
    tokenClass: savedTokenClassKey,
    quantityLimit: new BigNumber("50")
  }).signed(users.admin.privateKey);

  await contract.UpdateTokenClass(ctx, updateDto);

  const transferDto = await createValidSubmitDTO(TransferTokenDto, {
    from: users.tokenHolder.identityKey,
    to: users.testUser2.identityKey,
    tokenInstance: currencyInstanceKey,
    quantity: new BigNumber("11")
  }).signed(users.tokenHolder.privateKey);

  // When
  const response = await contract.TransferToken(ctx, transferDto);

  // Then
  expect(response.Status).toEqual(1);
});

it("should apply a lowered class quantityLimit against spend already in the window", async () => {
  // Given
  const currencyInstance = currency.tokenInstance();
  const currencyInstanceKey = currency.tokenInstanceKey();
  const savedTokenClass = currency.tokenClass((c) => ({ ...c, quantityLimit: new BigNumber("10") }));
  const savedTokenClassKey = await savedTokenClass.getKey();
  const ownerBalance = currency.tokenBalance((b) => ({
    ...b,
    owner: users.tokenHolder.identityKey,
    quantity: new BigNumber("100000")
  }));

  const { ctx, contract } = fixture(GalaChainTokenContract)
    .caClientIdentity("curator", "CuratorOrg")
    .registeredUsers(users.admin, users.tokenHolder, users.testUser2)
    .savedState(savedTokenClass, currencyInstance, ownerBalance);

  const firstTransfer = await createValidSubmitDTO(TransferTokenDto, {
    from: users.tokenHolder.identityKey,
    to: users.testUser2.identityKey,
    tokenInstance: currencyInstanceKey,
    quantity: new BigNumber("6")
  }).signed(users.tokenHolder.privateKey);

  const firstResponse = await contract.TransferToken(ctx, firstTransfer);
  expect(firstResponse.Status).toEqual(1);

  const updateDto: UpdateTokenClassDto = await createValidSubmitDTO(UpdateTokenClassDto, {
    tokenClass: savedTokenClassKey,
    quantityLimit: new BigNumber("5")
  }).signed(users.admin.privateKey);

  await contract.UpdateTokenClass(ctx, updateDto);

  const secondTransfer = await createValidSubmitDTO(TransferTokenDto, {
    from: users.tokenHolder.identityKey,
    to: users.testUser2.identityKey,
    tokenInstance: currencyInstanceKey,
    quantity: new BigNumber("1")
  }).signed(users.tokenHolder.privateKey);

  // When
  const response = await contract.TransferToken(ctx, secondTransfer);

  // Then
  expect(response).toEqual(
    GalaChainResponse.Error(
      new TokenQuantityLimitExceededError(
        users.tokenHolder.identityKey,
        savedTokenClass,
        new BigNumber("1"),
        new BigNumber("5"),
        new BigNumber("6")
      )
    )
  );
});

function defaultUpdate() {
  return {
    name: "UPDATEDTESTCURRENCY",
    description: "UPDATED: A mock currency for automated tests.",
    image: "http://app.gala.games/UPDATED-image-url",
    symbol: "UPDATEDAUTOTESTCOIN",
    rarity: "Updateable",
    authorities: [users.admin.identityKey, "client|new-admin"] as UserAlias[],
    quantityLimit: new BigNumber("1000")
  };
}

function defaultUpdateDto(tokenClassKey: TokenClassKey, update = defaultUpdate()) {
  return createValidSubmitDTO(UpdateTokenClassDto, {
    tokenClass: tokenClassKey,
    ...update
  });
}

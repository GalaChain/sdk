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
  DeleteTokenInstanceMetadataDto,
  GalaChainResponse,
  TokenInstanceKey,
  createValidSubmitDTO
} from "@gala-chain/api";
import { currency, fixture, nft, users } from "@gala-chain/test";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import {
  NftInstanceRequiredError,
  TokenInstanceMetadataNotFoundError,
  UserNotAuthorizedForProjectError
} from "./TokenInstanceMetadataError";

const project = "TestProject";

it("should delete token instance metadata as a user authorized for the project name", async () => {
  // Given
  const savedMetadata = nft.tokenInstance1Metadata();
  const savedAuthorization = nft.projectAuthorization(); // "TestProject" authorized to users.admin

  const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
    .registeredUsers(users.admin)
    .savedState(nft.tokenClass(), nft.tokenInstance1(), savedAuthorization, savedMetadata);

  const dto = await defaultDeleteDto(nft.tokenInstance1Key()).signed(users.admin.privateKey);

  // When
  const response = await contract.DeleteTokenInstanceMetadata(ctx, dto);

  // Then
  expect(response).toEqual(GalaChainResponse.Success(nft.tokenInstance1Key()));
  // deletions are recorded as writes with empty values
  expect(getWrites()).toEqual({ [savedMetadata.getCompositeKey()]: "" });
});

it("should fail if metadata does not exist", async () => {
  // Given: authorization exists, but no metadata document for this instance
  const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
    .registeredUsers(users.admin)
    .savedState(nft.tokenClass(), nft.tokenInstance1(), nft.projectAuthorization());

  const tokenInstanceKey = nft.tokenInstance1Key();
  const dto = await defaultDeleteDto(tokenInstanceKey).signed(users.admin.privateKey);

  // When
  const response = await contract.DeleteTokenInstanceMetadata(ctx, dto);

  // Then
  expect(response).toEqual(
    GalaChainResponse.Error(new TokenInstanceMetadataNotFoundError(tokenInstanceKey.toStringKey(), project))
  );
  expect(getWrites()).toEqual({});
});

it("should fail if callingUser is not authorized for the project name", async () => {
  // Given
  const savedMetadata = nft.tokenInstance1Metadata();
  const savedAuthorization = nft.projectAuthorization(); // authorized to users.admin
  const callingUser = users.testUser2;
  expect(savedAuthorization.authorizedUsers).not.toContain(callingUser.identityKey);

  const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
    .registeredUsers(callingUser)
    .savedState(nft.tokenClass(), nft.tokenInstance1(), savedAuthorization, savedMetadata);

  const dto = await defaultDeleteDto(nft.tokenInstance1Key()).signed(callingUser.privateKey);

  // When
  const response = await contract.DeleteTokenInstanceMetadata(ctx, dto);

  // Then
  expect(response).toEqual(
    GalaChainResponse.Error(new UserNotAuthorizedForProjectError(callingUser.identityKey, project))
  );
  expect(getWrites()).toEqual({});
});

it("should fail for fungible token instances", async () => {
  // Given
  const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
    .registeredUsers(users.admin)
    .savedState(currency.tokenClass(), currency.tokenInstance());

  const tokenInstanceKey = currency.tokenInstanceKey();
  const dto = await defaultDeleteDto(tokenInstanceKey).signed(users.admin.privateKey);

  // When
  const response = await contract.DeleteTokenInstanceMetadata(ctx, dto);

  // Then
  expect(response).toEqual(
    GalaChainResponse.Error(new NftInstanceRequiredError(tokenInstanceKey.toStringKey()))
  );
  expect(getWrites()).toEqual({});
});

function defaultDeleteDto(tokenInstance: TokenInstanceKey) {
  return createValidSubmitDTO(DeleteTokenInstanceMetadataDto, { tokenInstance, project });
}

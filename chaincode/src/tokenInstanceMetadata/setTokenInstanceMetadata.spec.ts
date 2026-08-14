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
  SetTokenInstanceMetadataDto,
  TokenInstanceKey,
  TokenInstanceMetadata,
  TokenInstanceMetadataAttribute,
  TokenInstanceMetadataCustomField,
  TokenInstanceMetadataProject,
  createValidChainObject,
  createValidSubmitDTO
} from "@gala-chain/api";
import { currency, fixture, nft, transactionSuccess, users, writesMap } from "@gala-chain/test";
import { plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { TokenClassNotFoundError } from "../token/TokenError";
import {
  NftInstanceRequiredError,
  NotProjectMetadataOwnerError,
  TokenInstanceNotFoundError
} from "./TokenInstanceMetadataError";
import { SetTokenInstanceMetadataParams } from "./setTokenInstanceMetadata";

const project = "TestProject";

it("should set token instance metadata and create project ownership", async () => {
  // Given
  const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
    .registeredUsers(users.testUser1)
    .savedState(nft.tokenClass(), nft.tokenInstance1());

  const metadataProps = defaultMetadataProps();
  const dto = await defaultSetDto(nft.tokenInstance1Key(), metadataProps).signed(users.testUser1.privateKey);

  const expectedMetadata = await createValidChainObject(TokenInstanceMetadata, {
    ...nft.tokenInstance1KeyPlain(),
    project,
    ...metadataProps,
    createdBy: users.testUser1.identityKey,
    lastModifiedBy: users.testUser1.identityKey,
    created: ctx.txUnixTime,
    lastModified: ctx.txUnixTime
  });

  const expectedOwnership = await createValidChainObject(TokenInstanceMetadataProject, {
    ...nft.tokenClassKeyPlain(),
    project,
    owner: users.testUser1.identityKey,
    created: ctx.txUnixTime
  });

  // When
  const response = await contract.SetTokenInstanceMetadata(ctx, dto);

  // Then
  expect(response).toEqual(GalaChainResponse.Success(expectedMetadata));
  expect(getWrites()).toEqual(writesMap(expectedOwnership, expectedMetadata));
});

it("should replace existing metadata as owner, preserving creation info", async () => {
  // Given
  const savedMetadata = nft.tokenInstance1Metadata();
  const savedOwnership = nft.tokenInstance1MetadataProject(); // owned by users.admin

  const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
    .registeredUsers(users.admin)
    .savedState(nft.tokenClass(), nft.tokenInstance1(), savedOwnership, savedMetadata);

  const update = { name: "Renamed Elixir", description: "Replaced document." };
  const dto = await defaultSetDto(nft.tokenInstance1Key(), update).signed(users.admin.privateKey);

  // full-document semantics: fields omitted in the dto (image, attributes, etc.) are removed
  const expectedMetadata = await createValidChainObject(TokenInstanceMetadata, {
    ...nft.tokenInstance1KeyPlain(),
    project,
    ...update,
    createdBy: savedMetadata.createdBy,
    created: savedMetadata.created,
    lastModifiedBy: users.admin.identityKey,
    lastModified: ctx.txUnixTime
  });

  // When
  const response = await contract.SetTokenInstanceMetadata(ctx, dto);

  // Then
  expect(response).toEqual(GalaChainResponse.Success(expectedMetadata));
  expect(getWrites()).toEqual(writesMap(expectedMetadata));
});

it("should allow a different user to set metadata for a different project", async () => {
  // Given
  const savedOwnership = nft.tokenInstance1MetadataProject(); // "TestProject" owned by users.admin

  const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
    .registeredUsers(users.testUser2)
    .savedState(nft.tokenClass(), nft.tokenInstance1(), savedOwnership);

  const otherProject = "OtherProject";
  const dto = await createValidSubmitDTO(SetTokenInstanceMetadataDto, {
    tokenInstance: nft.tokenInstance1Key(),
    project: otherProject,
    name: "Other Project View"
  }).signed(users.testUser2.privateKey);

  const expectedMetadata = await createValidChainObject(TokenInstanceMetadata, {
    ...nft.tokenInstance1KeyPlain(),
    project: otherProject,
    name: "Other Project View",
    createdBy: users.testUser2.identityKey,
    lastModifiedBy: users.testUser2.identityKey,
    created: ctx.txUnixTime,
    lastModified: ctx.txUnixTime
  });

  const expectedOwnership = await createValidChainObject(TokenInstanceMetadataProject, {
    ...nft.tokenClassKeyPlain(),
    project: otherProject,
    owner: users.testUser2.identityKey,
    created: ctx.txUnixTime
  });

  // When
  const response = await contract.SetTokenInstanceMetadata(ctx, dto);

  // Then
  expect(response).toEqual(GalaChainResponse.Success(expectedMetadata));
  expect(getWrites()).toEqual(writesMap(expectedOwnership, expectedMetadata));
});

it("should fail if callingUser is not the project metadata owner", async () => {
  // Given
  const savedOwnership = nft.tokenInstance1MetadataProject(); // owned by users.admin
  const callingUser = users.testUser2;
  expect(savedOwnership.owner).not.toEqual(callingUser.identityKey);

  const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
    .registeredUsers(callingUser)
    .savedState(nft.tokenClass(), nft.tokenInstance1(), savedOwnership);

  const dto = await defaultSetDto(nft.tokenInstance1Key()).signed(callingUser.privateKey);

  // When
  const response = await contract.SetTokenInstanceMetadata(ctx, dto);

  // Then
  const classKey = nft.tokenClass().getCompositeKey();
  expect(response).toEqual(
    GalaChainResponse.Error(
      new NotProjectMetadataOwnerError(callingUser.identityKey, project, classKey, savedOwnership.owner)
    )
  );
  expect(getWrites()).toEqual({});
});

it("should fail if token class does not exist", async () => {
  // Given
  const { ctx, contract, getWrites } = fixture(GalaChainTokenContract).registeredUsers(users.testUser1); // no saved token class

  const tokenInstanceKey = nft.tokenInstance1Key();
  const dto = await defaultSetDto(tokenInstanceKey).signed(users.testUser1.privateKey);

  // When
  const response = await contract.SetTokenInstanceMetadata(ctx, dto);

  // Then
  expect(response).toEqual(
    GalaChainResponse.Error(new TokenClassNotFoundError(tokenInstanceKey.getTokenClassKey().toStringKey()))
  );
  expect(getWrites()).toEqual({});
});

it("should fail if token instance does not exist", async () => {
  // Given
  const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
    .registeredUsers(users.testUser1)
    .savedState(nft.tokenClass()); // class saved, but no instance

  const tokenInstanceKey = nft.tokenInstance1Key();
  const dto = await defaultSetDto(tokenInstanceKey).signed(users.testUser1.privateKey);

  // When
  const response = await contract.SetTokenInstanceMetadata(ctx, dto);

  // Then
  expect(response).toEqual(
    GalaChainResponse.Error(new TokenInstanceNotFoundError(tokenInstanceKey.toStringKey()))
  );
  expect(getWrites()).toEqual({});
});

it("should fail for fungible token instances", async () => {
  // Given
  const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
    .registeredUsers(users.testUser1)
    .savedState(currency.tokenClass(), currency.tokenInstance());

  const tokenInstanceKey = currency.tokenInstanceKey();
  const dto = await defaultSetDto(tokenInstanceKey).signed(users.testUser1.privateKey);

  // When
  const response = await contract.SetTokenInstanceMetadata(ctx, dto);

  // Then
  expect(response).toEqual(
    GalaChainResponse.Error(new NftInstanceRequiredError(tokenInstanceKey.toStringKey()))
  );
  expect(getWrites()).toEqual({});
});

it("should not persist signing envelope fields supplied on attributes or custom fields", async () => {
  // Given
  const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
    .registeredUsers(users.testUser1)
    .savedState(nft.tokenClass(), nft.tokenInstance1());

  // attributes and custom fields extend ChainCallDTO, so a caller can populate the signing
  // envelope on them; none of those fields carry a MaxLength
  const envelope = {
    signature: "X".repeat(5000),
    signerPublicKey: "Y".repeat(5000),
    signerAddress: "eth|abcdef",
    uniqueKey: "attacker-supplied",
    prefix: "junk",
    dtoOperation: "junk",
    dtoExpiresAt: 1,
    trace: { traceId: "Z".repeat(5000) }
  };

  const dto = await defaultSetDto(nft.tokenInstance1Key(), {
    attributes: [
      plainToInstance(TokenInstanceMetadataAttribute, {
        traitType: "Potency",
        value: 9,
        displayType: "number",
        ...envelope
      })
    ],
    customFields: [
      plainToInstance(TokenInstanceMetadataCustomField, {
        key: "gameId",
        value: "elixir-001",
        ...envelope
      })
    ]
  }).signed(users.testUser1.privateKey);

  // When
  const response = await contract.SetTokenInstanceMetadata(ctx, dto);

  // Then
  expect(response).toEqual(transactionSuccess());

  const written = Object.values(getWrites()).map((v) => JSON.parse(v as string));
  const metadata = written.find((w) => w.attributes !== undefined);

  expect(Object.keys(metadata.attributes[0]).sort()).toEqual(["displayType", "traitType", "value"]);
  expect(Object.keys(metadata.customFields[0]).sort()).toEqual(["key", "value"]);
});

function defaultMetadataProps() {
  return {
    name: "Test Elixir #1",
    description: "Generated via automated test suite.",
    image: "https://app.gala.games/test-image-placeholder-url.png",
    attributes: [
      plainToInstance(TokenInstanceMetadataAttribute, {
        traitType: "Potency",
        value: 9,
        displayType: "number"
      })
    ],
    customFields: [plainToInstance(TokenInstanceMetadataCustomField, { key: "gameId", value: "elixir-001" })]
  };
}

function defaultSetDto(
  tokenInstance: TokenInstanceKey,
  metadataProps: Omit<SetTokenInstanceMetadataParams, "tokenInstance" | "project"> = defaultMetadataProps()
) {
  return createValidSubmitDTO(SetTokenInstanceMetadataDto, {
    tokenInstance,
    project,
    ...metadataProps
  });
}

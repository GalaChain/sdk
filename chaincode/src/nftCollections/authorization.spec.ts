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
import { NftCollectionAuthorization } from "@gala-chain/api";
import { fixture, users, writesMap } from "@gala-chain/test";
import { plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { GalaChainContext } from "../types";
import { UserNotAuthorizedForCollectionError } from "./NftCollectionError";
import { grantNftCollectionAuthorization } from "./authorization";

const collection = "TestCollection";

function existingAuthorization(authorizedUsers: string[]): NftCollectionAuthorization {
  return plainToInstance(NftCollectionAuthorization, { collection, authorizedUsers });
}

describe("grantNftCollectionAuthorization", () => {
  it("should create a new authorization when none exists", async () => {
    // Given
    const { ctx, getWrites } = fixture<GalaChainContext, GalaChainTokenContract>(
      GalaChainTokenContract
    ).callingUser(users.testUser1);

    const expectedAuthorization = existingAuthorization([users.testUser2.identityKey]);

    // When
    const result = await grantNftCollectionAuthorization(ctx, collection, users.testUser2.identityKey).then(
      (res) => ctx.stub.flushWrites().then(() => res)
    );

    // Then
    expect(result).toEqual(expectedAuthorization);
    expect(getWrites()).toEqual(writesMap(expectedAuthorization));
  });

  it("should add a user when the calling user is already authorized", async () => {
    // Given
    const saved = existingAuthorization([users.testUser1.identityKey]);

    const { ctx, getWrites } = fixture<GalaChainContext, GalaChainTokenContract>(GalaChainTokenContract)
      .callingUser(users.testUser1)
      .savedState(saved);

    const expectedAuthorization = existingAuthorization(
      [users.testUser1.identityKey, users.testUser2.identityKey].sort()
    );

    // When
    const result = await grantNftCollectionAuthorization(ctx, collection, users.testUser2.identityKey).then(
      (res) => ctx.stub.flushWrites().then(() => res)
    );

    // Then
    expect(result.authorizedUsers).toEqual(expectedAuthorization.authorizedUsers);
    expect(getWrites()).toEqual(writesMap(expectedAuthorization));
  });

  it("should throw when the calling user is not authorized for the existing collection", async () => {
    // Given
    const saved = existingAuthorization([users.testUser1.identityKey]);

    const { ctx, getWrites } = fixture<GalaChainContext, GalaChainTokenContract>(GalaChainTokenContract)
      .callingUser(users.testUser2)
      .savedState(saved);

    // When
    const result = await grantNftCollectionAuthorization(ctx, collection, users.admin.identityKey)
      .then(() => ctx.stub.flushWrites())
      .catch((e) => e);

    // Then
    expect(result).toEqual(new UserNotAuthorizedForCollectionError(users.testUser2.identityKey, collection));
    expect(getWrites()).toEqual({});
  });

  it("should not duplicate a user already in the list (idempotent) for an authorized caller", async () => {
    // Given
    const saved = existingAuthorization([users.testUser1.identityKey, users.testUser2.identityKey].sort());

    const { ctx, getWrites } = fixture<GalaChainContext, GalaChainTokenContract>(GalaChainTokenContract)
      .callingUser(users.testUser1)
      .savedState(saved);

    // When
    const result = await grantNftCollectionAuthorization(ctx, collection, users.testUser2.identityKey).then(
      (res) => ctx.stub.flushWrites().then(() => res)
    );

    // Then
    expect(result.authorizedUsers).toEqual(saved.authorizedUsers);
    expect(getWrites()).toEqual(writesMap(saved));
  });
});

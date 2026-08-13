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
import { NftCollectionAuthorization, NftCollectionNameReservation } from "@gala-chain/api";
import { fixture, users, writesMap } from "@gala-chain/test";
import { plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { GalaChainContext } from "../types";
import { CollectionNameAlreadyClaimedError, UserNotAuthorizedForCollectionError } from "./NftCollectionError";
import { grantNftCollectionAuthorization } from "./authorization";

const collection = "TestCollection";

function existingAuthorization(authorizedUsers: string[], name = collection): NftCollectionAuthorization {
  return plainToInstance(NftCollectionAuthorization, { collection: name, authorizedUsers });
}

function existingReservation(name: string): NftCollectionNameReservation {
  return plainToInstance(NftCollectionNameReservation, {
    normalizedName: NftCollectionNameReservation.normalize(name),
    collection: name
  });
}

describe("grantNftCollectionAuthorization", () => {
  it("should create a new authorization when none exists", async () => {
    // Given
    const { ctx, getWrites } = fixture<GalaChainContext, GalaChainTokenContract>(
      GalaChainTokenContract
    ).callingUser(users.testUser1);

    const expectedAuthorization = existingAuthorization([users.testUser2.identityKey]);
    const expectedReservation = existingReservation(collection);

    // When
    const result = await grantNftCollectionAuthorization(ctx, collection, users.testUser2.identityKey).then(
      (res) => ctx.stub.flushWrites().then(() => res)
    );

    // Then
    expect(result).toEqual(expectedAuthorization);
    expect(getWrites()).toEqual(writesMap(expectedAuthorization, expectedReservation));
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

describe("grantNftCollectionAuthorization case-variant squatting", () => {
  const claimed = "Mirandus";

  // A claimed name is reserved across every letter case, so no one can claim a variant of it.
  it.each([
    ["lower case", "mirandus"],
    ["upper case", "MIRANDUS"],
    ["mixed case", "MiRaNdUs"]
  ])("should reject claiming the %s variant of an already-claimed collection", async (_label, variant) => {
    // Given: testUser1 owns "Mirandus"; testUser2 is a stranger to it
    const { ctx, getWrites } = fixture<GalaChainContext, GalaChainTokenContract>(GalaChainTokenContract)
      .callingUser(users.testUser2)
      .savedState(
        existingAuthorization([users.testUser1.identityKey], claimed),
        existingReservation(claimed)
      );

    // When
    const result = await grantNftCollectionAuthorization(ctx, variant, users.testUser2.identityKey)
      .then(() => ctx.stub.flushWrites())
      .catch((e) => e);

    // Then
    expect(result).toEqual(new CollectionNameAlreadyClaimedError(variant, claimed));
    expect(getWrites()).toEqual({});
  });

  it("should still allow the exact claimed casing to be granted by an authorized user", async () => {
    // Given
    const saved = existingAuthorization([users.testUser1.identityKey], claimed);

    const { ctx } = fixture<GalaChainContext, GalaChainTokenContract>(GalaChainTokenContract)
      .callingUser(users.testUser1)
      .savedState(saved, existingReservation(claimed));

    // When
    const result = await grantNftCollectionAuthorization(ctx, claimed, users.testUser2.identityKey).then(
      (res) => ctx.stub.flushWrites().then(() => res)
    );

    // Then
    expect(result.collection).toEqual(claimed);
    expect(result.authorizedUsers).toEqual([users.testUser1.identityKey, users.testUser2.identityKey].sort());
  });

  it("should allow an unrelated collection name to be claimed freely", async () => {
    // Given
    const { ctx } = fixture<GalaChainContext, GalaChainTokenContract>(GalaChainTokenContract)
      .callingUser(users.testUser2)
      .savedState(
        existingAuthorization([users.testUser1.identityKey], claimed),
        existingReservation(claimed)
      );

    // When
    const result = await grantNftCollectionAuthorization(ctx, "Legacy", users.testUser2.identityKey).then(
      (res) => ctx.stub.flushWrites().then(() => res)
    );

    // Then
    expect(result.collection).toEqual("Legacy");
    expect(result.authorizedUsers).toEqual([users.testUser2.identityKey]);
  });

  it("should reserve the name on first claim so a later variant is blocked", async () => {
    // Given: nothing claimed yet
    const { ctx } = fixture<GalaChainContext, GalaChainTokenContract>(GalaChainTokenContract)
      .callingUser(users.testUser1)
      .savedState();

    // When: testUser1 claims "Mirandus", then testUser2 attempts "mirandus" against that same state
    await grantNftCollectionAuthorization(ctx, claimed, users.testUser1.identityKey);
    await ctx.stub.flushWrites();

    ctx.resetCallingUser();
    ctx.callingUserData = {
      alias: users.testUser2.identityKey,
      ethAddress: users.testUser2.ethAddress,
      roles: users.testUser2.roles,
      signedBy: [],
      signatureQuorum: 0,
      allowedSigners: [],
      isMultisig: false
    };

    const result = await grantNftCollectionAuthorization(ctx, "mirandus", users.testUser2.identityKey).catch(
      (e) => e
    );

    // Then
    expect(result).toEqual(new CollectionNameAlreadyClaimedError("mirandus", claimed));
  });
});

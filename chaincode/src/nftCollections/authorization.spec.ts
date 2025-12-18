import { NotFoundError } from "@gala-chain/api";
import { fixture, users, writesMap } from "@gala-chain/test";
import { plainToInstance } from "class-transformer";

import { GalaChainTokenContract } from "../contracts/galaChainTokenContract";
import { NftCollectionAuthorization } from "../types";
import {
  fetchNftCollectionAuthorization,
  grantNftCollectionAuthorization,
  isUserAuthorizedForCollection,
  revokeNftCollectionAuthorization
} from "./authorization";
import { fetchNftCollectionAuthorizationsWithPagination } from "./fetchNftCollectionAuthorizationsWithPagination";

describe("grantNftCollectionAuthorization", () => {
  it("should create new authorization when it doesn't exist", async () => {
    // Given
    const collection = "TestCollection";
    const user = users.admin.identityKey;

    const { ctx, getWrites } = fixture(GalaChainTokenContract);

    // When
    const authorization = await grantNftCollectionAuthorization(ctx, collection, user);
    await ctx.stub.flushWrites();

    // Then
    expect(authorization.collection).toEqual(collection);
    expect(authorization.authorizedUsers).toEqual([user]);
    expect(getWrites()).toEqual(writesMap(authorization));
  });

  it("should add user to existing authorization", async () => {
    // Given
    const collection = "TestCollection";
    const user1 = users.admin.identityKey;
    const user2 = users.random().identityKey;

    const existingAuth = plainToInstance(NftCollectionAuthorization, {
      collection,
      authorizedUsers: [user1]
    });

    const { ctx, getWrites } = fixture(GalaChainTokenContract).savedState(existingAuth);

    // When
    const authorization = await grantNftCollectionAuthorization(ctx, collection, user2);
    await ctx.stub.flushWrites();

    // Then
    expect(authorization.collection).toEqual(collection);
    expect(authorization.authorizedUsers).toContain(user1);
    expect(authorization.authorizedUsers).toContain(user2);
    expect(authorization.authorizedUsers.length).toEqual(2);
    expect(getWrites()).toEqual(writesMap(authorization));
  });

  it("should not duplicate user if already authorized", async () => {
    // Given
    const collection = "TestCollection";
    const user = users.admin.identityKey;

    const existingAuth = plainToInstance(NftCollectionAuthorization, {
      collection,
      authorizedUsers: [user]
    });

    const { ctx, getWrites } = fixture(GalaChainTokenContract).savedState(existingAuth);

    // When
    const authorization = await grantNftCollectionAuthorization(ctx, collection, user);
    await ctx.stub.flushWrites();

    // Then
    expect(authorization.authorizedUsers).toEqual([user]);
    expect(authorization.authorizedUsers.length).toEqual(1);
    expect(getWrites()).toEqual(writesMap(authorization));
  });
});

describe("revokeNftCollectionAuthorization", () => {
  it("should remove user from authorization", async () => {
    // Given
    const collection = "TestCollection";
    const user1 = users.admin.identityKey;
    const user2 = users.random().identityKey;

    const existingAuth = plainToInstance(NftCollectionAuthorization, {
      collection,
      authorizedUsers: [user1, user2]
    });

    const { ctx, getWrites } = fixture(GalaChainTokenContract).savedState(existingAuth);

    // When
    const authorization = await revokeNftCollectionAuthorization(ctx, collection, user1);
    await ctx.stub.flushWrites();

    // Then
    expect(authorization.collection).toEqual(collection);
    expect(authorization.authorizedUsers).not.toContain(user1);
    expect(authorization.authorizedUsers).toContain(user2);
    expect(authorization.authorizedUsers.length).toEqual(1);
    expect(getWrites()).toEqual(writesMap(authorization));
  });

  it("should be idempotent when removing non-existent user", async () => {
    // Given
    const collection = "TestCollection";
    const user1 = users.admin.identityKey;
    const user2 = users.random().identityKey;

    const existingAuth = plainToInstance(NftCollectionAuthorization, {
      collection,
      authorizedUsers: [user1]
    });

    const { ctx, getWrites } = fixture(GalaChainTokenContract).savedState(existingAuth);

    // When
    const authorization = await revokeNftCollectionAuthorization(ctx, collection, user2);
    await ctx.stub.flushWrites();

    // Then
    expect(authorization.collection).toEqual(collection);
    expect(authorization.authorizedUsers).toEqual([user1]);
    expect(authorization.authorizedUsers.length).toEqual(1);
    // When removing a non-existent user, nothing changes so no write should occur (idempotent)
    expect(getWrites()).toEqual(writesMap());
  });

  it("should throw NotFoundError when authorization doesn't exist", async () => {
    // Given
    const collection = "NonExistentCollection";
    const user = users.admin.identityKey;

    const { ctx } = fixture(GalaChainTokenContract);

    // When & Then
    await expect(revokeNftCollectionAuthorization(ctx, collection, user)).rejects.toThrow(NotFoundError);
  });
});

describe("fetchNftCollectionAuthorization", () => {
  it("should fetch existing authorization", async () => {
    // Given
    const collection = "TestCollection";
    const user = users.admin.identityKey;

    const existingAuth = plainToInstance(NftCollectionAuthorization, {
      collection,
      authorizedUsers: [user]
    });

    const { ctx } = fixture(GalaChainTokenContract).savedState(existingAuth);

    // When
    const authorization = await fetchNftCollectionAuthorization(ctx, collection);

    // Then
    expect(authorization.collection).toEqual(collection);
    expect(authorization.authorizedUsers).toEqual([user]);
  });

  it("should throw NotFoundError when authorization doesn't exist", async () => {
    // Given
    const collection = "NonExistentCollection";

    const { ctx } = fixture(GalaChainTokenContract);

    // When & Then
    await expect(fetchNftCollectionAuthorization(ctx, collection)).rejects.toThrow(NotFoundError);
  });
});

describe("isUserAuthorizedForCollection", () => {
  it("should return true when user is authorized", async () => {
    // Given
    const collection = "TestCollection";
    const user = users.admin.identityKey;

    const existingAuth = plainToInstance(NftCollectionAuthorization, {
      collection,
      authorizedUsers: [user]
    });

    const { ctx } = fixture(GalaChainTokenContract).savedState(existingAuth);

    // When
    const isAuthorized = await isUserAuthorizedForCollection(ctx, collection, user);

    // Then
    expect(isAuthorized).toBe(true);
  });

  it("should return false when user is not authorized", async () => {
    // Given
    const collection = "TestCollection";
    const user1 = users.admin.identityKey;
    const user2 = users.random().identityKey;

    const existingAuth = plainToInstance(NftCollectionAuthorization, {
      collection,
      authorizedUsers: [user1]
    });

    const { ctx } = fixture(GalaChainTokenContract).savedState(existingAuth);

    // When
    const isAuthorized = await isUserAuthorizedForCollection(ctx, collection, user2);

    // Then
    expect(isAuthorized).toBe(false);
  });

  it("should return false when authorization doesn't exist", async () => {
    // Given
    const collection = "NonExistentCollection";
    const user = users.admin.identityKey;

    const { ctx } = fixture(GalaChainTokenContract);

    // When
    const isAuthorized = await isUserAuthorizedForCollection(ctx, collection, user);

    // Then
    expect(isAuthorized).toBe(false);
  });
});

describe("fetchNftCollectionAuthorizationsWithPagination", () => {
  it("should fetch all authorizations", async () => {
    // Given
    const collection1 = "TestCollection1";
    const collection2 = "TestCollection2";
    const user = users.admin.identityKey;

    const auth1 = plainToInstance(NftCollectionAuthorization, {
      collection: collection1,
      authorizedUsers: [user]
    });

    const auth2 = plainToInstance(NftCollectionAuthorization, {
      collection: collection2,
      authorizedUsers: [user]
    });

    const { ctx } = fixture(GalaChainTokenContract).savedState(auth1, auth2);

    // When
    const response = await fetchNftCollectionAuthorizationsWithPagination(ctx, {});

    // Then
    expect(response.results).toHaveLength(2);
    expect(response.results.map((a) => a.collection)).toContain(collection1);
    expect(response.results.map((a) => a.collection)).toContain(collection2);
  });

  it("should return empty results when no authorizations exist", async () => {
    // Given
    const { ctx } = fixture(GalaChainTokenContract);

    // When
    const response = await fetchNftCollectionAuthorizationsWithPagination(ctx, {});

    // Then
    expect(response.results).toHaveLength(0);
    expect(response.nextPageBookmark).toEqual("");
  });
});

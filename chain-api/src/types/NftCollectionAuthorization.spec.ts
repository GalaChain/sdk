import { users } from "@gala-chain/test";
import { plainToInstance } from "class-transformer";

import { NftCollectionAuthorization } from "./NftCollectionAuthorization";

describe("NftCollectionAuthorization", () => {
  it("should serialize collection authorization key", () => {
    // Given
    const collectionName = "TestCollection";
    const mockAuthorization = plainToInstance(NftCollectionAuthorization, {
      collection: collectionName,
      authorizedUsers: [users.admin.identityKey, users.random().identityKey]
    });

    // When
    const key = mockAuthorization.getCompositeKey();

    // Then
    expect(key).toEqual(`\u0000${NftCollectionAuthorization.INDEX_KEY}\u0000${collectionName}\u0000`);
  });

  it("should create authorization with empty authorized users array", () => {
    // Given
    const collectionName = "EmptyCollection";
    const mockAuthorization = plainToInstance(NftCollectionAuthorization, {
      collection: collectionName,
      authorizedUsers: []
    });

    // When
    const key = mockAuthorization.getCompositeKey();

    // Then
    expect(key).toEqual(`\u0000${NftCollectionAuthorization.INDEX_KEY}\u0000${collectionName}\u0000`);
    expect(mockAuthorization.authorizedUsers).toEqual([]);
  });

  it("should create authorization with multiple authorized users", () => {
    // Given
    const collectionName = "MultiUserCollection";
    const user1 = users.admin.identityKey;
    const user2 = users.random().identityKey;
    const user3 = users.random().identityKey;

    const mockAuthorization = plainToInstance(NftCollectionAuthorization, {
      collection: collectionName,
      authorizedUsers: [user1, user2, user3]
    });

    // When & Then
    expect(mockAuthorization.collection).toEqual(collectionName);
    expect(mockAuthorization.authorizedUsers).toHaveLength(3);
    expect(mockAuthorization.authorizedUsers).toContain(user1);
    expect(mockAuthorization.authorizedUsers).toContain(user2);
    expect(mockAuthorization.authorizedUsers).toContain(user3);
  });
});

import { CreateTokenClassDto, TokenClassKey, UserAlias } from "@gala-chain/api";
import { createTokenClass } from "@gala-chain/chaincode";
import { fixture, users, writesMap } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import { GalaChainTokenContract } from "../contracts/galaChainTokenContract";
import { CreateNftCollectionDto } from "../dtos";
import { NftCollectionAuthorization } from "../types";
import {
  CollectionNameMismatchError,
  NftCollectionAuthorizationNotFoundError,
  UserNotAuthorizedForCollectionError
} from "./NftCollectionError";
import * as authorizationModule from "./authorization";
import { createNftCollection } from "./createNftCollection";

// Mock createTokenClass before importing the module that uses it
jest.mock("@gala-chain/chaincode", () => {
  const actual = jest.requireActual("@gala-chain/chaincode");
  return {
    ...actual,
    createTokenClass: jest.fn()
  };
});

const mockCreateTokenClass = createTokenClass as jest.MockedFunction<typeof createTokenClass>;

describe("createNftCollection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create NFT collection when user is authorized", async () => {
    // Given
    const collection = "TestCollection";
    const user = users.admin.identityKey;

    const authorization = plainToInstance(NftCollectionAuthorization, {
      collection,
      authorizedUsers: [user]
    });

    const dto = plainToInstance(CreateNftCollectionDto, {
      collection,
      category: "Weapon",
      type: "Sword",
      additionalKey: "none",
      name: "Test Sword",
      symbol: "TSW",
      description: "A test sword",
      image: "https://example.com/image.png"
    });

    const expectedTokenClassKey = new TokenClassKey();
    expectedTokenClassKey.collection = collection;
    expectedTokenClassKey.category = "Weapon";
    expectedTokenClassKey.type = "Sword";
    expectedTokenClassKey.additionalKey = "none";

    mockCreateTokenClass.mockResolvedValue(expectedTokenClassKey);

    const { ctx } = fixture(GalaChainTokenContract).savedState(authorization).callingUser(users.admin);

    // When
    const result = await createNftCollection(ctx, dto);

    // Then
    expect(result).toEqual(expectedTokenClassKey);
    expect(mockCreateTokenClass).toHaveBeenCalledWith(ctx, {
      network: "GC",
      tokenClass: expect.objectContaining({
        collection,
        category: "Weapon",
        type: "Sword",
        additionalKey: "none"
      }),
      isNonFungible: true,
      decimals: 0,
      name: "Test Sword",
      symbol: "TSW",
      description: "A test sword",
      image: "https://example.com/image.png",
      rarity: undefined,
      metadataAddress: undefined,
      contractAddress: undefined,
      maxSupply: CreateTokenClassDto.DEFAULT_MAX_SUPPLY,
      maxCapacity: CreateTokenClassDto.DEFAULT_MAX_CAPACITY,
      totalMintAllowance: CreateTokenClassDto.INITIAL_MINT_ALLOWANCE,
      totalSupply: CreateTokenClassDto.INITIAL_TOTAL_SUPPLY,
      totalBurned: CreateTokenClassDto.INITIAL_TOTAL_BURNED,
      authorities: [user]
    });
  });

  it("should create NFT collection with optional fields", async () => {
    // Given
    const collection = "TestCollection";
    const user = users.admin.identityKey;

    const authorization = plainToInstance(NftCollectionAuthorization, {
      collection,
      authorizedUsers: [user]
    });

    const dto = plainToInstance(CreateNftCollectionDto, {
      collection,
      category: "Weapon",
      type: "Sword",
      additionalKey: "none",
      name: "Test Sword",
      symbol: "TSW",
      description: "A test sword",
      image: "https://example.com/image.png",
      metadataAddress: "0x123",
      contractAddress: "0x456",
      rarity: "Common",
      maxSupply: new BigNumber(1000),
      maxCapacity: new BigNumber(1000),
      authorities: [users.random().identityKey]
    });

    const expectedTokenClassKey = new TokenClassKey();
    expectedTokenClassKey.collection = collection;
    expectedTokenClassKey.category = "Weapon";
    expectedTokenClassKey.type = "Sword";
    expectedTokenClassKey.additionalKey = "none";

    mockCreateTokenClass.mockResolvedValue(expectedTokenClassKey);

    const { ctx } = fixture(GalaChainTokenContract).savedState(authorization).callingUser(users.admin);

    // When
    const result = await createNftCollection(ctx, dto);

    // Then
    expect(result).toEqual(expectedTokenClassKey);
    expect(mockCreateTokenClass).toHaveBeenCalledWith(ctx, {
      network: "GC",
      tokenClass: expect.objectContaining({
        collection,
        category: "Weapon",
        type: "Sword",
        additionalKey: "none"
      }),
      isNonFungible: true,
      decimals: 0,
      name: "Test Sword",
      symbol: "TSW",
      description: "A test sword",
      rarity: "Common",
      image: "https://example.com/image.png",
      metadataAddress: "0x123",
      contractAddress: "0x456",
      maxSupply: new BigNumber(1000),
      maxCapacity: new BigNumber(1000),
      totalMintAllowance: new BigNumber(0),
      totalSupply: new BigNumber(0),
      totalBurned: new BigNumber(0),
      authorities: dto.authorities
    });
  });

  it("should always use collection name from authorization object", async () => {
    // Given
    const authorizedCollection = "AuthorizedCollection";
    const user = users.admin.identityKey;

    const authorization = plainToInstance(NftCollectionAuthorization, {
      collection: authorizedCollection,
      authorizedUsers: [user]
    });

    const dto = plainToInstance(CreateNftCollectionDto, {
      collection: authorizedCollection, // Must match to find authorization
      category: "Weapon",
      type: "Sword",
      additionalKey: "none",
      name: "Test Sword",
      symbol: "TSW"
    });

    const expectedTokenClassKey = new TokenClassKey();
    expectedTokenClassKey.collection = authorizedCollection;

    mockCreateTokenClass.mockResolvedValue(expectedTokenClassKey);

    const { ctx } = fixture(GalaChainTokenContract).savedState(authorization).callingUser(users.admin);

    // When
    const result = await createNftCollection(ctx, dto);

    // Then
    expect(result).toEqual(expectedTokenClassKey);
    // Collection name should be from authorization object, not directly from DTO
    expect(mockCreateTokenClass).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        tokenClass: expect.objectContaining({
          collection: authorizedCollection // Should use collection from authorization object
        })
      })
    );
  });

  it("should throw error when user is not authorized", async () => {
    // Given
    const collection = "TestCollection";
    const authorizedUser = users.admin.identityKey;
    const unauthorizedUser = users.random();

    const authorization = plainToInstance(NftCollectionAuthorization, {
      collection,
      authorizedUsers: [authorizedUser]
    });

    const dto = plainToInstance(CreateNftCollectionDto, {
      collection,
      category: "Weapon",
      type: "Sword",
      additionalKey: "none",
      name: "Test Sword",
      symbol: "TSW",
      description: "A test sword",
      image: "https://example.com/image.png"
    });

    const { ctx } = fixture(GalaChainTokenContract).savedState(authorization).callingUser(unauthorizedUser);

    // When & Then
    await expect(createNftCollection(ctx, dto)).rejects.toThrow(UserNotAuthorizedForCollectionError);
    expect(mockCreateTokenClass).not.toHaveBeenCalled();
  });

  it("should throw error when authorization doesn't exist", async () => {
    // Given
    const collection = "NonExistentCollection";
    const user = users.admin;

    const dto = plainToInstance(CreateNftCollectionDto, {
      collection,
      category: "Weapon",
      type: "Sword",
      additionalKey: "none",
      name: "Test Sword",
      symbol: "TSW",
      description: "A test sword",
      image: "https://example.com/image.png"
    });

    const { ctx } = fixture(GalaChainTokenContract).callingUser(user);

    // When & Then
    await expect(createNftCollection(ctx, dto)).rejects.toThrow(NftCollectionAuthorizationNotFoundError);
    expect(mockCreateTokenClass).not.toHaveBeenCalled();
  });

  it("should throw error when collection name in DTO doesn't match authorization collection name", async () => {
    // Given
    const authorizedCollection = "AuthorizedCollection";
    const requestedCollection = "DifferentCollection";
    const user = users.admin.identityKey;

    // Mock fetchNftCollectionAuthorization to return an authorization with a different collection name
    // This simulates the scenario where the authorization object has a mismatched collection name
    // The key is: we're mocking it to return an authorization for "AuthorizedCollection" even though
    // the DTO requests "DifferentCollection", which will trigger the check at line 29
    const authorization = plainToInstance(NftCollectionAuthorization, {
      collection: authorizedCollection, // Different from requestedCollection
      authorizedUsers: [user] // User is authorized, so line 24 won't throw
    });

    // Create a spy just for this test and restore it afterward
    const mockFetchNftCollectionAuthorization = jest
      .spyOn(authorizationModule, "fetchNftCollectionAuthorization")
      .mockImplementation(async (ctx, collection) => {
        // Return the authorization regardless of what collection is requested
        // This simulates a data corruption scenario where the authorization has wrong collection name
        return authorization;
      });

    try {
      const dto = plainToInstance(CreateNftCollectionDto, {
        collection: requestedCollection, // Different from authorization collection
        category: "Weapon",
        type: "Sword",
        additionalKey: "none",
        name: "Test Sword",
        symbol: "TSW",
        description: "A test sword",
        image: "https://example.com/image.png"
      });

      const { ctx } = fixture(GalaChainTokenContract).callingUser(users.admin);

      // When & Then
      // This should throw because authorization.collection ("AuthorizedCollection") !== dto.collection ("DifferentCollection")
      await expect(createNftCollection(ctx, dto)).rejects.toThrow(CollectionNameMismatchError);

      // Verify the mock was called (proving we're using the mock, not the real implementation)
      expect(mockFetchNftCollectionAuthorization).toHaveBeenCalledWith(ctx, requestedCollection);
      expect(mockFetchNftCollectionAuthorization).toHaveReturned();

      // Verify createTokenClass was NOT called (proving the error was thrown before reaching it)
      expect(mockCreateTokenClass).not.toHaveBeenCalled();
    } finally {
      // Always restore the original implementation after this test
      mockFetchNftCollectionAuthorization.mockRestore();
    }
  });

  it("should always set isNonFungible to true and decimals to 0", async () => {
    // Given
    const collection = "TestCollection";
    const user = users.admin.identityKey;

    const authorization = plainToInstance(NftCollectionAuthorization, {
      collection,
      authorizedUsers: [user]
    });

    const dto = plainToInstance(CreateNftCollectionDto, {
      collection,
      category: "Weapon",
      type: "Sword",
      additionalKey: "none",
      name: "Test Sword",
      symbol: "TSW",
      description: "A test sword",
      image: "https://example.com/image.png"
    });

    const expectedTokenClassKey = new TokenClassKey();
    mockCreateTokenClass.mockResolvedValue(expectedTokenClassKey);

    const { ctx } = fixture(GalaChainTokenContract).savedState(authorization).callingUser(users.admin);

    // When
    await createNftCollection(ctx, dto);

    // Then
    expect(mockCreateTokenClass).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        isNonFungible: true,
        decimals: 0
      })
    );
  });
});

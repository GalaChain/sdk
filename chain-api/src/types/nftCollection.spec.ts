import { createValidDTO } from "@gala-chain/api";
import BigNumber from "bignumber.js";
import { plainToClass as plainToInstance } from "class-transformer";

import {
  CreateNftCollectionDto,
  FetchNftCollectionAuthorizationDto,
  GrantNftCollectionAuthorizationDto,
  RevokeNftCollectionAuthorizationDto
} from "./nftCollection";

describe("NFT Collection DTOs", () => {
  describe("GrantNftCollectionAuthorizationDto", () => {
    it("should parse valid grant authorization DTO", async () => {
      // Given
      const valid = {
        collection: "TestCollection",
        authorizedUser: "client|testuser"
      };

      // When
      const dto = await createValidDTO<GrantNftCollectionAuthorizationDto>(
        GrantNftCollectionAuthorizationDto,
        valid as any
      );

      // Then
      expect(dto.collection).toEqual("TestCollection");
      expect(dto.authorizedUser).toEqual("client|testuser");
    });

    it("should fail validation when collection is missing", async () => {
      // Given
      const invalid = {
        authorizedUser: "client|testuser"
      };

      // When
      const dto = plainToInstance(GrantNftCollectionAuthorizationDto, invalid);
      const errors = await dto.validate();

      // Then
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === "collection")).toBe(true);
    });

    it("should fail validation when authorizedUser is missing", async () => {
      // Given
      const invalid = {
        collection: "TestCollection"
      };

      // When
      const dto = plainToInstance(GrantNftCollectionAuthorizationDto, invalid);
      const errors = await dto.validate();

      // Then
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === "authorizedUser")).toBe(true);
    });
  });

  describe("RevokeNftCollectionAuthorizationDto", () => {
    it("should parse valid revoke authorization DTO", async () => {
      // Given
      const valid = {
        collection: "TestCollection",
        authorizedUser: "client|testuser"
      };

      // When
      const dto = await createValidDTO<RevokeNftCollectionAuthorizationDto>(
        RevokeNftCollectionAuthorizationDto,
        valid as any
      );

      // Then
      expect(dto.collection).toEqual("TestCollection");
      expect(dto.authorizedUser).toEqual("client|testuser");
    });

    it("should fail validation when collection is missing", async () => {
      // Given
      const invalid = {
        authorizedUser: "client|testuser"
      };

      // When
      const dto = plainToInstance(RevokeNftCollectionAuthorizationDto, invalid);
      const errors = await dto.validate();

      // Then
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === "collection")).toBe(true);
    });
  });

  describe("FetchNftCollectionAuthorizationDto", () => {
    it("should parse valid fetch authorization DTO", async () => {
      // Given
      const valid = {
        collection: "TestCollection"
      };

      // When
      const dto = await createValidDTO(FetchNftCollectionAuthorizationDto, valid);

      // Then
      expect(dto.collection).toEqual("TestCollection");
    });

    it("should fail validation when collection is missing", async () => {
      // Given
      const invalid = {};

      // When
      const dto = plainToInstance(FetchNftCollectionAuthorizationDto, invalid);
      const errors = await dto.validate();

      // Then
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === "collection")).toBe(true);
    });
  });

  describe("CreateNftCollectionDto", () => {
    it("should parse valid create collection DTO with required fields", async () => {
      // Given
      const valid = {
        collection: "TestCollection",
        category: "Weapon",
        type: "Sword",
        additionalKey: "none",
        name: "Test Sword",
        symbol: "TSW",
        description: "A test sword",
        image: "https://example.com/image.png"
      };

      // When
      const dto = await createValidDTO<CreateNftCollectionDto>(CreateNftCollectionDto, valid as any);

      // Then
      expect(dto.collection).toEqual("TestCollection");
      expect(dto.category).toEqual("Weapon");
      expect(dto.type).toEqual("Sword");
      expect(dto.additionalKey).toEqual("none");
      expect(dto.name).toEqual("Test Sword");
      expect(dto.symbol).toEqual("TSW");
      expect(dto.description).toEqual("A test sword");
      expect(dto.image).toEqual("https://example.com/image.png");
    });

    it("should parse valid create collection DTO with optional fields", async () => {
      // Given
      const valid = {
        collection: "TestCollection",
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
        authorities: ["client|user1", "client|user2"]
      };

      // When
      const dto = await createValidDTO<CreateNftCollectionDto>(CreateNftCollectionDto, valid as any);

      // Then
      expect(dto.collection).toEqual("TestCollection");
      expect(dto.description).toEqual("A test sword");
      expect(dto.image).toEqual("https://example.com/image.png");
      expect(dto.metadataAddress).toEqual("0x123");
      expect(dto.contractAddress).toEqual("0x456");
      expect(dto.rarity).toEqual("Common");
      expect(dto.maxSupply).toEqual(new BigNumber(1000));
      expect(dto.maxCapacity).toEqual(new BigNumber(1000));
      expect(dto.authorities).toEqual(["client|user1", "client|user2"]);
    });

    it("should fail validation when required fields are missing", async () => {
      // Given
      const invalid = {
        collection: "TestCollection"
        // Missing category, type, additionalKey, name, symbol, description, image
      };

      // When
      const dto = plainToInstance(CreateNftCollectionDto, invalid);
      const errors = await dto.validate();

      // Then
      expect(errors.length).toBeGreaterThan(0);
      const errorProperties = errors.map((e) => e.property);
      expect(errorProperties).toContain("category");
      expect(errorProperties).toContain("type");
      expect(errorProperties).toContain("additionalKey");
      expect(errorProperties).toContain("name");
      expect(errorProperties).toContain("symbol");
      expect(errorProperties).toContain("description");
      expect(errorProperties).toContain("image");
    });

    it("should serialize and deserialize correctly", async () => {
      // Given
      const valid = {
        collection: "TestCollection",
        category: "Weapon",
        type: "Sword",
        additionalKey: "none",
        name: "Test Sword",
        symbol: "TSW",
        description: "A test sword",
        image: "https://example.com/image.png",
        maxSupply: new BigNumber(1000),
        maxCapacity: new BigNumber(1000)
      };

      const dto = await createValidDTO<CreateNftCollectionDto>(CreateNftCollectionDto, valid as any);

      // When
      const serialized = dto.serialize();
      const deserialized = plainToInstance(CreateNftCollectionDto, JSON.parse(serialized));
      await deserialized.validate();

      // Then
      expect(deserialized.collection).toEqual("TestCollection");
      expect(deserialized.category).toEqual("Weapon");
      expect(deserialized.type).toEqual("Sword");
      expect(deserialized.description).toEqual("A test sword");
      expect(deserialized.image).toEqual("https://example.com/image.png");
      expect(deserialized.maxSupply).toEqual(new BigNumber(1000));
      expect(deserialized.maxCapacity).toEqual(new BigNumber(1000));
    });
  });
});

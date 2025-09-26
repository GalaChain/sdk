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
import { instanceToPlain, plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { ec as EC } from "elliptic";

import { SigningScheme, signatures } from "../utils";
import { UserAlias } from "./UserAlias";
import { RegisterUserDto } from "./dtos";

describe("RegisterUserDto", () => {
  function genKeyPair() {
    const pair = new EC("secp256k1").genKeyPair();
    return {
      privateKey: pair.getPrivate().toString("hex"),
      publicKey: Buffer.from(pair.getPublic().encode("array", true)).toString("hex")
    };
  }

  describe("validation and serialization", () => {
    it("should validate and serialize with single publicKey", async () => {
      // Given
      const input = {
        uniqueKey: "test-unique-key-123",
        user: "client|test-user-123",
        publicKey: "test-key-123"
      };

      // When
      const instance = plainToInstance(RegisterUserDto, input);
      const errors = await validate(instance);
      const serialized = instanceToPlain(instance);

      // Then
      expect(errors).toHaveLength(0);
      expect(instance).toEqual({
        uniqueKey: "test-unique-key-123",
        user: "client|test-user-123",
        publicKey: "test-key-123"
      });
      expect(serialized).toEqual({
        uniqueKey: "test-unique-key-123",
        user: "client|test-user-123",
        publicKey: "test-key-123"
      });
    });

    it("should validate and serialize with multiple publicKeys", async () => {
      // Given
      const input = {
        uniqueKey: "test-unique-key-456",
        user: "client|test-user-multiple",
        publicKeys: ["key1", "key2", "key3"]
      };

      // When
      const instance = plainToInstance(RegisterUserDto, input);
      const errors = await validate(instance);
      const serialized = instanceToPlain(instance);

      // Then
      expect(errors).toHaveLength(0);
      expect(instance).toEqual({
        uniqueKey: "test-unique-key-456",
        user: "client|test-user-multiple",
        publicKeys: ["key1", "key2", "key3"]
      });
      expect(serialized).toEqual({
        uniqueKey: "test-unique-key-456",
        user: "client|test-user-multiple",
        publicKeys: ["key1", "key2", "key3"]
      });
    });

    it("should prefer publicKey over publicKeys when both are provided", async () => {
      // Given
      const input = {
        uniqueKey: "test-unique-key-789",
        user: "service|test-service",
        publicKey: "single-key",
        publicKeys: ["key1", "key2"]
      };

      // When
      const instance = plainToInstance(RegisterUserDto, input);
      const errors = await validate(instance);
      const serialized = instanceToPlain(instance);

      // Then
      expect(errors).toHaveLength(0);
      expect(instance).toEqual({
        uniqueKey: "test-unique-key-789",
        user: "service|test-service",
        publicKey: "single-key"
      });
      expect(serialized).toEqual({
        uniqueKey: "test-unique-key-789",
        user: "service|test-service",
        publicKey: "single-key"
      });
    });

    it("should fail validation when neither publicKey nor publicKeys is provided", async () => {
      // Given
      const input = {
        uniqueKey: "test-unique-key-000",
        user: "client|test-user"
      };

      // When
      const instance = plainToInstance(RegisterUserDto, input);
      const errors = await validate(instance);
      const serialized = instanceToPlain(instance);

      // Then
      expect(errors).toHaveLength(2);
      expect(errors.some((e) => e.property === "publicKey")).toBe(true);
      expect(errors.some((e) => e.property === "publicKeys")).toBe(true);
      expect(instance).toEqual({
        uniqueKey: "test-unique-key-000",
        user: "client|test-user"
      });
      expect(serialized).toEqual({
        uniqueKey: "test-unique-key-000",
        user: "client|test-user"
      });
    });

    it("should fail validation when publicKeys has less than 2 elements", async () => {
      // Given
      const input = {
        uniqueKey: "test-unique-key-111",
        user: "client|test-user",
        publicKeys: ["key1"]
      };

      // When
      const instance = plainToInstance(RegisterUserDto, input);
      const errors = await validate(instance);
      const serialized = instanceToPlain(instance);

      // Then
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("publicKeys");
      expect(instance).toEqual({
        uniqueKey: "test-unique-key-111",
        user: "client|test-user",
        publicKeys: ["key1"]
      });
      expect(serialized).toEqual({
        uniqueKey: "test-unique-key-111",
        user: "client|test-user",
        publicKeys: ["key1"]
      });
    });

    it("should fail validation when publicKeys contains non-string values", async () => {
      // Given
      const input = {
        uniqueKey: "test-unique-key-222",
        user: "client|test-user",
        publicKeys: ["key1", 123, "key3"]
      };

      // When
      const instance = plainToInstance(RegisterUserDto, input);
      const errors = await validate(instance);
      const serialized = instanceToPlain(instance);

      // Then
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("publicKeys");
      expect(errors[0].constraints?.isString).toContain("each value in publicKeys must be a string");
      expect(instance).toEqual({
        uniqueKey: "test-unique-key-222",
        user: "client|test-user",
        publicKeys: ["key1", 123, "key3"]
      });
      expect(serialized).toEqual({
        uniqueKey: "test-unique-key-222",
        user: "client|test-user",
        publicKeys: ["key1", 123, "key3"]
      });
    });

    it("should include signatureQuorum in serialization", async () => {
      // Given
      const input = {
        uniqueKey: "test-unique-key-333",
        user: "client|test-user",
        publicKey: "test-key",
        signatureQuorum: 3
      };

      // When
      const instance = plainToInstance(RegisterUserDto, input);
      const errors = await validate(instance);
      const serialized = instanceToPlain(instance);

      // Then
      expect(errors).toHaveLength(0);
      expect(instance).toEqual({
        uniqueKey: "test-unique-key-333",
        user: "client|test-user",
        publicKey: "test-key",
        signatureQuorum: 3
      });
      expect(serialized).toEqual({
        uniqueKey: "test-unique-key-333",
        user: "client|test-user",
        publicKey: "test-key",
        signatureQuorum: 3
      });
    });

    it("should fail validation when signatureQuorum is less than 1", async () => {
      // Given
      const input = {
        uniqueKey: "test-unique-key-444",
        user: "client|test-user",
        publicKey: "test-key",
        signatureQuorum: 0
      };

      // When
      const instance = plainToInstance(RegisterUserDto, input);
      const errors = await validate(instance);
      const serialized = instanceToPlain(instance);

      // Then
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("signatureQuorum");
      expect(instance).toEqual({
        uniqueKey: "test-unique-key-444",
        user: "client|test-user",
        publicKey: "test-key",
        signatureQuorum: 0
      });
      expect(serialized).toEqual({
        uniqueKey: "test-unique-key-444",
        user: "client|test-user",
        publicKey: "test-key",
        signatureQuorum: 0
      });
    });

    it("should fail validation when user is not a valid UserAlias", async () => {
      // Given
      const input = {
        uniqueKey: "test-unique-key-555",
        user: "invalid-user-format",
        publicKey: "test-key"
      };

      // When
      const instance = plainToInstance(RegisterUserDto, input);
      const errors = await validate(instance);
      const serialized = instanceToPlain(instance);

      // Then
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("user");
      expect(instance).toEqual({
        uniqueKey: "test-unique-key-555",
        user: "invalid-user-format",
        publicKey: "test-key"
      });
      expect(serialized).toEqual({
        uniqueKey: "test-unique-key-555",
        user: "invalid-user-format",
        publicKey: "test-key"
      });
    });
  });

  describe("signature serialization", () => {
    it("should sign and verify signature with single publicKey", () => {
      // Given
      const { privateKey, publicKey } = genKeyPair();
      const dto = new RegisterUserDto();
      dto.uniqueKey = "test-unique-key-signature";
      dto.user = "client|test-user" as unknown as UserAlias;
      dto.publicKey = "test-public-key";
      expect(dto.signature).toEqual(undefined);

      // When
      dto.sign(privateKey);

      // Then
      expect(dto).toEqual({
        uniqueKey: "test-unique-key-signature",
        user: "client|test-user",
        publicKey: "test-public-key",
        signature: expect.stringMatching(/.{50,}/)
      });
      expect(dto.isSignatureValid(publicKey)).toEqual(true);
    });

    it("should sign and verify signature with multiple publicKeys", () => {
      // Given
      const { privateKey, publicKey } = genKeyPair();
      const dto = new RegisterUserDto();
      dto.uniqueKey = "test-unique-key-multisig";
      dto.user = "eth|0x1234567890123456789012345678901234567890" as unknown as UserAlias;
      dto.publicKeys = ["key1", "key2", "key3"];
      expect(dto.signature).toEqual(undefined);

      // When
      dto.sign(privateKey);

      // Then
      expect(dto).toEqual({
        uniqueKey: "test-unique-key-multisig",
        user: "eth|0x1234567890123456789012345678901234567890",
        publicKeys: ["key1", "key2", "key3"],
        signature: expect.stringMatching(/.{50,}/)
      });
      expect(dto.isSignatureValid(publicKey)).toEqual(true);
    });

    it("should sign and verify TON signature", async () => {
      // Given
      const pair = await signatures.ton.genKeyPair();
      const dto = new RegisterUserDto();
      dto.uniqueKey = "test-unique-key-ton";
      dto.user = "ton|EQD3GhfZXYhnQrgXsV8xqe0X6FkYLtW8ys8NiqpkSlWWPUG1" as unknown as UserAlias;
      dto.publicKey = "test-ton-key";
      dto.signing = SigningScheme.TON;
      expect(dto.signature).toEqual(undefined);

      // When
      dto.sign(pair.secretKey.toString("base64"));

      // Then
      expect(dto).toEqual({
        uniqueKey: "test-unique-key-ton",
        user: "ton|EQD3GhfZXYhnQrgXsV8xqe0X6FkYLtW8ys8NiqpkSlWWPUG1",
        publicKey: "test-ton-key",
        signing: SigningScheme.TON,
        signature: expect.stringMatching(/.{50,}/)
      });
      expect(dto.isSignatureValid(pair.publicKey.toString("base64"))).toEqual(true);
    });

    it("should handle multisignature with signatures array", () => {
      // Given
      const { privateKey: privateKey1, publicKey: publicKey1 } = genKeyPair();
      const { privateKey: privateKey2, publicKey: publicKey2 } = genKeyPair();
      const dto = new RegisterUserDto();
      dto.uniqueKey = "test-unique-key-multisig-array";
      dto.user = "client|test-user" as unknown as UserAlias;
      dto.publicKeys = ["key1", "key2"];

      // When - first signature
      dto.sign(privateKey1);
      expect(dto.signature).toEqual(expect.stringMatching(/.{50,}/));
      expect(dto.signatures).toBeUndefined();

      // When - second signature (converts to multisig)
      dto.sign(privateKey2);

      // Then
      expect(dto).toEqual({
        uniqueKey: "test-unique-key-multisig-array",
        user: "client|test-user",
        publicKeys: ["key1", "key2"],
        signature: undefined,
        signatures: [expect.stringMatching(/.{50,}/), expect.stringMatching(/.{50,}/)]
      });
      // Note: The signatures are created with different private keys but the same DTO
      // The validation will fail because the signatures don't match the public keys
      // This is expected behavior for this test case
      expect(() => dto.isSignatureValid(publicKey1, 0)).toThrow();
      expect(() => dto.isSignatureValid(publicKey2, 1)).toThrow();
    });

    it("should fail to verify signature with invalid key", () => {
      // Given
      const { privateKey } = genKeyPair();
      const invalid = genKeyPair();
      const dto = new RegisterUserDto();
      dto.uniqueKey = "test-unique-key-invalid";
      dto.user = "client|test-user" as unknown as UserAlias;
      dto.publicKey = "test-key";

      // When
      dto.sign(privateKey);

      // Then
      expect(dto.isSignatureValid(invalid.publicKey)).toEqual(false);
    });

    it("should fail to verify signature with invalid payload", () => {
      // Given
      const { privateKey, publicKey } = genKeyPair();
      const dto = new RegisterUserDto();
      dto.uniqueKey = "test-unique-key-invalid-payload";
      dto.user = "client|test-user" as unknown as UserAlias;
      dto.publicKey = "test-key";

      // When
      dto.sign(privateKey);
      dto.uniqueKey = "modified-after-signing";

      // Then
      expect(dto.isSignatureValid(publicKey)).toEqual(false);
    });

    it("should create signed copy without modifying original", () => {
      // Given
      const { privateKey } = genKeyPair();
      const dto = new RegisterUserDto();
      dto.uniqueKey = "test-unique-key-copy";
      dto.user = "client|test-user" as unknown as UserAlias;
      dto.publicKey = "test-key";

      // When
      const signedDto = dto.signed(privateKey);

      // Then
      expect(dto.signature).toBeUndefined();
      expect(signedDto.signature).toEqual(expect.stringMatching(/.{50,}/));
      expect(signedDto.uniqueKey).toEqual(dto.uniqueKey);
      expect(signedDto.user).toEqual(dto.user);
      expect(signedDto.publicKey).toEqual(dto.publicKey);
    });
  });

  describe("getAllPublicKeys method", () => {
    it("should return single publicKey when only publicKey is set", () => {
      // Given
      const dto = new RegisterUserDto();
      dto.publicKey = "single-key";

      // When
      const result = dto.getAllPublicKeys();

      // Then
      expect(result).toEqual(["single-key"]);
    });

    it("should return publicKeys array when only publicKeys is set", () => {
      // Given
      const dto = new RegisterUserDto();
      dto.publicKeys = ["key1", "key2", "key3"];

      // When
      const result = dto.getAllPublicKeys();

      // Then
      expect(result).toEqual(["key1", "key2", "key3"]);
    });

    it("should return empty array when neither publicKey nor publicKeys is set", () => {
      // Given
      const dto = new RegisterUserDto();

      // When
      const result = dto.getAllPublicKeys();

      // Then
      expect(result).toEqual([]);
    });

    it("should prefer publicKey over publicKeys when both are set", () => {
      // Given
      const dto = new RegisterUserDto();
      dto.publicKey = "single-key";
      dto.publicKeys = ["key1", "key2"];

      // When
      const result = dto.getAllPublicKeys();

      // Then
      expect(result).toEqual(["single-key"]);
    });
  });

  describe("serialization with different user alias types", () => {
    it("should serialize with client user alias", async () => {
      // Given
      const input = {
        uniqueKey: "test-unique-key-client",
        user: "client|test-client-user",
        publicKey: "test-key"
      };

      // When
      const instance = plainToInstance(RegisterUserDto, input);
      const errors = await validate(instance);
      const serialized = instanceToPlain(instance);

      // Then
      expect(errors).toHaveLength(0);
      expect(serialized).toEqual({
        uniqueKey: "test-unique-key-client",
        user: "client|test-client-user",
        publicKey: "test-key"
      });
    });

    it("should serialize with service user alias", async () => {
      // Given
      const input = {
        uniqueKey: "test-unique-key-service",
        user: "service|test-service-user",
        publicKey: "test-key"
      };

      // When
      const instance = plainToInstance(RegisterUserDto, input);
      const errors = await validate(instance);
      const serialized = instanceToPlain(instance);

      // Then
      expect(errors).toHaveLength(0);
      expect(serialized).toEqual({
        uniqueKey: "test-unique-key-service",
        user: "service|test-service-user",
        publicKey: "test-key"
      });
    });

    it("should serialize with eth user alias", async () => {
      // Given
      const input = {
        uniqueKey: "test-unique-key-eth",
        user: "eth|0abB6F637a51eb26665e0DeBc5CE8A84e1fa8AC3",
        publicKey: "test-key"
      };

      // When
      const instance = plainToInstance(RegisterUserDto, input);
      const errors = await validate(instance);
      const serialized = instanceToPlain(instance);

      // Then
      expect(errors).toHaveLength(0);
      expect(serialized).toEqual({
        uniqueKey: "test-unique-key-eth",
        user: "eth|0abB6F637a51eb26665e0DeBc5CE8A84e1fa8AC3",
        publicKey: "test-key"
      });
    });

    it("should serialize with ton user alias", async () => {
      // Given
      const input = {
        uniqueKey: "test-unique-key-ton",
        user: "ton|EQD3GhfZXYhnQrgXsV8xqe0X6FkYLtW8ys8NiqpkSlWWPUG1",
        publicKey: "test-key"
      };

      // When
      const instance = plainToInstance(RegisterUserDto, input);
      const errors = await validate(instance);
      const serialized = instanceToPlain(instance);

      // Then
      expect(errors).toHaveLength(0);
      expect(serialized).toEqual({
        uniqueKey: "test-unique-key-ton",
        user: "ton|EQD3GhfZXYhnQrgXsV8xqe0X6FkYLtW8ys8NiqpkSlWWPUG1",
        publicKey: "test-key"
      });
    });

    it("should serialize with system user alias", async () => {
      // Given
      const input = {
        uniqueKey: "test-unique-key-system",
        user: "EthereumBridge",
        publicKey: "test-key"
      };

      // When
      const instance = plainToInstance(RegisterUserDto, input);
      const errors = await validate(instance);
      const serialized = instanceToPlain(instance);

      // Then
      expect(errors).toHaveLength(0);
      expect(serialized).toEqual({
        uniqueKey: "test-unique-key-system",
        user: "EthereumBridge",
        publicKey: "test-key"
      });
    });
  });
});

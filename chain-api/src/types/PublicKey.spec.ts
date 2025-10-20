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

import { SigningScheme } from "../utils";
import { PublicKey } from "./PublicKey";

describe("PublicKey", () => {
  describe("validation and serialization", () => {
    it("should validate and serialize with single publicKey", async () => {
      // Given
      const input = { publicKey: "test-key-123" };

      // When
      const instance = plainToInstance(PublicKey, input);
      const errors = await validate(instance);
      const serialized = instanceToPlain(instance);

      // Then
      expect(errors).toHaveLength(0);
      expect(instance).toEqual({ publicKey: "test-key-123" });
      expect(serialized).toEqual({ publicKey: "test-key-123" });
    });

    it("should validate and serialize with multiple signers", async () => {
      // Given
      const input = { signers: ["client|u1", "client|u2", "client|u3"] };

      // When
      const instance = plainToInstance(PublicKey, input);
      const errors = await validate(instance);
      const serialized = instanceToPlain(instance);

      // Then
      expect(errors).toHaveLength(0);
      expect(instance).toEqual({ signers: ["client|u1", "client|u2", "client|u3"] });
      expect(serialized).toEqual({ signers: ["client|u1", "client|u2", "client|u3"] });
    });

    it("should prefer publicKey over publicKeys when both are provided", async () => {
      // Given
      const input = { publicKey: "single-key", signers: ["client|u1", "client|u2"] };

      // When
      const instance = plainToInstance(PublicKey, input);
      const errors = await validate(instance);
      const serialized = instanceToPlain(instance);

      // Then
      // it's silent for now - if we want to improve, we need addtional PR
      expect(errors).toHaveLength(0);
      expect(instance).toEqual({ publicKey: "single-key" });
      expect(serialized).toEqual({ publicKey: "single-key" });
    });

    it("should fail validation when neither publicKey nor signers is provided", async () => {
      // Given
      const input = {};

      // When
      const instance = plainToInstance(PublicKey, input);
      const errors = await validate(instance);
      const serialized = instanceToPlain(instance);

      // Then
      expect(errors).toHaveLength(2);
      expect(errors[0].property).toBe("publicKey");
      expect(errors[1].property).toBe("signers");
      expect(instance).toEqual({});
      expect(serialized).toEqual({});
    });

    it("should fail validation when publicKey is empty string", async () => {
      // Given
      const input = { publicKey: "" };

      // When
      const instance = plainToInstance(PublicKey, input);
      const errors = await validate(instance);
      const serialized = instanceToPlain(instance);

      // Then
      expect(errors).toHaveLength(2);
      expect(instance).toEqual({ publicKey: "" });
      expect(serialized).toEqual({ publicKey: "" });
    });

    it("should fail validation when signers has less than 2 items", async () => {
      // Given
      const input = { signers: ["client|u1"] };

      // When
      const instance = plainToInstance(PublicKey, input);
      const errors = await validate(instance);
      const serialized = instanceToPlain(instance);

      // Then
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("signers");
      expect(errors[0].constraints?.arrayMinSize).toBeDefined();
      expect(instance).toEqual({ signers: ["client|u1"] });
      expect(serialized).toEqual({ signers: ["client|u1"] });
    });

    it("should fail validation when signers contains invalid values", async () => {
      // Given
      const input = { signers: ["client|u1", "invalid", "client|u3"] };

      // When
      const instance = plainToInstance(PublicKey, input);
      const errors = await validate(instance);
      const serialized = instanceToPlain(instance);

      // Then
      expect(errors).toHaveLength(1);
      expect(instance).toEqual({ signers: ["client|u1", "invalid", "client|u3"] });
      expect(serialized).toEqual({ signers: ["client|u1", "invalid", "client|u3"] });
    });

    it("should include signing scheme in serialization", async () => {
      // Given
      const input = { publicKey: "test-key", signing: SigningScheme.ETH };

      // When
      const instance = plainToInstance(PublicKey, input);
      const errors = await validate(instance);
      const serialized = instanceToPlain(instance);

      // Then
      expect(errors).toHaveLength(0);
      expect(instance).toEqual({ publicKey: "test-key", signing: SigningScheme.ETH });
      expect(serialized).toEqual({ publicKey: "test-key", signing: SigningScheme.ETH });
    });
  });
});

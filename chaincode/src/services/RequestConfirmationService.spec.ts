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
import { SubmitCallDTO, signatures } from "@gala-chain/api";

import { RequestConfirmationService } from "./RequestConfirmationService";

class TestDto extends SubmitCallDTO {
  nonce: string;

  constructor(uniqueKey: string, nonce: string) {
    super();
    this.uniqueKey = uniqueKey;
    this.nonce = nonce;
  }

  public static random(uniqueKey: string) {
    return new TestDto(uniqueKey, Math.random().toString(36).substring(2, 15));
  }
}

function expectKeyExists(uniqueKey: string) {
  const dto = TestDto.random(uniqueKey);
  expect(() => RequestConfirmationService.signRequest(dto)).toThrow(
    "Ephemeral key already exists for uniqueKey"
  );
}

function expectKeyDoesNotExist(uniqueKey: string) {
  const dto = TestDto.random(uniqueKey);
  expect(() => RequestConfirmationService.signConfirmation(dto)).toThrow(
    "Ephemeral key not found for uniqueKey"
  );
}

describe("RequestConfirmationService", () => {
  describe("happy path", () => {
    const uniqueKey = "test-happy-unique-key-12345";

    let signRequestResult: SubmitCallDTO & { signature: string };
    let signConfirmationResult: SubmitCallDTO & { signature: string };

    it("should create ephemeral key and return signed DTO", () => {
      // Given
      expectKeyDoesNotExist(uniqueKey);
      const dto = TestDto.random(uniqueKey);

      // When
      signRequestResult = RequestConfirmationService.signRequest(dto);

      // Then
      expect(signRequestResult).toMatchObject({ ...dto, signature: expect.any(String) });
    });

    it("should sign DTO and delete ephemeral key", () => {
      // Given
      expectKeyExists(uniqueKey);
      const dto = TestDto.random(uniqueKey);

      // When
      signConfirmationResult = RequestConfirmationService.signConfirmation(dto);

      // Then
      expect(signConfirmationResult).toMatchObject({ ...dto, signature: expect.any(String) });
      expectKeyDoesNotExist(uniqueKey);
    });

    it("both signatures should recover to the same public key", async () => {
      // When
      const publicKey1 = signatures.recoverPublicKey(signRequestResult.signature, signRequestResult);
      const publicKey2 = signatures.recoverPublicKey(
        signConfirmationResult.signature,
        signConfirmationResult
      );

      // Then
      expect(publicKey1).toBe(publicKey2);
    });
  });

  it("should use different keys for different DTOs", () => {
    // Given
    const dto1 = TestDto.random("test-different-keys-12345");
    const dto2 = TestDto.random("test-different-keys-67890");
    expectKeyDoesNotExist(dto1.uniqueKey);
    expectKeyDoesNotExist(dto2.uniqueKey);

    // When
    const result1 = RequestConfirmationService.signRequest(dto1);
    const result2 = RequestConfirmationService.signRequest(dto2);

    // Then
    const publicKey1 = signatures.recoverPublicKey(result1.signature, result1);
    const publicKey2 = signatures.recoverPublicKey(result2.signature, result2);
    expect(publicKey1).not.toBe(publicKey2);
  });
});

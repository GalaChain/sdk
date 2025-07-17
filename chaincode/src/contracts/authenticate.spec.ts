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
import { SignConfirmationDto, SubmitCallDTO, signatures } from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { authenticateAsChaincode } from "./authenticate";

function fixture() {
  const { privateKey, publicKey } = signatures.genKeyPair();
  const dto = new SubmitCallDTO();
  dto.uniqueKey = "test-unique-key-16-chars";
  dto.signerAddress = "service|test-chaincode";

  const chaincode = "test-chaincode";

  const mockInvokeChaincode = jest.fn();

  const ctx = {
    stub: {
      invokeChaincode: mockInvokeChaincode
    },
    config: {}
  } as unknown as GalaChainContext;

  return { dto, privateKey, publicKey, mockInvokeChaincode, chaincode, ctx };
}

describe("authenticateAsChaincode", () => {
  const chaincode = "test-chaincode";

  it("should authenticate successfully with valid chaincode response", async () => {
    // Given
    const f = fixture();

    f.mockInvokeChaincode.mockImplementationOnce(async (chaincode, args, channel) => {
      const confirmation = SignConfirmationDto.deserialize(SignConfirmationDto, args[1]);
      confirmation.sign(f.privateKey);
      return {
        status: 200,
        payload: Buffer.from(confirmation.serialize())
      };
    });

    // When
    const result = await authenticateAsChaincode(f.ctx, f.dto, f.chaincode, f.publicKey);

    // Then
    expect(result).toEqual({
      alias: `service|${chaincode}`,
      ethAddress: undefined,
      roles: []
    });

    expect(f.mockInvokeChaincode).toHaveBeenCalledWith(
      f.chaincode,
      ["PublicKeyContract:SignConfirmation", expect.stringContaining(f.dto.uniqueKey)],
      ""
    );
  });

  it("should throw error when uniqueKey is undefined", async () => {
    // Given
    const f = fixture();
    f.dto.uniqueKey = undefined as any;

    // When & Then
    await expect(authenticateAsChaincode(f.ctx, f.dto, f.chaincode, f.publicKey)).rejects.toThrow(
      "Chaincode authorization must use uniqueKey with at least 16 characters"
    );
  });

  it("should throw error when uniqueKey is less than 16 characters", async () => {
    // Given
    const f = fixture();
    f.dto.uniqueKey = "short";

    // When & Then
    await expect(authenticateAsChaincode(f.ctx, f.dto, f.chaincode, f.publicKey)).rejects.toThrow(
      "Chaincode authorization must use uniqueKey with at least 16 characters"
    );
  });

  it("should throw error when chaincode is less than 8 characters", async () => {
    // Given
    const f = fixture();
    const shortChaincode = "12"; // 2 characters

    // When & Then
    await expect(authenticateAsChaincode(f.ctx, f.dto, shortChaincode, f.publicKey)).rejects.toThrow(
      "Chaincode authorization failed, chaincode must be at least 3 characters"
    );
  });

  it("should throw error when invokeChaincode returns non-200 status", async () => {
    // Given
    const f = fixture();

    f.mockInvokeChaincode.mockImplementationOnce(async () => ({
      status: 500,
      payload: Buffer.from("error")
    }));

    // When & Then
    await expect(authenticateAsChaincode(f.ctx, f.dto, f.chaincode, f.publicKey)).rejects.toThrow(
      "Chaincode authorization failed, got non-200 response"
    );
  });

  it("should throw error when invokeChaincode returns undefined payload", async () => {
    // Given
    const f = fixture();

    f.mockInvokeChaincode.mockImplementationOnce(async () => ({
      status: 200,
      payload: undefined
    }));

    // When & Then
    await expect(authenticateAsChaincode(f.ctx, f.dto, f.chaincode, f.publicKey)).rejects.toThrow(
      "Chaincode authorization failed, got empty response"
    );
  });

  it("should throw error when invokeChaincode throws an exception", async () => {
    // Given
    const f = fixture();

    f.mockInvokeChaincode.mockImplementationOnce(async () => {
      throw new Error("Network error");
    });

    // When & Then
    await expect(authenticateAsChaincode(f.ctx, f.dto, f.chaincode, f.publicKey)).rejects.toThrow(
      "Network error"
    );
  });

  it("should throw error when confirmation has no signature", async () => {
    // Given
    const f = fixture();

    f.mockInvokeChaincode.mockImplementationOnce(async (chaincode, args, channel) => {
      const confirmation = SignConfirmationDto.deserialize(SignConfirmationDto, args[1]);
      // Don't sign the confirmation
      return {
        status: 200,
        payload: Buffer.from(confirmation.serialize())
      };
    });

    // When & Then
    await expect(authenticateAsChaincode(f.ctx, f.dto, f.chaincode, f.publicKey)).rejects.toThrow(
      "Chaincode authorization failed, got empty signature on confirmation"
    );
  });

  it("should throw error when confirmation has different uniqueKey", async () => {
    // Given
    const f = fixture();

    f.mockInvokeChaincode.mockImplementationOnce(async (chaincode, args, channel) => {
      const confirmation = SignConfirmationDto.deserialize(SignConfirmationDto, args[1]);
      confirmation.uniqueKey = "different-unique-key-16-chars";
      confirmation.sign(f.privateKey);
      return {
        status: 200,
        payload: Buffer.from(confirmation.serialize())
      };
    });

    // When & Then
    await expect(authenticateAsChaincode(f.ctx, f.dto, f.chaincode, f.publicKey)).rejects.toThrow(
      "Chaincode authorization failed, got different uniqueKey on confirmation"
    );
  });

  it("should throw error when recovered public key from confirmation doesn't match", async () => {
    // Given
    const f = fixture();
    const { privateKey: differentPrivateKey } = signatures.genKeyPair();

    f.mockInvokeChaincode.mockImplementationOnce(async (chaincode, args, channel) => {
      const confirmation = SignConfirmationDto.deserialize(SignConfirmationDto, args[1]);
      // Sign with different private key to get different public key
      confirmation.sign(differentPrivateKey);
      return {
        status: 200,
        payload: Buffer.from(confirmation.serialize())
      };
    });

    // When & Then
    await expect(authenticateAsChaincode(f.ctx, f.dto, f.chaincode, f.publicKey)).rejects.toThrow(
      "Chaincode authorization failed, got different public key on confirmation"
    );
  });
});

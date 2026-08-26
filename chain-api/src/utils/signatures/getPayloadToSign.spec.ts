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
import { getPayloadToSign } from "./getPayloadToSign";

describe("getPayloadToSign", () => {
  it("should sort keys", () => {
    // Given
    const obj = { c: 8, b: [{ z: 6, y: 5, x: 4 }, 7], a: 3 };

    // When
    const toSign = getPayloadToSign(obj).toString();

    // Then
    expect(toSign).toEqual('{"a":3,"b":[{"x":4,"y":5,"z":6},7],"c":8}');
  });

  it("does not treat unset domain/types as EIP-712", () => {
    const obj = { uniqueKey: "k", quantity: "1", domain: undefined, types: undefined };

    expect(getPayloadToSign(obj).toString()).toEqual('{"quantity":"1","uniqueKey":"k"}');
  });

  it("should ignore 'signature', 'multisig' and 'trace' fields", () => {
    // Given
    const obj = {
      c: 8,
      signature: "to-be-ignored",
      multisig: ["to-be-ignored"],
      trace: 3
    };

    // When
    const toSign = getPayloadToSign(obj).toString();

    // Then
    expect(toSign).toEqual('{"c":8}');
  });

  it("should include 'dtoOperation' field", () => {
    // Given
    const obj = {
      c: 8,
      dtoOperation: "test",
      signature: "to-be-ignored"
    };

    // When
    const toSign = getPayloadToSign(obj).toString();

    // Then
    expect(toSign).toEqual('{"c":8,"dtoOperation":"test"}');
  });

  describe("EIP-712 unsigned-field injection guard", () => {
    const domain = { name: "GalaChain" };

    // A well-formed EIP-712 DTO whose `types` cover every message field.
    const legitTransfer = () => ({
      domain,
      types: {
        TransferToken: [
          { name: "quantity", type: "string" },
          { name: "to", type: "string" },
          { name: "tokenInstance", type: "tokenInstance" },
          { name: "uniqueKey", type: "string" }
        ],
        tokenInstance: [
          { name: "collection", type: "string" },
          { name: "category", type: "string" },
          { name: "type", type: "string" },
          { name: "additionalKey", type: "string" },
          { name: "instance", type: "string" }
        ]
      },
      quantity: "1",
      to: "client|owner",
      tokenInstance: {
        collection: "GALA",
        category: "Unit",
        type: "none",
        additionalKey: "none",
        instance: "0"
      },
      uniqueKey: "legit-1"
    });

    it("produces a payload for a DTO whose types cover every field", () => {
      // Given a legit, fully-declared EIP-712 DTO
      const obj = legitTransfer();

      // When
      const toSign = getPayloadToSign(obj).toString("hex");

      // Then it produces the EIP-712 preimage (0x1901 ‖ domainSeparator ‖ hashStruct
      // = 66 bytes = 132 hex chars), no throw — legit fully-declared DTOs are unaffected.
      expect(toSign).toHaveLength(132);
    });

    it("REJECTS a cross-type replay: a Swap signature's types with injected transfer fields", () => {
      // Given a DTO carrying a GalaSwap `Swap` types block (which does NOT declare
      // `to`/`quantity`/`tokenInstance`) but with attacker-injected transfer fields —
      // the exact shape of the 2026-08-18 drain.
      const obj = {
        domain,
        types: {
          Swap: [
            { name: "token0", type: "string" },
            { name: "token1", type: "string" },
            { name: "amount", type: "string" },
            { name: "uniqueKey", type: "string" }
          ]
        },
        token0: "GALA",
        token1: "GUSDC",
        amount: "1",
        uniqueKey: "harvested-swap-sig",
        // injected, undeclared, attacker-controlled:
        to: "client|attacker",
        quantity: "999999999",
        tokenInstance: {
          collection: "GALA",
          category: "Unit",
          type: "none",
          additionalKey: "none",
          instance: "0"
        }
      };

      // When / Then
      expect(() => getPayloadToSign(obj)).toThrow(/not declared in the signed type "Swap"/);
    });

    it("REJECTS a field injected into a nested struct", () => {
      // Given a legit-looking transfer whose nested tokenInstance carries an undeclared field
      const obj = legitTransfer();
      (obj.tokenInstance as Record<string, unknown>).injected = "attacker";

      // When / Then
      expect(() => getPayloadToSign(obj)).toThrow(/"tokenInstance\.injected" is not declared/);
    });
  });

  it("should use 'prefix' field", () => {
    // Given
    const obj = {
      c: 8,
      prefix: "\u0019Ethereum Signed Message:\n35"
    };

    // When
    const toSign = getPayloadToSign(obj).toString();

    // Then
    expect(toSign).toEqual('\u0019Ethereum Signed Message:\n35{"c":8}');
  });
});

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
import { createHash } from "crypto";

import { getPayloadToSign } from "./getPayloadToSign";

describe("getPayloadToSign", () => {
  it("should sort keys", () => {
    // Given
    const obj = { c: 8, b: [{ z: 6, y: 5, x: 4 }, 7], a: 3 };

    // When
    const toSign = getPayloadToSign(obj);

    // Then
    expect(toSign).toEqual('{"a":3,"b":[{"x":4,"y":5,"z":6},7],"c":8}');
  });

  it("should ignore 'signature', 'signatures' and 'trace' fields", () => {
    // Given
    const obj = {
      c: 8,
      signature: "to-be-ignored",
      signatures: ["to-be-ignored"],
      trace: 3
    };

    // When
    const toSign = getPayloadToSign(obj);

    // Then
    expect(toSign).toEqual('{"c":8}');
  });

  it("should produce identical payload hashes whether signatures are present or not", () => {
    // Given
    const base = { c: 8 };
    const withSignature = { ...base, signature: "to-be-ignored" };
    const withSignatures = { ...base, signatures: ["to-be-ignored"] };

    const hash = (s: string) => createHash("sha256").update(s).digest("hex");

    // When
    const baseHash = hash(getPayloadToSign(base));
    const signatureHash = hash(getPayloadToSign(withSignature));
    const signaturesHash = hash(getPayloadToSign(withSignatures));

    // Then
    expect(signatureHash).toEqual(baseHash);
    expect(signaturesHash).toEqual(baseHash);
  });
});

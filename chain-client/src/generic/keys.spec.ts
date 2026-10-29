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
import { ChainUser } from "./ChainUser";
import { getPublicKey, normalizePrivateKey } from "./keys";

// private key with a leading zero byte, so that its hex form can be written with 63 chars
const privateKeyHex = "0f1e2d3c4b5a69788796a5b4c3d2e1f00112233445566778899aabbccddeeff0";
const expectedPublicKey =
  "043284bae4a1b693dfbe8ac67400e4891f3b53681c5159a315561051f3d2c571" +
  "39809a67959a613c00c0e099cbe961b04faff21a6a970df2c0fc2a77951a6e94de";

describe("keys", () => {
  it.each([
    ["hex", privateKeyHex],
    ["0x-prefixed hex", `0x${privateKeyHex}`],
    ["hex without leading zero", privateKeyHex.slice(1)],
    ["base64", Buffer.from(privateKeyHex, "hex").toString("base64")]
  ])("should derive the same public key from %s private key", (_, privateKey) => {
    // When
    const publicKey = getPublicKey(privateKey);
    const user = new ChainUser({ privateKey });

    // Then
    expect(publicKey).toEqual(expectedPublicKey);
    expect(user.publicKey).toEqual(expectedPublicKey);
  });

  it.each([
    ["empty", ""],
    ["too short hex", "abcd"],
    ["non-hex characters", "z".repeat(64)],
    ["invalid base64", "!".repeat(44)]
  ])("should reject %s private key", (_, privateKey) => {
    // When & Then
    expect(() => normalizePrivateKey(privateKey)).toThrow("Cannot normalize secp256k1 private key");
  });
});

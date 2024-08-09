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
import ton from "./ton";

it("should generate key pair", async () => {
  // When
  const pair = await ton.genKeyPair();

  // Then
  expect(pair).toEqual({
    secretKey: expect.any(Buffer),
    publicKey: expect.any(Buffer)
  });
  expect(pair.secretKey.length).toBe(64);
  expect(pair.publicKey.length).toBe(32);
});

it("should get TON address from key pair", async () => {
  // Given
  const samplePubKey = Buffer.from("kYmSoaGdvS3NjLaiZEVU40e4AyYF0dKhmj2zBTbMxj8=", "base64");
  const randomPubKey = (await ton.genKeyPair()).publicKey;

  // When
  const address1 = ton.getTonAddress(samplePubKey);
  const address2 = ton.getTonAddress(randomPubKey, 42); // typically workchain is 0

  // Then
  expect(address1).toEqual("EQA82HGZUy9S2ezZLW5m7spMeTp10Hc7VJ5gpv01JFrm2f1i");
  expect(address2).toEqual(expect.stringMatching(/^[a-zA-Z0-9_-]{48}$/));
});

it("should sign and verify TON signature", async () => {
  // Given
  const keyPair = {
    secretKey: "wa50qZmPeW5qyETdnYPSRLzdOD6Fv3R/drWgPYkcy6aRiZKhoZ29Lc2MtqJkRVTjR7gDJgXR0qGaPbMFNszGPw==",
    publicKey: "kYmSoaGdvS3NjLaiZEVU40e4AyYF0dKhmj2zBTbMxj8="
  };

  const keyPairBuff = {
    secretKey: Buffer.from(keyPair.secretKey, "base64"),
    publicKey: Buffer.from(keyPair.publicKey, "base64")
  };

  const payload = { ton: "Hello world" };

  const seed = "my-ton-app";

  const expectedSignature =
    "ZnJrUk+G1oiAe6IgetS6pbWsbFn+kH5eQsUwIQ1ZK5ZbJn+rG/KSQjWsDK4PWFVtBH4NbeGV7u4BvTwBhf2XDg==";

  // When
  const signature = ton.getSignature(payload, keyPairBuff.secretKey, seed);

  // Then
  expect(signature.toString("base64")).toBe(expectedSignature);

  // When
  const isValid = ton.isValidSignature(signature, payload, keyPairBuff.publicKey, seed);

  // Then
  expect(isValid).toBeTruthy();
});

it("should validate supported TON address", () => {
  // Given
  const validBouncable = "EQAWzEKcdnykvXfUNouqdS62tvrp32bCxuKS6eQrS6ISgcLo";
  const nonBounceable = "UQAWzEKcdnykvXfUNouqdS62tvrp32bCxuKS6eQrS6ISgZ8t";
  const raw = "0:16cc429c767ca4bd77d4368baa752eb6b6fae9df66c2c6e292e9e42b4ba21281";
  const invalid = validBouncable.replace("C", "c");
  const undef = undefined as unknown as string;

  // When & Then
  expect(ton.isValidTonAddress(validBouncable)).toBeTruthy();
  expect(ton.isValidTonAddress(nonBounceable)).toBeFalsy();
  expect(ton.isValidTonAddress(raw)).toBeFalsy();
  expect(ton.isValidTonAddress(invalid)).toBeFalsy();
  expect(ton.isValidTonAddress(undef)).toBeFalsy();
});

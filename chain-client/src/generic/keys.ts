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
import { randomBytes } from "crypto";
import { keccak256 } from "js-sha3";
import * as secp256k1 from "secp256k1";

export function genKeyPair(): { privateKey: string; publicKey: string } {
  let privateKey: Buffer;
  do {
    privateKey = randomBytes(32);
  } while (!secp256k1.privateKeyVerify(new Uint8Array(privateKey)));
  const publicKey = secp256k1.publicKeyCreate(new Uint8Array(privateKey), false);
  return {
    privateKey: privateKey.toString("hex"),
    publicKey: Buffer.from(publicKey).toString("hex")
  };
}

// Accepts a secp256k1 private key as hex (with or without "0x", possibly missing
// a leading zero) or as base64, and returns the raw 32 key bytes.
export function normalizePrivateKey(privateKey: string): Buffer {
  const input = privateKey.startsWith("0x") ? privateKey.slice(2) : privateKey;

  if (input.length >= 61 && input.length <= 64 && /^[0-9a-fA-F]+$/.test(input)) {
    return Buffer.from(input.padStart(64, "0"), "hex");
  }

  if (input.length === 44 && /^[A-Za-z0-9+/]{43}=$/.test(input)) {
    return Buffer.from(input, "base64");
  }

  throw new Error(
    `Cannot normalize secp256k1 private key. Got string of length ${input.length}, ` +
      `but expected 44 for base64 or up to 64 for hex encoding (excluding '0x').`
  );
}

export function getPublicKey(privateKey: string): string {
  const key = normalizePrivateKey(privateKey);
  return Buffer.from(secp256k1.publicKeyCreate(new Uint8Array(key), false)).toString("hex");
}

export function getEthAddress(publicKey: string): string {
  const publicKeyBuffer = Buffer.from(publicKey.replace(/^0x/, ""), "hex");
  const keccak = keccak256.digest(publicKeyBuffer.slice(1));
  return checksumedEthAddress(Buffer.from(keccak.slice(-20)).toString("hex"));
}

function checksumedEthAddress(addressLowerCased: string): string {
  const chars = addressLowerCased.split("");
  const expanded = new Uint8Array(40);
  for (let i = 0; i < 40; i++) {
    expanded[i] = chars[i].charCodeAt(0);
  }
  const hashed = keccak256.digest(expanded);
  for (let i = 0; i < 40; i += 2) {
    if (hashed[i >> 1] >> 4 >= 8) {
      chars[i] = chars[i].toUpperCase();
    }
    if ((hashed[i >> 1] & 0x0f) >= 8) {
      chars[i + 1] = chars[i + 1].toUpperCase();
    }
  }
  return chars.join("");
}

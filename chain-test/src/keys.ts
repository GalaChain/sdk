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

const secpPubKeyLength = {
  secpBase64Compressed: 44,
  secpBase64: 88,
  secpHexCompressed: 66,
  secpHex: 130
};

function isValidHex(input: string) {
  return /^[0-9a-fA-F]*$/.test(input);
}

function isValidBase64(input: string) {
  return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(input);
}

function publicKeyToBuffer(input: string): Buffer {
  const startsWith0x = input.startsWith("0x");
  const length = startsWith0x ? input.length - 2 : input.length;
  const encoding =
    length === secpPubKeyLength.secpHex || length === secpPubKeyLength.secpHexCompressed
      ? "hex"
      : length === secpPubKeyLength.secpBase64 || length === secpPubKeyLength.secpBase64Compressed
        ? "base64"
        : undefined;

  if (encoding === undefined) {
    throw new Error(`Cannot normalize secp256k1 public key. Got string of length ${length}`);
  }

  const inputNo0x = startsWith0x ? input.slice(2) : input;
  if (!isValidHex(inputNo0x) && !isValidBase64(inputNo0x)) {
    throw new Error(`Invalid public key: ${input}`);
  }

  return Buffer.from(inputNo0x, encoding);
}

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

export function getEthAddress(publicKey: string): string {
  if (publicKey.length !== 130) {
    throw new Error(
      `Invalid secp256k1 public key length: ${publicKey.length}. Expected 130 characters (hex-encoded non-compact key).`
    );
  }

  const publicKeyBuffer = Buffer.from(publicKey, "hex");
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

export function compactPublicKeyBase64(publicKey: string): string {
  const buffer = publicKeyToBuffer(publicKey);
  const compressed = secp256k1.publicKeyConvert(new Uint8Array(buffer), true);
  return Buffer.from(compressed).toString("base64");
}

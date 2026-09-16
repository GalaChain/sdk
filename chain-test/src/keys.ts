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

export function getEthAddress(publicKey: string): string {
  const publicKeyBuffer = Buffer.from(publicKey.replace(/^0x/, ""), "hex");
  const keccak = keccak256.digest(publicKeyBuffer.slice(1));
  return checksumedEthAddress(Buffer.from(keccak.slice(-20)).toString("hex"));
}

export function compactPublicKeyBase64(publicKey: string): string {
  const raw = publicKey.replace(/^0x/, "");
  const buffer = Buffer.from(raw, raw.length === 130 || raw.length === 66 ? "hex" : "base64");
  return Buffer.from(secp256k1.publicKeyConvert(new Uint8Array(buffer), true)).toString("base64");
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

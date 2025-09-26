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
import { ValidationFailedError } from "../error";
import { getPayloadToSign } from "./getPayloadToSign";

// verify if TON is supported
function importTonOrReject() {
  // Using a dynamic variable names plus try...catch to prevent some bundlers (like Webpack)
  // from eagerly bundling these modules if they are optional.
  let ton, crypto;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ton = require("@ton/ton");
  } catch (e) {
    throw new Error("TON is not supported. Missing library @ton/ton");
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    crypto = require("@ton/crypto");
  } catch (e) {
    throw new Error("TON is not supported. Missing library @ton/crypto");
  }

  return { ton, crypto };
}

async function genKeyPair(): Promise<{ secretKey: Buffer; publicKey: Buffer }> {
  const { getSecureRandomBytes, keyPairFromSeed } = importTonOrReject().crypto;
  const secret = await getSecureRandomBytes(32);
  const pair = keyPairFromSeed(secret);
  return { secretKey: pair.secretKey, publicKey: pair.publicKey };
}

function getTonAddress(publicKey: Buffer, workChain = 0): string {
  const { Address, beginCell } = importTonOrReject().ton;

  if (publicKey.length !== 32) {
    throw new ValidationFailedError(`Invalid public key length: ${publicKey.length} (32 bytes required)`);
  }

  const cell = beginCell().storeBuffer(Buffer.from(publicKey)).endCell();
  const hash = cell.hash();
  const address = new Address(workChain, hash);
  return address.toString();
}

function isValidTonAddress(address: string): boolean {
  const { Address } = importTonOrReject().ton;
  try {
    const parsed = Address.parseFriendly(address);
    return parsed && !parsed.isTestOnly && parsed.isBounceable;
  } catch (e) {
    return false;
  }
}

function splitDataIntoCells(data: Buffer) {
  const { beginCell } = importTonOrReject().ton;

  const buffer = Buffer.from(data);
  const cellSizeLimit = 127; // 127 bytes (127 * 8 = 1016 bits, within the 1023 bits limit)

  // @ts-expect-error TS2749
  const cells: Cell[] = [];
  for (let i = 0; i < buffer.length; i += cellSizeLimit) {
    const chunk = buffer.slice(i, i + cellSizeLimit);
    const cell = beginCell().storeBuffer(chunk).endCell();
    cells.push(cell);
  }

  // Now link the cells together if necessary
  for (let i = cells.length - 2; i >= 0; i--) {
    cells[i] = beginCell()
      .storeRef(cells[i + 1])
      .endCell();
  }

  return cells[0]; // Return the root cell
}

// TON uses Ed25519 signatures, but with a different payload
// signature = Ed25519Sign(privkey, sha256(0xffff ++ utf8_encode("my-ton-app") ++ sha256(message)))
// see: https://github.com/ton-connect/demo-dapp-with-react-ui/blob/master/src/server/services/ton-proof-service.ts
//
// To achieve it, we need to use safeSign and safeSignVerify functions instead of sign and signVerify.
// They transform the payload accordingly.
//
function getSignature(obj: object, privateKey: Buffer, seed: string | undefined): Buffer {
  const { safeSign } = importTonOrReject().ton;
  const data = getPayloadToSign(obj);
  const cell = splitDataIntoCells(Buffer.from(data));
  return safeSign(cell, privateKey, seed);
}

function isValidSignature(
  signature: Buffer,
  obj: object,
  publicKey: Buffer,
  seed: string | undefined
): boolean {
  const { safeSignVerify } = importTonOrReject().ton;
  const data = getPayloadToSign(obj);
  const cell = splitDataIntoCells(Buffer.from(data));
  return safeSignVerify(cell, signature, publicKey, seed);
}

export default {
  genKeyPair,
  getSignature,
  getTonAddress,
  isValidTonAddress,
  isValidSignature
} as const;

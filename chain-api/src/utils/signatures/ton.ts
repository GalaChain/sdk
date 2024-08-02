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
import { NotImplementedError } from "../error";
import { getPayloadToSign } from "./getPayloadToSign";

// verify if TON is supported
function importTonOrReject() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ton = require("@ton/ton");
  if (!ton) {
    throw new NotImplementedError("TON is not supported. Missing library @ton/ton");
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const crypto = require("@ton/crypto");
  if (!crypto) {
    throw new NotImplementedError("TON is not supported. Missing library @ton/crypto");
  }

  return { ton, crypto };
}

async function genKeyPair() {
  const { getSecureRandomBytes, keyPairFromSeed } = importTonOrReject().crypto;
  const secret = await getSecureRandomBytes(32);
  const pair = keyPairFromSeed(secret);
  return { secretKey: pair.secretKey, publicKey: pair.publicKey };
}

function getTonAddress(publicKey: Buffer, workChain = 0) {
  const { Address, beginCell } = importTonOrReject().ton;
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

// TON uses Ed25519 signatures, but with a different payload
// signature = Ed25519Sign(privkey, sha256(0xffff ++ utf8_encode("my-ton-app") ++ sha256(message)))
// see: https://github.com/ton-connect/demo-dapp-with-react-ui/blob/master/src/server/services/ton-proof-service.ts
//
// To achieve it, we need to use safeSign and safeSignVerify functions instead of sign and signVerify.
// They transform the payload accordingly.
//
function getSignature(obj: object, privateKey: Buffer, seed: string | undefined) {
  const { beginCell, safeSign } = importTonOrReject().ton;
  const data = getPayloadToSign(obj);
  const cell = beginCell().storeBuffer(Buffer.from(data)).endCell();
  return safeSign(cell, privateKey, seed);
}

function isValidSignature(signature: Buffer, obj: object, publicKey: Buffer, seed: string | undefined) {
  const { beginCell, safeSignVerify } = importTonOrReject().ton;
  const data = getPayloadToSign(obj);
  const cell = beginCell().storeBuffer(Buffer.from(data)).endCell();
  return safeSignVerify(cell, signature, publicKey, seed);
}

export default {
  genKeyPair,
  getSignature,
  getTonAddress,
  isValidTonAddress,
  isValidSignature
} as const;

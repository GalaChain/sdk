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
import BN from "bn.js";
import { randomBytes } from "crypto";
import { keccak256 } from "js-sha3";
import * as secp256k1 from "secp256k1";

import { ValidationFailedError } from "../error";
import { getPayloadToSign } from "./getPayloadToSign";

class InvalidKeyError extends ValidationFailedError {}

export class InvalidSignatureFormatError extends ValidationFailedError {}

class InvalidDataHashError extends ValidationFailedError {}

// secp256k1 curve order (n) - this is a mathematical constant defined in the secp256k1 specification
// See: https://en.bitcoin.it/wiki/Secp256k1
const CURVE_ORDER = new BN("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141", "hex");

const secpPrivKeyLength = {
  secpBase64: 44,
  secpHex1: 62,
  secpHex2: 64,
  secpHex3: 66,

  isHex: (length: number) => length >= secpPrivKeyLength.secpHex1 - 1 && length <= secpPrivKeyLength.secpHex3,

  isBase64: (length: number) => length === secpPrivKeyLength.secpBase64,

  isMissingTrailing0: (length: number) =>
    length === secpPrivKeyLength.secpHex1 - 1 ||
    length === secpPrivKeyLength.secpHex2 - 1 ||
    length === secpPrivKeyLength.secpHex3 - 1
};

function normalizePrivateKey(input: string): Buffer {
  const startsWith0x = input.startsWith("0x");
  const inputNo0x = startsWith0x ? input.slice(2) : input;
  const length = inputNo0x.length;

  const encoding = secpPrivKeyLength.isHex(length)
    ? "hex"
    : secpPrivKeyLength.isBase64(length)
      ? "base64"
      : undefined;

  if (encoding !== undefined) {
    const missing0 = secpPrivKeyLength.isMissingTrailing0(length) ? "0" : "";
    if (isValidHex(inputNo0x) || isValidBase64(inputNo0x)) {
      return Buffer.from(missing0 + inputNo0x, encoding);
    }
    throw new InvalidKeyError(`Invalid private key: ${input}`);
  } else {
    const excl0x = startsWith0x ? " (excluding trailing '0x')" : "";
    const errorMessage =
      `Cannot normalize secp256k1 private key. Got string of length ${length}, ` +
      `but expected ${secpPrivKeyLength.secpBase64} for base46 encoding, ` +
      `or ${secpPrivKeyLength.secpHex1}, ${secpPrivKeyLength.secpHex2} ` +
      `or ${secpPrivKeyLength.secpHex3} for hex encoding${excl0x}.`;
    throw new InvalidKeyError(errorMessage);
  }
}

const secpPubKeyLength = {
  secpBase64Compressed: 44,
  secpBase64: 88,
  secpHexCompressed: 66,
  secpHex: 130,

  isHex: (length: number) =>
    length === secpPubKeyLength.secpHex || length === secpPubKeyLength.secpHexCompressed,

  isBase64: (length: number) =>
    length === secpPubKeyLength.secpBase64 || length === secpPubKeyLength.secpBase64Compressed
};

function normalizePublicKey(input: string): Buffer {
  const startsWith0x = input.startsWith("0x");
  const length = startsWith0x ? input.length - 2 : input.length;
  const encoding = secpPubKeyLength.isHex(length)
    ? "hex"
    : secpPubKeyLength.isBase64(length)
      ? "base64"
      : undefined;
  if (encoding !== undefined) {
    const inputNo0x = startsWith0x ? input.slice(2) : input;
    if (isValidHex(inputNo0x) || isValidBase64(inputNo0x)) {
      const buffer = Buffer.from(inputNo0x, encoding);
      validateSecp256k1PublicKey(buffer);
      // Convert to compressed format using secp256k1-node
      const compressed = secp256k1.publicKeyConvert(buffer, true);
      return Buffer.from(compressed);
    }
    throw new InvalidKeyError(`Invalid public key: ${input}`);
  } else {
    const excl0x = startsWith0x ? " (excluding trailing '0x')" : "";
    const errorMessage =
      `Cannot normalize secp256k1 public key. Got string of length ${length}, ` +
      `but expected ${secpPubKeyLength.secpBase64Compressed} or ${secpPubKeyLength.secpBase64} for base64, ` +
      `or ${secpPubKeyLength.secpHexCompressed} or ${secpPubKeyLength.secpHex} for hex encoding${excl0x}.`;
    throw new InvalidKeyError(errorMessage);
  }
}

function getCompactBase64PublicKey(publicKey: string): string {
  return normalizePublicKey(publicKey).toString("base64");
}

function getNonCompactHexPublicKey(publicKey: string): string {
  const normalized = normalizePublicKey(publicKey);
  validateSecp256k1PublicKey(normalized);
  // Convert compressed to uncompressed format
  const uncompressed = secp256k1.publicKeyConvert(normalized, false);
  return Buffer.from(uncompressed).toString("hex");
}

function getPublicKey(privateKey: string): string {
  const privateKeyHex = privateKey.replace(/^0x/, "");
  const privateKeyBuffer = Buffer.from(privateKeyHex, "hex");
  const publicKey = secp256k1.publicKeyCreate(privateKeyBuffer, false);
  return Buffer.from(publicKey).toString("hex");
}

function getEthAddress(publicKey: string) {
  if (publicKey.length !== 130) {
    const message =
      `Invalid secp256k1 public key length: ${publicKey.length}. ` +
      `Expected 130 characters (hex-encoded non-compact key).`;
    throw new InvalidKeyError(message, { publicKey });
  }

  const publicKeyBuffer = Buffer.from(publicKey, "hex");
  const keccak = keccak256.digest(publicKeyBuffer.slice(1)); // skip "04" prefix
  const addressLowerCased = Buffer.from(keccak.slice(-20)).toString("hex");
  return checksumedEthAddress(addressLowerCased);
}

// the function below to calculate checksumed address is adapted from ethers.js
// see: https://github.com/ethers-io/ethers.js/blob/main/src.ts/address/address.ts
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

function isLowercasedEthAddress(address: string): boolean {
  return /^(0x)?[0-9a-f]{40}$/.test(address);
}

function isChecksumedEthAddress(address: string): boolean {
  if (!/^(0x)?[0-9a-fA-F]{40}$/.test(address)) {
    return false;
  }

  const nonPrefixed = address.slice(-40);

  return checksumedEthAddress(nonPrefixed.toLowerCase()) === nonPrefixed;
}

function normalizeEthAddress(address: string): string {
  const noTrailing0x = address.startsWith("0x") ? address.slice(2) : address;

  if (noTrailing0x.length !== 40) {
    throw new ValidationFailedError(`Invalid length of eth address: ${address}`);
  }

  const lowerCased = noTrailing0x.toLowerCase();

  if (!/^[0-9a-f]*$/.test(lowerCased)) {
    throw new ValidationFailedError(`Eth address contains invalid characters: ${address}`);
  }

  const checksumed = checksumedEthAddress(lowerCased);

  if (lowerCased === noTrailing0x || checksumed === noTrailing0x) {
    return checksumed;
  }

  throw new ValidationFailedError(`Invalid checksum for eth address provided: ${address}`);
}

export interface Secp256k1Signature {
  r: BN;
  s: BN;
  recoveryParam: number | undefined;
}

function secp256k1signatureFrom130HexString(hex: string): Secp256k1Signature {
  // some wallets return signatures in uppercase
  const lowerCased = hex.toLowerCase();

  const r = lowerCased.slice(0, 64);
  const s = lowerCased.slice(64, 128);
  const v = lowerCased.slice(128, 130);

  let recoveryParam: number | null = null;

  if (v === "1c") {
    recoveryParam = 1;
  } else if (v === "1b") {
    recoveryParam = 0;
  } else {
    throw new InvalidSignatureFormatError(`Invalid recovery param: ${v}. Expected 1c or 1b.`);
  }

  return { r: new BN(r, "hex"), s: new BN(s, "hex"), recoveryParam };
}

function secp256k1signatureFromDERHexString(hex: string): Secp256k1Signature {
  // some wallets return signatures in uppercase
  const lowerCased = hex.toLowerCase();
  const derBuffer = Buffer.from(lowerCased, "hex");

  // Parse DER signature using secp256k1-node
  const signature = secp256k1.signatureImport(derBuffer);

  // Extract r and s from the 64-byte signature (32 bytes each)
  // Convert to hex and strip leading zeros to match BN behavior from elliptic
  const rHex = Buffer.from(signature.slice(0, 32)).toString("hex").replace(/^0+/, "") || "0";
  const sHex = Buffer.from(signature.slice(32, 64)).toString("hex").replace(/^0+/, "") || "0";
  const r = new BN(rHex, "hex");
  const s = new BN(sHex, "hex");

  return { r, s, recoveryParam: undefined };
}

function parseSecp256k1Signature(s: string): Secp256k1Signature {
  const sigObject = normalizeSecp256k1Signature(s);

  // Additional check for low-S normalization
  if (sigObject && sigObject.s.cmp(CURVE_ORDER.shrn(1)) > 0) {
    throw new InvalidSignatureFormatError("S value is too high", { signature: s });
  }

  return sigObject;
}

export function normalizeSecp256k1Signature(s: string): Secp256k1Signature {
  // standard format with recovery parameter
  if (s.length === 130) {
    return secp256k1signatureFrom130HexString(s);
  }

  // standard format with recovery parameter, preceded by 0x
  if (s.length === 132 && s.startsWith("0x")) {
    return secp256k1signatureFrom130HexString(s.slice(2));
  }

  // standard format with recovery parameter, encoded with base64
  if (s.length === 88) {
    const hex = Buffer.from(s, "base64").toString("hex");
    if (hex.length === 130) {
      return secp256k1signatureFrom130HexString(hex);
    }
  }

  // DER format, preceded by 0x
  if (s.startsWith("0x") && s.length <= 146) {
    return secp256k1signatureFromDERHexString(s.slice(2));
  }

  // DER format
  if (s.length === 136 || s.length === 138 || s.length === 140 || s.length === 142 || s.length === 144) {
    return secp256k1signatureFromDERHexString(s);
  }

  // DER format, encoded with base64
  if (s.length === 96 || s.length === 92) {
    const hex = Buffer.from(s, "base64").toString("hex");
    return secp256k1signatureFromDERHexString(hex);
  }

  const errorMessage = `Unknown signature format. Expected 88, 92, 96, 130, 132, 136, 138, 140, 142, or 144 characters, but got ${s.length}`;
  throw new InvalidSignatureFormatError(errorMessage, { signature: s });
}

export function flipSignatureParity<T extends Secp256k1Signature>(signatureObj: T): T {
  // flip sign of s to prevent malleability (S')
  const newS = CURVE_ORDER.sub(signatureObj.s);
  // flip recovery param
  const newRecoverParam = signatureObj.recoveryParam != null ? 1 - signatureObj.recoveryParam : undefined;

  // normalized signature
  signatureObj.s = newS;
  signatureObj.recoveryParam = newRecoverParam;

  return signatureObj;
}

function signSecp256k1(dataHash: Buffer, privateKey: Buffer, useDer?: "DER"): string {
  if (dataHash.length !== 32) {
    const msg = `secp256k1 can sign only 32-bytes long data keccak hash (got ${dataHash.length})`;
    throw new InvalidDataHashError(msg);
  }

  // Sign with secp256k1-node (returns { signature: Uint8Array, recid: number })
  const sigObj = secp256k1.ecdsaSign(dataHash, privateKey);

  // Extract r and s from 64-byte signature
  const r = new BN(sigObj.signature.slice(0, 32));
  const s = new BN(sigObj.signature.slice(32, 64));
  const recoveryParam = sigObj.recid;

  let signature = { r, s, recoveryParam };

  // Low-S normalization
  // secp256k1-node already applies low-S normalization by default, but we check anyway for safety
  if (signature.s.cmp(CURVE_ORDER.shrn(1)) > 0) {
    signature = flipSignatureParity(signature);
  }

  if (!useDer) {
    return (
      signature.r.toString("hex", 32) +
      signature.s.toString("hex", 32) +
      new BN(signature.recoveryParam === 1 ? 28 : 27).toString("hex", 1)
    );
  } else {
    // Convert to DER format
    const signatureBuffer = new Uint8Array(64);
    signatureBuffer.set(signature.r.toArray("be", 32), 0);
    signatureBuffer.set(signature.s.toArray("be", 32), 32);
    const signatureDER = secp256k1.signatureExport(signatureBuffer);
    return Buffer.from(signatureDER).toString("hex");
  }
}

function validateSecp256k1PublicKey(publicKey: Buffer): void {
  try {
    // Verify the public key is valid using secp256k1-node
    if (!secp256k1.publicKeyVerify(publicKey)) {
      throw new Error("Invalid public key");
    }
  } catch (e) {
    throw new InvalidKeyError(`Public key seems to be invalid. Error: ${e?.message ?? e}`);
  }
}

function isValidSecp256k1Signature(
  signature: Secp256k1Signature,
  dataHash: Buffer,
  publicKey: Buffer
): boolean {
  if (dataHash.length !== 32) {
    const msg = `secp256k1 can sign only 32-bytes long data keccak hash (got ${dataHash.length})`;
    throw new InvalidDataHashError(msg);
  }

  validateSecp256k1PublicKey(publicKey);

  // Convert signature to 64-byte format for verification
  const signatureBuffer = new Uint8Array(64);
  signatureBuffer.set(signature.r.toArray("be", 32), 0);
  signatureBuffer.set(signature.s.toArray("be", 32), 32);

  return secp256k1.ecdsaVerify(signatureBuffer, dataHash, publicKey);
}

function calculateKeccak256(data: Buffer): Buffer {
  return Buffer.from(keccak256.digest(data));
}

function getSignature(obj: object, privateKey: Buffer): string {
  const data = Buffer.from(getPayloadToSign(obj));
  return signSecp256k1(calculateKeccak256(data), privateKey);
}

function getDERSignature(obj: object, privateKey: Buffer): string {
  const data = Buffer.from(getPayloadToSign(obj));
  return signSecp256k1(calculateKeccak256(data), privateKey, "DER");
}

function recoverPublicKey(signature: string, obj: object, prefix?: string): string {
  const signatureObj = parseSecp256k1Signature(signature);
  const recoveryParam = signatureObj.recoveryParam;
  if (recoveryParam === undefined) {
    const message = "Signature must contain recovery part (typically 1b or 1c as the last two characters)";
    throw new InvalidSignatureFormatError(message, { signature });
  }

  const dataString = getPayloadToSign(obj);
  const data = dataString.startsWith("0x")
    ? Buffer.from(dataString.slice(2), "hex")
    : Buffer.from((prefix ?? "") + dataString);

  const dataHash = Buffer.from(keccak256.hex(data), "hex");

  // Convert signature to 64-byte format for recovery
  const signatureBuffer = new Uint8Array(64);
  signatureBuffer.set(signatureObj.r.toArray("be", 32), 0);
  signatureBuffer.set(signatureObj.s.toArray("be", 32), 32);

  const publicKey = secp256k1.ecdsaRecover(signatureBuffer, recoveryParam, dataHash, false);
  return Buffer.from(publicKey).toString("hex");
}

function isValid(signature: string, obj: object, publicKey: string): boolean {
  try {
    const data = Buffer.from(getPayloadToSign(obj));
    const publicKeyBuffer = normalizePublicKey(publicKey);

    const signatureObj = parseSecp256k1Signature(signature);
    const dataHash = calculateKeccak256(data);
    return isValidSecp256k1Signature(signatureObj, dataHash, publicKeyBuffer);
  } catch (e) {
    // Invalid key or signature format
    return false;
  }
}

function isValidHex(input: string) {
  return /^[0-9a-fA-F]*$/.test(input);
}

function isValidBase64(input: string) {
  return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(input);
}

function genKeyPair() {
  // Generate random private key
  let privateKey: Buffer;
  do {
    privateKey = randomBytes(32);
  } while (!secp256k1.privateKeyVerify(privateKey));

  // Derive public key from private key
  const publicKey = secp256k1.publicKeyCreate(privateKey, false);

  return {
    privateKey: privateKey.toString("hex"),
    publicKey: Buffer.from(publicKey).toString("hex")
  };
}

export default {
  calculateKeccak256,
  genKeyPair,
  getCompactBase64PublicKey,
  getNonCompactHexPublicKey,
  getEthAddress,
  getPublicKey,
  getSignature,
  getDERSignature,
  isChecksumedEthAddress,
  isLowercasedEthAddress,
  isValid,
  normalizeEthAddress,
  normalizePrivateKey,
  normalizePublicKey,
  normalizeSecp256k1Signature,
  parseSecp256k1Signature,
  recoverPublicKey
} as const;

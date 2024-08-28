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
import { ec as EC, ec } from "elliptic";
import Signature from "elliptic/lib/elliptic/ec/signature";
import { keccak256 } from "js-sha3";

import { ValidationFailedError } from "../error";
import { getPayloadToSign } from "./getPayloadToSign";

class InvalidKeyError extends ValidationFailedError {}

export class InvalidSignatureFormatError extends ValidationFailedError {}

class InvalidDataHashError extends ValidationFailedError {}

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
      const pair = validateSecp256k1PublicKey(buffer);
      return Buffer.from(pair.getPublic().encode("array", true));
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
  const pair = validateSecp256k1PublicKey(normalized);
  return pair.getPublic().encode("hex", false);
}

const ecSecp256k1 = new EC("secp256k1");

function getPublicKey(privateKey: string): string {
  const pkObj = new EC("secp256k1").keyFromPrivate(privateKey, "hex");
  return pkObj.getPublic().encode("hex", false).toString();
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
  const r = hex.slice(0, 64);
  const s = hex.slice(64, 128);
  const v = hex.slice(128, 130);

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
  const signature = new Signature(hex, "hex");
  return { r: signature.r, s: signature.s, recoveryParam: undefined };
}

function parseSecp256k1Signature(s: string): Secp256k1Signature {
  const sigObject = normalizeSecp256k1Signature(s);

  // Additional check for low-S normalization
  if (sigObject && sigObject.s.cmp(ecSecp256k1.curve.n.shrn(1)) > 0) {
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

export function flipSignatureParity<T extends EC.Signature | Secp256k1Signature>(signatureObj: T): T {
  const curveN = ecSecp256k1.curve.n;
  // flip sign of s to prevent malleability (S')
  const newS = new BN(curveN).sub(signatureObj.s);
  // flip recovery param
  const newRecoverParam = signatureObj.recoveryParam != null ? 1 - signatureObj.recoveryParam : null;

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

  let signature = ecSecp256k1.sign(dataHash, privateKey);

  // Low-S normalization
  if (signature.s.cmp(ecSecp256k1.curve.n.shrn(1)) > 0) {
    signature = flipSignatureParity(signature);
  }

  if (!useDer) {
    return (
      signature.r.toString("hex", 32) +
      signature.s.toString("hex", 32) +
      new BN(signature.recoveryParam === 1 ? 28 : 27).toString("hex", 1)
    );
  } else {
    const signatureDER = Buffer.from(signature.toDER());
    return signatureDER.toString("hex");
  }
}

function validateSecp256k1PublicKey(publicKey: Buffer): ec.KeyPair {
  try {
    return ecSecp256k1.keyFromPublic(publicKey);
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

  const pair = validateSecp256k1PublicKey(publicKey);

  return pair.verify(dataHash, signature);
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

  const publicKeyObj = ecSecp256k1.recoverPubKey(dataHash, signatureObj, recoveryParam);
  return publicKeyObj.encode("hex", false);
}

function isValid(signature: string, obj: object, publicKey: string): boolean {
  const data = Buffer.from(getPayloadToSign(obj));
  const publicKeyBuffer = normalizePublicKey(publicKey);

  const signatureObj = parseSecp256k1Signature(signature);
  const dataHash = Buffer.from(keccak256.hex(data), "hex");
  return isValidSecp256k1Signature(signatureObj, dataHash, publicKeyBuffer);
}

function validatePublicKey(publicKey: Buffer): void {
  validateSecp256k1PublicKey(publicKey);
}

function enforceValidPublicKey(
  signature: string | undefined,
  payload: object,
  publicKey: string | undefined
): string {
  if (signature === undefined) {
    throw new InvalidSignatureFormatError(`Signature is ${signature}`, { signature });
  }

  const signatureObj = parseSecp256k1Signature(signature);

  if (publicKey === undefined) {
    if (signatureObj.recoveryParam === undefined) {
      const message = "Public key is required when the signature recovery parameter is missing";
      throw new ValidationFailedError(message, { signature });
    } else {
      // recover public key from the signature and payload
      return recoverPublicKey(signature, payload);
    }
  }

  const publicKeyBuffer = normalizePublicKey(publicKey);
  const keccakBuffer = calculateKeccak256(Buffer.from(getPayloadToSign(payload)));

  if (isValidSecp256k1Signature(signatureObj, keccakBuffer, publicKeyBuffer)) {
    return publicKeyBuffer.toString("hex");
  } else {
    throw new ValidationFailedError("Secp256k1 signature is invalid", { signature, publicKey, payload });
  }
}

function isValidHex(input: string) {
  return /^[0-9a-fA-F]*$/.test(input);
}

function isValidBase64(input: string) {
  return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(input);
}

function genKeyPair() {
  const pair = ecSecp256k1.genKeyPair();
  const privateKey = pair.getPrivate().toString("hex");
  const publicKey = Buffer.from(pair.getPublic().encode("array", false)).toString("hex");
  return { privateKey, publicKey };
}

export default {
  calculateKeccak256,
  enforceValidPublicKey,
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
  isValidBase64,
  isValidHex,
  isValidSecp256k1Signature,
  normalizeEthAddress,
  normalizePrivateKey,
  normalizePublicKey,
  parseSecp256k1Signature,
  recoverPublicKey,
  validatePublicKey,
  validateSecp256k1PublicKey
} as const;

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
import * as secp from "@noble/secp256k1";
import BN from "bn.js";
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
      return Buffer.from(missing0 + inputNo0x, encoding as BufferEncoding);
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

function compressPublicKeyFromUncompressed(uncompressed: Buffer): Buffer {
  // uncompressed expected: 65 bytes, first = 0x04, then 32 bytes X, 32 bytes Y
  if (uncompressed.length !== 65 || uncompressed[0] !== 0x04) {
    throw new InvalidKeyError("Invalid uncompressed public key format");
  }
  const x = uncompressed.slice(1, 33);
  const y = uncompressed.slice(33, 65);
  const yLast = y[y.length - 1];
  const prefix = (yLast & 1) === 1 ? 0x03 : 0x02;
  return Buffer.concat([Buffer.from([prefix]), x]);
}

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
      const buffer = Buffer.from(inputNo0x, encoding as BufferEncoding);

      // Accept compressed (33) or uncompressed (65). Convert to compressed representation.
      if (buffer.length === 33 && (buffer[0] === 0x02 || buffer[0] === 0x03)) {
        // compressed already
        // Validate basic form
        validateSecp256k1PublicKey(buffer);
        return Buffer.from(buffer);
      } else if (buffer.length === 65 && buffer[0] === 0x04) {
        // compress and validate
        const compressed = compressPublicKeyFromUncompressed(buffer);
        validateSecp256k1PublicKey(compressed);
        return Buffer.from(compressed);
      } else {
        throw new InvalidKeyError(`Invalid public key length or prefix: provided ${buffer.length} bytes`);
      }
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
  const normalized = normalizePublicKey(publicKey); // compressed 33 bytes
  // convert compressed -> uncompressed hex (starts with 0x04)
  const uncompressedHex = secp.Point.fromHex(normalized).toHex(false);
  return uncompressedHex;
}

function getPublicKey(privateKey: string): string {
  // returns hex-encoded uncompressed public key, same as elliptic version (130 hex chars)
  const privateHex = privateKey.replace(/^0x/, "");
  const pubHex = secp.getPublicKey(privateHex, false); // uncompressed, hex string with 0x04 prefix
  // noble returns hex string without 0x prefix in many versions; ensure it's hex without 0x
  return pubHex.startsWith("0x") ? pubHex.slice(2) : pubHex;
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
  // We don't rely on elliptic's Signature class anymore.
  // Use noble to parse DER: noble's sign() can output DER, but parsing DER to r/s here:
  // A simple DER parser is implemented below (lightweight) to extract r and s.
  const buf = Buffer.from(hex, "hex");
  // Minimal DER parser for ECDSA (sequence -> r -> s)
  let offset = 0;
  if (buf[offset++] !== 0x30) {
    throw new InvalidSignatureFormatError("Invalid DER signature: expected sequence");
  }
  const seqLen = buf[offset++];
  if (buf[offset++] !== 0x02)
    throw new InvalidSignatureFormatError("Invalid DER signature: expected integer (r)");
  const rLen = buf[offset++];
  const rBuf = buf.slice(offset, offset + rLen);
  offset += rLen;
  if (buf[offset++] !== 0x02)
    throw new InvalidSignatureFormatError("Invalid DER signature: expected integer (s)");
  const sLen = buf[offset++];
  const sBuf = buf.slice(offset, offset + sLen);
  // r and s may have leading zero for DER; just convert to hex without sign extension
  const rHex = rBuf.toString("hex").padStart(64, "0").slice(-64);
  const sHex = sBuf.toString("hex").padStart(64, "0").slice(-64);
  return { r: new BN(rHex, "hex"), s: new BN(sHex, "hex"), recoveryParam: undefined };
}

function parseSecp256k1Signature(s: string): Secp256k1Signature {
  const sigObject = normalizeSecp256k1Signature(s);

  // Additional check for low-S normalization
  // curve order n
  const curveN = new BN(secp.CURVE.n.toString(16), "hex");
  if (sigObject && sigObject.s.cmp(curveN.shrn(1)) > 0) {
    throw new InvalidSignatureFormatError("S value is too high", { signature: s });
  }

  return sigObject;
}

export function normalizeSecp256k1Signature(s: string): Secp256k1Signature {
  // standard format with recovery parameter: 130 hex chars (r(64)+s(64)+v(2))
  if (s.length === 130) {
    return secp256k1signatureFrom130HexString(s);
  }

  // standard format with recovery parameter, preceded by 0x
  if (s.length === 132 && s.startsWith("0x")) {
    return secp256k1signatureFrom130HexString(s.slice(2));
  }

  // standard format with recovery parameter, encoded with base64 (88 chars)
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

  // DER format (various valid lengths)
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
  const curveN = new BN(secp.CURVE.n.toString(16), "hex");
  // flip sign of s to prevent malleability (S')
  const newS = new BN(curveN).sub(signatureObj.s);
  // flip recovery param
  const newRecoverParam = signatureObj.recoveryParam != null ? 1 - signatureObj.recoveryParam : undefined;

  // normalized signature
  signatureObj.s = newS;
  signatureObj.recoveryParam = newRecoverParam;

  return signatureObj;
}

function uint8ToBuffer(u: Uint8Array | string): Buffer {
  if (typeof u === "string") {
    return Buffer.from(u, "hex");
  }
  return Buffer.from(u);
}

async function signSecp256k1(dataHash: Buffer, privateKey: Buffer, useDer?: "DER"): Promise<string> {
  if (dataHash.length !== 32) {
    const msg = `secp256k1 can sign only 32-bytes long data keccak hash (got ${dataHash.length})`;
    throw new InvalidDataHashError(msg);
  }

  // noble accepts hex or Uint8Array
  const privHex = privateKey.toString("hex");

  // produce compact signature (r||s) as hex; request DER when asked
  let signatureCompactHex: string;
  let signatureDerHex: string | undefined;

  if (useDer) {
    // noble sign can return DER if requested (some versions accept options)
    // to be robust, produce compact and build DER if necessary from r/s
    const sig = await secp.sign(dataHash, privHex); // returns compact 64-byte hex by default
    signatureCompactHex = typeof sig === "string" ? sig : Buffer.from(sig).toString("hex");
    // build DER using noble util
    const der = secp.Signature.fromHex(signatureCompactHex).toDER();
    signatureDerHex = Buffer.from(der).toString("hex");
  } else {
    const sig = await secp.sign(dataHash, privHex);
    signatureCompactHex = typeof sig === "string" ? sig : Buffer.from(sig).toString("hex");
  }

  if (useDer) {
    return signatureDerHex!;
  }

  // signatureCompactHex is r(32) + s(32)
  const rHex = signatureCompactHex.slice(0, 64);
  let sHex = signatureCompactHex.slice(64, 128);

  // Determine recovery param: try rec = 0 or 1 and match public key
  const pubFromPriv = (secp.getPublicKey(privHex, false) as string).replace(/^0x/, ""); // uncompressed 65 bytes hex (130 chars)
  let recoveryParam: number | null = null;
  const sigBytes = Buffer.from(signatureCompactHex, "hex");
  for (let rec = 0; rec <= 1; rec++) {
    try {
      const recovered = secp.recoverPublicKey(dataHash, signatureCompactHex, rec); // recovered hex uncompressed
      const recoveredHex = recovered.startsWith("0x") ? recovered.slice(2) : recovered;
      if (recoveredHex.toLowerCase() === pubFromPriv.toLowerCase()) {
        recoveryParam = rec;
        break;
      }
    } catch (e) {
      // try next
    }
  }

  if (recoveryParam === null) {
    // As a fallback, try rec 2/3 (unlikely for secp256k1 ECDSA but be thorough)
    for (let rec = 2; rec <= 3; rec++) {
      try {
        const recovered = secp.recoverPublicKey(dataHash, signatureCompactHex, rec);
        const recoveredHex = recovered.startsWith("0x") ? recovered.slice(2) : recovered;
        if (recoveredHex.toLowerCase() === pubFromPriv.toLowerCase()) {
          recoveryParam = rec;
          break;
        }
      } catch (e) {
        // continue
      }
    }
  }

  // Convert s to BN for low-S check
  const curveN = new BN(secp.CURVE.n.toString(16), "hex");
  const sBN = new BN(sHex, "hex");
  if (sBN.cmp(curveN.shrn(1)) > 0) {
    // flip s (S' = n - s)
    const newS = curveN.sub(sBN);
    sHex = newS.toString("hex", 32);
    // flip recovery param if present
    if (recoveryParam != null) {
      recoveryParam = 1 - recoveryParam;
    }
  }

  const vHex = new BN(recoveryParam === 1 ? 28 : 27).toString("hex", 1);
  return rHex + sHex + vHex;
}

function validateSecp256k1PublicKey(publicKey: Buffer): Buffer {
  // simple validation: compressed (33) starting 02/03 or uncompressed (65) starting 04
  if (!(publicKey.length === 33 || publicKey.length === 65)) {
    throw new InvalidKeyError("Public key has invalid length");
  }
  const prefix = publicKey[0];
  if (publicKey.length === 33 && !(prefix === 0x02 || prefix === 0x03)) {
    throw new InvalidKeyError("Compressed public key has invalid prefix");
  }
  if (publicKey.length === 65 && prefix !== 0x04) {
    throw new InvalidKeyError("Uncompressed public key has invalid prefix");
  }
  // optionally, more advanced curve membership validation could go here,
  // but noble provides curve utilities in some versions (secp.utils.isValidPublicKey)
  return publicKey;
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

  // convert signature to compact hex r||s
  const rHex = signature.r.toString("hex", 32);
  const sHex = signature.s.toString("hex", 32);
  const sigHex = rHex + sHex;

  // accept compressed public key buffer
  const pubHex =
    publicKey.length === 33 || publicKey.length === 65
      ? publicKey.length === 33
        ? Buffer.from(publicKey).toString("hex")
        : secp.Point.fromHex(publicKey).toHex(false)
      : Buffer.from(publicKey).toString("hex");

  // noble.verify expects signature, messageHash, publicKey (all hex or Uint8Array)
  return secp.verify(sigHex, dataHash, pubHex);
}

function calculateKeccak256(data: Buffer): Buffer {
  return Buffer.from(keccak256.digest(data));
}

function getSignature(obj: object, privateKey: Buffer): Promise<string> {
  const data = Buffer.from(getPayloadToSign(obj));
  return signSecp256k1(calculateKeccak256(data), privateKey);
}

function getDERSignature(obj: object, privateKey: Buffer): Promise<string> {
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

  // rebuild compact signature r||s hex
  const rHex = signatureObj.r.toString("hex", 32);
  const sHex = signatureObj.s.toString("hex", 32);
  const sigHex = rHex + sHex;

  const recovered = secp.recoverPublicKey(dataHash, sigHex, recoveryParam);
  const recoveredHex = recovered.startsWith("0x") ? recovered.slice(2) : recovered;
  return recoveredHex;
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
    // return normalized hex (uncompressed) to keep parity with original impl
    const uncompressedHex = secp.Point.fromHex(publicKeyBuffer).toHex(false);
    return uncompressedHex;
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
  const privateKey = Buffer.from(secp.utils.randomPrivateKey()).toString("hex");
  const publicKey = secp.getPublicKey(privateKey, false).replace(/^0x/, "");
  return { privateKey, publicKey };
}

export default {
  calculateKeccak256,
  enforceValidPublicKey,
  genKeyPair,
  flipSignatureParity,
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
  normalizeSecp256k1Signature,
  parseSecp256k1Signature,
  recoverPublicKey,
  validatePublicKey,
  validateSecp256k1PublicKey
} as const;

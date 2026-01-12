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
import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator
} from "class-validator";

import { signatures } from "../utils";
import { isValidUserAlias } from "./IsUserAlias";

export enum ChainAddressValidationResult {
  VALID_ETHEREUM,
  VALID_SOLANA,
  VALID_TON,
  VALID_GALACHAIN,
  INVALID_ETHEREUM,
  INVALID_SOLANA,
  INVALID_TON,
  INVALID_GALACHAIN,
  INVALID_FORMAT
}

export function meansValidChainAddress(result: ChainAddressValidationResult) {
  return (
    result === ChainAddressValidationResult.VALID_ETHEREUM ||
    result === ChainAddressValidationResult.VALID_SOLANA ||
    result === ChainAddressValidationResult.VALID_TON ||
    result === ChainAddressValidationResult.VALID_GALACHAIN
  );
}

// Base58 alphabet used by Solana
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58Decode(input: string): Uint8Array | null {
  if (!input || input.length === 0) {
    return null;
  }

  // Check if all characters are valid base58
  for (const char of input) {
    if (!BASE58_ALPHABET.includes(char)) {
      return null;
    }
  }

  try {
    const base = BigInt(BASE58_ALPHABET.length);
    let num = BigInt(0);

    // Count leading zeros (encoded as '1' in base58)
    let leadingZeros = 0;
    for (let i = 0; i < input.length && input[i] === "1"; i++) {
      leadingZeros++;
    }

    // Convert base58 string to BigInt (skip leading ones)
    const significantPart = input.slice(leadingZeros);
    if (significantPart.length === 0) {
      // All zeros case
      return new Uint8Array(leadingZeros);
    }

    for (const char of significantPart) {
      const index = BASE58_ALPHABET.indexOf(char);
      if (index === -1) {
        return null;
      }
      num = num * base + BigInt(index);
    }

    // Convert BigInt to bytes
    const bytes: number[] = [];
    if (num === BigInt(0)) {
      return new Uint8Array(leadingZeros);
    }

    while (num > BigInt(0)) {
      bytes.push(Number(num % BigInt(256)));
      num = num / BigInt(256);
    }

    const significantBytes = new Uint8Array(bytes.reverse());

    // Combine leading zeros with significant bytes
    const result = new Uint8Array(leadingZeros + significantBytes.length);
    result.set(significantBytes, leadingZeros);

    return result;
  } catch {
    return null;
  }
}

function isValidSolanaAddress(address: string): boolean {
  // Solana addresses are base58 encoded 32-byte public keys
  // Typical length is 32-44 characters
  if (!address || address.length < 32 || address.length > 44) {
    return false;
  }

  const decoded = base58Decode(address);
  if (!decoded) {
    return false;
  }

  // Solana public keys must decode to exactly 32 bytes
  // Base58 encoding of 32 bytes can result in variable length strings,
  // but when decoded, it must be exactly 32 bytes (leading zeros are encoded as '1's)
  return decoded.length === 32;
}

function isValidTonAddress(address: string): boolean {
  // TON addresses must be bounceable and not test-only (mainnet only)
  // Friendly format: UQ... (48 characters, base64url encoded)
  // U = bounceable, Q = mainnet (not test-only)
  // We require: isBounceable = true && isTestOnly = false

  // Check for bounceable mainnet format: UQ followed by base64url characters
  if (!/^UQ[a-zA-Z0-9_-]{46}$/.test(address)) {
    return false;
  }

  // Validate base64url encoding and decode to check flags
  try {
    const base64urlPart = address.slice(2); // Remove "UQ" prefix

    // Base64url alphabet: A-Za-z0-9_- (no + or /)
    if (!/^[A-Za-z0-9_-]+$/.test(base64urlPart)) {
      return false;
    }

    // Decode base64url
    const base64 = base64urlPart.replace(/-/g, "+").replace(/_/g, "/");
    const padding = base64.length % 4;
    const paddedBase64 = base64 + "=".repeat(padding === 0 ? 0 : 4 - padding);

    const decoded = Buffer.from(paddedBase64, "base64");

    // TON address structure: 1 byte flags + address + checksum = 34 bytes total
    // Base64url encoded: 34 * 4/3 = 45.33 -> 46 chars (UQ + 46 = 48 total)
    // Accept 33-35 bytes to handle potential encoding variations
    if (decoded.length < 33 || decoded.length > 35) {
      return false;
    }

    // Check flags byte (first byte)
    // Bit 0: bounceable flag (0 = non-bounceable, 1 = bounceable)
    // Bit 1: testnet flag (0 = mainnet, 1 = testnet/test-only)
    const flags = decoded[0];
    const isBounceable = (flags & 0x01) !== 0;
    const isTestOnly = (flags & 0x02) !== 0;

    // Must be bounceable and not test-only
    return isBounceable && !isTestOnly;
  } catch {
    return false;
  }
}

function isValidEthereumAddress(address: string): boolean {
  // Ethereum addresses must have 0x prefix and be checksummed
  if (!address.startsWith("0x")) {
    return false;
  }

  // Use the existing validation from signatures
  return signatures.isChecksumedEthAddress(address);
}

export function validateChainAddress(value: unknown): ChainAddressValidationResult {
  if (typeof value !== "string" || value.length === 0) {
    return ChainAddressValidationResult.INVALID_FORMAT;
  }

  // Check Ethereum first (has 0x prefix, easy to identify)
  if (value.startsWith("0x")) {
    if (isValidEthereumAddress(value)) {
      return ChainAddressValidationResult.VALID_ETHEREUM;
    } else {
      return ChainAddressValidationResult.INVALID_ETHEREUM;
    }
  }

  // Check TON (starts with UQ for bounceable mainnet)
  if (value.startsWith("UQ") || value.startsWith("EQ") || value.startsWith("0:")) {
    if (isValidTonAddress(value)) {
      return ChainAddressValidationResult.VALID_TON;
    } else {
      return ChainAddressValidationResult.INVALID_TON;
    }
  }

  // Check Solana (base58 encoded, 32-44 chars, doesn't start with special prefixes)
  if (isValidSolanaAddress(value)) {
    return ChainAddressValidationResult.VALID_SOLANA;
  }

  // Check GalaChain (same as IsUserAlias)
  if (isValidUserAlias(value)) {
    return ChainAddressValidationResult.VALID_GALACHAIN;
  }

  // If we got here and it looks like Solana format but failed validation
  if (value.length >= 32 && value.length <= 44) {
    // Check if it contains only base58 characters
    let allBase58 = true;
    for (const char of value) {
      if (!BASE58_ALPHABET.includes(char)) {
        allBase58 = false;
        break;
      }
    }
    if (allBase58) {
      return ChainAddressValidationResult.INVALID_SOLANA;
    }
  }

  // If it looks like TON but failed
  if (value.startsWith("UQ") || value.startsWith("EQ") || value.startsWith("0:")) {
    return ChainAddressValidationResult.INVALID_TON;
  }

  // If it looks like Ethereum but failed
  if (/^0x[0-9a-fA-F]{40}$/.test(value)) {
    return ChainAddressValidationResult.INVALID_ETHEREUM;
  }

  return ChainAddressValidationResult.INVALID_FORMAT;
}

export function isValidChainAddress(value: unknown): boolean {
  const result = validateChainAddress(value);
  return meansValidChainAddress(result);
}

const customMessages = {
  [ChainAddressValidationResult.INVALID_ETHEREUM]:
    "Ethereum address must be checksummed and start with '0x' prefix.",
  [ChainAddressValidationResult.INVALID_SOLANA]:
    "Solana address must be a valid base58-encoded 32-byte public key.",
  [ChainAddressValidationResult.INVALID_TON]:
    "TON address must be bounceable and not test-only (UQ... format).",
  [ChainAddressValidationResult.INVALID_GALACHAIN]: "GalaChain address must be a valid user alias."
};

const genericMessage =
  "Expected a valid chain address: Ethereum (checksummed with 0x prefix), " +
  "Solana (base58-encoded 32-byte public key), TON (bounceable mainnet format: UQ...), " +
  "or GalaChain (valid user alias).";

@ValidatorConstraint({ async: false })
class IsValidChainAddressConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if (Array.isArray(value)) {
      return value.every((val) => this.validate(val, args));
    }
    const result = validateChainAddress(value);
    return meansValidChainAddress(result);
  }

  defaultMessage(args: ValidationArguments): string {
    const value = args.value;
    if (Array.isArray(value)) {
      const invalidValues = value.filter((val) => !meansValidChainAddress(validateChainAddress(val)));
      return `${args.property} property with values ${invalidValues} are not valid chain addresses. ${genericMessage}`;
    }
    const result = validateChainAddress(args.value);
    const details = customMessages[result] ?? genericMessage;
    return `${args.property} property with value ${args.value} is not a valid chain address. ${details}`;
  }
}

/**
 * @description
 *
 * Used to register a decorator for class validation.
 * Validates against IsValidChainAddressConstraint.
 * Supports addresses for Ethereum, Solana, TON, and GalaChain chains.
 *
 * Ethereum addresses must be checksummed and start with '0x' prefix.
 * Solana addresses must be base58-encoded 32-byte public keys.
 * TON addresses must be bounceable and not test-only (UQ... format).
 * GalaChain addresses must be valid user aliases.
 *
 * @param options
 *
 */
export function IsValidChainAddress(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isValidChainAddress",
      target: object.constructor,
      propertyName,
      options,
      constraints: [],
      validator: IsValidChainAddressConstraint
    });
  };
}

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
import { instanceToPlain } from "class-transformer";

import { TypedDataEncoder } from "../../ethers/hash/typed-data";
import serialize from "../serialize";

// Type definitions
type EIP712Domain = Record<string, any>;
type EIP712Types = Record<string, any>;
type EIP712Value = Record<string, any>;

interface EIP712Object {
  domain: EIP712Domain;
  types: EIP712Types;
  value: EIP712Value;
}

// Type guard to check if an object is EIP712Object
function isEIP712Object(obj: object): obj is EIP712Object {
  return obj && typeof obj === "object" && "domain" in obj && "types" in obj;
}

/**
 * Guards against EIP-712 unsigned-field injection.
 *
 * The signed payload is `TypedDataEncoder.encode(domain, types, value)`, which hashes
 * ONLY the fields enumerated in `types` — and `types` travels inside the DTO, supplied
 * by the caller. Any DTO field that is not declared in `types[primaryType]` (or the
 * corresponding struct type, recursively) is therefore NOT covered by the signature.
 *
 * That lets a signature produced for one DTO type be replayed against another: e.g. a
 * GalaSwap `Swap`/`AddLiquidity` signature (whose `types` omit `to`/`quantity`/
 * `tokenInstance`) replayed into `TransferToken` with attacker-injected `to`/`quantity`.
 * The recovered signer is unchanged (the victim), so the move is authorized and the
 * victim is drained. This is the mechanism behind the 2026-08-18 mainnet drain.
 *
 * The fix: require the signed `types` to cover EVERY message field of the DTO. If any
 * field is present on the value but not declared in its struct type, refuse to produce
 * the payload — on the signing side (a client cannot omit a field from its own signature)
 * and, critically, on the verifying side (a replayed cross-type signature carries `types`
 * that do not match the DTO it was replayed into, so the injected fields are undeclared
 * and this throws before the signer is trusted).
 */
function assertNoUnsignedFields(
  encoder: TypedDataEncoder,
  typeName: string,
  value: unknown,
  ignoredKeys: Set<string>,
  path: string
): void {
  const fields = encoder.types[typeName];
  // Atomic type or non-object value: nothing to enumerate.
  if (!Array.isArray(fields) || value === null || typeof value !== "object" || Array.isArray(value)) {
    return;
  }
  const record = value as Record<string, unknown>;
  const declared = new Set(fields.map((f) => f.name));
  for (const key of Object.keys(record)) {
    if (ignoredKeys.has(key)) continue;
    if (!declared.has(key)) {
      throw new Error(
        `EIP-712 payload field "${path}${key}" is not declared in the signed type "${typeName}". ` +
          `Refusing to produce/verify a signature that does not cover every DTO field ` +
          `(prevents unsigned-field injection / cross-type signature replay).`
      );
    }
  }
  // Recurse into struct-typed fields so nested injection is caught too.
  for (const f of fields) {
    const base = f.type.replace(/(\[\d*\])+$/, ""); // strip any array suffixes: "quantities[]" -> "quantities"
    if (!encoder.types[base]) continue; // atomic field type (string, uint256, ...)
    const fieldVal = record[f.name];
    const items = f.type.endsWith("]") && Array.isArray(fieldVal) ? fieldVal : [fieldVal];
    for (const item of items) {
      assertNoUnsignedFields(encoder, base, item, new Set(), `${path}${f.name}.`);
    }
  }
}

function getEIP712PayloadToSign(obj: EIP712Object, eipOverride: { chainId?: number | "delete" }): string {
  if (eipOverride.chainId === "delete") {
    delete obj.domain.chainId;
  } else if (eipOverride.chainId !== undefined) {
    obj.domain.chainId = eipOverride.chainId;
  }
  // Enforce full-DTO coverage BEFORE trusting the signature. `domain` and `types` are
  // envelope members of the EIP-712 object, not message fields, so they are exempt.
  const encoder = TypedDataEncoder.from(obj.types);
  assertNoUnsignedFields(encoder, encoder.primaryType, obj, new Set(["domain", "types"]), "");
  return TypedDataEncoder.encode(obj.domain, obj.types, obj);
}

export function getPayloadToSign(obj: object, eipOverride: { chainId?: number | "delete" } = {}): Buffer {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { signature, multisig, trace, prefix, ...plain } = instanceToPlain(obj);

  const dataString = isEIP712Object(plain)
    ? getEIP712PayloadToSign(plain, eipOverride)
    : `${prefix ?? ""}${serialize(plain)}`;

  return dataString.startsWith("0x") //
    ? Buffer.from(dataString.slice(2), "hex") //
    : Buffer.from(dataString);
}

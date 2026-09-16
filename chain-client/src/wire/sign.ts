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

import { serialize } from "./serialize";

export function randomUniqueKey(): string {
  return randomBytes(32).toString("base64");
}

export function signPlain(
  plain: Record<string, unknown>,
  privateKey: string
): Record<string, unknown> & {
  serialize(): string;
} {
  const payload = { ...plain };
  delete payload.signature;
  delete payload.multisig;
  const hash = Buffer.from(keccak256.digest(Buffer.from(serialize(payload))));
  const key = Buffer.from(privateKey.replace(/^0x/, ""), "hex");
  const sig = secp256k1.ecdsaSign(new Uint8Array(hash), new Uint8Array(key));
  const r = Buffer.from(sig.signature.slice(0, 32)).toString("hex");
  const s = Buffer.from(sig.signature.slice(32, 64)).toString("hex");
  const v = (sig.recid === 1 ? 28 : 27).toString(16).padStart(2, "0");
  const signed = { ...payload, signature: `${r}${s}${v}` };
  return Object.assign(signed, { serialize: () => serialize(signed) });
}

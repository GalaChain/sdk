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

function getEIP712PayloadToSign(obj: EIP712Object): string {
  return TypedDataEncoder.encode(obj.domain, obj.types, obj);
}

export function getPayloadToSign(obj: object): string {
  if (isEIP712Object(obj)) {
    return getEIP712PayloadToSign(obj);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { signature, signatures, trace, ...plain } = instanceToPlain(obj);
  return serialize(plain);
}

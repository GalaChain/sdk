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

import { serialize } from "./serialize";

function isEip712Object(obj: object): boolean {
  if (!obj || typeof obj !== "object") {
    return false;
  }
  const record = obj as Record<string, unknown>;
  return (
    record.domain !== null &&
    typeof record.domain === "object" &&
    !Array.isArray(record.domain) &&
    record.types !== null &&
    typeof record.types === "object" &&
    !Array.isArray(record.types)
  );
}

export function getPayloadToSign(obj: object): Buffer {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { signature, multisig, trace, prefix, ...plain } = instanceToPlain(obj);

  if (isEip712Object(plain)) {
    throw new Error("EIP-712 typed data is not supported by the CLI signer");
  }

  const dataString = `${prefix ?? ""}${serialize(plain)}`;

  return dataString.startsWith("0x") ? Buffer.from(dataString.slice(2), "hex") : Buffer.from(dataString);
}

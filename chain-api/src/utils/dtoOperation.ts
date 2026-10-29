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

export interface DtoOperationParts {
  channel?: string;
  chaincode?: string;
  contract?: string;
}

export function configuredDtoOperation(
  parts: DtoOperationParts | undefined,
  method: string
): string | undefined {
  const channel = parts?.channel?.trim() ?? "";
  const chaincode = parts?.chaincode?.trim() ?? "";
  const contract = parts?.contract?.trim() ?? "";
  const name = method.trim();
  if (channel.length === 0 || chaincode.length === 0 || contract.length === 0 || name.length === 0) {
    return undefined;
  }
  return `${channel}_${chaincode}_${contract}:${name}`;
}

function hasSignature(value: object): boolean {
  const record = value as { signature?: unknown; multisig?: unknown };
  if (typeof record.signature === "string" && record.signature.length > 0) {
    return true;
  }
  return Array.isArray(record.multisig) && record.multisig.length > 0;
}

/**
 * Adds dtoOperation before a payload is signed.
 * A payload that already names an operation, or that already has a signature, is left unchanged.
 */
export function withDtoOperation<T>(payload: T, operation: string | undefined): T {
  if (operation === undefined || payload === null || typeof payload !== "object") {
    return payload;
  }
  const record = payload as { dtoOperation?: unknown };
  if (typeof record.dtoOperation === "string" && record.dtoOperation.length > 0) {
    return payload;
  }
  if (hasSignature(payload)) {
    return payload;
  }
  return { ...(payload as object), dtoOperation: operation } as T;
}

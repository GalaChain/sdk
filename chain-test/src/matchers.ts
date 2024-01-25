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
import { ChainError, GalaChainResponseType } from "@gala-chain/api";
import { expect } from "@jest/globals";

export function transactionSuccess<T>(payload?: T): unknown {
  if (payload === undefined) {
    return expect.objectContaining({ Status: GalaChainResponseType.Success });
  } else {
    return expect.objectContaining({ Status: GalaChainResponseType.Success, Data: payload });
  }
}

export function transactionError(matcher?: string | unknown | ChainError): unknown {
  if (matcher === undefined) {
    return expect.objectContaining({ Status: GalaChainResponseType.Error });
  }

  if (matcher instanceof ChainError) {
    return expect.objectContaining({
      Status: GalaChainResponseType.Error,
      Message: matcher.message,
      ErrorCode: matcher.code,
      ErrorKey: matcher.key,
      ErrorPayload: matcher.payload
    });
  }

  return expect.objectContaining({ Status: GalaChainResponseType.Error, Message: matcher });
}

export function transactionErrorKey(key: string) {
  return expect.objectContaining({
    ErrorKey: key,
    Status: GalaChainResponseType.Error
  });
}

export function transactionErrorCode(code: number) {
  return expect.objectContaining({
    ErrorCode: code,
    Status: GalaChainResponseType.Error
  });
}

export function transactionErrorMessageContains(s: string) {
  return expect.objectContaining({
    Message: expect.stringContaining(s),
    Status: GalaChainResponseType.Error
  });
}

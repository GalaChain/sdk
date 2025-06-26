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

/**
 * Creates a Jest matcher for asserting successful GalaChain transaction responses.
 *
 * @template T - The type of the expected payload data
 * @param payload - Optional expected payload data. If provided, the matcher will also verify the Data field matches this value
 * @returns A Jest matcher object that can be used with `expect().toEqual()`
 *
 * @example
 * ```typescript
 * // Assert successful response without checking payload
 * expect(response).toEqual(transactionSuccess());
 *
 * // Assert successful response with specific payload
 * expect(response).toEqual(transactionSuccess({ tokenId: "123" }));
 * ```
 */
export function transactionSuccess<T>(payload?: T): unknown {
  if (payload === undefined) {
    return expect.objectContaining({ Status: GalaChainResponseType.Success });
  } else {
    return expect.objectContaining({ Status: GalaChainResponseType.Success, Data: payload });
  }
}

/**
 * Creates a Jest matcher for asserting failed GalaChain transaction responses.
 *
 * @param matcher - Optional matcher for the error. Can be:
 *   - `undefined`: Matches any error response
 *   - `string`: Matches error with specific message
 *   - `ChainError`: Matches error with specific ChainError properties (message, code, key, payload)
 *   - `unknown`: Matches error with specific message
 * @returns A Jest matcher object that can be used with `expect().toEqual()`
 *
 * @example
 * ```typescript
 * // Assert any error response
 * expect(response).toEqual(transactionError());
 *
 * // Assert error with specific message
 * expect(response).toEqual(transactionError("Invalid token"));
 *
 * // Assert error with ChainError details
 * const error = new ChainError("Token not found", { code: 404, key: "TOKEN_NOT_FOUND" });
 * expect(response).toEqual(transactionError(error));
 * ```
 */
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

/**
 * Creates a Jest matcher for asserting GalaChain transaction error responses with a specific error key.
 *
 * @param key - The expected error key to match
 * @returns A Jest matcher object that can be used with `expect().toEqual()`
 *
 * @example
 * ```typescript
 * // Assert error response has specific error key
 * expect(response).toEqual(transactionErrorKey("TOKEN_NOT_FOUND"));
 * expect(response).toEqual(transactionErrorKey("INSUFFICIENT_BALANCE"));
 * ```
 */
export function transactionErrorKey(key: string) {
  return expect.objectContaining({
    ErrorKey: key,
    Status: GalaChainResponseType.Error
  });
}

/**
 * Creates a Jest matcher for asserting GalaChain transaction error responses with a specific error code.
 *
 * @param code - The expected error code to match
 * @returns A Jest matcher object that can be used with `expect().toEqual()`
 *
 * @example
 * ```typescript
 * // Assert error response has specific error code
 * expect(response).toEqual(transactionErrorCode(404));
 * expect(response).toEqual(transactionErrorCode(400));
 * ```
 */
export function transactionErrorCode(code: number) {
  return expect.objectContaining({
    ErrorCode: code,
    Status: GalaChainResponseType.Error
  });
}

/**
 * Creates a Jest matcher for asserting GalaChain transaction error responses with error messages containing specific text.
 *
 * @param s - The text that should be contained in the error message
 * @returns A Jest matcher object that can be used with `expect().toEqual()`
 *
 * @example
 * ```typescript
 * // Assert error message contains specific text
 * expect(response).toEqual(transactionErrorMessageContains("insufficient"));
 * expect(response).toEqual(transactionErrorMessageContains("not found"));
 * ```
 */
export function transactionErrorMessageContains(s: string) {
  return expect.objectContaining({
    Message: expect.stringContaining(s),
    Status: GalaChainResponseType.Error
  });
}

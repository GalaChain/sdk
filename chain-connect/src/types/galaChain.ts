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
import { GalaChainErrorResponse, GalaChainResponseType, GalaChainSuccessResponse } from "@gala-chain/api";

/**
 * Error response type for GalaChain operations.
 * @template T - The type of data associated with the error
 */
type GalaChainError<T> = {
  /** The error information, either a string or structured error response */
  error: string | GalaChainErrorResponse<T>;
  /** Human-readable error message */
  message: string;
  /** HTTP status code if applicable */
  statusCode?: number;
};

/**
 * Represents a successful response from a GalaChain operation.
 * @template T - The type of data returned in the response
 */
export class GalaChainResponseSuccess<T> {
  /** The response status indicating success */
  public readonly Status: GalaChainResponseType;
  /** The actual data returned by the operation */
  public readonly Data: T;
  /** Optional transaction hash for the operation */
  public readonly Hash?: string;

  /**
   * Creates a new successful response.
   * @param data - The success response data
   * @param hash - Optional transaction hash
   */
  constructor(data: GalaChainSuccessResponse<T>, hash?: string) {
    this.Hash = hash;
    this.Status = data.Status;
    this.Data = data.Data;
  }
}

/**
 * Represents an error response from a GalaChain operation.
 * @template T - The type of data associated with the error
 */
export class GalaChainResponseError<T> extends Error {
  /** The error key or identifier */
  public readonly Error: string;
  /** Human-readable error message */
  public readonly Message: string;
  /** Numeric error code */
  public readonly ErrorCode: number;
  /** Structured details from the response, when present */
  public readonly ErrorPayload?: unknown;

  /**
   * Creates a new error response.
   * @param data - The error data to construct the response from
   */
  constructor(data: GalaChainError<T>) {
    const details = readResponseError(data);
    super(details.message);
    this.name = "GalaChainResponseError";
    Object.setPrototypeOf(this, new.target.prototype);
    this.Error = details.error;
    this.Message = details.message;
    this.ErrorCode = details.code;
    this.ErrorPayload = details.payload;
  }
}

function readResponseError<T>(data: GalaChainError<T>): {
  error: string;
  message: string;
  code: number;
  payload?: unknown;
} {
  const message = typeof data?.message === "string" ? data.message : "Request failed";

  if (typeof data?.error === "string") {
    return { error: data.error, message, code: data.statusCode ?? 500 };
  }

  if (isStructuredError(data?.error)) {
    return {
      error: data.error.ErrorKey,
      message,
      code: data.error.ErrorCode ?? data.statusCode ?? 500,
      payload: data.error.ErrorPayload
    };
  }

  return { error: "UNKNOWN", message, code: data?.statusCode ?? 500 };
}

function isStructuredError(
  error: unknown
): error is { ErrorKey: string; ErrorCode?: number; ErrorPayload?: unknown } {
  return (
    typeof error === "object" &&
    error !== null &&
    typeof (error as { ErrorKey?: unknown }).ErrorKey === "string"
  );
}

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
import { plainToInstance } from "class-transformer";

import { ClassType, Inferred } from "../generic/types";

export const GalaChainResponseType = {
  Error: 0,
  Success: 1
} as const;

export interface GalaChainResponse<T> {
  Status: number;
  Message?: string;
  ErrorCode?: number;
  ErrorKey?: string;
  ErrorPayload?: unknown;
  Data?: T;
}

export const GalaChainResponse = {
  Success<T>(Data: T): GalaChainResponse<T> {
    return { Status: GalaChainResponseType.Success, Data };
  },

  Error<T>(
    message: string,
    errorCode?: number,
    errorKey?: string,
    errorPayload?: unknown
  ): GalaChainResponse<T> {
    return {
      Status: GalaChainResponseType.Error,
      Message: message,
      ErrorCode: errorCode ?? 500,
      ErrorKey: errorKey ?? "UNKNOWN",
      ErrorPayload: errorPayload
    };
  },

  isSuccess<T>(r: GalaChainResponse<T>): boolean {
    return r.Status === GalaChainResponseType.Success;
  },

  isError<T>(r: GalaChainResponse<T>): boolean {
    return r.Status === GalaChainResponseType.Error;
  },

  deserialize<T>(
    constructor: ClassType<Inferred<T>> | undefined,
    object: string | Record<string, unknown>
  ): GalaChainResponse<T> {
    const json = typeof object === "string" ? JSON.parse(object) : object;
    if (json.Status === GalaChainResponseType.Error) {
      return {
        Status: GalaChainResponseType.Error,
        Message: json.Message,
        ErrorCode: json.ErrorCode,
        ErrorKey: json.ErrorKey,
        ErrorPayload: json.ErrorPayload
      };
    }
    const raw = json.Data;
    const data =
      constructor !== undefined && raw !== undefined && typeof raw === "object"
        ? (plainToInstance(constructor, raw) as T)
        : (raw as T);
    return { Status: GalaChainResponseType.Success, Data: data };
  }
};

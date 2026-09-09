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
import { ChainError, ErrorCode, deserialize } from "../utils";
import { ClassConstructor, Inferred } from "./dtos";

export const GC_NETWORK_ID = "GC";
export enum GalaChainResponseType {
  Error,
  Success
}

export abstract class GalaChainResponse<T> {
  public readonly Status: GalaChainResponseType;
  public readonly Message?: string;
  public readonly ErrorCode?: number;
  public readonly ErrorKey?: string;
  public readonly ErrorPayload?: unknown;
  public readonly Data?: T;
  public static Success<T>(Data: T): GalaChainResponse<T> {
    return new GalaChainSuccessResponse<T>(Data);
  }
  public static Error<T>(e: { message?: string }): GalaChainResponse<T>;
  public static Error<T>(e: ChainError): GalaChainResponse<T>;
  public static Error<T>(
    Message: string,
    ErrorCode: number,
    ErrorKey: string,
    ErrorPayload?: Record<string, unknown>
  ): GalaChainResponse<T>;

  public static Error<T>(
    MessageOrError: string | { message?: string },
    ErrorCode?: number,
    ErrorKey?: string,
    ErrorPayload?: Record<string, unknown>
  ): GalaChainResponse<T> {
    if (typeof MessageOrError === "string") {
      return new GalaChainErrorResponse<T>(MessageOrError, ErrorCode, ErrorKey, ErrorPayload);
    } else {
      return new GalaChainErrorResponse<T>(MessageOrError);
    }
  }

  public static Wrap<T>(op: Promise<T>): Promise<GalaChainResponse<T>> {
    return op
      .then((Data) => GalaChainResponse.Success<T>(Data))
      .catch((e: { message?: string }) => GalaChainResponse.Error(e));
  }

  public static isSuccess<T>(r: GalaChainResponse<T>): r is GalaChainSuccessResponse<T> {
    return r.Status === GalaChainResponseType.Success;
  }

  public static isError<T>(r: GalaChainResponse<T>): r is GalaChainErrorResponse<T> {
    return r.Status === GalaChainResponseType.Error;
  }

  public static deserialize<T>(
    constructor: ClassConstructor<Inferred<T>> | undefined,
    object: string | Record<string, unknown>
  ): GalaChainResponse<T> {
    const json = typeof object === "string" ? JSON.parse(object) : object;
    if (json.Status === GalaChainResponseType.Error) {
      return deserialize<GalaChainResponse<T>>(GalaChainErrorResponse, json);
    } else if (constructor === undefined) {
      // TODO we are cheating somewhat with response type, fix with method overloading
      return deserialize(GalaChainSuccessResponse, json) as GalaChainResponse<T>;
    } else {
      // nested objects might be not deserialized properly for generics, that's why we deserialize `Data` again
      const data =
        typeof json.Data === "object"
          ? deserialize(constructor, (json.Data ?? {}) as Record<string, unknown>)
          : json.Data;
      return new GalaChainSuccessResponse<T>(data);
    }
  }
}

export class GalaChainErrorResponse<T> extends GalaChainResponse<T> {
  public readonly Status: GalaChainResponseType.Error;
  public readonly Message: string;
  public readonly ErrorCode: number;
  public readonly ErrorKey: string;
  public readonly ErrorPayload?: Record<string, unknown>;

  constructor(message: string, errorCode?: number, errorKey?: string, errorPayload?: Record<string, unknown>);

  constructor(error: { message?: string });

  constructor(error: ChainError);

  constructor(
    messageOrError: string | { message?: string },
    errorCode?: number,
    errorKey?: string,
    errorPayload?: Record<string, unknown>
  ) {
    super();
    if (typeof messageOrError === "string") {
      this.Status = GalaChainResponseType.Error;
      this.Message = messageOrError;
      this.ErrorCode = errorCode ?? ErrorCode.DEFAULT_ERROR;
      this.ErrorKey = errorKey ?? "UNKNOWN";
      this.ErrorPayload = errorPayload;
    } else {
      const chainError = ChainError.from(messageOrError);
      this.Status = GalaChainResponseType.Error;
      this.Message = chainError.message;
      this.ErrorCode = chainError.code;
      this.ErrorKey = chainError.key;
      this.ErrorPayload = chainError.payload;
    }
  }
}

export class GalaChainSuccessResponse<T> extends GalaChainResponse<T> {
  public readonly Status: GalaChainResponseType.Success;
  public readonly Data: T;
  constructor(data: T) {
    super();
    this.Status = GalaChainResponseType.Success;
    this.Data = data;
  }
}

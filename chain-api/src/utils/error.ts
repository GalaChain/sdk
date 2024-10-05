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

type ClassConstructor<T> = {
  new (...args: unknown[]): T;
};

export enum ErrorCode {
  VALIDATION_FAILED = 400,
  UNAUTHORIZED = 401,
  PAYMENT_REQUIRED = 402,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  NO_LONGER_AVAILABLE = 410,
  DEFAULT_ERROR = 500,
  NOT_IMPLEMENTED = 501
}

export interface OptionalChainErrorData {
  message?: string;
  code?: ErrorCode;
  key?: Uppercase<string>;
  payload?: Record<string, unknown>;
}

export abstract class ChainError extends Error implements OptionalChainErrorData {
  /**
   * Status code, a value from ErrorCode enum. It is directly mapped to HTTP,
   * status, it is a constant value to be used by clients integrating with
   * the chain.
   */
  public readonly code: ErrorCode;

  /**
   * An upper case string to be used as a key do diagnose where the error comes
   * from and help with regular development. It should not be used by client
   * integrating with the chain since we don't guarantee it won't change.
   * It is generated from original error class name.
   */
  public readonly key: Uppercase<string>;

  /**
   * Additional information to be used by
   */
  public readonly payload?: Record<string, unknown>;
  constructor(message: string);
  constructor(message: string, key: Uppercase<string>);
  constructor(message: string, key: Uppercase<string>, payload: Record<string, unknown>);
  constructor(message: string, payload: Record<string, unknown> | unknown);

  constructor(
    message: string,
    payloadOrKey?: Record<string, unknown> | Uppercase<string>,
    payloadOpt?: Record<string, unknown>
  ) {
    super(message);
    const [key, payload] =
      typeof payloadOrKey === "string"
        ? [payloadOrKey as Uppercase<string>, payloadOpt]
        : [undefined, payloadOrKey];

    this.key = ChainError.normalizedKey(key ?? this.constructor);
    this.payload = payload;
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  public static normalizedKey(fn: string | Function): Uppercase<string> {
    let rawCode: string;

    if (typeof fn === "string") {
      rawCode = fn;
    } else {
      const regex = /[A-Z]{2,}(?=[A-Z]+[a-z]*[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g;
      rawCode =
        fn.name
          .match(regex)
          ?.join("_")
          .toUpperCase()
          .replace(/_ERROR$/g, "") ?? "UNKNOWN";
    }

    return rawCode.toUpperCase().replace(/[^A-Z0-9_]/g, "_") as Uppercase<string>;
  }

  public static withCode(code: ErrorCode) {
    return class ChainErrorWithCode extends ChainError {
      public readonly code = code;
    } as ClassConstructor<ChainError>;
  }

  /**
   * Allows to execute function getting as a parameter the current error.
   *
   * @param fn
   *
   * @example
   * throw CommonChainError.objectNotFound(objectId).andExec((e) => {
   *   logger.error(e.message);
   * });
   */
  public andExec(fn: (e: ChainError) => void): ChainError {
    fn(this);
    return this;
  }

  public logError(logger: { error(message: string): void }): ChainError {
    logger.error(this.message);
    return this;
  }

  public logWarn(logger: { warn(message: string): void }): ChainError {
    logger.warn(this.message);
    return this;
  }

  public matches(key: ErrorCode | ClassConstructor<ChainError>): boolean {
    if (typeof key === "function") {
      return !!key.name && this.constructor.name === key.name;
    } else {
      return key === this.code;
    }
  }

  /**
   * Maps ChainError to another chain error by error code if `key` param matches
   * current error code or current diagnostic key. Otherwise, returns original
   * error.
   *
   * Useful in rethrowing an error or mapping an error to another one in catch
   * clauses or catch methods in promises.
   *
   * @param key error code or error class to match
   * @param newError new error or a function to create the new error
   */
  public map(
    key: ErrorCode | ClassConstructor<ChainError>,
    newError: ChainError | ((e: ChainError) => ChainError)
  ): ChainError {
    // return original error if there is no key match
    if (!this.matches(key)) {
      return this;
    }

    if (typeof newError === "function") {
      return newError(this);
    }

    return newError;
  }

  public static isChainError(e: object | undefined): e is ChainError {
    return !!e && "key" in e && e.key !== undefined && "code" in e && e.code !== undefined;
  }

  public static from(e: object & { message?: string }): ChainError {
    return this.isChainError(e) ? e : new DefaultError(e?.message ?? "Unknown error occured");
  }

  public static matches(
    e: { message?: string } | ChainError,
    key: ErrorCode | ClassConstructor<ChainError>
  ): boolean {
    return ChainError.isChainError(e) && e.matches(key);
  }

  /**
   * Maps ChainError to another chain error by error code, or returns original
   * error if no error code matches, or returns default chain error if a given
   * parameter is not a ChainError instance.
   *
   * Useful in rethrowing an error or mapping an error to another one in catch
   * clauses or catch methods in promises.
   *
   * @param e original error
   * @param key error code or error class to match
   * @param newError new error or a function to create the new error
   */
  public static map(
    e: { message?: string } | ChainError,
    key: ErrorCode | ClassConstructor<ChainError>,
    newError: ChainError | ((e: ChainError) => ChainError)
  ): ChainError {
    if (ChainError.isChainError(e)) {
      return e.map(key, newError);
    } else {
      return ChainError.from(e);
    }
  }

  /**
   * Maps ChainError to a specified return value by error code, or re-throws
   * original error if no error code matches, or returns default chain error
   * if a given parameter is not a ChainError instance.
   *
   * Useful in rethrowing an error or mapping an error to another one in catch
   * clauses or catch methods in promises.
   *
   * For instance when you want to get an object from chain, and ignore the
   * NOT_FOUND error, but you don't want to mute other errors:
   *
   * ```ts
   * getObjectByKey(...)
   *   .catch((e) => CommonChainError.map(e, ErrorCode.NOT_FOUND));
   * ```
   *
   * @param e original error
   * @param key error code or error class to match
   * @param returnValue value to be returned if error code matches
   */
  public static ignore<T = undefined>(
    e: { message?: string } | ChainError,
    key: ErrorCode | ClassConstructor<ChainError>,
    returnValue: T = undefined as T
  ): T {
    if (ChainError.isChainError(e) && e.matches(key)) {
      return returnValue;
    } else {
      throw e;
    }
  }
}

export class ValidationFailedError extends ChainError.withCode(ErrorCode.VALIDATION_FAILED) {}

export class UnauthorizedError extends ChainError.withCode(ErrorCode.UNAUTHORIZED) {}

export class PaymentRequiredError extends ChainError.withCode(ErrorCode.PAYMENT_REQUIRED) {}

export class ForbiddenError extends ChainError.withCode(ErrorCode.FORBIDDEN) {}

export class NotFoundError extends ChainError.withCode(ErrorCode.NOT_FOUND) {}

export class ConflictError extends ChainError.withCode(ErrorCode.CONFLICT) {}

export class NoLongerAvailableError extends ChainError.withCode(ErrorCode.NO_LONGER_AVAILABLE) {}

export class DefaultError extends ChainError.withCode(ErrorCode.DEFAULT_ERROR) {}

export class RuntimeError extends ChainError.withCode(ErrorCode.DEFAULT_ERROR) {}

export class NotImplementedError extends ChainError.withCode(ErrorCode.NOT_IMPLEMENTED) {}

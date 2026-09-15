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

/**
 * Same brand as @gala-chain/api UserAlias so identity keys stay assignable
 * without importing that package.
 */
export type UserAlias = string & { __userAlias__: void };

export type UserRef = (string & { __userRef__: void }) | UserAlias;

export interface ClassConstructor<T> {
  new (...args: unknown[]): T;
}

// eslint-disable-next-line @typescript-eslint/ban-types
type NonFunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T];

export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

export interface Serializable {
  serialize(): string;
}

export interface CompositeKeyed extends Serializable {
  getCompositeKey(): string;
}

export interface RangeKeyed extends Serializable {
  getRangedKey(): string;
}

export interface ChainErrorLike {
  message: string;
  code: number;
  key: string;
  payload?: unknown;
}

export function isChainErrorLike(value: unknown): value is ChainErrorLike {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ChainErrorLike).message === "string" &&
    typeof (value as ChainErrorLike).code === "number" &&
    typeof (value as ChainErrorLike).key === "string"
  );
}

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

export interface ClassConstructor<T> {
  new (...args: unknown[]): T;
}

type NonFunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends (...args: never[]) => unknown ? never : K;
}[keyof T];

export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

/** Same brand as @gala-chain/api UserAlias so fixture users stay assignable. */
export type UserAlias = string & { __userAlias__: void };

export interface CompositeKeyed {
  getCompositeKey(): string;
  serialize(): string;
}

export interface RangeKeyed {
  getRangedKey(): string;
  serialize(): string;
}

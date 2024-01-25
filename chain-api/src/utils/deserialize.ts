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

type Base<T, BaseT> = T extends BaseT ? T : never;

// `any` is specified on purpose to avoid some compilation errors when `unknown` is provided here
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Inferred<T, BaseT = any> = T extends (infer U)[] ? Base<U, BaseT> : Base<T, BaseT>;

export interface ClassConstructor<T> {
  new (...args: unknown[]): T;
}

const opts = {
  // do NOT use enableImplicitConversion, since the benefits are lost when the library is imported
};

export default function customDeserialize<T, BaseT = unknown>(
  constructor: ClassConstructor<Inferred<T, BaseT>>,
  object: string | Record<string, unknown> | Record<string, unknown>[]
): T {
  if (typeof object === "string") {
    const parsed = JSON.parse(object);
    if (Array.isArray(parsed)) {
      return (parsed as BaseT[]).map((o) => plainToInstance(constructor, o, opts)) as unknown as T;
    } else {
      return plainToInstance(constructor, parsed, opts) as unknown as T;
    }
  } else {
    return plainToInstance(constructor, object, opts) as unknown as T;
  }
}

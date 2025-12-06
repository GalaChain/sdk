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
import { ClassConstructor, NonFunctionProperties } from "@gala-chain/api";
import { plainToInstance } from "class-transformer";

/**
 * Function type for creating instances with optional property overrides.
 *
 * @template T - The target class type
 * @param override - Optional function to modify properties before instance creation
 * @returns Instance of type T
 */
type CreateInstanceFn<T> = (override?: (plain: NonFunctionProperties<T>) => NonFunctionProperties<T>) => T;

/**
 * Creates a function which builds and instance from plain object and optional
 * override function to alter values in target.
 *
 * @param cls Target class, which instance is going to be returned
 * @param plain source plain object
 */
export function createInstanceFn<T>(
  cls: ClassConstructor<T>,
  plain: NonFunctionProperties<T>
): CreateInstanceFn<T> {
  return (override) =>
    plainToInstance<T, NonFunctionProperties<T>>(cls, !override ? plain : override(plain)) as T;
}

/**
 * Creates a factory function that returns a copy of the provided object.
 *
 * @template T - Object type extending Record<string, unknown>
 * @param t - Object to return from the factory function
 * @returns Factory function that returns the object
 *
 * @example
 * ```typescript
 * const factory = createPlainFn({ name: "test", value: 123 });
 * const obj = factory(); // { name: "test", value: 123 }
 * ```
 */
export function createPlainFn<T extends Record<string, unknown>>(t: T): () => T {
  return () => t;
}

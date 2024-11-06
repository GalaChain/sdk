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
import { NonFunctionProperties } from "@gala-chain/api";

export type PublicProperties<T> = {
  -readonly [K in keyof T]: T[K]; // Remove readonly
};

type NonFunctionPropertiesAndReplaceRecursive<T> = {
  [K in keyof NonFunctionProperties<T>]: NonFunctionProperties<T>[K] extends object
    ? NonFunctionPropertiesAndReplaceRecursive<NonFunctionProperties<T>[K]>
    : NonFunctionProperties<T>[K];
};

export type ConstructorArgs<T> = NonFunctionPropertiesAndReplaceRecursive<T>;

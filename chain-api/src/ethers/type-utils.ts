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
import BigNumber from "bignumber.js";

import { NonFunctionProperties } from "../types";

// Recursive type to pick non-function properties and replace specified types
type NonFunctionPropertiesAndReplaceRecursive<T, From, To> = {
  [K in keyof NonFunctionProperties<T>]: NonFunctionProperties<T>[K] extends From
    ? To
    : NonFunctionProperties<T>[K] extends object
      ? NonFunctionPropertiesAndReplaceRecursive<NonFunctionProperties<T>[K], From, To>
      : NonFunctionProperties<T>[K];
};

export type ConstructorArgs<T> = NonFunctionPropertiesAndReplaceRecursive<T, BigNumber, string>;

/**
 * The following types are from ethers maths.ts
 */
/**
 *  Any type that can be used where a numeric value is needed.
 */
export type Numeric = number | bigint;

/**
 *  Any type that can be used where a big number is needed.
 */
export type BigNumberish = string | Numeric;

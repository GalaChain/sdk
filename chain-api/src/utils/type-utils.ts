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

// Utility type to pick only optional properties of a class
type OptionalProperties<T> = Pick<T, { [K in keyof T]: T[K] extends Required<T>[K] ? never : K }[keyof T]>;

// Utility type to require only the required properties of a class
type RequiredProperties<T> = Required<
  Pick<T, { [K in keyof T]: T[K] extends Required<T>[K] ? K : never }[keyof T]>
>;

type OmitFields =
  | "validate"
  | "validateOrReject"
  | "serialize"
  | "deserialize"
  | "sign"
  | "signed"
  | "isSignatureValid";

export type ConstructorArgs<T> = RequiredProperties<Omit<T, OmitFields>> &
  Partial<OptionalProperties<Omit<T, OmitFields>>>;

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

/*
 * Creates valid chain object. Throws error in case of failure
 */
import { ChainObject } from "./ChainObject";
import { RangedChainObject } from "./RangedChainObject";
import { ClassConstructor, NonFunctionProperties } from "./dtos";

export async function createValidChainObject<T extends ChainObject>(
  constructor: ClassConstructor<T>,
  plain: NonFunctionProperties<T>
): Promise<T> {
  const obj = new constructor();
  Object.entries(plain).forEach(([k, v]) => {
    obj[k] = v;
  });

  await obj.validateOrReject();

  return obj;
}

export async function createValidRangedChainObject<T extends RangedChainObject>(
  constructor: ClassConstructor<T>,
  plain: NonFunctionProperties<T>
): Promise<T> {
  const obj = new constructor();
  Object.entries(plain).forEach(([k, v]) => {
    obj[k] = v;
  });

  await obj.validateOrReject();

  return obj;
}

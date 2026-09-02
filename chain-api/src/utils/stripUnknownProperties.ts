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
import { getMetadataStorage } from "class-validator";

import { ChainKeyMetadata } from "./chain-decorators";

type ClassLike = { new (...args: unknown[]): unknown };

const knownPropertyCache = new WeakMap<ClassLike, Set<string>>();

function getKnownPropertyNames(constructor: ClassLike): Set<string> {
  const cached = knownPropertyCache.get(constructor);
  if (cached) {
    return cached;
  }

  const names = new Set<string>();

  const metadatas = getMetadataStorage().getTargetValidationMetadatas(constructor, "", false, false);
  for (const metadata of metadatas) {
    names.add(metadata.propertyName);
  }

  let proto = constructor.prototype;
  while (proto && proto !== Object.prototype) {
    const fields: ChainKeyMetadata[] = Reflect.getOwnMetadata("galachain:chainkey", proto) || [];
    for (const field of fields) {
      names.add(String(field.key));
    }
    proto = Object.getPrototypeOf(proto);
  }

  knownPropertyCache.set(constructor, names);
  return names;
}

function shouldRecurse(value: unknown): value is object {
  return (
    value !== null &&
    typeof value === "object" &&
    !BigNumber.isBigNumber(value) &&
    !(value instanceof Date) &&
    !Buffer.isBuffer(value)
  );
}

/**
 * Removes properties that are not declared on the class (no validator and no @ChainKey).
 * Used when reading ChainObject / RangedChainObject values that may still carry fields
 * removed from the class definition.
 */
export function stripUnknownProperties(instance: object, visited = new WeakSet<object>()): void {
  if (visited.has(instance)) {
    return;
  }
  visited.add(instance);

  if (Array.isArray(instance)) {
    for (const item of instance) {
      if (shouldRecurse(item)) {
        stripUnknownProperties(item, visited);
      }
    }
    return;
  }

  const known = getKnownPropertyNames(instance.constructor as ClassLike);
  for (const key of Object.keys(instance)) {
    if (!known.has(key)) {
      delete instance[key];
      continue;
    }

    const value = instance[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        if (shouldRecurse(item) && item.constructor !== Object) {
          stripUnknownProperties(item, visited);
        }
      }
    } else if (shouldRecurse(value) && value.constructor !== Object) {
      stripUnknownProperties(value, visited);
    }
  }
}

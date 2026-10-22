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
import { classToPlain as instanceToPlain } from "class-transformer";

import { ChainKeyMetadata } from "../utils";
import { ChainObject } from "./ChainObject";

export function compositeKeyOmittingUnset(
  instance: ChainObject,
  indexKey: string,
  omitUnsetKeys: string[]
): string {
  const fields: ChainKeyMetadata[] =
    Reflect.getOwnMetadata("galachain:chainkey", Object.getPrototypeOf(instance)) || [];
  const plain = instanceToPlain(instance);
  const keyParts = fields
    .sort((a, b) => a.position - b.position)
    .filter((field) => {
      const name = field.key.toString();
      if (!omitUnsetKeys.includes(name)) {
        return true;
      }
      const live = instance[name];
      const value = live !== undefined ? live : plain[name];
      return value !== undefined && value !== null && `${value}` !== "";
    })
    .map((field) => {
      const key = field.key.toString();
      const live = instance[key];
      if (typeof live?.toStringKey === "function") {
        return live.toStringKey();
      }
      if (omitUnsetKeys.includes(key) && live !== undefined && live !== null && `${live}` !== "") {
        return `${live}`;
      }
      return plain[key];
    });

  return ChainObject.getCompositeKeyFromParts(indexKey, keyParts);
}

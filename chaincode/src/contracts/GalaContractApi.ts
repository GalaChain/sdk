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
import { MethodAPI, NotFoundError, RuntimeError } from "@gala-chain/api";

// singleton object containing the API
const api: Record<string, MethodAPI[]> = {};

// eslint-disable-next-line @typescript-eslint/ban-types
export function updateApi(target: Object, methodApi: MethodAPI): void {
  const className = target.constructor?.name;

  if (className === undefined) {
    throw new RuntimeError(`target.constructor?.name is undefined on ${target}`);
  }

  if (!api[className]) {
    const parentClassName = Object.getPrototypeOf(target).constructor.name;
    api[className] = [...(api[parentClassName] ?? [])]; // copy all from parent class
  }
  api[className].push(methodApi);
  api[className].sort((a, b) => a.methodName.localeCompare(b.methodName));
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function getApiMethods(target: Object): MethodAPI[] {
  const className = target.constructor?.name;
  return api?.[className] ?? [];
}

export function getApiMethod(
  // eslint-disable-next-line @typescript-eslint/ban-types
  target: Object,
  methodName: string,
  additionalFilter: (method: MethodAPI) => boolean = () => true
): MethodAPI {
  const apiMethods = getApiMethods(target).filter(additionalFilter);
  const method = apiMethods.find(
    (m) => (m.apiMethodName && m.apiMethodName === methodName) || m.methodName === methodName
  );

  if (method) {
    return method;
  }

  // check if method exists
  const availableMethods = apiMethods.map((m) => m.apiMethodName ?? m.methodName).sort();
  throw new NotFoundError(
    `Method ${methodName} is not available. Available methods: ${availableMethods.join(", ")}`
  );
}

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
import { ValidationFailedError } from "../utils";
import { UserAliasValidationResult, meansValidUserAlias, validateUserAlias } from "../validators";

/**
 * @description
 *
 * Type for user alias. Technically it is a string, but it has an additional
 * marker (tag) to distinguish it from other strings at compilation level,
 * and mark it was actually validated as user alias.
 *
 * You should not cast any string to this type, but instead use `resolveUserAlias`
 * function to get the user alias.
 */
export type UserAlias = string & { __userAlias__: void };

export function asValidUserAlias(value: unknown): UserAlias {
  const result = validateUserAlias(value);
  if (!meansValidUserAlias(result)) {
    const key = UserAliasValidationResult[result];
    throw new ValidationFailedError(`Invalid user alias (${key}): ${value}`);
  }
  return value as UserAlias;
}

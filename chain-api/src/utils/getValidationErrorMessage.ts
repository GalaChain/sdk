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
import { ValidationError } from "class-validator";

export interface ValidationErrorInfo {
  message: string;
  details: string[];
}

export function getValidationErrorInfo(validationErrors: ValidationError[]): ValidationErrorInfo {
  const detailsArray = validationErrors.map((e) => {
    const targetInfo = typeof e.target === "object" ? ` of ${e.target.constructor?.name ?? e.target}` : "";
    const intro = `Property '${e.property}'${targetInfo} has failed the following constraints:`;
    const constraints = e.constraints ?? {};
    const constraintsKeys = Object.keys(constraints).sort();
    const details = constraintsKeys.map((k) => `${k}: ${constraints[k]}`);
    return { message: `${intro} ${constraintsKeys.join(", ")}`, details };
  });

  return {
    message: detailsArray.map((d) => d.message).join(". "),
    details: detailsArray.reduce((all, d) => [...all, ...d.details], [])
  };
}

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
import { Transform, Type } from "class-transformer";
import { IsIn, ValidateBy, ValidationOptions, buildMessage } from "class-validator";
import "reflect-metadata";

import { BigNumberIsNotInfinity, IsBigNumber } from "./decorators";

type ClassConstructor<Signature = unknown[]> = {
  new (args: Signature): unknown;
};

export function ApplyConstructor<ClassInstance, ConstructorSignature, SerializedType>(
  Constructor: ClassConstructor<ConstructorSignature>,
  fromTransformer: (propertyValue: SerializedType) => ClassInstance,
  toTransformer: (classInstance: ClassInstance) => SerializedType
) {
  return function Wrapper() {
    const type = Type(() => Constructor);

    const from = Transform(({ value }) => fromTransformer(value), {
      toClassOnly: true
    });

    const to = Transform(({ value }) => toTransformer(value), {
      toPlainOnly: true
    });

    // eslint-disable-next-line @typescript-eslint/ban-types
    return function (target: Object, propertyKey: string | symbol) {
      type(target, propertyKey);
      from(target, propertyKey);
      to(target, propertyKey);
    };
  };
}

// create BigNumber object only if we have proper input that matches .toFixed()
const parseBigNumber = (value: unknown): unknown => {
  if (typeof value === "string") {
    const bn = new BigNumber(value);
    return bn.toFixed() === value ? bn : value;
  } else {
    return value;
  }
};

export const BigNumberProperty = (opts?: { allowInfinity: boolean }) => {
  const type = Type(() => BigNumber);

  const from = Transform(({ value }) => parseBigNumber(value), {
    toClassOnly: true
  });

  const to = Transform(({ value }) => value.toFixed(), {
    toPlainOnly: true
  });

  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (target: Object, propertyKey) {
    type(target, propertyKey);
    from(target, propertyKey);
    to(target, propertyKey);

    IsBigNumber()(target, propertyKey);
    if (!opts?.allowInfinity) {
      BigNumberIsNotInfinity()(target, propertyKey);
    }
  };
};

export const BigNumberArrayProperty = ApplyConstructor(
  BigNumber,
  (values: string[]) => values.map((value) => parseBigNumber(value)),
  (values: BigNumber[]) => values.map((value) => value.toFixed())
);

/*
 * Mark this field has enum value. Works only for standard enums (numbers as values).
 */
export function EnumProperty(enumType: object, validationOptions?: ValidationOptions) {
  // enum obj contains reverse mappings: {"0":"Use", ...,"Use":0, ...}
  const keysAndValues = Object.values(enumType);
  const values = keysAndValues.filter((v) => typeof v === "number").sort();
  const mappingInfo = values.map((v) => `${v} - ${enumType[v]}`).join(", ");

  return ValidateBy(
    {
      name: "enumProperty",
      constraints: [values, enumType, mappingInfo], // enumType and mappingInfo is added here to use this information outside this lib
      validator: {
        validate: (value, args) => {
          const possibleValues = args?.constraints[0];
          return !Array.isArray(possibleValues) || possibleValues.some((v) => v === value);
        },
        defaultMessage: buildMessage(
          (prefix) =>
            `${prefix}$property must be one of the following values: $constraint1, where $constraint3`,
          validationOptions
        )
      }
    },
    validationOptions
  );
}

/*
 * Mark this field has enum value. Works only for string enums (strings as values).
 */
export function StringEnumProperty(enumType: object, validationOptions?: ValidationOptions) {
  const values = Object.values(enumType).sort();
  return IsIn(values, validationOptions);
}

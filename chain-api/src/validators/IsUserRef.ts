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
import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator
} from "class-validator";

import { signatures } from "../utils";
import { UserAliasValidationResult, validateUserAlias } from "./IsUserAlias";

export enum UserRefValidationResult {
  VALID_USER_ALIAS,
  VALID_SYSTEM_USER,
  VALID_ETH_ADDRESS,
  INVALID_ETH_USER_ALIAS,
  INVALID_TON_USER_ALIAS,
  INVALID_FORMAT
}

export function meansValidUserRef(result: UserRefValidationResult) {
  return (
    result === UserRefValidationResult.VALID_USER_ALIAS ||
    result === UserRefValidationResult.VALID_SYSTEM_USER ||
    result === UserRefValidationResult.VALID_ETH_ADDRESS
  );
}

const userAliasValidationResultMapping = {
  [UserAliasValidationResult.VALID_USER_ALIAS]: UserRefValidationResult.VALID_USER_ALIAS,
  [UserAliasValidationResult.VALID_SYSTEM_USER]: UserRefValidationResult.VALID_SYSTEM_USER,
  [UserAliasValidationResult.INVALID_ETH_USER_ALIAS]: UserRefValidationResult.INVALID_ETH_USER_ALIAS,
  [UserAliasValidationResult.INVALID_TON_USER_ALIAS]: UserRefValidationResult.INVALID_TON_USER_ALIAS
};

export function validateUserRef(value: unknown): UserRefValidationResult {
  if (typeof value !== "string" || value.length === 0) {
    return UserRefValidationResult.INVALID_FORMAT;
  }

  // check if the value contains a valid user alias
  const userAliasValidationResult = userAliasValidationResultMapping[validateUserAlias(value)];
  if (userAliasValidationResult !== undefined) {
    return userAliasValidationResult;
  }

  // check if this is a valid Ethereum address
  if (signatures.isChecksumedEthAddress(value) || signatures.isLowercasedEthAddress(value)) {
    return UserRefValidationResult.VALID_ETH_ADDRESS;
  }

  return UserRefValidationResult.INVALID_FORMAT;
}

const customMessages = {
  [UserRefValidationResult.INVALID_ETH_USER_ALIAS]:
    "User ref starting with 'eth|' must end with valid checksumed eth address without 0x prefix.",
  [UserRefValidationResult.INVALID_TON_USER_ALIAS]:
    "User ref starting with 'ton|' must end with valid bounceable base64 TON address."
};

const genericMessage =
  "Expected a valid user alias ('client|<user-id>', or 'eth|<checksumed-eth-addr>', " +
  "or 'ton|<chain:ton-address>', or valid system-level username), or valid Ethereum address.";

@ValidatorConstraint({ async: false })
class IsUserRefConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if (Array.isArray(value)) {
      return value.every((val) => this.validate(val, args));
    }
    const result = validateUserRef(value);
    return meansValidUserRef(result);
  }

  defaultMessage(args: ValidationArguments): string {
    const value = args.value;
    if (Array.isArray(value)) {
      const invalidValues = value.filter((val) => !meansValidUserRef(validateUserRef(val)));
      return `${args.property} property with values ${invalidValues} are not valid GalaChain user ref. ${genericMessage}`;
    }
    const result = validateUserRef(args.value);
    const details = customMessages[result] ?? genericMessage;
    return `${args.property} property with value ${args.value} is not a valid GalaChain user ref. ${details}`;
  }
}

export function IsUserRef(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isUserRef",
      target: object.constructor,
      propertyName,
      options,
      constraints: [],
      validator: IsUserRefConstraint
    });
  };
}

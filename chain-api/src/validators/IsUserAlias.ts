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

export enum UserAliasValidationResult {
  VALID_USER_ALIAS,
  VALID_SYSTEM_USER,
  INVALID_ETH_USER_ALIAS,
  INVALID_TON_USER_ALIAS,
  INVALID_FORMAT
}

function isValid(result: UserAliasValidationResult) {
  return (
    result === UserAliasValidationResult.VALID_USER_ALIAS ||
    result === UserAliasValidationResult.VALID_SYSTEM_USER
  );
}

const customMessages = {
  [UserAliasValidationResult.INVALID_ETH_USER_ALIAS]:
    "User alias starting with 'eth|' must end with valid checksumed eth address.",
  [UserAliasValidationResult.INVALID_TON_USER_ALIAS]:
    "User alias starting with 'ton|' must end with valid bounceable base64 TON address."
};

const genericMessage =
  "Expected string following the format of 'client|<user-id>', or 'eth|<checksumed-eth-addr>', " +
  "or 'ton|<chain:ton-address>', or valid system-level username.";

export function isValidSystemUser(value: string): boolean {
  return value === "EthereumBridge" || value === "TonBridge" || /^GalaChainBridge-\d+$/.test(value);
}

/**
 * @description
 *
 * Validates a provided user alias. As of 2024-10, The following alias types
 * are supported: legacy client| and service| prefixed aliases,
 * eth| and ton| prefixed addresses, and internally reserved identities.
 *
 * @param value
 * @returns UserRefValidationResult
 */
function validateUserAlias(value: unknown): UserRefValidationResult {
  if (typeof value !== "string" || value.length === 0) {
    return UserAliasValidationResult.INVALID_FORMAT;
  }

  const parts = value.split("|");

  if (parts.length === 1) {
    if (isValidSystemUser(parts[0])) {
      return UserAliasValidationResult.VALID_SYSTEM_USER;
    } else {
      return UserAliasValidationResult.INVALID_FORMAT;
    }
  }

  if (parts.length === 2) {
    if ((parts[0] === "client" || parts[0] === "service") && parts[1].length > 0) {
      return UserAliasValidationResult.VALID_USER_ALIAS;
    }

    if (parts[0] === "eth") {
      if (signatures.isChecksumedEthAddress(parts[1])) {
        return UserAliasValidationResult.VALID_USER_ALIAS;
      } else {
        return UserAliasValidationResult.INVALID_ETH_USER_ALIAS;
      }
    }

    if (parts[0] === "ton") {
      if (signatures.ton.isValidTonAddress(parts[1])) {
        return UserAliasValidationResult.VALID_USER_ALIAS;
      } else {
        return UserAliasValidationResult.INVALID_TON_USER_ALIAS;
      }
    }
  }

  return UserAliasValidationResult.INVALID_FORMAT;
}

@ValidatorConstraint({ async: false })
class IsUserAliasConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if (Array.isArray(value)) {
      return value.every((val) => this.validate(val, args));
    }
    const result = validateUserAlias(value);
    return isValid(result);
  }

  defaultMessage(args: ValidationArguments): string {
    const value = args.value;
    if (Array.isArray(value)) {
      const invalidValues = value.filter((val) => !isValid(validateUserAlias(val)));
      return `${args.property} property with values ${invalidValues} are not valid GalaChain user aliases. ${genericMessage}`;
    }
    const result = validateUserAlias(args.value);
    const details = customMessages[result] ?? genericMessage;
    return `${args.property} property with value ${args.value} is not a valid GalaChain user alias. ${details}`;
  }
}

/**
 * @description
 *
 * Used to register a decorator for class validation.
 * Validates against IsUserAliasConstraint.
 * See also IsUserAliasConstraint, validateUserAlias.
 * As of 2024-10, The following alias types
 * are supported: legacy client| and service| prefixed aliases,
 * eth| and ton| prefixed addresses, and internally reserved identities.
 *
 * @param options
 *
 */
export function IsUserAlias(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isUserAlias",
      target: object.constructor,
      propertyName,
      options,
      constraints: [],
      validator: IsUserAliasConstraint
    });
  };
}

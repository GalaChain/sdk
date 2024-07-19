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
import { ValidationArguments, ValidationOptions, registerDecorator } from "class-validator";

import signatures from "../utils/signatures";

enum UserRefValidationResult {
  VALID_USER_ALIAS,
  VALID_SYSTEM_USER,
  INVALID_ETH_USER_ALIAS,
  INVALID_FORMAT
}

const customMessages = {
  [UserRefValidationResult.INVALID_ETH_USER_ALIAS]:
    "User alias starting with 'eth|' must end with valid checksumed eth address."
};

const genericMessage =
  "Expected string following the format of 'client|<user-id>', or 'eth|<checksumed-eth-addr>', " +
  "or valid system-level username.";

function validateUserRef(value: unknown): UserRefValidationResult {
  if (typeof value !== "string" || value.length === 0) {
    return UserRefValidationResult.INVALID_FORMAT;
  }

  const parts = value.split("|");

  if (parts.length === 1) {
    if (parts[0] === "EthereumBridge" || /^GalaChainBridge-\d+$/.test(parts[0])) {
      return UserRefValidationResult.VALID_SYSTEM_USER;
    } else {
      return UserRefValidationResult.INVALID_FORMAT;
    }
  }

  if (parts.length === 2) {
    if (parts[0] === "client" && parts[1].length > 0) {
      return UserRefValidationResult.VALID_USER_ALIAS;
    }

    if (parts[0] === "eth") {
      if (signatures.isChecksumedEthAddress(parts[1])) {
        return UserRefValidationResult.VALID_USER_ALIAS;
      } else {
        return UserRefValidationResult.INVALID_ETH_USER_ALIAS;
      }
    }
  }

  return UserRefValidationResult.INVALID_FORMAT;
}

export function IsUserAlias(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    // validation of the input
    registerDecorator({
      name: "IsUserAlias",
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate(value: unknown) {
          const result = validateUserRef(value);
          return (
            result === UserRefValidationResult.VALID_USER_ALIAS ||
            result === UserRefValidationResult.VALID_SYSTEM_USER
          );
        },
        defaultMessage(args: ValidationArguments) {
          // need to validate again to serve detailed custom message
          const result = validateUserRef(args.value);
          const details = customMessages[result] ?? genericMessage;

          return `${args.property} property with value ${args.value} is not a valid GalaChain user alias. ${details}`;
        }
      }
    });
  };
}

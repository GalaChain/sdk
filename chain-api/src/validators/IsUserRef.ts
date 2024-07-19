import { ValidationArguments, ValidationOptions, registerDecorator } from "class-validator";

import signatures from "../utils/signatures";

enum UserRefValidationResult {
  VALID_USER_ALIAS,
  VALID_LOWERCASED_ADDR,
  VALID_CHECKSUMED_ADDR,
  INVALID_ETH_USER_ALIAS,
  INVALID_ETH_ADDR,
  INVALID_FORMAT
}

const customMessages = {
  [UserRefValidationResult.INVALID_ETH_USER_ALIAS]:
    "User alias starting with 'eth|' must end with valid checksumed eth address.",
  [UserRefValidationResult.INVALID_ETH_ADDR]:
    "Invalid eth address provided. If some characters are upper-cased, please make sure it is checksumed properly."
};

const genericMessage =
  "Expected string following the format of 'client|<user-id>', or 'eth|<checksumed-eth-addr>', or valid eth address (either checksumed or lowercased).";

function validateUserRef(value: unknown): UserRefValidationResult {
  if (typeof value !== "string" || value.length === 0) {
    return UserRefValidationResult.INVALID_FORMAT;
  }

  const [prefix, userId] = value.split("|");

  if (prefix === "client" && userId.length > 0) {
    return UserRefValidationResult.VALID_USER_ALIAS;
  }

  if (prefix === "eth") {
    if (signatures.isChecksumedEthAddress(userId)) {
      return UserRefValidationResult.VALID_USER_ALIAS;
    } else {
      return UserRefValidationResult.INVALID_ETH_USER_ALIAS;
    }
  }

  if (userId === undefined) {
    if (signatures.isLowercasedEthAddress(prefix)) {
      return UserRefValidationResult.VALID_LOWERCASED_ADDR;
    } else if (signatures.isChecksumedEthAddress(prefix)) {
      return UserRefValidationResult.VALID_CHECKSUMED_ADDR;
    } else {
      return UserRefValidationResult.INVALID_ETH_ADDR;
    }
  }

  return UserRefValidationResult.INVALID_FORMAT;
}

export function IsUserRef(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "IsUserId",
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate(value: unknown) {
          const result = validateUserRef(value);
          return (
            result === UserRefValidationResult.VALID_USER_ALIAS ||
            result === UserRefValidationResult.VALID_LOWERCASED_ADDR ||
            result === UserRefValidationResult.VALID_CHECKSUMED_ADDR
          );
        },
        defaultMessage(args: ValidationArguments) {
          // need to validate again to serve detailed custom message
          const result = validateUserRef(args.value);
          const details = customMessages[result] ?? genericMessage;

          return `${args.property} property with value ${args.value} is not a valid GalaChain user identifier. ${details}`;
        }
      }
    });
  };
}

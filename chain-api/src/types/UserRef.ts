import { ValidationFailedError } from "../utils";
import { UserRefValidationResult, meansValidUserRef, validateUserRef } from "../validators";
import { UserAlias } from "./UserAlias";

/**
 * @description
 *
 * Type for user ref. Technically it is a string, but it has an additional
 * marker (tag) to distinguish it from other strings at compilation level,
 * and mark it was actually validated as user ref. Also, any user alias is valid
 * user ref as well.
 *
 * You may use `asValidUserRef` function to validate any string as user ref and return
 * it as `UserRef` type.
 */
export type UserRef = (string & { __userRef__: void }) | UserAlias;

export function asValidUserRef(value: unknown): UserRef {
  const result = validateUserRef(value);
  if (!meansValidUserRef(result)) {
    const key = UserRefValidationResult[result];
    throw new ValidationFailedError(`Invalid user reference (${key}): ${value}`);
  }
  return value as UserRef;
}

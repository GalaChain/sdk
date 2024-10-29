/**
 * @description
 *
 * Type for user alias. Technically it is a string, but it has an additional
 * marker (tag) to distinguish it from other strings at compilation level,
 * and mark it was actually validated as user ref. Also any user alias is valid
 * user ref as well.
 *
 * You may use `asValidUserRef` function to validate any string as user ref and return
 * it as `UserRef` type.
 */
export type UserRef = string & ({ __userRef__: void } | { __userAlias__: void });

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

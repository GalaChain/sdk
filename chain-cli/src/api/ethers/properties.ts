/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 *  Property helper functions.
 *
 *  @_subsection api/utils:Properties  [about-properties]
 */

function checkType(value: any, type: string, name: string): void {
  const types = type.split("|").map((t) => t.trim());
  for (let i = 0; i < types.length; i++) {
    switch (type) {
      case "any":
        return;
      case "bigint":
      case "boolean":
      case "number":
      case "string":
        if (typeof value === type) {
          return;
        }
    }
  }

  const error: any = new Error(`invalid value for type ${type}`);
  error.code = "INVALID_ARGUMENT";
  error.argument = `value.${name}`;
  error.value = value;

  throw error;
}

/**
 *  Assigns the %%values%% to %%target%% as read-only values.
 *
 *  It %%types%% is specified, the values are checked.
 */
export function defineProperties<T>(
  target: T,
  values: { [K in keyof T]?: T[K] },
  types?: { [K in keyof T]?: string }
): void {
  for (const key in values) {
    const value = values[key];

    const type = types ? types[key] : null;
    if (type) {
      checkType(value, type, key);
    }

    Object.defineProperty(target, key, { enumerable: true, value, writable: false });
  }
}

import { assert, assertArgument } from "../errors";
import { BigNumberish } from "../type-utils";

const BN_0 = BigInt(0);
// IEEE 754 support 53-bits of mantissa
const maxValue = 0x1fffffffffffff;

/**
 *  Gets a //number// from %%value%%. If it is an invalid value for
 *  a //number//, then an ArgumentError will be thrown for %%name%%.
 */
export function getNumber(value: BigNumberish, name?: string): number {
  switch (typeof value) {
    case "bigint":
      assertArgument(value >= -maxValue && value <= maxValue, "overflow", name || "value", value);
      return Number(value);
    case "number":
      assertArgument(Number.isInteger(value), "underflow", name || "value", value);
      assertArgument(value >= -maxValue && value <= maxValue, "overflow", name || "value", value);
      return value;
    case "string":
      try {
        if (value === "") {
          throw new Error("empty string");
        }
        return getNumber(BigInt(value), name);
      } catch (e: any) {
        assertArgument(false, `invalid numeric string: ${e.message}`, name || "value", value);
      }
  }
  assertArgument(false, "invalid numeric value", name || "value", value);
}

/**
 *  Gets a BigInt from %%value%%. If it is an invalid value for
 *  a BigInt, then an ArgumentError will be thrown for %%name%%.
 */
export function getBigInt(value: BigNumberish, name?: string): bigint {
  switch (typeof value) {
    case "bigint":
      return value;
    case "number":
      assertArgument(Number.isInteger(value), "underflow", name || "value", value);
      assertArgument(value >= -maxValue && value <= maxValue, "overflow", name || "value", value);
      return BigInt(value);
    case "string":
      try {
        if (value === "") {
          throw new Error("empty string");
        }
        if (value[0] === "-" && value[1] !== "-") {
          return -BigInt(value.substring(1));
        }
        return BigInt(value);
      } catch (e: any) {
        assertArgument(false, `invalid BigNumberish string: ${e.message}`, name || "value", value);
      }
  }
  assertArgument(false, "invalid BigNumberish value", name || "value", value);
}

/**
 *  Returns %%value%% as a bigint, validating it is valid as a bigint
 *  value and that it is positive.
 */
export function getUint(value: BigNumberish, name?: string): bigint {
  const result = getBigInt(value, name);
  assert(result >= BN_0, "unsigned value cannot be negative", "NUMERIC_FAULT", {
    fault: "overflow",
    operation: "getUint",
    value
  });
  return result;
}

/**
 *  Converts %%value%% to a Big Endian Uint8Array.
 */
export function toBeArray(_value: BigNumberish): Uint8Array {
  const value = getUint(_value, "value");

  if (value === BN_0) {
    return new Uint8Array([]);
  }

  let hex = value.toString(16);
  if (hex.length % 2) {
    hex = "0" + hex;
  }

  const result = new Uint8Array(hex.length / 2);
  for (let i = 0; i < result.length; i++) {
    const offset = i * 2;
    result[i] = parseInt(hex.substring(offset, offset + 2), 16);
  }

  return result;
}

import BigNumber from "bignumber.js";

/**
 *
 * @param input It will take any object as input and convert all the bignumber to string inside it
 * @returns Modified Object with all the bignumbers turned to string
 */
export function formatBigNumber(input: any): any {
  if (BigNumber.isBigNumber(input)) {
    return input.f18().toString();
  } else if (Array.isArray(input)) {
    return input.map(formatBigNumber);
  } else if (input !== null && typeof input === "object") {
    return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, formatBigNumber(value)]));
  }
  return input;
}

/**
 *
 * @param input It will take any object as input and convert all the bignumber to string inside it
 * @returns Modified Object with all the bignumbers turned to string
 */
export function formatBigNumberDecimals(input: any): any {
  if (BigNumber.isBigNumber(input)) {
    return input.f18();
  } else if (Array.isArray(input)) {
    return input.map(formatBigNumber);
  } else if (input !== null && typeof input === "object") {
    return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, formatBigNumber(value)]));
  }
  return input;
}

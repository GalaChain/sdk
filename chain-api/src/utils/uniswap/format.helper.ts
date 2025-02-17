import BigNumber from "bignumber.js";

export const requirePosititve = (...params) => {
  for (const positive of params) {
    if (positive instanceof BigNumber) {
      if (positive.lt(new BigNumber(0))) {
        throw new Error("Uint Out of Bounds error :Uint");
      }
    }
  }
};
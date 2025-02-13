import BigNumber from "bignumber.js";

declare module "bignumber.js" {
  interface BigNumber {
    f18(): BigNumber;
  }
}

BigNumber.prototype.f18 = function (round: BigNumber.RoundingMode = BigNumber.ROUND_DOWN): BigNumber {
  return new BigNumber(this.toFixed(18, round));
};

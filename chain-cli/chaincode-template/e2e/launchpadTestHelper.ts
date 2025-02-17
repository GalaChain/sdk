import Decimal from "decimal.js";

const A = new Decimal("0.00001650667150665");
const B = new Decimal("0.000001166069");
const SCALE = new Decimal(10).pow(0);

export function calMemeTokensOutTest(totalSupply: number, amount: number): string {
  const totalSupplyF = new Decimal(totalSupply).div(SCALE);
  const amountF = new Decimal(amount).div(SCALE);

  const expPart = B.times(totalSupplyF).exp();
  const logPart = amountF.times(B).div(A).plus(expPart).ln();
  const result = logPart.div(B).minus(totalSupplyF).times(SCALE);

  return result.toFixed(18, Decimal.ROUND_DOWN);
}

export function calNativeTokensInTest(totalSupply, amount) {
  const totalSupplyF = new Decimal(totalSupply).div(SCALE);
  const amountF = new Decimal(amount).div(SCALE);
  return A.times(Decimal.exp(B.times(totalSupplyF.plus(amountF))).minus(Decimal.exp(B.times(totalSupplyF))))
    .div(B)
    .times(SCALE);
}

export function calMemeTokensInTest(totalSupply, amount) {
  const totalSupplyF = new Decimal(totalSupply).div(SCALE);
  const amountF = new Decimal(amount).div(SCALE);

  const expTerm = Decimal.exp(totalSupplyF.times(B)); // e^(totalSupply * B)
  const amountTerm = amountF.times(B).div(A); // (amount * B) / A
  const logInput = expTerm.minus(amountTerm); // The input to ln()

  // Ensure the logarithm input is valid
  if (logInput.lte(0)) {
    console.error(`Error: ln() input is non-positive: ${logInput}`);
    return new Decimal(0);
  }

  return totalSupplyF.minus(Decimal.ln(logInput).div(B)).times(SCALE);
}

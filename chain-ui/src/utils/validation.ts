import BigNumber from 'bignumber.js'

export const validate = <T>(
  data: T,
  validator: ((data: T) => string) | Array<(data: T) => string>
) => {
  const validators = Array.isArray(validator) ? validator : [validator]
  return validators.map((v) => v(data)).filter((err) => !!err)
}

export const getStepSizeFromDecimals = (decimals: number) => {
  return BigNumber(`1e-${decimals}`)
}

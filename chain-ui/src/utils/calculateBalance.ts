import type { TokenAllowance, TokenBalance, TokenClass } from '@gala-chain/api'
import BigNumber from 'bignumber.js'

export const calculateAvailableBalance = (balance: TokenBalance) => {
  const now = Date.now()
  const locked = balance?.lockedHolds?.reduce((acc, hold) => {
    if (hold.expires && hold.expires < now) {
      return acc
    }
    return acc.plus(hold.quantity)
  }, BigNumber(0))
  const available = BigNumber(balance?.quantity ?? 0).minus(locked ?? BigNumber(0))
  return BigNumber.max(available, BigNumber(0))
}

export const calculateAvailableMintAllowances = (allowances: TokenAllowance[]) => {
  return allowances.reduce((total, allowance) => {
    const availableAllowance = BigNumber(allowance.quantity).minus(allowance.quantitySpent)
    return total.plus(availableAllowance)
  }, new BigNumber(0))
}

export const calculateAvailableMintSupply = (token: TokenClass, address?: string) => {
  if (address && !token.authorities.includes(address)) {
    return new BigNumber(0)
  }
  const value1 = BigNumber(token.maxSupply)
    .minus(token.knownMintAllowanceSupply as BigNumber)
    .plus(token.totalBurned)
  const value2 = BigNumber(token.maxCapacity).minus(token.knownMintAllowanceSupply as BigNumber)
  const min = BigNumber.min(value1, value2)
  return min.isGreaterThan(0) ? min : new BigNumber(0)
}

/// @notice gives the MSB for a number
/// @param number
/// @return index of the most signficant bit in a 256-bit number OR the last bit (255)
export function mostSignificantBit(n: bigint): number {
  let i = 255;
  while (i > -1) {
    if (n & (BigInt(1) << BigInt(i))) return i;
    i--;
  }
  return 0;
}

/// @notice gives the LSB for a number
/// @param number
/// @return index of the least signficant bit in a 256-bit number OR the first bit (0)
export function leastSignificantBit(n: bigint): number {
  let i = 0;
  while (i < 256) {
    if (n & (BigInt(1) << BigInt(i))) return i;
    i++;
  }
  return 255;
}

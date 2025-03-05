/*
 * Copyright (c) Gala Games Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 *
 *  @notice gives the MSB for a number
 *  @param number
 *  @return index of the most signficant bit in a 256-bit number OR the last bit (255)
 */
export function mostSignificantBit(n: bigint): number {
  let i = 255;
  while (i > -1) {
    if (n & (BigInt(1) << BigInt(i))) return i;
    i--;
  }
  return 0;
}

/**
 *
 *  @notice gives the LSB for a number
 *  @param number
 *  @return index of the least signficant bit in a 256-bit number OR the first bit (0)
 */

export function leastSignificantBit(n: bigint): number {
  let i = 0;
  while (i < 256) {
    if (n & (BigInt(1) << BigInt(i))) return i;
    i++;
  }
  return 255;
}

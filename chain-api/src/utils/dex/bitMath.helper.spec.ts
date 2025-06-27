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
import { leastSignificantBit, mostSignificantBit } from "./bitMath.helper";

describe("mostSignificantBit", () => {
  it("returns 0 for 0n", () => {
    // Given
    const input = BigInt(0);

    // When
    const result = mostSignificantBit(input);

    // Then
    expect(result).toBe(0);
  });

  it("returns 0 for 1n (only LSB set)", () => {
    // Given
    const input = BigInt(1);

    // When
    const result = mostSignificantBit(input);

    // Then
    expect(result).toBe(0);
  });

  it("returns 255 for max 256-bit value", () => {
    // Given
    const input = (BigInt(1) << BigInt(256)) - BigInt(1); // 0xffff...ffff (256 bits)

    // When
    const result = mostSignificantBit(input);

    // Then
    expect(result).toBe(255);
  });

  it("returns correct MSB index for power of 2", () => {
    // Given
    const input = BigInt(1) << BigInt(200);

    // When
    const result = mostSignificantBit(input);

    // Then
    expect(result).toBe(200);
  });

  it("returns correct MSB for non-power-of-2 value", () => {
    // Given
    const input = (BigInt(1) << BigInt(128)) + (BigInt(1) << BigInt(64));

    // When
    const result = mostSignificantBit(input);

    // Then
    expect(result).toBe(128);
  });
});

describe("leastSignificantBit", () => {
  it("returns 255 for 0n", () => {
    // Given
    const input = BigInt(0);

    // When
    const result = leastSignificantBit(input);

    // Then
    expect(result).toBe(255);
  });

  it("returns 0 for 1n (only LSB set)", () => {
    // Given
    const input = BigInt(1);

    // When
    const result = leastSignificantBit(input);

    // Then
    expect(result).toBe(0);
  });

  it("returns correct LSB for power of 2", () => {
    // Given
    const input = BigInt(1) << BigInt(100);

    // When
    const result = leastSignificantBit(input);

    // Then
    expect(result).toBe(100);
  });

  it("returns correct LSB for multiple bits set", () => {
    // Given
    const input = (BigInt(1) << BigInt(10)) | (BigInt(1) << BigInt(40)) | (BigInt(1) << BigInt(200));

    // When
    const result = leastSignificantBit(input);

    // Then
    expect(result).toBe(10);
  });
});

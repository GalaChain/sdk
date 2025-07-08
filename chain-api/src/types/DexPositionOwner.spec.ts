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
import { DexPositionOwner } from "./DexPositionOwner";

describe("DexPositionOwner", () => {
  const owner = "user:gamer123";
  const poolHash = "pool-abc-001";
  let positionOwner: DexPositionOwner;

  beforeEach(() => {
    // Given: A new DexPositionOwner instance
    positionOwner = new DexPositionOwner(owner, poolHash);
  });

  it("should initialize with empty tickRangeMap", () => {
    // Then
    expect(positionOwner.owner).toBe(owner);
    expect(positionOwner.poolHash).toBe(poolHash);
    expect(positionOwner.tickRangeMap).toEqual({});
  });

  it("should add a position to a new tick range", () => {
    // When
    positionOwner.addPosition("10:20", "pos-001");

    // Then
    expect(positionOwner.tickRangeMap["10:20"]).toEqual(["pos-001"]);
  });

  it("should add multiple positions to the same tick range", () => {
    // When
    positionOwner.addPosition("10:20", "pos-001");
    positionOwner.addPosition("10:20", "pos-002");

    // Then
    expect(positionOwner.tickRangeMap["10:20"]).toEqual(["pos-001", "pos-002"]);
  });

  it("should remove a position from a tick range and keep others", () => {
    // Given
    positionOwner.addPosition("10:20", "pos-001");
    positionOwner.addPosition("10:20", "pos-002");

    // When
    positionOwner.removePosition("10:20", "pos-001");

    // Then
    expect(positionOwner.tickRangeMap["10:20"]).toEqual(["pos-002"]);
  });

  it("should remove the tick range entirely if all positions are removed", () => {
    // Given
    positionOwner.addPosition("10:20", "pos-001");

    // When
    positionOwner.removePosition("10:20", "pos-001");

    // Then
    expect(positionOwner.tickRangeMap["10:20"]).toBeUndefined();
  });

  it("should get the first position ID from a tick range", () => {
    // Given
    positionOwner.addPosition("10:20", "pos-001");
    positionOwner.addPosition("10:20", "pos-002");

    // When
    const positionId = positionOwner.getPositionId("10:20");

    // Then
    expect(positionId).toBe("pos-001");
  });

  it("should return undefined for getPositionId if tick range does not exist", () => {
    // When
    const positionId = positionOwner.getPositionId("99:100");

    // Then
    expect(positionId).toBeUndefined();
  });

  it("should get the tick range by position ID", () => {
    // Given
    positionOwner.addPosition("10:20", "pos-001");
    positionOwner.addPosition("30:40", "pos-002");

    // When
    const tickRange = positionOwner.getTickRangeByPositionId("pos-002");

    // Then
    expect(tickRange).toBe("30:40");
  });

  it("should return undefined for getTickRangeByPositionId if not found", () => {
    // Given
    positionOwner.addPosition("10:20", "pos-001");

    // When
    const tickRange = positionOwner.getTickRangeByPositionId("pos-999");

    // Then
    expect(tickRange).toBeUndefined();
  });
});

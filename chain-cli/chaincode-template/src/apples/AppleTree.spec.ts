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
import { AppleTree } from "./AppleTree";
import { Variety } from "./types";

it("should pick apples", () => {
  // Given
  const tree = new AppleTree("user1", Variety.GOLDEN_DELICIOUS, 1, 0);
  const now = plusYears(tree.plantedAt, 2);
  expect(tree.applesPicked.toFixed()).toEqual("0");

  // When
  tree.ensureCanPick(now).pick();

  // Then
  expect(tree.applesPicked.toFixed()).toEqual("1");
});

it("should fail to pick if the date is invalid", () => {
  // Given
  const now = 0;
  const future = plusYears(0, 1);
  const tree = new AppleTree("user1", Variety.GOLDEN_DELICIOUS, 2, future);

  // When
  const pick = () => tree.ensureCanPick(now).pick();

  // Then
  expect(pick).toThrowError("Tree planted in the future");
});

it("should fail to pick if no apples are left", () => {
  // Given
  const tree = new AppleTree("user1", Variety.GOLDEN_DELICIOUS, 3, 0);
  const now = plusYears(tree.plantedAt, 1);
  tree.ensureCanPick(now).pick();

  // When
  const pick = () => tree.ensureCanPick(now).pick();

  // Then
  expect(pick).toThrowError("No apples left to pick");
});

test.each([
  [0, 0],
  [0.9, 0],
  [1, 1],
  [2, 2],
  [3, 4],
  [8, 128],
  [8.2, 128]
])("%s year old tree should have %s apples", (age, expectedApples) => {
  // Given
  const tree = new AppleTree("user1", Variety.GOLDEN_DELICIOUS, 4, 0);
  const now = plusYears(tree.plantedAt, age);

  // When
  const apples = tree.applesTotal(now);

  // Then
  expect(apples.toFixed()).toEqual(expectedApples.toString());
});

function plusYears(ms: number, years: number): number {
  return Math.floor(ms + years * 365 * 24 * 60 * 60 * 1000);
}

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
import { asyncIterator, fabricIterable, filter, prepend } from "./FabricIterable";

const getAllResults = async <T>(iterator: AsyncIterator<T>): Promise<T[]> => {
  const iterable = fabricIterable(iterator);
  const results: T[] = [];

  for await (const v of iterable) {
    results.push(v);
  }

  return results;
};

interface FilterTestCase {
  values: number[];
  expected: number[];
}

const filterTestCases: FilterTestCase[] = [
  { values: [], expected: [] },
  { values: [1], expected: [] },
  { values: [2], expected: [2] },
  { values: [1, 2, 3, 4, 5], expected: [2, 4] }
];

filterTestCases.forEach(({ values, expected }) => {
  it(`should filter [${values.join(", ")}]`, async () => {
    // Given
    const filterFn = (v: number): boolean => v % 2 === 0;
    const iterator = filter(filterFn, asyncIterator(values));

    // When
    const result = await getAllResults(iterator);

    // Then
    expect(result).toEqual(expected);
  });
});

interface PrependTestCase {
  values: number[];
  toPrepend: number[][];
  expected: number[];
}

const prependTestCases: PrependTestCase[] = [
  { values: [2, 3], toPrepend: [[]], expected: [2, 3] },
  { values: [], toPrepend: [[1]], expected: [1] },
  { values: [], toPrepend: [[]], expected: [] },
  { values: [5, 6], toPrepend: [[1, 2]], expected: [1, 2, 5, 6] },
  { values: [4], toPrepend: [[1], [2, 3]], expected: [2, 3, 1, 4] }
];

prependTestCases.forEach(({ values, toPrepend, expected }) => {
  it(`should prepend [${values.join(",")}] with ${toPrepend
    .map((as) => `[${as.join(",")}]`)
    .join(",")}`, async () => {
    // Given
    const iterator = asyncIterator(values);
    const prepended = toPrepend.reduce((it, vs) => prepend(vs, it), iterator);

    // When
    const result = await getAllResults(prepended);

    // Then
    expect(result).toEqual(expected);
  });
});

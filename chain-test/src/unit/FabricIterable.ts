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
import { Iterators } from "fabric-shim";

/**
 * Utilities for creating and manipulating async iterators compatible with Hyperledger Fabric.
 *
 * These functions provide testing infrastructure for blockchain state queries and iterations,
 * allowing mock implementations of Fabric's iterator interfaces for unit testing.
 */

/**
 * Creates an AsyncIterator from an array for testing purposes.
 *
 * @template T - Type of elements in the array
 * @param arr - Array to convert to async iterator
 * @returns AsyncIterator that yields array elements sequentially
 *
 * @example
 * ```typescript
 * const iterator = asyncIterator([1, 2, 3]);
 * const first = await iterator.next(); // { value: 1, done: false }
 * ```
 */
export const asyncIterator = <T>(arr: T[]): AsyncIterator<T> => {
  let nextIndex = 0;

  return {
    next: async (): Promise<IteratorResult<T>> => {
      if (nextIndex < arr.length) {
        const result = {
          value: arr[nextIndex],
          done: false
        };
        nextIndex += 1;

        return result;
      }

      return {
        value: arr[arr.length - 1],
        done: true
      };
    }
  };
};

/**
 * Filters an AsyncIterator based on a predicate function.
 *
 * @template T - Type of elements being filtered
 * @param include - Predicate function that returns true for elements to include
 * @param iterator - Source AsyncIterator to filter
 * @returns Filtered AsyncIterator containing only elements that pass the predicate
 *
 * @example
 * ```typescript
 * const sourceIterator = asyncIterator([1, 2, 3, 4]);
 * const evenNumbers = filter(n => n % 2 === 0, sourceIterator);
 * ```
 */
export const filter = <T>(include: (_: T) => boolean, iterator: AsyncIterator<T>): AsyncIterator<T> => {
  const filteredIterator = {
    next: async (): Promise<IteratorResult<T>> => {
      const result = await iterator.next();

      if (result.done || include(result.value)) {
        return result;
      }

      return filteredIterator.next();
    }
  };

  return filteredIterator;
};

/**
 * Prepends array elements to the beginning of an AsyncIterator.
 *
 * @template T - Type of elements being prepended
 * @param arr - Array of elements to prepend
 * @param iterator - AsyncIterator to append after the array elements
 * @returns Combined AsyncIterator that yields array elements first, then iterator elements
 *
 * @example
 * ```typescript
 * const baseIterator = asyncIterator([3, 4]);
 * const combined = prepend([1, 2], baseIterator);
 * // Yields: 1, 2, 3, 4
 * ```
 */
export const prepend = <T>(arr: T[], iterator: AsyncIterator<T>): AsyncIterator<T> => {
  const arrIterator = asyncIterator(arr);
  let isArrIteratorDone = false;

  return {
    next: async (): Promise<IteratorResult<T>> => {
      if (!isArrIteratorDone) {
        const arrIteratorResult = await arrIterator.next();

        if (arrIteratorResult.done) {
          isArrIteratorDone = true;

          return iterator.next();
        } else {
          return arrIteratorResult;
        }
      } else {
        return iterator.next();
      }
    }
  };
};

/**
 * Type representing a Fabric-compatible iterable that combines Promise and AsyncIterable interfaces.
 *
 * This type matches Hyperledger Fabric's iterator pattern where iterators are both
 * Promises (for compatibility) and AsyncIterables (for modern async iteration).
 *
 * @template T - Type of elements yielded by the iterator
 */
export type FabricIterable<T> = Promise<Iterators.CommonIterator<T>> & AsyncIterable<T>;

/**
 * Interface for cached key-value pairs used in testing.
 *
 * Similar to Hyperledger Fabric's Iterators.KV but with optional namespace
 * to provide more flexibility in test scenarios.
 *
 * @interface CachedKV
 */
export interface CachedKV {
  key: string;
  value: Uint8Array;
  namespace?: string;
}

/**
 * Creates a FabricIterable from an AsyncIterator for testing blockchain queries.
 *
 * Wraps an AsyncIterator to provide the Promise and AsyncIterable interfaces
 * expected by Hyperledger Fabric's iterator patterns.
 *
 * @template T - Type of elements in the iterator
 * @param iterator - Source AsyncIterator to wrap
 * @returns FabricIterable compatible with Fabric's iterator interfaces
 *
 * @example
 * ```typescript
 * const sourceData = [{ key: "key1", value: Buffer.from("value1") }];
 * const iterator = asyncIterator(sourceData);
 * const fabricIterator = fabricIterable(iterator);
 *
 * // Use with for-await-of
 * for await (const item of fabricIterator) {
 *   console.log(item.key, item.value);
 * }
 * ```
 */
export const fabricIterable = <T>(iterator: AsyncIterator<T>): FabricIterable<T> => {
  const stateQueryIterator: Iterators.CommonIterator<T> = {
    close: (): Promise<void> => Promise.resolve(), // do nothing,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore the only incompatibility is whether 'done' can be undefined
    next: (): Promise<Iterators.NextResult<T>> => iterator.next()
  };

  const response: FabricIterable<T> = {
    ...Promise.resolve(stateQueryIterator),
    [Symbol.asyncIterator]: (): AsyncIterator<T> => iterator
  };

  return response;
};

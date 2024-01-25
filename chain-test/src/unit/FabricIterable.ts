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

export type FabricIterable<T> = Promise<Iterators.CommonIterator<T>> & AsyncIterable<T>;

// the only difference between Iterators.KV is that here "namespace" is optional
export interface CachedKV {
  key: string;
  value: Uint8Array;
  namespace?: string;
}

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

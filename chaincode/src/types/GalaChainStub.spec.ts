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
import { ChainObject } from "@gala-chain/api";
import { TestChaincodeStub } from "@gala-chain/test";
import { Buffer } from "buffer";

import { CachedKV, FabricIterable } from "./FabricIterable";
import { createGalaChainStub } from "./GalaChainStub";

const setupTest = (initialState: Record<string, string> = {}) => {
const setupTest = (initialState: Record<string, string> = {}) => {
  const state = { ...initialState }; // shallow copy

  const testChaincodeStub = new TestChaincodeStub([], state, undefined);
  const testChaincodeStub = new TestChaincodeStub([], state, undefined);
  testChaincodeStub.putState = jest.fn(testChaincodeStub.putState);
  testChaincodeStub.getState = jest.fn(testChaincodeStub.getState);
  testChaincodeStub.deleteState = jest.fn(testChaincodeStub.deleteState);
  testChaincodeStub.getStateByPartialCompositeKey = jest.fn(testChaincodeStub.getStateByPartialCompositeKey);

  const cachedWrites = createGalaChainStub(testChaincodeStub, false, undefined);

  return { testChaincodeStub: testChaincodeStub, cachedWrites: cachedWrites };
};

describe("updates/flush", () => {
  it("should call putState on flushWrites only", async () => {
    // Given
    const { testChaincodeStub, cachedWrites } = setupTest();
    const [key, value] = ["name", Buffer.from("Willy Wonka")];

    // When
    await cachedWrites.putState(key, value);

    // Then
    expect(testChaincodeStub.putState).not.toBeCalled();

    // When
    await cachedWrites.flushWrites();

    // Then
    expect(testChaincodeStub.putState).toBeCalledWith(key, value);
  });

  it("should call deleteState on flushWrites only", async () => {
    // Given
    const { testChaincodeStub, cachedWrites } = setupTest();
    const key = "age";

    // When
    await cachedWrites.deleteState(key);

    // Then
    expect(testChaincodeStub.deleteState).not.toBeCalled();

    // When
    await cachedWrites.flushWrites();

    // Then
    expect(testChaincodeStub.deleteState).toBeCalledWith(key);
  });

  it("should not duplicate puts and deletes", async () => {
    // Given
    const { testChaincodeStub, cachedWrites } = setupTest();
    const [key1, value1] = ["player1", Buffer.from("Willy Wonka")];
    const [key2, value2] = ["player2", Buffer.from("Bruce Wayne")];
    const [key3, value3] = ["player3", Buffer.from("Jack Sparrow")];
    const key4 = "player4";

    // When - put and delete
    await cachedWrites.putState(key1, value1);
    await cachedWrites.deleteState(key1);

    // When - delete and put
    await cachedWrites.deleteState(key2);
    await cachedWrites.putState(key2, value2);

    // When - just put or delete
    await cachedWrites.putState(key3, value3);
    await cachedWrites.deleteState(key4);

    // When - flush
    await cachedWrites.flushWrites();

    // Then
    expect(testChaincodeStub.putState).toBeCalledWith(key2, value2);
    expect(testChaincodeStub.putState).toBeCalledWith(key3, value3);
    expect(testChaincodeStub.putState).toBeCalledTimes(2);

    expect(testChaincodeStub.deleteState).toBeCalledWith(key1);
    expect(testChaincodeStub.deleteState).toBeCalledWith(key4);
    expect(testChaincodeStub.deleteState).toBeCalledTimes(2);
  });

  it("should not flush writes in read-only mode", async () => {
    // Given
    const isReadOnly = true;
    const cachedWrites = createGalaChainStub(new TestChaincodeStub([], {}, {}), isReadOnly, undefined);

    // When
    const flushOp = cachedWrites.flushWrites();

    // Then
    expect(flushOp).rejects.toThrow("Cannot flush writes in read-only mode");
  });

  it("should suffix txId with index", async () => {
    // Given
    const index = 42;
    const cachedWrites = createGalaChainStub(new TestChaincodeStub([], {}, {}), false, index);

    // When
    const txId = cachedWrites.getTxID();

    // Then
    expect(txId).toMatch(/^[a-zA-Z0-9_]+\|42$/);
  });
});

describe("cached reads", () => {
  const key = "name";
  const initialValue = Buffer.from("Kate Dibiasky");
  const updatedValue = Buffer.from("Randall Mindy");

  const setupTestWithInitialState = () => setupTest({ [key]: initialValue.toString() });

  it("should read value only once", async () => {
    // Given
    const { testChaincodeStub, cachedWrites } = setupTestWithInitialState();

    // When
    const result1 = await cachedWrites.getCachedState(key);
    const result2 = await cachedWrites.getCachedState(key);

    // Then
    expect(result1).toEqual(initialValue);
    expect(result2).toEqual(initialValue);
    expect(testChaincodeStub.getState).toBeCalledTimes(1);
  });

  it("should read updated value", async () => {
    // Given
    const { testChaincodeStub, cachedWrites } = setupTestWithInitialState();
    await cachedWrites.putState(key, updatedValue);

    // When
    const result = await cachedWrites.getCachedState(key);

    // Then
    expect(result).toEqual(updatedValue);
    expect(testChaincodeStub.getState).not.toBeCalled();
  });

  it("should read deleted value", async () => {
    // Given
    const { testChaincodeStub, cachedWrites } = setupTestWithInitialState();
    await cachedWrites.deleteState(key);

    // When
    const result = await cachedWrites.getCachedState(key);

    // Then
    expect(result).toEqual(new Uint8Array());
    expect(testChaincodeStub.getState).not.toBeCalled();
  });

  it("should handle delete -> update -> read", async () => {
    // Given
    const { testChaincodeStub, cachedWrites } = setupTestWithInitialState();
    await cachedWrites.deleteState(key);
    await cachedWrites.putState(key, updatedValue);

    // When
    const result = await cachedWrites.getCachedState(key);

    // Then
    expect(result).toEqual(updatedValue);
    expect(testChaincodeStub.getState).not.toBeCalled();
  });

  it("should handle update -> delete -> read", async () => {
    // Given
    const { testChaincodeStub, cachedWrites } = setupTestWithInitialState();
    await cachedWrites.putState(key, updatedValue);
    await cachedWrites.deleteState(key);

    // When
    const result = await cachedWrites.getCachedState(key);

    // Then
    expect(result).toEqual(new Uint8Array());
    expect(testChaincodeStub.getState).not.toBeCalled();
  });

  it("should handle read -> update -> read", async () => {
    // Given
    const { testChaincodeStub, cachedWrites } = setupTestWithInitialState();
    const result1 = await cachedWrites.getCachedState(key);
    await cachedWrites.putState(key, updatedValue);

    // When
    const result2 = await cachedWrites.getCachedState(key);

    // Then
    expect(result1).toEqual(initialValue);
    expect(result2).toEqual(updatedValue);
    expect(testChaincodeStub.getState).toBeCalledTimes(1);
  });

  it("should handle read -> delete -> read", async () => {
    // Given
    const { testChaincodeStub, cachedWrites } = setupTestWithInitialState();
    const result1 = await cachedWrites.getCachedState(key);
    await cachedWrites.deleteState(key);

    // When
    const result2 = await cachedWrites.getCachedState(key);

    // Then
    expect(result1).toEqual(initialValue);
    expect(result2).toEqual(new Uint8Array());
    expect(testChaincodeStub.getState).toBeCalledTimes(1);
  });
});

describe("cached range queries", () => {
  const separator = ChainObject.MIN_UNICODE_RUNE_VALUE;

  const scientist1 = {
    key: `${separator}people${separator}sc${separator}kate${separator}`,
    value: Buffer.from("Kate Dibiasky")
  };
  const scientist2 = {
    key: `${separator}people${separator}sc${separator}randall${separator}`,
    value: Buffer.from("Randall Mindy")
  };
  const journalist1 = {
    key: `${separator}people${separator}jr${separator}brie${separator}`,
    value: Buffer.from("Brie Evantee")
  };
  const journalist2 = {
    key: `${separator}people${separator}jr${separator}tyler${separator}`,
    value: Buffer.from("Tyler Perry")
  };

  // key parts
  const people = "people";
  const scientists = ["sc"];
  const journalists = ["jr"];

  const setupTestWithInitialState = () => {
    const setup = setupTest({
      [scientist1.key]: scientist1.value.toString(),
      [scientist2.key]: scientist2.value.toString(),
      [journalist1.key]: journalist1.value.toString()
    });

    const getAllResults = async (iterator: FabricIterable<CachedKV>): Promise<Array<CachedKV>> => {
      const results: Array<CachedKV> = [];

      for await (const kv of iterator) {
        results.push(kv);
      }

      return results.sort((a, b) => a.key.localeCompare(b.key));
    };

    const getCachedStateByPartialCompositeKey = (objectType: string, attrs: string[]) =>
      getAllResults(setup.cachedWrites.getCachedStateByPartialCompositeKey(objectType, attrs));

    const getStateByPartialCompositeKey = (objectType: string, attrs: string[]) =>
      getAllResults(setup.cachedWrites.getStateByPartialCompositeKey(objectType, attrs));

    return {
      ...setup,
      getCachedStateByPartialCompositeKey: getCachedStateByPartialCompositeKey,
      getStateByPartialCompositeKey: getStateByPartialCompositeKey
    };
  };

  it("should read values from chain both times", async () => {
    // Given
    const test = setupTestWithInitialState();
    const expectedResult = [expect.objectContaining(scientist1), expect.objectContaining(scientist2)];

    // When
    const result1 = await test.getCachedStateByPartialCompositeKey(people, scientists);
    const result2 = await test.getCachedStateByPartialCompositeKey(people, scientists);

    // Then
    expect(result1).toEqual(expectedResult);
    expect(result2).toEqual(expectedResult);
    expect(test.testChaincodeStub.getStateByPartialCompositeKey).toBeCalledTimes(2);
  });

  it("should read added value", async () => {
    // Given
    const test = setupTestWithInitialState();
    await test.cachedWrites.putState(journalist2.key, journalist2.value);

    // When
    const resultRaw = await test.getStateByPartialCompositeKey(people, journalists);
    const resultCashed = await test.getCachedStateByPartialCompositeKey(people, journalists);

    // Then
    expect(resultRaw).toEqual([expect.objectContaining(journalist1)]);
    expect(resultCashed).toEqual([
      expect.objectContaining(journalist1),
      expect.objectContaining(journalist2)
    ]);
  });

  it("should read updated value", async () => {
    // Given
    const test = setupTestWithInitialState();
    const updatedScientist = { key: scientist2.key, value: Buffer.from("Dr No") };
    await test.cachedWrites.putState(updatedScientist.key, updatedScientist.value);

    // When
    const resultRaw = await test.getStateByPartialCompositeKey(people, scientists);
    const resultCashed = await test.getCachedStateByPartialCompositeKey(people, scientists);

    // Then
    expect(resultRaw).toEqual([expect.objectContaining(scientist1), expect.objectContaining(scientist2)]);
    expect(resultCashed).toEqual([
      expect.objectContaining(scientist1),
      expect.objectContaining(updatedScientist)
    ]);
  });

  it("should skip deleted value", async () => {
    // Given
    const test = setupTestWithInitialState();
    await test.cachedWrites.deleteState(scientist1.key);

    // When
    const resultRaw = await test.getStateByPartialCompositeKey(people, scientists);
    const resultCashed = await test.getCachedStateByPartialCompositeKey(people, scientists);

    // Then
    expect(resultRaw).toEqual([expect.objectContaining(scientist1), expect.objectContaining(scientist2)]);
    expect(resultCashed).toEqual([expect.objectContaining(scientist2)]);
  });

  it("should handle delete -> update -> read", async () => {
    // Given
    const test = setupTestWithInitialState();
    const updatedScientist = { key: scientist2.key, value: Buffer.from("Dr No") };
    await test.cachedWrites.deleteState(updatedScientist.key);
    await test.cachedWrites.putState(updatedScientist.key, updatedScientist.value);

    // When
    const resultRaw = await test.getStateByPartialCompositeKey(people, scientists);
    const resultCashed = await test.getCachedStateByPartialCompositeKey(people, scientists);

    // Then
    expect(resultRaw).toEqual([expect.objectContaining(scientist1), expect.objectContaining(scientist2)]);
    expect(resultCashed).toEqual([
      expect.objectContaining(scientist1),
      expect.objectContaining(updatedScientist)
    ]);
  });

  it("should handle update -> delete -> read", async () => {
    // Given
    const test = setupTestWithInitialState();
    const updatedScientist = { key: scientist2.key, value: Buffer.from("Dr No") };
    await test.cachedWrites.putState(updatedScientist.key, updatedScientist.value);
    await test.cachedWrites.deleteState(updatedScientist.key);

    // When
    const resultRaw = await test.getStateByPartialCompositeKey(people, scientists);
    const resultCashed = await test.getCachedStateByPartialCompositeKey(people, scientists);

    // Then
    expect(resultRaw).toEqual([expect.objectContaining(scientist1), expect.objectContaining(scientist2)]);
    expect(resultCashed).toEqual([expect.objectContaining(scientist1)]);
  });
});

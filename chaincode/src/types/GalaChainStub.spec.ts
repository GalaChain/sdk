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
import { DuplicateInvokeChaincodeError, createGalaChainStub } from "./GalaChainStub";

const setupTest = (initialState: Record<string, string> = {}) => {
  const state = { ...initialState }; // shallow copy

  /* eslint-disable  @typescript-eslint/ban-ts-comment */
  // @ts-ignore
  const internalStub = new TestChaincodeStub([], state, undefined);
  internalStub.putState = jest.fn(internalStub.putState);
  internalStub.getState = jest.fn(internalStub.getState);
  internalStub.deleteState = jest.fn(internalStub.deleteState);
  internalStub.getStateByPartialCompositeKey = jest.fn(internalStub.getStateByPartialCompositeKey);
  internalStub.invokeChaincode = jest.fn(internalStub.invokeChaincode);

  const gcStub = createGalaChainStub(internalStub, false, undefined);

  return { internalStub, gcStub };
};

describe("updates/flush", () => {
  it("should call putState on flushWrites only", async () => {
    // Given
    const { internalStub, gcStub } = setupTest();
    const [key, value] = ["name", Buffer.from("Willy Wonka")];

    // When
    await gcStub.putState(key, value);

    // Then
    expect(internalStub.putState).not.toBeCalled();

    // When
    await gcStub.flushWrites();

    // Then
    expect(internalStub.putState).toBeCalledWith(key, value);
  });

  it("should call deleteState on flushWrites only", async () => {
    // Given
    const { internalStub, gcStub } = setupTest();
    const key = "age";

    // When
    await gcStub.deleteState(key);

    // Then
    expect(internalStub.deleteState).not.toBeCalled();

    // When
    await gcStub.flushWrites();

    // Then
    expect(internalStub.deleteState).toBeCalledWith(key);
  });

  it("should not duplicate puts and deletes", async () => {
    // Given
    const { internalStub, gcStub } = setupTest();
    const [key1, value1] = ["player1", Buffer.from("Willy Wonka")];
    const [key2, value2] = ["player2", Buffer.from("Bruce Wayne")];
    const [key3, value3] = ["player3", Buffer.from("Jack Sparrow")];
    const key4 = "player4";

    // When - put and delete
    await gcStub.putState(key1, value1);
    await gcStub.deleteState(key1);

    // When - delete and put
    await gcStub.deleteState(key2);
    await gcStub.putState(key2, value2);

    // When - just put or delete
    await gcStub.putState(key3, value3);
    await gcStub.deleteState(key4);

    // When - flush
    await gcStub.flushWrites();

    // Then
    expect(internalStub.putState).toBeCalledWith(key2, value2);
    expect(internalStub.putState).toBeCalledWith(key3, value3);
    expect(internalStub.putState).toBeCalledTimes(2);

    expect(internalStub.deleteState).toBeCalledWith(key1);
    expect(internalStub.deleteState).toBeCalledWith(key4);
    expect(internalStub.deleteState).toBeCalledTimes(2);
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
    expect(txId).toMatch(/^[a-zA-Z0-9_-]+\|42$/);
  });
});

describe("cached reads", () => {
  const key = "name";
  const initialValue = Buffer.from("Kate Dibiasky");
  const updatedValue = Buffer.from("Randall Mindy");

  const setupTestWithInitialState = () => setupTest({ [key]: initialValue.toString() });

  it("should read value only once", async () => {
    // Given
    const { internalStub, gcStub } = setupTestWithInitialState();

    // When
    const result1 = await gcStub.getCachedState(key);
    const result2 = await gcStub.getCachedState(key);

    // Then
    expect(result1).toEqual(initialValue);
    expect(result2).toEqual(initialValue);
    expect(internalStub.getState).toBeCalledTimes(1);
  });

  it("should read updated value", async () => {
    // Given
    const { internalStub, gcStub } = setupTestWithInitialState();
    await gcStub.putState(key, updatedValue);

    // When
    const result = await gcStub.getCachedState(key);

    // Then
    expect(result).toEqual(updatedValue);
    expect(internalStub.getState).not.toBeCalled();
  });

  it("should read deleted value", async () => {
    // Given
    const { internalStub, gcStub } = setupTestWithInitialState();
    await gcStub.deleteState(key);

    // When
    const result = await gcStub.getCachedState(key);

    // Then
    expect(result).toEqual(new Uint8Array());
    expect(internalStub.getState).not.toBeCalled();
  });

  it("should handle delete -> update -> read", async () => {
    // Given
    const { internalStub, gcStub } = setupTestWithInitialState();
    await gcStub.deleteState(key);
    await gcStub.putState(key, updatedValue);

    // When
    const result = await gcStub.getCachedState(key);

    // Then
    expect(result).toEqual(updatedValue);
    expect(internalStub.getState).not.toBeCalled();
  });

  it("should handle update -> delete -> read", async () => {
    // Given
    const { internalStub, gcStub } = setupTestWithInitialState();
    await gcStub.putState(key, updatedValue);
    await gcStub.deleteState(key);

    // When
    const result = await gcStub.getCachedState(key);

    // Then
    expect(result).toEqual(new Uint8Array());
    expect(internalStub.getState).not.toBeCalled();
  });

  it("should handle read -> update -> read", async () => {
    // Given
    const { internalStub, gcStub } = setupTestWithInitialState();
    const result1 = await gcStub.getCachedState(key);
    await gcStub.putState(key, updatedValue);

    // When
    const result2 = await gcStub.getCachedState(key);

    // Then
    expect(result1).toEqual(initialValue);
    expect(result2).toEqual(updatedValue);
    expect(internalStub.getState).toBeCalledTimes(1);
  });

  it("should handle read -> delete -> read", async () => {
    // Given
    const { internalStub, gcStub } = setupTestWithInitialState();
    const result1 = await gcStub.getCachedState(key);
    await gcStub.deleteState(key);

    // When
    const result2 = await gcStub.getCachedState(key);

    // Then
    expect(result1).toEqual(initialValue);
    expect(result2).toEqual(new Uint8Array());
    expect(internalStub.getState).toBeCalledTimes(1);
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
      getAllResults(setup.gcStub.getCachedStateByPartialCompositeKey(objectType, attrs));

    const getStateByPartialCompositeKey = (objectType: string, attrs: string[]) =>
      getAllResults(setup.gcStub.getStateByPartialCompositeKey(objectType, attrs));

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
    expect(test.internalStub.getStateByPartialCompositeKey).toBeCalledTimes(2);
  });

  it("should read added value", async () => {
    // Given
    const test = setupTestWithInitialState();
    await test.gcStub.putState(journalist2.key, journalist2.value);

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
    await test.gcStub.putState(updatedScientist.key, updatedScientist.value);

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
    await test.gcStub.deleteState(scientist1.key);

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
    await test.gcStub.deleteState(updatedScientist.key);
    await test.gcStub.putState(updatedScientist.key, updatedScientist.value);

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
    await test.gcStub.putState(updatedScientist.key, updatedScientist.value);
    await test.gcStub.deleteState(updatedScientist.key);

    // When
    const resultRaw = await test.getStateByPartialCompositeKey(people, scientists);
    const resultCashed = await test.getCachedStateByPartialCompositeKey(people, scientists);

    // Then
    expect(resultRaw).toEqual([expect.objectContaining(scientist1), expect.objectContaining(scientist2)]);
    expect(resultCashed).toEqual([expect.objectContaining(scientist1)]);
  });
});

describe("invokeChaincode", () => {
  const successInvoke = expect.objectContaining({
    status: 200
  });

  it("should allow to invoke other chaincode only once", async () => {
    // Given
    const { internalStub, gcStub } = setupTest();
    const args = ["Contract:Method", "{}"];

    // When
    const calls = [
      await gcStub.invokeChaincode("chaincode-1", args, "channel-A"), // ok
      await gcStub.invokeChaincode("chaincode-2", args, "channel-A"), // ok
      await gcStub.invokeChaincode("chaincode-1", args, "channel-A").catch((e) => e),
      await gcStub.invokeChaincode("chaincode-1", args, "channel-B") // ok
    ];

    // Then
    expect(calls).toEqual([
      successInvoke,
      successInvoke,
      new DuplicateInvokeChaincodeError("chaincode-1", args, "channel-A"),
      successInvoke
    ]);

    expect(internalStub.invokeChaincode).toHaveBeenCalledTimes(3);
  });

  it("should allow to call DryRun before the actual invocation", async () => {
    // Given
    const { internalStub, gcStub } = setupTest();
    const args = ["Contract:Method", "{}"];
    const dryRunArgs = ["Contract:DryRun", "{}"];

    // When
    const calls = [
      await gcStub.invokeChaincode("chaincode-1", dryRunArgs, "channel-A"), // ok
      await gcStub.invokeChaincode("chaincode-1", dryRunArgs, "channel-A"), // ok
      await gcStub.invokeChaincode("chaincode-1", args, "channel-A"), // ok
      await gcStub.invokeChaincode("chaincode-1", dryRunArgs, "channel-A").catch((e) => e),
      await gcStub.invokeChaincode("chaincode-1", args, "channel-A").catch((e) => e)
    ];

    // Then
    expect(calls).toEqual([
      successInvoke,
      successInvoke,
      successInvoke,
      new DuplicateInvokeChaincodeError("chaincode-1", args, "channel-A"),
      new DuplicateInvokeChaincodeError("chaincode-1", args, "channel-A")
    ]);

    expect(internalStub.invokeChaincode).toHaveBeenCalledTimes(3);
  });
});

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
import { NotImplementedError } from "@gala-chain/api";
import { ChaincodeResponse, ChaincodeStub } from "fabric-shim";

import { truncateOtelAttr, withSpan, withSpanSync } from "../tracing";
import { CachedKV, FabricIterable, fabricIterable, filter, prepend } from "./FabricIterable";

const stateKeyAttr = truncateOtelAttr;

/**
 * The main purpose of this class is to keep the state clean when the transaction fails. In this
 * case (1) we don't want to save any keys and (2) we want to have all errors caught to produce
 * meaningful error messages. However, when transaction does not end uncaught error, Fabric updates
 * the state. It may lead to corrupted state. That's why we use this class to cache write operations
 * and allow the @GalaTransaction call `flush` method after the successful transaction. We want to
 * save changes only if the transaction succeeds.
 *
 * Also, this class provides `getCachedState` method to be used to access values that have been
 * already read or updated within current chaincode call.
 *
 * This class implements all methods from ChaincodeStub that changes the state to forbid actually
 * changing the state without flushing. Leaving some methods not supported is intentional.
 */
class StubCache {
  private writes: Record<string, Uint8Array> = {};

  private reads: Record<string, Uint8Array> = {};

  private deletes: Record<string, true> = {};

  private invokeChaincodeCalls: Record<string, string[]> = {};

  constructor(
    private readonly stub: ChaincodeStub,
    private readonly isReadOnly: boolean,
    private readonly index: number | undefined
  ) {}

  getTxID(): string {
    if (typeof this.index === "number") {
      return this.stub.getTxID() + `|${this.index}`;
    }
    return this.stub.getTxID();
  }

  async getState(key: string): Promise<Uint8Array> {
    return withSpan(
      "stub.getState",
      {
        "fabric.state.operation": "getState",
        "fabric.state.key": stateKeyAttr(key)
      },
      async (span) => {
        const result = await this.stub.getState(key);
        span?.setAttribute("fabric.state.value_size", result?.length ?? 0);
        span?.setAttribute("fabric.state.found", (result?.length ?? 0) > 0);
        return result;
      }
    );
  }

  getStateByRange(startKey: string, endKey: string): FabricIterable<CachedKV> {
    return withSpanSync(
      "stub.getStateByRange",
      {
        "fabric.state.operation": "getStateByRange",
        "fabric.state.start_key": stateKeyAttr(startKey),
        "fabric.state.end_key": stateKeyAttr(endKey)
      },
      () => this.stub.getStateByRange(startKey, endKey) as FabricIterable<CachedKV>
    );
  }

  getStateByPartialCompositeKey(objectType: string, attributes: string[]): FabricIterable<CachedKV> {
    return withSpanSync(
      "stub.getStateByPartialCompositeKey",
      {
        "fabric.state.operation": "getStateByPartialCompositeKey",
        "fabric.state.object_type": objectType,
        "fabric.state.attribute_count": attributes.length
      },
      () => this.stub.getStateByPartialCompositeKey(objectType, attributes) as FabricIterable<CachedKV>
    );
  }

  getHistoryForKey(key: string): ReturnType<ChaincodeStub["getHistoryForKey"]> {
    return withSpanSync(
      "stub.getHistoryForKey",
      {
        "fabric.state.operation": "getHistoryForKey",
        "fabric.state.key": stateKeyAttr(key)
      },
      () => this.stub.getHistoryForKey(key)
    );
  }

  async getCachedState(key: string): Promise<Uint8Array> {
    if (key in this.deletes) {
      return new Uint8Array();
    }

    if (key in this.writes) {
      return this.writes[key];
    }

    if (key in this.reads) {
      return this.reads[key];
    }

    // Cache miss: instrumented getState records the Fabric I/O.
    const result = await this.getState(key);
    this.reads[key] = result;

    return result;
  }

  getCachedStateByPartialCompositeKey(objectType: string, attributes: string[]): FabricIterable<CachedKV> {
    const partialCompositeKey = this.stub.createCompositeKey(objectType, attributes);

    const cached = Object.entries({ ...this.reads, ...this.writes })
      .filter(([k]) => k.startsWith(partialCompositeKey))
      .map(([k, v]) => ({ key: k, value: v }));

    const keysToExclude = new Set(cached.map((kv) => kv.key).concat(Object.keys(this.deletes)));

    // Instrumented getStateByPartialCompositeKey records the Fabric query.
    const state = this.getStateByPartialCompositeKey(objectType, attributes);
    const filteredState = filter((kv) => !keysToExclude.has(kv.key), state[Symbol.asyncIterator]());

    return fabricIterable(prepend(cached, filteredState));
  }

  putState(key: string, value: Uint8Array): Promise<void> {
    return withSpan(
      "stub.putState",
      {
        "fabric.state.operation": "putState",
        "fabric.state.key": stateKeyAttr(key),
        "fabric.state.value_size": value.length,
        "fabric.state.cached": true
      },
      async () => {
        this.writes[key] = value;

        if (key in this.deletes) {
          delete this.deletes[key];
        }

        if (key in this.reads) {
          delete this.reads[key];
        }
      }
    );
  }

  deleteState(key: string): Promise<void> {
    return withSpan(
      "stub.deleteState",
      {
        "fabric.state.operation": "deleteState",
        "fabric.state.key": stateKeyAttr(key),
        "fabric.state.cached": true
      },
      async () => {
        this.deletes[key] = true;

        if (key in this.writes) {
          delete this.writes[key];
        }

        if (key in this.reads) {
          delete this.reads[key];
        }
      }
    );
  }

  /**
   * This method is used to invoke other chaincode. It is not allowed to invoke the same chaincode
   * more than once within the same transaction, because we are not able to support cache for the
   * invoked chaincode.
   *
   * The only exception is DryRun, which is allowed to be called multiple times, if no other
   * methods on the same chaincode are called before it.
   */
  async invokeChaincode(chaincodeName: string, args: string[], channel: string): Promise<ChaincodeResponse> {
    return withSpan(
      "stub.invokeChaincode",
      {
        "fabric.state.operation": "invokeChaincode",
        "fabric.invoke.chaincode": chaincodeName,
        "fabric.invoke.channel": channel,
        "fabric.invoke.method": args?.[0] ?? ""
      },
      async () => {
        const key = `${channel}/${chaincodeName}`;
        const prevCall = this.invokeChaincodeCalls[key];

        if (prevCall) {
          const effectiveChannel = channel === "" ? this.stub.getChannelID() : channel;
          throw new DuplicateInvokeChaincodeError(chaincodeName, prevCall, effectiveChannel);
        }

        const isDryRun = args?.[0].endsWith(":DryRun");
        if (!isDryRun) {
          this.invokeChaincodeCalls[key] = args;
        }

        return await this.stub.invokeChaincode(chaincodeName, args, channel);
      }
    );
  }

  get externalChaincodeWasInvoked(): boolean {
    return Object.keys(this.invokeChaincodeCalls).length > 0;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setStateValidationParameter(key: string, ep: Uint8Array): Promise<void> {
    throw new NotImplementedError("setStateValidationParameter is not supported");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setEvent(name: string, payload: Uint8Array): void {
    throw new NotImplementedError("setEvent is not supported");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  putPrivateData(collection: string, key: string, value: Uint8Array): Promise<void> {
    throw new NotImplementedError("putPrivateData is not supported");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deletePrivateData(collection: string, key: string): Promise<void> {
    throw new NotImplementedError("deletePrivateData is not supported");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setPrivateDataValidationParameter(collection: string, key: string, ep: Uint8Array): Promise<void> {
    throw new NotImplementedError("setPrivateDataValidationParameter is not supported");
  }

  async flushWrites(): Promise<void> {
    const deleteKeys = Object.keys(this.deletes);
    const putEntries = Object.entries(this.writes);

    return withSpan(
      "stub.flushWrites",
      {
        "fabric.state.operation": "flushWrites",
        "fabric.state.put_count": putEntries.length,
        "fabric.state.delete_count": deleteKeys.length
      },
      async () => {
        if (this.isReadOnly) {
          throw new NotImplementedError("Cannot flush writes in read-only mode");
        }

        const deleteOps = deleteKeys.map((key) =>
          withSpan(
            "stub.deleteState.flush",
            {
              "fabric.state.operation": "deleteState",
              "fabric.state.key": stateKeyAttr(key),
              "fabric.state.cached": false
            },
            () => this.stub.deleteState(key)
          )
        );
        const putOps = putEntries.map(([key, value]) =>
          withSpan(
            "stub.putState.flush",
            {
              "fabric.state.operation": "putState",
              "fabric.state.key": stateKeyAttr(key),
              "fabric.state.value_size": value.length,
              "fabric.state.cached": false
            },
            () => this.stub.putState(key, value)
          )
        );
        await Promise.all(deleteOps);
        await Promise.all(putOps);
      }
    );
  }

  getReads(): Record<string, Uint8Array> {
    return { ...this.reads };
  }

  getWrites(): Record<string, Uint8Array> {
    return { ...this.writes };
  }

  getWritesCount(): number {
    return Object.keys(this.writes).length;
  }

  getDeletes(): Record<string, true> {
    return { ...this.deletes };
  }

  setReads(reads: Record<string, Uint8Array>): void {
    this.reads = { ...reads };
  }

  setWrites(writes: Record<string, Uint8Array>): void {
    this.writes = { ...writes };
  }

  setDeletes(deletes: Record<string, true>): void {
    this.deletes = { ...deletes };
  }
}

export class DuplicateInvokeChaincodeError extends NotImplementedError {
  constructor(chaincodeName: string, args: string[], channel: string) {
    const msg = `Chaincode ${chaincodeName} on channel ${channel} was already invoked in the transaction (method: ${args[0]})`;
    super(msg, { chaincodeName, args, channel });
  }
}

export interface GalaChainStub extends ChaincodeStub {
  getTxID(): string;

  getCachedState(key: string): Promise<Uint8Array>;

  getCachedStateByPartialCompositeKey(objectType: string, attributes: string[]): FabricIterable<CachedKV>;

  flushWrites(): Promise<void>;

  getReads(): Record<string, Uint8Array>;

  getWrites(): Record<string, Uint8Array>;

  getWritesCount(): number;

  getDeletes(): Record<string, true>;

  setReads(reads: Record<string, Uint8Array>): void;

  setWrites(writes: Record<string, Uint8Array>): void;

  setDeletes(deletes: Record<string, true>): void;

  invokeChaincode(chaincodeName: string, args: string[], channel: string): Promise<ChaincodeResponse>;

  get externalChaincodeWasInvoked(): boolean;
}

export const createGalaChainStub = (
  stub: ChaincodeStub,
  isReadOnly: boolean,
  index: number | undefined
): GalaChainStub => {
  const cachedWrites = new StubCache(stub, isReadOnly, index);

  const proxyHandler = {
    get: function (target: GalaChainStub, name: string | symbol): unknown {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return name in cachedWrites ? cachedWrites[name] : target[name];
    },
    set: function (target: GalaChainStub, name: string | symbol, value: unknown): boolean {
      if (name in cachedWrites) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        cachedWrites[name] = value;
        return true;
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      target[name] = value;
      return true;
    }
  };

  // Note: Proxy is slightly slower than direct object access, but it is recommended to use
  // it here, since we are not able to implement all ChaincodeStub internals that should be
  // handled. It is more reliable to pass the missing calls to target object. It is also
  // easier to test it.
  return new Proxy<GalaChainStub>(<GalaChainStub>stub, proxyHandler);
};

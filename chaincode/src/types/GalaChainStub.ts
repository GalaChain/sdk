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
import { ChaincodeStub } from "fabric-shim";

import { CachedKV, FabricIterable, fabricIterable, filter, prepend } from "./FabricIterable";

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

  constructor(private readonly stub: ChaincodeStub) {}

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

    const result = await this.stub.getState(key);
    this.reads[key] = result;

    return result;
  }

  getCachedStateByPartialCompositeKey(objectType: string, attributes: string[]): FabricIterable<CachedKV> {
    const partialCompositeKey = this.stub.createCompositeKey(objectType, attributes);

    const cached = Object.entries({ ...this.reads, ...this.writes })
      .filter(([k]) => k.startsWith(partialCompositeKey))
      .map(([k, v]) => ({ key: k, value: v }));

    const keysToExclude = new Set(cached.map((kv) => kv.key).concat(Object.keys(this.deletes)));

    const state = this.stub.getStateByPartialCompositeKey(objectType, attributes);
    const filteredState = filter((kv) => !keysToExclude.has(kv.key), state[Symbol.asyncIterator]());

    return fabricIterable(prepend(cached, filteredState));
  }

  putState(key: string, value: Uint8Array): Promise<void> {
    this.writes[key] = value;

    if (key in this.deletes) {
      delete this.deletes[key];
    }

    if (key in this.reads) {
      delete this.reads[key];
    }

    return Promise.resolve();
  }

  deleteState(key: string): Promise<void> {
    this.deletes[key] = true;

    if (key in this.writes) {
      delete this.writes[key];
    }

    if (key in this.reads) {
      delete this.reads[key];
    }

    return Promise.resolve();
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
    const deleteOps = Object.keys(this.deletes).map((key) => this.stub.deleteState(key));
    const putOps = Object.entries(this.writes).map(([key, value]) => this.stub.putState(key, value));
    await Promise.all(deleteOps);
    await Promise.all(putOps);
  }

  getReads(): Record<string, string> {
    return keysToUtfStrings(this.reads);
  }

  getWrites(): Record<string, string> {
    return keysToUtfStrings(this.writes);
  }

  getDeletes(): Record<string, true> {
    return { ...this.deletes };
  }
}

function keysToUtfStrings(obj: Record<string, Uint8Array>): Record<string, string> {
  return Object.entries(obj).reduce(
    (acc, [key, value]) => {
      acc[key] = value.toString();
      return acc;
    },
    {} as Record<string, string>
  );
}

export interface GalaChainStub extends ChaincodeStub {
  getCachedState(key: string): Promise<Uint8Array>;

  getCachedStateByPartialCompositeKey(objectType: string, attributes: string[]): FabricIterable<CachedKV>;

  flushWrites(): Promise<void>;

  getReads(): Record<string, string>;

  getWrites(): Record<string, string>;

  getDeletes(): Record<string, true>;
}

export const createGalaChainStub = (stub: ChaincodeStub): GalaChainStub => {
  const cachedWrites = new StubCache(stub);

  const proxyHandler = {
    get: function (target: GalaChainStub, name: string | symbol): unknown {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return name in cachedWrites ? cachedWrites[name] : target[name];
    }
  };

  // Note: Proxy is slightly slower than direct object access, but it is recommended to use
  // it here, since we are not able to implement all ChaincodeStub internals that should be
  // handled. It is more reliable to pass the missing calls to target object. It is also
  // easier to test it.
  return new Proxy<GalaChainStub>(<GalaChainStub>stub, proxyHandler);
};

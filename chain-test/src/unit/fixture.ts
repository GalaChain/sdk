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
import {
  ChainCallDTO,
  ChainObject,
  ClassConstructor,
  GalaChainResponse,
  PublicKey,
  RangedChainObject,
  UserProfile,
  UserRole,
  signatures
} from "@gala-chain/api";
import { ChainUser } from "@gala-chain/client";
import { plainToInstance } from "class-transformer";
import { ec as EC } from "elliptic";
import { Context, Contract } from "fabric-contract-api";
import { ChaincodeStub } from "fabric-shim";
import Logger from "fabric-shim/lib/logger";

import { ChainUserWithRoles } from "../data/users";
import { CachedKV, FabricIterable } from "./FabricIterable";
import { TestChaincodeStub, x509Identity } from "./TestChaincodeStub";

interface GalaLoggerInstance {
  getLogger(name?: string): Logger;

  error(message: string): void;

  warn(message: string): void;

  info(message: string): void;

  debug(message: string): void;

  log(
    level: "debug" | "info" | "warn" | "error",
    msg:
      | string
      | (Record<string, unknown> & {
          message: string;
        })
  ): void;

  logTimeline(timelineActionDescription: string, context: string, metaData?: unknown[], error?: Error): void;
}

type GalaChainStub = ChaincodeStub & {
  getCachedState(key: string): Promise<Uint8Array>;
  getCachedStateByPartialCompositeKey(objectType: string, attributes: string[]): FabricIterable<CachedKV>;
  flushWrites(): Promise<void>;
  getReads(): Record<string, string>;
  getWrites(): Record<string, string>;
  getDeletes(): Record<string, true>;
};

type TestGalaChainContext = Context & {
  readonly stub: GalaChainStub;
  readonly logger: GalaLoggerInstance;
  set callingUserData(d: { alias: string; ethAddress?: string; tonAddress?: string; roles: string[] });
  get callingUser(): string;
  get callingUserEthAddress(): string;
  get callingUserRoles(): string[];
  get callingUserTonAddress(): string;
  setDryRunOnBehalfOf(d: { alias: string; ethAddress?: string; tonAddress?: string; roles: string[] }): void;
  isDryRun: boolean;
  get txUnixTime(): number;
  setChaincodeStub(stub: ChaincodeStub): void;
  resetCallingUserData(): void;
};

type GalaContract<Ctx extends TestGalaChainContext> = Contract & {
  beforeTransaction(ctx: Ctx): Promise<void>;
  createContext(): Ctx;
};

const defaultCaClientIdentity = x509Identity("test", "TestOrg");

type Wrapped<Contract> = {
  [K in keyof Contract]: Contract[K] extends (...args: infer A) => Promise<GalaChainResponse<infer R>>
    ? Contract[K] // If it already returns Promise<GalaChainResponse<R>>, keep it as is.
    : Contract[K] extends (...args: infer A) => Promise<infer R>
      ? (...args: A) => Promise<GalaChainResponse<R>> // Otherwise, transform Promise<R> to Promise<GalaChainResponse<R>>.
      : Contract[K]; // Keep non-Promise methods as is.
};

class Fixture<Ctx extends TestGalaChainContext, T extends GalaContract<Ctx>> {
  private readonly stub: TestChaincodeStub;
  public readonly contract: Wrapped<T>;
  public readonly ctx: Ctx;

  constructor(
    contractClass: ClassConstructor<T>,
    public readonly writes: Record<string, string> = {},
    public readonly state: Record<string, string> = {}
  ) {
    const contractInstance = new contractClass() as Wrapped<T>; // it's done by @GalaTransaction decorator
    this.contract = new Proxy(contractInstance, {
      get: (target, prop) => {
        // check if target property is a function with ctx + dto as parameters
        if (typeof target[prop as string] === "function" && target[prop as string].length === 2) {
          const method = target[prop as string];
          return async (ctx: Ctx, dto?: ChainCallDTO) => {
            await contractInstance.beforeTransaction(ctx);
            const result = dto
              ? await method.call(contractInstance, ctx, dto)
              : await method.call(contractInstance, ctx);
            await contractInstance.afterTransaction(ctx, result);
            ctx.resetCallingUserData();
            return result;
          };
        }

        return target[prop];
      }
    });

    this.stub = new TestChaincodeStub([], this.state, this.writes);

    const ctxInstance = this.contract.createContext() as Ctx;
    ctxInstance.setChaincodeStub(this.stub);
    ctxInstance.logging = {
      setLevel: Logger.setLevel,
      getLogger: (name) => {
        return Logger.getLogger(name ? `${contractClass?.name}:${name}` : contractClass?.name);
      }
    };
    ctxInstance.clientIdentity = defaultCaClientIdentity;
    this.ctx = ctxInstance;
  }

  registeredUsers(...users: ChainUserWithRoles[]): Fixture<Ctx, T> {
    const publicKeys = users.map((u) => ({
      key: `\u0000GCPK\u0000${u.identityKey}\u0000`,
      value: JSON.stringify({ publicKey: signatures.normalizePublicKey(u.publicKey).toString("base64") })
    }));

    const userProfiles = users.map((u) => ({
      key: `\u0000GCUP\u0000${u.ethAddress}\u0000`,
      value: JSON.stringify({ alias: u.identityKey, ethAddress: u.ethAddress, roles: u.roles })
    }));

    return this.savedKVState(...publicKeys, ...userProfiles);
  }

  caClientIdentity(caUser: string, mspId: string): Fixture<Ctx, T> {
    this.ctx.clientIdentity = x509Identity(caUser, mspId);
    return this;
  }

  savedState(...objs: ChainObject[]): Fixture<Ctx, T> {
    objs.forEach((o) => {
      try {
        this.state[o.getCompositeKey()] = o.serialize();
      } catch (e) {
        throw new Error(`getCompositeKey() failure for: ${o.serialize()}. Error: ${e}`);
      }
    });
    return this;
  }

  savedKVState(...objs: { key: string; value: string }[]): Fixture<Ctx, T> {
    objs.forEach(({ key, value }) => {
      this.state[key] = value;
    });
    return this;
  }

  savedRangeState(objs: RangedChainObject[]): Fixture<Ctx, T> {
    objs.forEach((o) => {
      this.state[o.getRangedKey()] = o.serialize();
    });
    return this;
  }
}

export function fixture<Ctx extends TestGalaChainContext, T extends GalaContract<Ctx>>(
  contractClass: ClassConstructor<T>
) {
  return new Fixture<Ctx, T>(contractClass);
}

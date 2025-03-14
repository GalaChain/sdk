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
  RangedChainObject,
  UserAlias,
  UserProfile,
  signatures
} from "@gala-chain/api";
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

interface CallingUserData {
  alias?: UserAlias;
  ethAddress?: string;
  tonAddress?: string;
  roles: string[];
}

interface GalaChainContextConfig {
  readonly adminPublicKey?: string;
  readonly allowNonRegisteredUsers?: boolean;
}

type TestGalaChainContext = Context & {
  readonly stub: GalaChainStub;
  readonly logger: GalaLoggerInstance;
  set callingUserData(d: CallingUserData);
  get callingUser(): UserAlias;
  get callingUserEthAddress(): string;
  get callingUserTonAddress(): string;
  get callingUserRoles(): string[];
  get callingUserProfile(): UserProfile;
  get config(): GalaChainContextConfig;
  setDryRunOnBehalfOf(d: CallingUserData): void;
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
  public readonly state: Record<string, string> = {};
  public readonly contract: Wrapped<T>;
  public readonly ctx: Ctx;
  private readonly stub: TestChaincodeStub;
  private readonly allWrites: Record<string, string> = {};

  constructor(contractClass: ClassConstructor<T>) {
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

    this.stub = new TestChaincodeStub([], this.state, this.allWrites);

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

  caClientIdentity(caUser: string, mspId?: string): Fixture<Ctx, T> {
    this.ctx.clientIdentity = x509Identity(caUser, mspId ?? this.ctx.clientIdentity.getMSPID());
    return this;
  }

  callingUser(
    user: ChainUserWithRoles | { alias: UserAlias; ethAddress?: string; tonAddress?: string; roles: string[] }
  ): Fixture<Ctx, T> {
    if ("identityKey" in user) {
      this.ctx.callingUserData = {
        alias: user.identityKey,
        ethAddress: user.ethAddress,
        roles: user.roles
      };
      return this;
    }

    this.ctx.callingUserData = user;
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

  getWrites: (skipKeysStartingWith?: string[]) => Record<string, string> = (
    skipKeysStartingWith = ["\u0000UNTX\u0000"]
  ) => {
    return Object.entries(this.allWrites).reduce((acc, [key, value]) => {
      const shouldSkip = skipKeysStartingWith.some((prefix) => key.startsWith(prefix));
      if (!shouldSkip) {
        acc[key] = value;
      }
      return acc;
    }, {});
  };
}

export function fixture<Ctx extends TestGalaChainContext, T extends GalaContract<Ctx>>(
  contractClass: ClassConstructor<T>
) {
  return new Fixture<Ctx, T>(contractClass);
}

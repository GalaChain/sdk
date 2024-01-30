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
  PublicKey,
  RangedChainObject,
  UserProfile
} from "@gala-chain/api";
import { ChainUser } from "@gala-chain/client";
import { plainToInstance } from "class-transformer";
import { ec as EC } from "elliptic";
import { Context, Contract } from "fabric-contract-api";
import { ChaincodeStub } from "fabric-shim";
import Logger from "fabric-shim/lib/logger";

import { CachedKV, FabricIterable } from "./FabricIterable";
import { TestChaincodeStub } from "./TestChaincodeStub";

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
};

type TestGalaChainContext = Context & {
  readonly stub: GalaChainStub;
  readonly logger: GalaLoggerInstance;
  set callingUserData(d: { alias: string; ethAddress: string | undefined });
  get callingUser(): string;
  get callingUserEthAddress(): string;
  get txUnixTime(): number;
  setChaincodeStub(stub: ChaincodeStub): void;
};

type GalaContract<Ctx extends TestGalaChainContext> = Contract & {
  beforeTransaction(ctx: Ctx): Promise<void>;
  createContext(): Ctx;
};

class Fixture<Ctx extends TestGalaChainContext, T extends GalaContract<Ctx>> {
  private readonly stub: TestChaincodeStub;
  public readonly contract: T;
  public readonly ctx: Ctx;

  public callingChainUser: ChainUser;
  private knownUsers: Record<string, ChainUser> = {};

  constructor(
    contractClass: ClassConstructor<T>,
    public readonly writes: Record<string, string> = {},
    public readonly state: Record<string, string> = {}
  ) {
    const contractInstance = new contractClass();
    this.contract = new Proxy(contractInstance, {
      get: (target, prop) => {
        // check if target property is a function with ctx + dto as parameters
        if (typeof target[prop as string] === "function" && target[prop as string].length === 2) {
          const method = target[prop as string];
          return async (ctx: Ctx, dto?: ChainCallDTO) => {
            if (this.callingChainUser === undefined) {
              throw new Error("ChainUser is not set.");
            }

            const signedDto =
              dto && dto.signature === undefined ? dto.signed(this.callingChainUser.privateKey) : dto;

            await contractInstance.beforeTransaction(ctx);
            const result = signedDto
              ? await method.call(contractInstance, ctx, signedDto)
              : await method.call(contractInstance, ctx);
            await contractInstance.afterTransaction(ctx, result);
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
    this.ctx = new Proxy(ctxInstance, {
      get: (target, prop) => {
        if (prop === "callingUser") {
          return this.callingChainUser.identityKey;
        }

        return target[prop];
      }
    });

    this.callingUser("client|admin");
  }

  callingUser(user: ChainUser, mspId?: string): Fixture<Ctx, T>;

  callingUser(user: string, mspId?: string): Fixture<Ctx, T>;

  callingUser(user: string | ChainUser, mspId = "CuratorOrg"): Fixture<Ctx, T> {
    if (typeof user === "string" && !user.startsWith("client|")) {
      throw new Error("Calling user string should start with 'client|', but provided: " + user);
    }

    const chainUser =
      typeof user === "string" ? this.knownUsers[user] ?? ChainUser.withRandomKeys(user) : user;
    this.callingChainUser = chainUser;
    this.knownUsers[chainUser.identityKey] = chainUser;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.ctx.setClientIdentity(this.stub.getClientIdentity(chainUser.identityKey, mspId));

    const userProfile = plainToInstance(UserProfile, {
      alias: chainUser.identityKey,
      ethAddress: chainUser.ethAddress,
      publicKey: chainUser.publicKey
    });
    const userProfileKey = this.ctx.stub.createCompositeKey("GCUP", [userProfile.ethAddress]);
    this.stub.mockState(userProfileKey, userProfile.serialize());

    const publicKey = plainToInstance(PublicKey, { publicKey: chainUser.publicKey });
    const publicKeyKey = this.ctx.stub.createCompositeKey("GCPK", [userProfile.alias]);
    this.stub.mockState(publicKeyKey, publicKey.serialize());

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

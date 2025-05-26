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
import { UnauthorizedError, UserAlias, UserProfile, UserRole } from "@gala-chain/api";
import { Context } from "fabric-contract-api";
import { ChaincodeStub, Timestamp } from "fabric-shim";

import { GalaChainStub, createGalaChainStub } from "./GalaChainStub";
import { GalaLoggerInstance, GalaLoggerInstanceImpl } from "./GalaLoggerInstance";

function getTxUnixTime(ctx: Context): number {
  const txTimestamp: Timestamp = ctx.stub.getTxTimestamp();
  // Convert time to milliseconds by multiplying seconds and dividing nanoseconds
  const txUnixTime = txTimestamp.seconds.toNumber() * 1000 + txTimestamp.nanos / 10 ** 6;
  return Math.floor(txUnixTime);
}

export interface GalaChainContextConfig {
  readonly adminPublicKey?: string;
  readonly allowNonRegisteredUsers?: boolean;
}

class GalaChainContextConfigImpl implements GalaChainContextConfig {
  constructor(private readonly config: GalaChainContextConfig) {}

  get adminPublicKey(): string | undefined {
    return this.config.adminPublicKey ?? process.env.DEV_ADMIN_PUBLIC_KEY;
  }

  get allowNonRegisteredUsers(): boolean | undefined {
    return this.config.allowNonRegisteredUsers ?? process.env.ALLOW_NON_REGISTERED_USERS === "true";
  }
}

export class GalaChainContext extends Context {
  stub: GalaChainStub;
  private callingUserValue?: UserAlias;
  private callingUserEthAddressValue?: string;
  private callingUserTonAddressValue?: string;
  private callingUserRolesValue?: string[];
  private txUnixTimeValue?: number;
  private loggerInstance?: GalaLoggerInstance;

  public isDryRun = false;
  public config: GalaChainContextConfig;

  constructor(config: GalaChainContextConfig) {
    super();
    this.config = new GalaChainContextConfigImpl(config);
  }

  get logger(): GalaLoggerInstance {
    if (this.loggerInstance === undefined) {
      this.loggerInstance = new GalaLoggerInstanceImpl(this);
    }
    return this.loggerInstance;
  }

  get callingUser(): UserAlias {
    if (this.callingUserValue === undefined) {
      const message =
        "No calling user set. " +
        "It usually means that chaincode tried to get ctx.callingUser for unauthorized call (no DTO signature).";
      throw new UnauthorizedError(message);
    }
    return this.callingUserValue;
  }

  get callingUserEthAddress(): string {
    if (this.callingUserEthAddressValue === undefined) {
      throw new UnauthorizedError(`No ETH address known for user ${this.callingUserValue}`);
    }
    return this.callingUserEthAddressValue;
  }

  get callingUserTonAddress(): string {
    if (this.callingUserTonAddressValue === undefined) {
      throw new UnauthorizedError(`No TON address known for user ${this.callingUserValue}`);
    }
    return this.callingUserTonAddressValue;
  }

  get callingUserRoles(): string[] {
    if (this.callingUserRolesValue === undefined) {
      throw new UnauthorizedError(`No roles known for user ${this.callingUserValue}`);
    }
    return this.callingUserRolesValue;
  }

  get callingUserProfile(): UserProfile {
    const profile = new UserProfile();
    profile.alias = this.callingUser;
    profile.ethAddress = this.callingUserEthAddressValue;
    profile.tonAddress = this.callingUserTonAddressValue;
    profile.roles = this.callingUserRoles;
    return profile;
  }

  set callingUserData(d: { alias?: UserAlias; ethAddress?: string; tonAddress?: string; roles: string[] }) {
    if (this.callingUserValue !== undefined) {
      throw new Error("Calling user already set to " + this.callingUserValue);
    }

    this.callingUserValue = d.alias;
    this.callingUserRolesValue = d.roles ?? [UserRole.EVALUATE]; // default if `roles` is undefined

    if (d.ethAddress !== undefined) {
      this.callingUserEthAddressValue = d.ethAddress;
    }

    if (d.tonAddress !== undefined) {
      this.callingUserTonAddressValue = d.tonAddress;
    }
  }

  resetCallingUser() {
    this.callingUserValue = undefined;
    this.callingUserRolesValue = undefined;
    this.callingUserEthAddressValue = undefined;
    this.callingUserTonAddressValue = undefined;
  }

  public setDryRunOnBehalfOf(d: {
    alias: UserAlias;
    ethAddress?: string;
    tonAddress?: string;
    roles: string[];
  }): void {
    this.callingUserValue = d.alias;
    this.callingUserRolesValue = d.roles ?? [];
    this.callingUserEthAddressValue = d.ethAddress;
    this.callingUserTonAddressValue = d.tonAddress;
    this.isDryRun = true;
  }

  get txUnixTime(): number {
    if (this.txUnixTimeValue === undefined) {
      this.txUnixTimeValue = getTxUnixTime(this);
    }
    return this.txUnixTimeValue;
  }

  /**
   * @returns a new, empty context that uses the same chaincode stub as
   * the current context, but with dry run set (disables writes and deletes).
   */
  public createReadOnlyContext(index: number | undefined): GalaChainContext {
    const ctx = new GalaChainContext();
    ctx.clientIdentity = this.clientIdentity;
    ctx.setChaincodeStub(createGalaChainStub(this.stub, true, index));
    return ctx;
  }

  setChaincodeStub(stub: ChaincodeStub) {
    const galaChainStub = createGalaChainStub(stub, this.isDryRun, undefined);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - missing typings for `setChaincodeStub` in `fabric-contract-api`
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    super.setChaincodeStub(galaChainStub);
  }
}

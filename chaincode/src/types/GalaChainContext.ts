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
import { OtelTraceContext, UnauthorizedError, UserAlias, UserProfile, UserRole } from "@gala-chain/api";
import { Attributes, Span } from "@opentelemetry/api";
import { Context } from "fabric-contract-api";
import { ChaincodeStub, Timestamp } from "fabric-shim";

import { withSpan } from "../tracing";
import { GalaChainStub, createGalaChainStub } from "./GalaChainStub";
import { GalaLoggerInstance, GalaLoggerInstanceImpl } from "./GalaLoggerInstance";
import { OperationContext, getOperationContext } from "./OperationContext";

const NANOS_PER_MILLISECOND = 1_000_000;

function getTxUnixTime(ctx: Context): number {
  const txTimestamp: Timestamp = ctx.stub.getTxTimestamp();
  // Convert time to milliseconds by multiplying seconds and dividing nanoseconds
  const txUnixTime = txTimestamp.seconds.toNumber() * 1000 + txTimestamp.nanos / NANOS_PER_MILLISECOND;
  return Math.floor(txUnixTime);
}

export interface GalaChainContextConfig {
  readonly adminPublicKey?: string;
}

class GalaChainContextConfigImpl implements GalaChainContextConfig {
  constructor(private readonly config: GalaChainContextConfig) {}

  get adminPublicKey(): string | undefined {
    return this.config.adminPublicKey ?? process.env.DEV_ADMIN_PUBLIC_KEY;
  }
}

/**
 * Child-span helper bound to a transaction context.
 * Export is async (BatchSpanProcessor); `send` never waits on OTLP.
 */
export class GalaChainSpan {
  constructor(private readonly ctx: GalaChainContext) {}

  /**
   * Record `fn` as an INTERNAL child span.
   * Parents to the active span when ALS is intact; otherwise to
   * `GalaTransaction.EVALUATE`/`SUBMIT` or the SERVER span — never to
   * inner spans like `gala.handle` that may be missing in the trace UI.
   * Telemetry failures never propagate; errors from `fn` do.
   */
  async send<T>(
    name: string,
    attributes: Attributes,
    fn: (span: Span | undefined) => Promise<T>
  ): Promise<T> {
    return withSpan(name, attributes, fn, this.ctx.otelFallbackSpan);
  }
}

/** Safe `ctx.span.send` for contexts that are not a full GalaChainContext. */
export function sendCtxSpan<T>(
  ctx: GalaChainContext,
  name: string,
  attributes: Attributes,
  fn: (span: Span | undefined) => Promise<T>
): Promise<T> {
  if (typeof ctx?.span?.send === "function") {
    return ctx.span.send(name, attributes, fn);
  }
  return fn(undefined);
}

export class GalaChainContext extends Context {
  stub: GalaChainStub;
  private callingUserValue?: UserAlias;
  private callingUserEthAddressValue?: string;
  private callingUserRolesValue?: string[];
  private callingUserSignedByValue?: UserAlias[];
  private callingUserSignatureQuorumValue?: number;
  private callingUserAllowedSignersValue?: UserAlias[];
  private isMultisigValue?: boolean;
  private operationCtxValue?: OperationContext;
  private txUnixTimeValue?: number;
  private loggerInstance?: GalaLoggerInstance;

  public isDryRun = false;
  public config: GalaChainContextConfig;
  /** OTEL trace from DTO, used to correlate chaincode logs with the caller span. */
  public trace?: OtelTraceContext;
  /** SERVER span for the current Fabric invoke (before → after). */
  public otelSpan?: Span;
  /** GalaTransaction.EVALUATE / SUBMIT span — stable fallback parent for stub/state. */
  public otelTxSpan?: Span;
  /** Record child spans for this transaction. Export is not on the hot path. */
  public readonly span: GalaChainSpan;

  /**
   * Fallback parent when AsyncLocalStorage is missing (Fabric stub I/O).
   * Uses EVALUATE/SUBMIT if present, else the SERVER span. Never an inner
   * span (`gala.handle`) — those show up as missing parents in Sentry.
   */
  get otelFallbackSpan(): Span | undefined {
    const tx = this.otelTxSpan;
    if (tx?.isRecording()) {
      return tx;
    }
    return this.otelSpan;
  }

  constructor(config: GalaChainContextConfig) {
    super();
    this.config = new GalaChainContextConfigImpl(config);
    this.span = new GalaChainSpan(this);
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

  get callingUserAddress(): string {
    if (this.callingUserEthAddressValue !== undefined) {
      return this.callingUserEthAddressValue;
    }
    throw new UnauthorizedError(`No address known for user ${this.callingUserValue}`);
  }

  get callingUserRoles(): string[] {
    if (this.callingUserRolesValue === undefined) {
      throw new UnauthorizedError(`No roles known for user ${this.callingUserValue}`);
    }
    return this.callingUserRolesValue;
  }

  get callingUserSignedBy(): UserAlias[] {
    if (this.callingUserSignedByValue === undefined) {
      const msg = `No signed by users known for user ${this.callingUserValue}`;
      const error = new UnauthorizedError(msg);
      this.loggerInstance?.log("error", error?.stack ?? msg);
      throw error;
    }
    return this.callingUserSignedByValue;
  }

  get callingUserSignatureQuorum(): number {
    if (this.callingUserSignatureQuorumValue === undefined) {
      throw new UnauthorizedError(`No signature quorum known for user ${this.callingUserValue}`);
    }
    return this.callingUserSignatureQuorumValue;
  }

  get callingUserAllowedSigners(): UserAlias[] {
    if (this.callingUserAllowedSignersValue === undefined) {
      throw new UnauthorizedError(`No allowed signers known for user ${this.callingUserValue}`);
    }
    return this.callingUserAllowedSignersValue;
  }

  get isMultisig(): boolean {
    if (this.isMultisigValue === undefined) {
      throw new UnauthorizedError(`No multisig known for user ${this.callingUserValue}`);
    }
    return this.isMultisigValue;
  }

  get callingUserProfile(): UserProfile {
    const profile = new UserProfile();
    profile.alias = this.callingUser;
    profile.ethAddress = this.callingUserEthAddressValue;
    profile.roles = this.callingUserRoles;
    profile.signatureQuorum = this.callingUserSignatureQuorum;
    profile.signers = this.callingUserAllowedSigners;

    return profile;
  }

  set callingUserData(d: {
    alias?: UserAlias;
    ethAddress?: string;
    roles: string[];
    signedBy: UserAlias[];
    signatureQuorum: number;
    allowedSigners: UserAlias[];
    isMultisig: boolean;
  }) {
    if (this.callingUserValue !== undefined) {
      throw new Error("Calling user already set to " + this.callingUserValue);
    }

    this.callingUserValue = d.alias;
    this.callingUserRolesValue = d.roles ?? [UserRole.EVALUATE]; // default if `roles` is undefined
    this.callingUserSignedByValue = d.signedBy;
    this.callingUserSignatureQuorumValue = d.signatureQuorum;
    this.callingUserAllowedSignersValue = d.allowedSigners;
    this.isMultisigValue = d.isMultisig;

    if (d.ethAddress !== undefined) {
      this.callingUserEthAddressValue = d.ethAddress;
    }
  }

  resetCallingUser() {
    this.callingUserValue = undefined;
    this.callingUserRolesValue = undefined;
    this.callingUserEthAddressValue = undefined;
    this.callingUserSignedByValue = undefined;
    this.callingUserSignatureQuorumValue = undefined;
    this.callingUserAllowedSignersValue = undefined;
    this.isMultisigValue = undefined;
  }

  get operationCtx(): OperationContext {
    if (this.operationCtxValue === undefined) {
      this.operationCtxValue = getOperationContext(this);
    }
    return { ...this.operationCtxValue }; // prevent mutation
  }

  public setDryRunOnBehalfOf(d: { alias: UserAlias; ethAddress?: string; roles: string[] }): void {
    this.callingUserValue = d.alias;
    this.callingUserRolesValue = d.roles ?? [];
    this.callingUserEthAddressValue = d.ethAddress;
    this.callingUserSignedByValue = [];
    this.callingUserSignatureQuorumValue = 0;
    this.callingUserAllowedSignersValue = [];
    this.isMultisigValue = false;
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
    const ctx = new GalaChainContext(this.config);
    ctx.clientIdentity = this.clientIdentity;
    ctx.setChaincodeStub(createGalaChainStub(this.stub, true, index));
    // Preserve OTEL parenting for nested dry-run / batch sandbox contexts.
    ctx.trace = this.trace;
    ctx.otelSpan = this.otelSpan;
    ctx.otelTxSpan = this.otelTxSpan;
    ctx.stub?.setActiveOtelSpan?.(this.otelFallbackSpan);
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

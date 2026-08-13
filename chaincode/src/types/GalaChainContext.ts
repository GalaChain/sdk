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

import {
  endTransactionSpan,
  recordTransactionSpanError,
  runInSpanContext,
  startTransactionSpan,
  withSpan
} from "../tracing";
import { extractOtelTrace } from "../utils/extractOtelTrace";
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
 * OTEL facade for a transaction context.
 * Export is async (BatchSpanProcessor); `send` / `end` never wait on OTLP.
 */
export class GalaChainOtel {
  constructor(private readonly ctx: GalaChainContext) {}

  /** DTO parent trace — log correlation and SERVER parenting. */
  trace?: OtelTraceContext;

  private server?: Span;
  private active?: Span;

  /** SERVER span for this Fabric invoke (before → after). */
  get current(): Span | undefined {
    return this.server;
  }

  /**
   * Stub-bound recording span, else SERVER.
   * Used when Fabric drops AsyncLocalStorage (getState). Never `gala.handle`.
   */
  private get fallback(): Span | undefined {
    if (this.active?.isRecording()) {
      return this.active;
    }
    return this.server;
  }

  /** Run `fn` with SERVER as the active OTEL ALS span. */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    return runInSpanContext(this.server, fn);
  }

  /** Record an error on the SERVER span. */
  recordError(err: unknown): void {
    recordTransactionSpanError(this.server, err);
  }

  /**
   * Record `fn` as an INTERNAL child span.
   * Parents to ALS when intact; otherwise to `fallback`.
   * Does not change the stub parent (`gala.handle` must not steal it).
   * Telemetry failures never propagate; errors from `fn` do.
   */
  async send<T>(
    name: string,
    attributes: Attributes,
    fn: (span: Span | undefined) => Promise<T>
  ): Promise<T> {
    return withSpan(name, attributes, fn, this.fallback);
  }

  /**
   * Like `send`, and binds the child as stub parent for the duration of `fn`.
   * Use for state helpers and afterTransaction so stub I/O nests under this span.
   */
  async sendBound<T>(
    name: string,
    attributes: Attributes,
    fn: (span: Span | undefined) => Promise<T>
  ): Promise<T> {
    return this.send(name, attributes, (span) => this.withActive(span, () => fn(span)));
  }

  /**
   * Bind the stub fallback parent for Fabric I/O that drops ALS.
   * Omitting `span` (or passing undefined) binds SERVER.
   */
  private setActive(span?: Span): void {
    this.bind(span ?? this.server);
  }

  private async withActive<T>(span: Span | undefined, fn: () => Promise<T>): Promise<T> {
    const prev = this.active;
    this.setActive(span);
    try {
      return await fn();
    } finally {
      this.bind(prev);
    }
  }

  private bind(span: Span | undefined): void {
    this.active = span;
    this.ctx.stub?.setActiveOtelSpan?.(span);
  }

  /** Start the SERVER span once. Safe to call again (no-op if `current` exists). */
  start(name: string, dtoPlain: unknown, attributes: Attributes): void {
    if (!this.trace) {
      this.trace = extractOtelTrace(dtoPlain);
    }
    if (this.server) {
      return;
    }
    this.server = startTransactionSpan(name, this.trace, attributes);
    this.setActive();
  }

  /** End SERVER and drop span state. */
  async end(failed = false): Promise<void> {
    await endTransactionSpan(this.server, failed);
    this.server = undefined;
    this.bind(undefined);
  }

  /**
   * Sandbox ctx: share caller trace and stub parent, not SERVER.
   * Nested decorated methods start their own SERVER via `start()`.
   */
  attachFrom(parent: GalaChainOtel): void {
    this.trace = parent.trace;
    this.bind(parent.fallback);
  }
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
  /** Tracing for this invoke. Use `otel.send` / `otel.run` / `otel.end`. */
  public readonly otel: GalaChainOtel;

  constructor(config: GalaChainContextConfig) {
    super();
    this.config = new GalaChainContextConfigImpl(config);
    this.otel = new GalaChainOtel(this);
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
    ctx.otel.attachFrom(this.otel);
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

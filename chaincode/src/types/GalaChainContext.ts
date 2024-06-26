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
import { TraceContext, UnauthorizedError } from "@gala-chain/api";
import { Context } from "fabric-contract-api";
import { ChaincodeStub, Timestamp } from "fabric-shim";
import { SpanContext } from "opentracing";

import { GalaChainStub, createGalaChainStub } from "./GalaChainStub";
import { GalaLoggerInstance, GalaLoggerInstanceImpl } from "./GalaLoggerInstance";

// note this is different from SpanContext from opentracing standard
export function createDDCompatibleSpanContext({ spanId, traceId }: TraceContext, name: string): SpanContext {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const DatadogSpanContext = require("dd-trace/packages/dd-trace/src/opentracing/span_context");

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const id = require("dd-trace/packages/dd-trace/src/id") as (value: string, radix: number) => object;

  return new DatadogSpanContext({ traceId: id(traceId, 10), spanId: id(spanId, 10), name }) as SpanContext;
}

export function traceContextFromDtoString(s: string): TraceContext | undefined {
  try {
    const { trace } = JSON.parse(s) as { trace?: { spanId: string; traceId: string } };
    if (typeof trace?.traceId === "string" && typeof trace?.spanId === "string") {
      return trace;
    } else {
      return undefined;
    }
  } catch (e) {
    return undefined;
  }
}

export function traceContextFromTransientData(
  transientMap: Map<string, Uint8Array>
): TraceContext | undefined {
  try {
    const str = transientMap.get("spanContext")?.toString();

    if (str === undefined) {
      return undefined;
    }

    const { traceId, spanId } = JSON.parse(str);

    if (typeof traceId !== "string" || typeof spanId !== "string") {
      return undefined;
    } else {
      return { spanId, traceId };
    }
  } catch (e) {
    return undefined;
  }
}

export function getParentSpanContext(stub: ChaincodeStub): SpanContext | undefined {
  try {
    const { fcn, params } = stub.getFunctionAndParameters();
    const t = traceContextFromDtoString(params[0]) ?? traceContextFromTransientData(stub.getTransient());
    return t === undefined ? undefined : createDDCompatibleSpanContext(t, fcn);
  } catch (e) {
    return undefined;
  }
}

function getTxUnixTime(ctx: Context): number {
  const txTimestamp: Timestamp = ctx.stub.getTxTimestamp();
  // Convert time to milliseconds by multiplying seconds and dividing nanoseconds
  const txUnixTime = txTimestamp.seconds.toNumber() * 1000 + txTimestamp.nanos / 10 ** 6;
  return Math.floor(txUnixTime);
}

export class GalaChainContext extends Context {
  stub: GalaChainStub;
  span?: SpanContext;
  private callingUserValue?: string;
  private callingUserEthAddressValue?: string;
  public isDryRun = false;
  private txUnixTimeValue?: number;
  private loggerInstance?: GalaLoggerInstance;

  get logger(): GalaLoggerInstance {
    if (this.loggerInstance === undefined) {
      this.loggerInstance = new GalaLoggerInstanceImpl(this);
    }
    return this.loggerInstance;
  }

  get callingUser(): string {
    if (this.callingUserValue === undefined) {
      throw new UnauthorizedError("No calling user set");
    }
    return this.callingUserValue;
  }

  get callingUserEthAddress(): string {
    if (this.callingUserEthAddressValue === undefined) {
      throw new UnauthorizedError(`No eth address known for user ${this.callingUserValue}`);
    }
    return this.callingUserEthAddressValue;
  }

  set callingUserData(d: { alias: string; ethAddress: string | undefined }) {
    if (this.callingUserValue !== undefined) {
      throw new Error("Calling user already set to " + this.callingUserValue);
    }
    this.callingUserValue = d.alias;
    this.callingUserEthAddressValue = d.ethAddress;
  }

  public setDryRunOnBehalfOf(d: { alias: string; ethAddress: string | undefined }): void {
    this.callingUserValue = d.alias;
    this.callingUserEthAddressValue = d.ethAddress;
    this.isDryRun = true;
  }

  get txUnixTime(): number {
    if (this.txUnixTimeValue === undefined) {
      this.txUnixTimeValue = getTxUnixTime(this);
    }
    return this.txUnixTimeValue;
  }

  setChaincodeStub(stub: ChaincodeStub) {
    const galaChainStub = createGalaChainStub(stub);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - missing typings for `setChaincodeStub` in `fabric-contract-api`
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    super.setChaincodeStub(galaChainStub);
    // set parent context
    this.span = getParentSpanContext(stub);
  }
}

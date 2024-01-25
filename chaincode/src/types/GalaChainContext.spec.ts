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
import { ChaincodeStub } from "fabric-shim";
import { SpanContext } from "opentracing";

import {
  createDDCompatibleSpanContext,
  getParentSpanContext,
  traceContextFromDtoString,
  traceContextFromTransientData
} from "./GalaChainContext";

describe("dd-trace", () => {
  it("should create dd-compatible span context", async () => {
    // Given
    const spanId = "5165352660394767087";
    const traceId = "8728051200597135514";

    // When
    const spanContect = createDDCompatibleSpanContext({ spanId, traceId }, "irrelevant");

    // Then
    expect(spanContect.toSpanId()).toEqual(spanId);
    expect(spanContect.toTraceId()).toEqual(traceId);
  });

  it("should get trace context from dto string", () => {
    // Given
    const trace = {
      spanId: "5165352660394767087",
      traceId: "8728051200597135514"
    };

    // Given
    const validS = [
      JSON.stringify({ a: 1, trace: trace, z: "abc" }), //
      JSON.stringify({ trace: trace })
    ];
    const invalidS = [
      JSON.stringify({ x: { trace: trace } }),
      JSON.stringify({ x: { trace: { spanId: trace.spanId } } }),
      JSON.stringify({ trace: trace }).slice(1)
    ];

    // When
    const valid = validS.map((s) => traceContextFromDtoString(s));
    const invalid = invalidS.map((s) => traceContextFromDtoString(s));

    // Then
    expect(valid).toEqual([trace, trace]);
    expect(invalid).toEqual([undefined, undefined]);
  });

  it("should get trace context from transient data", () => {
    // Given
    const trace = {
      spanId: "5165352660394767087",
      traceId: "8728051200597135514"
    };

    // Given
    const validTransient = [new Map([["spanContext", Buffer.from(JSON.stringify(trace))]])];
    const invalidTransient = [
      new Map([["spanContex", Buffer.from(JSON.stringify(trace))]]),
      new Map([["spanContext", Buffer.from(JSON.stringify({ spanContext: trace }))]]),
      new Map([["spanContext", Buffer.from(JSON.stringify({ spanId: trace.spanId }))]]),
      new Map([["spanContext", Buffer.from(JSON.stringify(trace).slice(1))]])
    ];

    // When
    const valid = validTransient.map((t) => traceContextFromTransientData(t));
    const invalid = invalidTransient.map((t) => traceContextFromTransientData(t));

    // Then
    expect(valid).toEqual([trace]);
    expect(invalid).toEqual([undefined, undefined, undefined, undefined]);
  });

  it("should prefer trace context from dto string", () => {
    // Given
    const traceFromDto = { spanId: "1111111111111111111", traceId: "1111111111111111111" };
    const dtoString = JSON.stringify({ trace: traceFromDto, a: 1, z: "abc" });

    const traceFromTransient = { spanId: "2222222222222222222", traceId: "2222222222222222222" };
    const transientMap = new Map([["spanContext", Buffer.from(JSON.stringify(traceFromTransient))]]);

    const dtoOnlyStub = {
      getFunctionAndParameters: () => ({ fcn: "irrelevant", params: [dtoString] }),
      getTransient: () => new Map()
    } as unknown as ChaincodeStub;

    const transientOnlyStub = {
      getFunctionAndParameters: () => ({ fcn: "irrelevant", params: [JSON.stringify({})] }),
      getTransient: () => transientMap
    } as unknown as ChaincodeStub;

    const bothStub = {
      getFunctionAndParameters: () => ({ fcn: "irrelevant", params: [dtoString] }),
      getTransient: () => transientMap
    } as unknown as ChaincodeStub;

    function asPlain(o: SpanContext | undefined) {
      return o === undefined ? undefined : { spanId: o.toSpanId(), traceId: o.toTraceId() };
    }

    // When
    const contextFromDto = getParentSpanContext(dtoOnlyStub);
    const contextFromTransient = getParentSpanContext(transientOnlyStub);
    const contextFromBoth = getParentSpanContext(bothStub);

    // Then
    expect(asPlain(contextFromDto)).toEqual(traceFromDto);
    expect(asPlain(contextFromTransient)).toEqual(traceFromTransient);
    expect(asPlain(contextFromBoth)).toEqual(traceFromDto);
  });
});

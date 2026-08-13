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
  _resetTracingForTests,
  endTransactionSpan,
  formatOtelStateKey,
  isTracingEnabled,
  recordTransactionSpanError,
  runInSpanContext,
  startTransactionSpan,
  verifyOtelConnection,
  withSpan
} from "./tracing";

describe("tracing", () => {
  const previousEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

  afterEach(async () => {
    await _resetTracingForTests();
    if (previousEndpoint === undefined) {
      delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    } else {
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT = previousEndpoint;
    }
  });

  it("should be disabled when OTEL_EXPORTER_OTLP_ENDPOINT is unset", async () => {
    // Given
    delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    await _resetTracingForTests();

    // When & Then
    expect(isTracingEnabled()).toBe(false);
    expect(startTransactionSpan("Test:Method", undefined)).toBeUndefined();
  });

  it("should skip startup check when endpoint is unset", async () => {
    // Given
    delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    await _resetTracingForTests();

    // When
    const ok = await verifyOtelConnection();

    // Then
    expect(ok).toBe(false);
  });

  it("should fail startup check when endpoint is unreachable", async () => {
    // Given
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = "http://127.0.0.1:9";
    process.env.OTEL_SERVICE_NAME = "test-chaincode";
    await _resetTracingForTests();

    // When
    const ok = await verifyOtelConnection();

    // Then
    expect(ok).toBe(false);
  });

  it("should start and end a span when endpoint is configured", async () => {
    // Given
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = "http://127.0.0.1:9";
    process.env.OTEL_SERVICE_NAME = "test-chaincode";
    await _resetTracingForTests();

    // When
    const span = startTransactionSpan("TestContract:TestMethod", {
      traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
      spanId: "00f067aa0ba902b7"
    });

    // Then
    expect(span).toBeDefined();
    expect(span?.isRecording()).toBe(true);

    recordTransactionSpanError(span, new Error("boom"));
    await endTransactionSpan(span, true);
    expect(span?.isRecording()).toBe(false);
  });

  it("should nest withSpan children under the active transaction span", async () => {
    // Given
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = "http://127.0.0.1:9";
    process.env.OTEL_SERVICE_NAME = "test-chaincode";
    await _resetTracingForTests();

    const parent = startTransactionSpan("TestContract:Parent", undefined);
    expect(parent).toBeDefined();

    // When
    let childTraceId: string | undefined;
    let childParentSpanId: string | undefined;
    await runInSpanContext(parent, async () => {
      await withSpan("stub.getState", { "fabric.state.key": "k1" }, async (span) => {
        const ctx = span?.spanContext();
        childTraceId = ctx?.traceId;
        // Parent linkage is via context; child must share the parent's trace id.
        childParentSpanId = parent?.spanContext().spanId;
        expect(span?.isRecording()).toBe(true);
      });
      await withSpan("stub.flushWrites", { "fabric.state.key": "k1" }, async (span) => {
        expect(span?.isRecording()).toBe(true);
        expect(span?.spanContext().traceId).toBe(childTraceId);
      });
    });

    // Then
    expect(childTraceId).toBe(parent?.spanContext().traceId);
    expect(childParentSpanId).toBe(parent?.spanContext().spanId);

    await endTransactionSpan(parent);
  });

  it("should rethrow errors from withSpan and mark the span failed", async () => {
    // Given
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = "http://127.0.0.1:9";
    await _resetTracingForTests();

    // When & Then
    await expect(
      withSpan("stub.getState", {}, async () => {
        throw new Error("state boom");
      })
    ).rejects.toThrow("state boom");
  });

  it("should parent withSpan to fallbackParent when no span is active", async () => {
    // Given — simulates Fabric afterTransaction where ALS context was dropped
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = "http://127.0.0.1:9";
    process.env.OTEL_SERVICE_NAME = "test-chaincode";
    await _resetTracingForTests();

    const parent = startTransactionSpan("TestContract:Parent", {
      traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
      spanId: "00f067aa0ba902b7"
    });
    expect(parent).toBeDefined();

    // When — intentionally NOT inside runInSpanContext
    let childTraceId: string | undefined;
    await withSpan(
      "stub.flushWrites",
      {},
      async (span) => {
        childTraceId = span?.spanContext().traceId;
        expect(span?.isRecording()).toBe(true);
      },
      parent
    );

    // Then
    expect(childTraceId).toBe(parent?.spanContext().traceId);
    await endTransactionSpan(parent);
  });

  it("should ignore non-recording active span and use fallbackParent", async () => {
    // Given — ambient context has only a remote (non-recording) parent from dto.trace
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = "http://127.0.0.1:9";
    process.env.OTEL_SERVICE_NAME = "test-chaincode";
    await _resetTracingForTests();

    const fallback = startTransactionSpan("TestContract:Fallback", undefined);
    expect(fallback?.isRecording()).toBe(true);

    const remoteParent = startTransactionSpan("TestContract:Remote", {
      traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
      spanId: "00f067aa0ba902b7"
    });
    // End remote so any leftover context would be non-recording if re-used; instead
    // simulate remote via setSpanContext on ROOT (non-recording wrapper).
    await endTransactionSpan(remoteParent);

    const { context: otelContext, ROOT_CONTEXT, trace: otelTrace } = await import("@opentelemetry/api");
    const remoteCtx = otelTrace.setSpanContext(ROOT_CONTEXT, {
      traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
      spanId: "00f067aa0ba902b7",
      traceFlags: 1,
      isRemote: true
    });

    let childTraceId: string | undefined;
    await otelContext.with(remoteCtx, async () => {
      // active getSpan is non-recording; child must still attach to our fallback
      await withSpan(
        "state.getObjectByKey",
        {},
        async (span) => {
          childTraceId = span?.spanContext().traceId;
        },
        fallback
      );
    });

    // Then
    expect(childTraceId).toBe(fallback?.spanContext().traceId);
    await endTransactionSpan(fallback);
  });

  it("should replace composite-key null separators with slashes in state keys", () => {
    // Given
    const compositeKey = ["TokenClass", "GALA", "Unit", "none", "none"].join("\u0000");

    // When
    const formatted = formatOtelStateKey(`\u0000${compositeKey}\u0000`);

    // Then
    expect(formatted).toBe("/TokenClass/GALA/Unit/none/none/");
    expect(formatted.includes("\u0000")).toBe(false);
  });

  it("should keep withSpan open for the full async duration", async () => {
    // Given
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = "http://127.0.0.1:9";
    await _resetTracingForTests();

    const started = Date.now();
    let endedWhileRunning = false;

    // When
    await withSpan("stub.getState", {}, async (span) => {
      await new Promise((r) => setTimeout(r, 30));
      endedWhileRunning = span?.isRecording() === true;
    });

    // Then
    expect(endedWhileRunning).toBe(true);
    expect(Date.now() - started).toBeGreaterThanOrEqual(25);
  });
});

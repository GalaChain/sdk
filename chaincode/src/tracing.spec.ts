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
  isTracingEnabled,
  recordTransactionSpanError,
  startTransactionSpan,
  verifyOtelConnection
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
});

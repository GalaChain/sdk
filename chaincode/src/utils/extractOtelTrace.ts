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
import { OtelTraceContext } from "@gala-chain/api";

const INVALID_TRACE_ID = "00000000000000000000000000000000";
const INVALID_SPAN_ID = "0000000000000000";

/**
 * Reads OTEL trace context from a raw DTO payload (object or JSON string).
 * Returns undefined when missing or when the caller sent the all-zero invalid context.
 */
export function extractOtelTrace(dtoPlain: unknown): OtelTraceContext | undefined {
  let value: unknown = dtoPlain;

  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return undefined;
    }
  }

  if (!value || typeof value !== "object") {
    return undefined;
  }

  const trace = (value as { trace?: unknown }).trace;
  if (!trace || typeof trace !== "object") {
    return undefined;
  }

  const { traceId, spanId } = trace as { traceId?: unknown; spanId?: unknown };
  if (typeof traceId !== "string" || typeof spanId !== "string" || !traceId || !spanId) {
    return undefined;
  }

  if (traceId === INVALID_TRACE_ID || spanId === INVALID_SPAN_ID) {
    return undefined;
  }

  return { traceId, spanId };
}

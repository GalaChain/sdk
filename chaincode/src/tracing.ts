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
import {
  Attributes,
  DiagLogLevel,
  ROOT_CONTEXT,
  Span,
  SpanKind,
  SpanStatusCode,
  TraceFlags,
  context,
  diag,
  trace
} from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeTracerProvider, SimpleSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";

const TRACER_NAME = "gala-chaincode";
const TRACE_ID_RE = /^[0-9a-f]{32}$/i;
const SPAN_ID_RE = /^[0-9a-f]{16}$/i;
const LOG_PREFIX = "[otel]";

let provider: NodeTracerProvider | undefined;
let initAttempted = false;

function tracesUrl(endpoint: string): string {
  const trimmed = endpoint.replace(/\/$/, "");
  return /\/v1\/traces$/i.test(trimmed) ? trimmed : `${trimmed}/v1/traces`;
}

function createTraceExporter(endpoint: string): OTLPTraceExporter {
  // Pass url/headers explicitly so the exporter matches our probe parsing.
  // Relying on the exporter's own env parsing can disagree (quotes, commas).
  return new OTLPTraceExporter({
    url: tracesUrl(endpoint),
    headers: parseOtelHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS)
  });
}

/**
 * Starts the OTEL tracer when `OTEL_EXPORTER_OTLP_ENDPOINT` is set.
 * Config from standard OTEL_* env vars:
 *   OTEL_EXPORTER_OTLP_ENDPOINT
 *   OTEL_EXPORTER_OTLP_PROTOCOL
 *   OTEL_EXPORTER_OTLP_HEADERS
 *   OTEL_SERVICE_NAME
 *   OTEL_SERVICE_VERSION
 */
export function initTracing(): void {
  if (initAttempted) {
    return;
  }
  initAttempted = true;

  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) {
    return;
  }

  const serviceName = process.env.OTEL_SERVICE_NAME ?? "gala-chaincode";
  const serviceVersion = process.env.OTEL_SERVICE_VERSION;

  provider = new NodeTracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
      ...(serviceVersion ? { [ATTR_SERVICE_VERSION]: serviceVersion } : {})
    }),
    // Export each span immediately — chaincode txs are short-lived.
    spanProcessors: [new SimpleSpanProcessor(createTraceExporter(endpoint))]
  });

  provider.register();
  console.log(
    `${LOG_PREFIX} Tracer initialized (endpoint=${endpoint}, service=${serviceName}` +
      `${serviceVersion ? `, version=${serviceVersion}` : ""})`
  );
}

export function isTracingEnabled(): boolean {
  initTracing();
  return provider !== undefined;
}

function isValidParentTrace(traceCtx: OtelTraceContext): boolean {
  return TRACE_ID_RE.test(traceCtx.traceId) && SPAN_ID_RE.test(traceCtx.spanId);
}

/**
 * Starts a SERVER span for a chaincode method, optionally as a child of dto.trace.
 */
export function startTransactionSpan(
  name: string,
  parent: OtelTraceContext | undefined,
  attributes: Attributes = {}
): Span | undefined {
  if (!isTracingEnabled()) {
    return undefined;
  }

  let parentCtx = context.active();
  if (parent && isValidParentTrace(parent)) {
    parentCtx = trace.setSpanContext(ROOT_CONTEXT, {
      traceId: parent.traceId.toLowerCase(),
      spanId: parent.spanId.toLowerCase(),
      traceFlags: TraceFlags.SAMPLED,
      isRemote: true
    });
  }

  return trace.getTracer(TRACER_NAME).startSpan(
    name,
    {
      kind: SpanKind.SERVER,
      attributes
    },
    parentCtx
  );
}

export function recordTransactionSpanError(span: Span | undefined, err: unknown): void {
  if (!span) {
    return;
  }

  const error = err instanceof Error ? err : new Error(String(err));
  span.recordException(error);
  span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
}

/**
 * Runs `fn` with `span` as the active OTEL context so child spans nest under it.
 * Uses ROOT_CONTEXT as the base so a stale ambient span cannot become the parent.
 */
export async function runInSpanContext<T>(span: Span | undefined, fn: () => Promise<T>): Promise<T> {
  if (!span) {
    return fn();
  }
  return context.with(trace.setSpan(ROOT_CONTEXT, span), fn);
}

/**
 * Resolves the parent for a child span.
 * Prefers the active context (preserves nesting); falls back to an explicit span
 * when Fabric/async boundaries drop AsyncLocalStorage context.
 */
function resolveParentSpan(fallback?: Span): Span | undefined {
  return trace.getSpan(context.active()) ?? fallback;
}

/**
 * Starts an INTERNAL child span under the active context, or `fallbackParent` when
 * no span is active (common after Fabric lifecycle boundaries).
 * No-op when tracing is disabled.
 */
export function startChildSpan(
  name: string,
  attributes: Attributes = {},
  fallbackParent?: Span
): Span | undefined {
  if (!isTracingEnabled()) {
    return undefined;
  }

  const parent = resolveParentSpan(fallbackParent);
  const parentCtx = parent ? trace.setSpan(ROOT_CONTEXT, parent) : context.active();

  return trace.getTracer(TRACER_NAME).startSpan(
    name,
    {
      kind: SpanKind.INTERNAL,
      attributes
    },
    parentCtx
  );
}

export function endChildSpan(span: Span | undefined, err?: unknown): void {
  if (!span) {
    return;
  }

  if (err !== undefined) {
    recordTransactionSpanError(span, err);
  } else if (span.isRecording()) {
    span.setStatus({ code: SpanStatusCode.OK });
  }

  span.end();
}

/**
 * Times an async operation as an INTERNAL child span. Never swallows errors.
 * Pass `fallbackParent` (usually ctx.otelSpan) so parenting survives lost ALS context.
 */
export async function withSpan<T>(
  name: string,
  attributes: Attributes,
  fn: (span: Span | undefined) => Promise<T>,
  fallbackParent?: Span
): Promise<T> {
  const span = startChildSpan(name, attributes, fallbackParent);
  try {
    const result = span
      ? await context.with(trace.setSpan(ROOT_CONTEXT, span), () => fn(span))
      : await fn(span);
    endChildSpan(span);
    return result;
  } catch (err) {
    endChildSpan(span, err);
    throw err;
  }
}

/**
 * Times a sync operation as an INTERNAL child span. Never swallows errors.
 */
export function withSpanSync<T>(
  name: string,
  attributes: Attributes,
  fn: (span: Span | undefined) => T,
  fallbackParent?: Span
): T {
  const span = startChildSpan(name, attributes, fallbackParent);
  try {
    const result = span ? context.with(trace.setSpan(ROOT_CONTEXT, span), () => fn(span)) : fn(span);
    endChildSpan(span);
    return result;
  } catch (err) {
    endChildSpan(span, err);
    throw err;
  }
}

const ATTR_MAX_LEN = 256;

/** Truncate long attribute values (e.g. Fabric keys) for OTEL. */
export function truncateOtelAttr(value: string, maxLen = ATTR_MAX_LEN): string {
  return value.length > maxLen ? `${value.slice(0, maxLen - 1)}…` : value;
}

/**
 * Ends the span and optionally flushes so the export completes before the tx returns.
 * Pass `failed` when the transaction already recorded an error status.
 * Set `flush` false for nested spans (e.g. batch ops); the outer tx ends with a flush.
 */
export async function endTransactionSpan(
  span: Span | undefined,
  failed = false,
  flush = true
): Promise<void> {
  if (!span) {
    return;
  }

  if (!failed) {
    span.setStatus({ code: SpanStatusCode.OK });
  }

  span.end();

  if (flush && provider) {
    try {
      await provider.forceFlush();
    } catch {
      // Never fail a chaincode transaction because of telemetry.
    }
  }
}

function stripWrappingQuotes(value: string): string {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

function parseOtelHeaders(raw: string | undefined): Record<string, string> {
  if (!raw) {
    return {};
  }

  const headers: Record<string, string> = {};
  for (const part of raw.split(",")) {
    const idx = part.indexOf("=");
    if (idx <= 0) {
      continue;
    }
    const key = part.slice(0, idx).trim();
    let value = part.slice(idx + 1).trim();
    value = stripWrappingQuotes(value);
    try {
      value = decodeURIComponent(value);
    } catch {
      // keep raw value if not URI-encoded
    }
    value = stripWrappingQuotes(value);
    if (key) {
      headers[key] = value;
    }
  }
  return headers;
}

/** Safe summary for logs — never prints secrets. */
function describeAuthHeaders(headers: Record<string, string>): string {
  const keys = Object.keys(headers);
  if (!keys.length) {
    return "headers=(none) — OTEL_EXPORTER_OTLP_HEADERS is unset or unparseable";
  }

  const parts = keys.map((key) => {
    const value = headers[key] ?? "";
    if (key.toLowerCase() === "authorization") {
      const bearer = /^Bearer\s+(\S+)/i.exec(value);
      if (bearer) {
        const token = bearer[1];
        const prefix = token.slice(0, 6);
        return `${key}=Bearer ${prefix}… (len=${token.length})`;
      }
      if (!value) {
        return `${key}=(empty)`;
      }
      return `${key}=(non-Bearer, len=${value.length}, startsWithQuote=${
        value.startsWith('"') || value.startsWith("'")
      })`;
    }
    return `${key}=(len=${value.length})`;
  });

  return `headers=[${parts.join(", ")}]`;
}

async function readBodyPreview(response: Response, maxLen = 300): Promise<string> {
  try {
    const text = await response.text();
    if (!text) {
      return "(empty body)";
    }
    const compact = text.replace(/\s+/g, " ").trim();
    return compact.length > maxLen ? `${compact.slice(0, maxLen)}…` : compact;
  } catch {
    return "(unreadable body)";
  }
}

/**
 * Verifies the OTLP endpoint is reachable and that a probe span can be exported.
 * Intended for chaincode startup and local `otel:verify` runs. Never throws.
 */
export async function verifyOtelConnection(): Promise<boolean> {
  initTracing();

  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint || !provider) {
    console.log(`${LOG_PREFIX} Startup check skipped: OTEL_EXPORTER_OTLP_ENDPOINT is not set`);
    return false;
  }

  const serviceName = process.env.OTEL_SERVICE_NAME ?? "gala-chaincode";
  const serviceVersion = process.env.OTEL_SERVICE_VERSION;
  const protocol = process.env.OTEL_EXPORTER_OTLP_PROTOCOL ?? "(default)";
  const rawHeadersEnv = process.env.OTEL_EXPORTER_OTLP_HEADERS;
  const headers = parseOtelHeaders(rawHeadersEnv);
  const url = tracesUrl(endpoint);

  console.log(
    `${LOG_PREFIX} Startup check config: endpoint=${endpoint}, tracesUrl=${url}, ` +
      `protocol=${protocol}, service=${serviceName}` +
      `${serviceVersion ? `, version=${serviceVersion}` : ""}, ` +
      `${describeAuthHeaders(headers)}, ` +
      `rawHeadersSet=${rawHeadersEnv ? "yes" : "no"}, rawHeadersLen=${rawHeadersEnv?.length ?? 0}`
  );

  if (rawHeadersEnv && /Authorization\s*=\s*["']Bearer/i.test(rawHeadersEnv)) {
    console.warn(
      `${LOG_PREFIX} Hint: OTEL_EXPORTER_OTLP_HEADERS looks quoted around the Bearer value. ` +
        `Prefer: OTEL_EXPORTER_OTLP_HEADERS=Authorization=Bearer <token> ` +
        `(or quote the whole env value, not only the token)`
    );
  }

  // 1) HTTP reachability (clearer errors than the exporter alone)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-protobuf",
        ...headers
      },
      // Empty body: we only care that TLS/DNS/auth/network work.
      body: new Uint8Array(),
      signal: controller.signal
    });
    clearTimeout(timeout);
    const bodyPreview = await readBodyPreview(response);
    const wwwAuth = response.headers.get("www-authenticate");
    console.log(
      `${LOG_PREFIX} HTTP probe response: ${response.status} ${response.statusText}` +
        `${wwwAuth ? `, www-authenticate=${wwwAuth}` : ""}, body=${bodyPreview}`
    );

    if (response.status === 401 || response.status === 403) {
      console.error(
        `${LOG_PREFIX} Startup check FAILED (auth): HTTP ${response.status}. ` +
          `Check OTEL_EXPORTER_OTLP_HEADERS. ${describeAuthHeaders(headers)}`
      );
      return false;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`${LOG_PREFIX} Startup check FAILED (HTTP reachability): ${message}`);
    return false;
  }

  // 2) Real OTLP export via the SDK
  const exportErrors: string[] = [];
  diag.setLogger(
    {
      error: (message, ...args) => {
        exportErrors.push([message, ...args].map(String).join(" "));
      },
      warn: () => undefined,
      info: () => undefined,
      debug: () => undefined,
      verbose: () => undefined
    },
    DiagLogLevel.ERROR
  );

  try {
    const span = trace.getTracer(TRACER_NAME).startSpan("otel.startup.probe", {
      kind: SpanKind.INTERNAL,
      attributes: { "otel.probe": true }
    });
    const { traceId, spanId } = span.spanContext();
    console.log(
      `${LOG_PREFIX} Probe span: name=otel.startup.probe, trace_id=${traceId}, span_id=${spanId}, ` +
        `service=${serviceName}`
    );
    span.setStatus({ code: SpanStatusCode.OK });
    span.end();
    await provider.forceFlush();

    if (exportErrors.length) {
      console.error(
        `${LOG_PREFIX} Startup check FAILED (export): ${exportErrors.join("; ")}. ` +
          `trace_id=${traceId}, span_id=${spanId}, ${describeAuthHeaders(headers)}, tracesUrl=${url}`
      );
      return false;
    }

    console.log(
      `${LOG_PREFIX} Startup check OK: probe span exported to ${url} ` +
        `(search by trace_id=${traceId} or span name otel.startup.probe / service=${serviceName})`
    );
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `${LOG_PREFIX} Startup check FAILED (export): ${message}. ` +
        `${describeAuthHeaders(headers)}, tracesUrl=${url}`
    );
    return false;
  }
}

/** @internal test helper */
export async function _resetTracingForTests(): Promise<void> {
  if (provider) {
    try {
      await provider.shutdown();
    } catch {
      // ignore
    }
  }
  provider = undefined;
  initAttempted = false;
}

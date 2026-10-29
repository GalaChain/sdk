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

export const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;
export const DEFAULT_MAX_RESPONSE_BYTES = 10 * 1024 * 1024;

export interface FetchWithTimeoutOptions {
  /** Deadline for the whole request, including reading the body. */
  timeoutMs?: number;
  /** Caller signal that cancels the request. */
  signal?: AbortSignal;
  /** Largest response body accepted, in bytes. */
  maxResponseBytes?: number;
}

export interface FetchedResponse {
  response: Response;
  /** Response body as text, read within the same deadline as the request. */
  body: string;
}

/**
 * Sends a request and reads its body under one deadline and size limit.
 * The response body is returned as text, so callers do not read the stream again.
 */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  options: FetchWithTimeoutOptions = {}
): Promise<FetchedResponse> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const maxBytes = options.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES;
  const controller = new AbortController();
  let abortError: Error | undefined;
  let rejectAborted: (error: Error) => void = () => undefined;
  const aborted = new Promise<never>((_resolve, reject) => {
    rejectAborted = reject;
  });
  // Avoid an unhandled rejection when nothing is waiting on it.
  aborted.catch(() => undefined);

  const abort = (error: Error) => {
    if (abortError) {
      return;
    }
    abortError = error;
    controller.abort();
    rejectAborted(error);
  };

  const timer = setTimeout(() => abort(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs);
  const onCallerAbort = () => abort(new Error("Request was aborted"));
  if (options.signal?.aborted) {
    onCallerAbort();
  } else {
    options.signal?.addEventListener("abort", onCallerAbort);
  }

  try {
    if (abortError) {
      throw abortError;
    }
    const response = await Promise.race([fetch(url, { ...init, signal: controller.signal }), aborted]);
    const body = await Promise.race([readBody(response, maxBytes), aborted]);
    return { response, body };
  } catch (error) {
    if (abortError) {
      throw abortError;
    }
    throw error;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", onCallerAbort);
  }
}

function tooLarge(maxBytes: number): Error {
  return new Error(`Response exceeds ${maxBytes} bytes`);
}

function utf8ByteLength(text: string): number {
  let bytes = 0;
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    bytes += code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
  }
  return bytes;
}

async function readBody(response: Response, maxBytes: number): Promise<string> {
  const declared = Number(response.headers?.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw tooLarge(maxBytes);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    const text = await response.text();
    if (utf8ByteLength(text) > maxBytes) {
      throw tooLarge(maxBytes);
    }
    return text;
  }

  const decoder = new TextDecoder();
  let received = 0;
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw tooLarge(maxBytes);
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

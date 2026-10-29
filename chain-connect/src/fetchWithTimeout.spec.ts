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
import { TextDecoder as NodeTextDecoder } from "util";

import { GalaChainProvider } from "./GalaChainClient";
import { DEFAULT_MAX_RESPONSE_BYTES, DEFAULT_REQUEST_TIMEOUT_MS, fetchWithTimeout } from "./fetchWithTimeout";

class TestProvider extends GalaChainProvider {
  public async sign<T extends object>(): Promise<T & { signature: string }> {
    throw new Error("unused");
  }
}

describe("fetchWithTimeout", () => {
  const originalFetch = global.fetch;

  beforeAll(() => {
    // jsdom does not provide TextDecoder, which browsers and Node do.
    Object.assign(global, { TextDecoder: global.TextDecoder ?? NodeTextDecoder });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  it("stops a request that does not answer within the default timeout", async () => {
    jest.useFakeTimers();
    let signal: AbortSignal | undefined;
    global.fetch = jest.fn((_url: string, init?: RequestInit) => {
      signal = init?.signal ?? undefined;
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("The operation was aborted", "AbortError"));
        });
      });
    }) as typeof fetch;

    const pending = fetchWithTimeout("https://example.test/submit", { method: "POST" });
    const assertion = expect(pending).rejects.toThrow(
      `Request timed out after ${DEFAULT_REQUEST_TIMEOUT_MS}ms`
    );

    await jest.advanceTimersByTimeAsync(DEFAULT_REQUEST_TIMEOUT_MS - 1);
    expect(signal?.aborted).toBe(false);

    await jest.advanceTimersByTimeAsync(1);
    await assertion;
  });

  it("uses the provider timeout for a submit", async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn((_url: string, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("The operation was aborted", "AbortError"));
        });
      });
    }) as typeof fetch;

    const client = new TestProvider({ timeoutMs: 5_000 });
    const pending = client.submit({
      url: "https://example.test",
      method: "Ping",
      payload: {},
      sign: false
    });
    const assertion = expect(pending).rejects.toThrow("Request timed out after 5000ms");

    await jest.advanceTimersByTimeAsync(5_000);
    await assertion;
  });

  it("times out when the body stalls after the headers arrive", async () => {
    // Given
    jest.useFakeTimers();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        headers: { get: () => null },
        text: () => new Promise<string>(() => undefined)
      } as unknown as Response)
    ) as typeof fetch;
    const client = new TestProvider({ timeoutMs: 5_000 });

    // When
    const pending = client.submit({ url: "https://example.test", method: "Ping", payload: {}, sign: false });
    const assertion = expect(pending).rejects.toThrow("Request timed out after 5000ms");
    await jest.advanceTimersByTimeAsync(5_000);

    // Then
    await assertion;
  });

  it("times out when a streamed body stops sending", async () => {
    // Given
    jest.useFakeTimers();
    const stalled = {
      getReader: () => ({
        read: () => new Promise(() => undefined),
        cancel: () => Promise.resolve()
      })
    };
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, headers: { get: () => null }, body: stalled } as unknown as Response)
    ) as typeof fetch;

    // When
    const pending = fetchWithTimeout("https://example.test", { method: "POST" }, { timeoutMs: 1_000 });
    const assertion = expect(pending).rejects.toThrow("Request timed out after 1000ms");
    await jest.advanceTimersByTimeAsync(1_000);

    // Then
    await assertion;
  });

  it("rejects a body larger than the limit", async () => {
    // Given
    const chunks = [new Uint8Array(600), new Uint8Array(600)];
    const cancel = jest.fn(() => Promise.resolve());
    const streamed = {
      getReader: () => ({
        read: () => Promise.resolve(chunks.length ? { done: false, value: chunks.shift() } : { done: true }),
        cancel
      })
    };
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, headers: { get: () => null }, body: streamed } as unknown as Response)
    ) as typeof fetch;

    // When
    const pending = fetchWithTimeout("https://example.test", { method: "POST" }, { maxResponseBytes: 1_000 });

    // Then
    await expect(pending).rejects.toThrow("Response exceeds 1000 bytes");
    expect(cancel).toHaveBeenCalled();
  });

  it("rejects a declared content-length above the default limit", async () => {
    // Given
    const text = jest.fn();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        headers: {
          get: (key: string) => (key === "content-length" ? `${DEFAULT_MAX_RESPONSE_BYTES + 1}` : null)
        },
        text
      } as unknown as Response)
    ) as typeof fetch;

    // When
    const pending = fetchWithTimeout("https://example.test", { method: "POST" });

    // Then
    await expect(pending).rejects.toThrow(`Response exceeds ${DEFAULT_MAX_RESPONSE_BYTES} bytes`);
    expect(text).not.toHaveBeenCalled();
  });

  it("returns the body text read within the deadline", async () => {
    // Given
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        headers: { get: () => null },
        text: () => Promise.resolve('{"a":1}')
      } as unknown as Response)
    ) as typeof fetch;

    // When
    const { body } = await fetchWithTimeout("https://example.test", { method: "POST" });

    // Then
    expect(body).toBe('{"a":1}');
  });

  it("cancels the request when the caller signal aborts", async () => {
    // Given
    let fetchSignal: AbortSignal | undefined;
    global.fetch = jest.fn((_url: string, init?: RequestInit) => {
      fetchSignal = init?.signal ?? undefined;
      return new Promise<Response>(() => undefined);
    }) as typeof fetch;
    const caller = new AbortController();

    // When
    const pending = fetchWithTimeout("https://example.test", { method: "POST" }, { signal: caller.signal });
    caller.abort();

    // Then
    await expect(pending).rejects.toThrow("Request was aborted");
    expect(fetchSignal?.aborted).toBe(true);
  });

  it("does not send a request when the caller signal is already aborted", async () => {
    // Given
    global.fetch = jest.fn() as unknown as typeof fetch;
    const caller = new AbortController();
    caller.abort();

    // When
    const pending = fetchWithTimeout("https://example.test", { method: "POST" }, { signal: caller.signal });

    // Then
    await expect(pending).rejects.toThrow("Request was aborted");
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

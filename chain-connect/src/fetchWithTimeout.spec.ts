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
import { GalaChainProvider } from "./GalaChainClient";
import { DEFAULT_REQUEST_TIMEOUT_MS, fetchWithTimeout } from "./fetchWithTimeout";

class TestProvider extends GalaChainProvider {
  public async sign<T extends object>(): Promise<T & { signature: string }> {
    throw new Error("unused");
  }
}

describe("fetchWithTimeout", () => {
  const originalFetch = global.fetch;

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
});

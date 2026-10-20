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
import { GalaChainProvider } from "../GalaChainClient";
import { WalletUtils } from "./WalletUtils";

class TestProvider extends GalaChainProvider {
  public sign(): Promise<never> {
    return Promise.reject(new Error("not signed"));
  }
}

function jsonResponse(status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => "2" },
    json: async () => ({ Status: 1, Data: {} })
  } as unknown as Response;
}

describe("wallet registration", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("rejects when registration does not succeed", async () => {
    fetchMock.mockResolvedValue(jsonResponse(500));
    const created = {
      galachainAddress: "eth|abc",
      privateKey: "0x01",
      publicKey: "0x02",
      ethAddress: "0x3bb75c2Da3B669E253C338101420CC8dEBf0a777",
      mnemonic: null
    };
    jest.spyOn(WalletUtils, "createRandom").mockReturnValue(created);

    await expect(WalletUtils.createAndRegisterRandomWallet("https://example.test/register")).rejects.toThrow(
      "Unexpected response status: 500"
    );
  });

  it("returns the wallet after a successful registration", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200));
    const created = {
      galachainAddress: "eth|abc",
      privateKey: "0x01",
      publicKey: "0x02",
      ethAddress: "0x3bb75c2Da3B669E253C338101420CC8dEBf0a777",
      mnemonic: null
    };
    jest.spyOn(WalletUtils, "createRandom").mockReturnValue(created);

    await expect(WalletUtils.createAndRegisterRandomWallet("https://example.test/register")).resolves.toBe(
      created
    );
  });
});

describe("legacy credential origin", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(jsonResponse());
    global.fetch = fetchMock;
  });

  function provider(): TestProvider {
    return new TestProvider({
      legacyCredentials: {
        identityLookupKey: "lookup",
        userEncryptionKey: "encrypt",
        origin: "https://chain.example"
      }
    });
  }

  it("sends credentials only to the configured origin", async () => {
    const client = provider();

    await client.submit({
      url: "https://chain.example/api",
      method: "Ping",
      payload: {},
      sign: false,
      headers: { "X-Identity-Lookup-Key": "replaced", "X-Trace": "1" }
    });
    await client.submit({
      url: "https://other.example/api",
      method: "Ping",
      payload: {},
      sign: false,
      headers: { "X-Identity-Lookup-Key": "replaced" }
    });

    const firstHeaders = fetchMock.mock.calls[0][1].headers;
    const secondHeaders = fetchMock.mock.calls[1][1].headers;
    expect(firstHeaders["X-Identity-Lookup-Key"]).toBe("lookup");
    expect(firstHeaders["X-User-Encryption-Key"]).toBe("encrypt");
    expect(firstHeaders["X-Trace"]).toBe("1");
    expect(secondHeaders["X-Identity-Lookup-Key"]).toBeUndefined();
    expect(secondHeaders["X-User-Encryption-Key"]).toBeUndefined();
  });

  it("does not let a differently cased header replace credentials", async () => {
    const client = provider();

    await client.submit({
      url: "https://chain.example/api",
      method: "Ping",
      payload: {},
      sign: false,
      headers: {
        "x-identity-lookup-key": "replaced",
        "x-user-encryption-key": "replaced"
      }
    });

    const sent = fetchMock.mock.calls[0][1].headers;
    expect(sent["x-identity-lookup-key"]).toBeUndefined();
    expect(sent["x-user-encryption-key"]).toBeUndefined();
    expect(sent["X-Identity-Lookup-Key"]).toBe("lookup");
    expect(sent["X-User-Encryption-Key"]).toBe("encrypt");
  });
});

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
import FabricCAServices from "fabric-ca-client";
import { Wallets } from "fabric-network";

import { CAClient } from "./CAClient";

jest.mock("fabric-ca-client", () => jest.fn());

function profile(orgMsp: string): Record<string, unknown> {
  return {
    organizations: {
      [orgMsp]: { certificateAuthorities: ["ca.example"] }
    },
    certificateAuthorities: {
      "ca.example": {
        url: "https://ca.example:7054",
        caName: "ca.example"
      }
    }
  };
}

function certificateOf(identity: unknown): string | undefined {
  return (identity as { credentials?: { certificate?: string } }).credentials?.certificate;
}

function enrolled(id: string) {
  return {
    certificate: `${id}-cert`,
    key: { toBytes: () => `${id}-key` }
  };
}

describe("enrollment retry", () => {
  const register = jest.fn().mockResolvedValue("user-secret");
  const enroll = jest.fn();

  beforeEach(() => {
    register.mockClear();
    enroll.mockReset();
    (FabricCAServices as unknown as jest.Mock).mockImplementation(() => ({ enroll, register }));
    jest.spyOn(Wallets, "newInMemoryWallet").mockImplementation(async () => {
      const stored = new Map<string, unknown>();
      return {
        get: async (id: string) => stored.get(id),
        put: async (id: string, identity: unknown) => {
          stored.set(id, identity);
        },
        getProviderRegistry: () => ({
          getProvider: () => ({
            getUserContext: async () => ({ name: "admin" })
          })
        })
      } as never;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("registers a new user once when two callers provision together", async () => {
    enroll.mockImplementation(async ({ enrollmentID }: { enrollmentID: string }) => enrolled(enrollmentID));
    const client = new CAClient("OrgTogether", "admin", "pw", profile("OrgTogether"));

    const [first, second] = await Promise.all([
      client.getIdentityOrRegisterUser("alice"),
      client.getIdentityOrRegisterUser("alice")
    ]);

    expect(register).toHaveBeenCalledTimes(1);
    expect(first).toEqual(second);
    expect(certificateOf(first)).toBe("alice-cert");
  });

  it("reuses the registration secret when enrollment fails", async () => {
    enroll
      .mockResolvedValueOnce(enrolled("admin"))
      .mockRejectedValueOnce(new Error("enroll down"))
      .mockImplementation(async ({ enrollmentID }: { enrollmentID: string }) => enrolled(enrollmentID));
    const client = new CAClient("OrgRetry", "admin", "pw", profile("OrgRetry"));

    await expect(client.getIdentityOrRegisterUser("bob")).rejects.toThrow("enroll down");
    const identity = await client.getIdentityOrRegisterUser("bob");

    expect(register).toHaveBeenCalledTimes(1);
    expect(enroll).toHaveBeenLastCalledWith({ enrollmentID: "bob", enrollmentSecret: "user-secret" });
    expect(certificateOf(identity)).toBe("bob-cert");
  });

  it("retries administrator enrollment after a rejection", async () => {
    enroll.mockRejectedValueOnce(new Error("ca down")).mockResolvedValue(enrolled("admin"));
    const client = new CAClient("OrgAdmin", "admin", "pw", profile("OrgAdmin"));

    await expect(client.isReady()).rejects.toThrow("ca down");
    await expect(client.isReady()).resolves.toBe(true);
    expect(enroll).toHaveBeenCalledTimes(2);
  });
});

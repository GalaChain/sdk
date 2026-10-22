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
import fs from "fs";
import os from "os";
import path from "path";

import { CAClient, enrollUser } from "./CAClient";

jest.mock("fabric-ca-client", () => jest.fn());

const pem = "-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----\n";

function walletProfile(caName: string, tlsCACerts: { pem?: string; path?: string }): Record<string, unknown> {
  return {
    organizations: {
      Org1MSP: { certificateAuthorities: [caName] }
    },
    certificateAuthorities: {
      [caName]: {
        url: `https://${caName}:7054`,
        caName,
        tlsCACerts,
        httpOptions: { verify: true }
      }
    }
  };
}

function orgProfile(orgMsp: string): Record<string, unknown> {
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

describe("Fabric CA wallet", () => {
  let directory: string;

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "ca-wallet-"));
    (FabricCAServices as unknown as jest.Mock).mockReset();
    (FabricCAServices as unknown as jest.Mock).mockImplementation(() => ({
      enroll: jest.fn().mockResolvedValue({
        certificate: "cert",
        key: { toBytes: () => "key" }
      })
    }));
  });

  afterEach(() => {
    fs.rmSync(directory, { recursive: true, force: true });
  });

  it("keeps wallets separate when the same MSP uses different authorities", async () => {
    const first = new CAClient("Org1MSP", "admin", "pw", walletProfile("ca-one.example", { pem }));
    const second = new CAClient("Org1MSP", "admin", "pw", walletProfile("ca-two.example", { pem }));
    const again = new CAClient("Org1MSP", "admin", "pw", walletProfile("ca-one.example", { pem }));

    const identity = {
      credentials: { certificate: "cert", privateKey: "key" },
      mspId: "Org1MSP",
      type: "X.509"
    };
    await (await first.wallet).put("user", identity);

    expect(second.wallet).not.toBe(first.wallet);
    expect(again.wallet).toBe(first.wallet);
    expect(await (await second.wallet).get("user")).toBeUndefined();
    expect(await (await again.wallet).get("user")).toEqual(identity);
  });

  it("reads tlsCACerts.path as certificate contents", () => {
    const certPath = path.join(directory, "ca.pem");
    fs.writeFileSync(certPath, pem);

    new CAClient("Org1MSP", "admin", "pw", walletProfile("ca.example", { path: certPath }));

    expect(FabricCAServices).toHaveBeenCalledWith(
      "https://ca.example:7054",
      { trustedRoots: [pem], verify: true },
      "ca.example"
    );
  });
});

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
    const client = new CAClient("OrgTogether", "admin", "pw", orgProfile("OrgTogether"));

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
    const client = new CAClient("OrgRetry", "admin", "pw", orgProfile("OrgRetry"));

    await expect(client.getIdentityOrRegisterUser("bob")).rejects.toThrow("enroll down");
    const identity = await client.getIdentityOrRegisterUser("bob");

    expect(register).toHaveBeenCalledTimes(1);
    expect(enroll).toHaveBeenLastCalledWith({ enrollmentID: "bob", enrollmentSecret: "user-secret" });
    expect(certificateOf(identity)).toBe("bob-cert");
  });

  it("retries administrator enrollment after a rejection", async () => {
    enroll.mockRejectedValueOnce(new Error("ca down")).mockResolvedValue(enrolled("admin"));
    const client = new CAClient("OrgAdmin", "admin", "pw", orgProfile("OrgAdmin"));

    await expect(client.isReady()).rejects.toThrow("ca down");
    await expect(client.isReady()).resolves.toBe(true);
    expect(enroll).toHaveBeenCalledTimes(2);
  });
});

describe("pending enrollment ids", () => {
  it.each(["constructor", "toString", "__proto__"])("enrolls %s as its own user id", async (userId) => {
    const caClient = {
      enroll: jest.fn().mockResolvedValue({
        certificate: "cert",
        key: { toBytes: () => "key-bytes" }
      })
    };
    const wallet = {
      get: jest.fn().mockResolvedValue(undefined),
      put: jest.fn().mockResolvedValue(undefined)
    };

    const identity = await enrollUser(caClient as never, wallet as never, "Org1MSP", userId, "secret");

    expect(caClient.enroll).toHaveBeenCalledWith({ enrollmentID: userId, enrollmentSecret: "secret" });
    expect(wallet.put).toHaveBeenCalledWith(userId, expect.objectContaining({ type: "X.509" }));
    expect(identity.mspId).toBe("Org1MSP");
  });
});

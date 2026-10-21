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
import fs from "fs";
import os from "os";
import path from "path";

import { CAClient, enrollUser } from "./CAClient";

jest.mock("fabric-ca-client", () =>
  jest.fn().mockImplementation(() => ({
    enroll: jest.fn().mockResolvedValue({
      certificate: "cert",
      key: { toBytes: () => "key" }
    })
  }))
);

const pem = "-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----\n";

function profile(caName: string, tlsCACerts: { pem?: string; path?: string }): Record<string, unknown> {
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

describe("Fabric CA wallet", () => {
  let directory: string;

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "ca-wallet-"));
    (FabricCAServices as unknown as jest.Mock).mockClear();
  });

  afterEach(() => {
    fs.rmSync(directory, { recursive: true, force: true });
  });

  it("keeps wallets separate when the same MSP uses different authorities", async () => {
    const first = new CAClient("Org1MSP", "admin", "pw", profile("ca-one.example", { pem }));
    const second = new CAClient("Org1MSP", "admin", "pw", profile("ca-two.example", { pem }));
    const again = new CAClient("Org1MSP", "admin", "pw", profile("ca-one.example", { pem }));

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

    new CAClient("Org1MSP", "admin", "pw", profile("ca.example", { path: certPath }));

    expect(FabricCAServices).toHaveBeenCalledWith(
      "https://ca.example:7054",
      { trustedRoots: [pem], verify: true },
      "ca.example"
    );
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

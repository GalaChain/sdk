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
import fs from "fs";
import os from "os";
import path from "path";

import { gcclient } from "../gcclient";
import { loadJson } from "../generic";
import { loadRestApiConfig } from "./loadRestApiConfig";

function validConfig() {
  return {
    channels: [
      {
        channelName: "product",
        pathFragment: "product",
        contracts: [
          {
            chaincodeName: "assets",
            contractName: "GalaChainToken",
            pathFragment: "token"
          }
        ]
      }
    ]
  };
}

describe("client configuration", () => {
  let directory: string;

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "client-config-"));
  });

  afterEach(() => {
    fs.rmSync(directory, { recursive: true, force: true });
  });

  function write(name: string, value: unknown): string {
    const file = path.join(directory, name);
    fs.writeFileSync(file, JSON.stringify(value));
    return file;
  }

  it("rejects JSON that is not an object", () => {
    const file = write("array.json", []);

    expect(() => loadJson(file)).toThrow(`Failed to parse JSON at ${file}: expected an object`);
  });

  it("rejects a connection profile that does not contain the organization", () => {
    const file = write("profile.json", { organizations: { OtherOrg: {} } });

    expect(() =>
      gcclient.forConnectionProfile({
        orgMsp: "Org1MSP",
        connectionProfilePath: file,
        userId: "admin",
        userSecret: "pw"
      })
    ).toThrow("Organization Org1MSP not found in connection profile");
  });

  it("rejects an empty channel list and reports the schema error", () => {
    const file = write("rest.json", { channels: [] });

    expect(() => loadRestApiConfig(file)).toThrow(/instance\.channels does not meet minimum length of 1/);
  });

  it("rejects an empty contract list", () => {
    const config = validConfig();
    config.channels[0].contracts = [];
    const file = write("rest.json", config);

    expect(() => loadRestApiConfig(file)).toThrow(/contracts does not meet minimum length of 1/);
  });

  it("rejects an empty contract identifier", () => {
    const config = validConfig();
    config.channels[0].contracts[0].contractName = "";
    const file = write("rest.json", config);

    expect(() => loadRestApiConfig(file)).toThrow(/contractName does not meet minimum length of 1/);
  });

  it("rejects a duplicate contract path", () => {
    const config = validConfig();
    config.channels[0].contracts.push({
      chaincodeName: "other",
      contractName: "PublicKeyContract",
      pathFragment: "token"
    });
    const file = write("rest.json", config);

    expect(() => loadRestApiConfig(file)).toThrow("Duplicate path token on channel product");
  });

  it("allows the same contract name on two chaincodes", () => {
    const config = validConfig();
    config.channels[0].contracts.push({
      chaincodeName: "other",
      contractName: "GalaChainToken",
      pathFragment: "other-token"
    });
    const file = write("rest.json", config);

    expect(loadRestApiConfig(file).channels[0].contracts).toHaveLength(2);
  });

  it("loads a usable REST configuration", () => {
    const file = write("rest.json", validConfig());

    expect(loadRestApiConfig(file).channels[0].channelName).toBe("product");
  });

  it("loads a channel marked as localhost", () => {
    const config = validConfig();
    const file = write("rest.json", {
      ...config,
      channels: [{ ...config.channels[0], asLocalHost: true }]
    });

    expect(loadRestApiConfig(file).channels[0].asLocalHost).toBe(true);
  });
});

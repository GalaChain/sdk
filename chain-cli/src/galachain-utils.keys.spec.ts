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
import * as secp from "@noble/secp256k1";
import fs from "fs";
import os from "os";
import path from "path";

import { getDeveloperPublicKeys, saveApiConfig } from "./galachain-utils";

describe("saveApiConfig contract names", () => {
  it("rejects a missing, empty, or duplicate contract name", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "api-config-"));

    await expect(saveApiConfig(dir, ["[{}]"], ["product-channel"], ["basic"])).rejects.toThrow(
      /non-empty string/
    );
    await expect(
      saveApiConfig(dir, ['[{"contractName":"  "}]'], ["product-channel"], ["basic"])
    ).rejects.toThrow(/non-empty string/);
    await expect(
      saveApiConfig(
        dir,
        ['[{"contractName":"Apple"},{"contractName":"Apple"}]'],
        ["product-channel"],
        ["basic"]
      )
    ).rejects.toThrow(/Duplicate contract name "Apple"/);
  });
});

describe("getDeveloperPublicKeys", () => {
  const originalCwd = process.cwd();

  afterEach(() => {
    process.chdir(originalCwd);
  });

  it("reads only regular developer key files that contain public keys", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dev-keys-"));
    const keysDir = path.join(dir, "keys");
    fs.mkdirSync(keysDir);
    const publicKey = secp.utils.bytesToHex(secp.getPublicKey(secp.utils.randomPrivateKey()));

    fs.writeFileSync(path.join(keysDir, "gc-dev-key.pub"), `${publicKey}\n`);
    fs.writeFileSync(path.join(keysDir, "notes-gc-dev-key.pub"), `${publicKey}\n`);
    fs.writeFileSync(path.join(keysDir, "gc-dev-key.pub.bak"), `${publicKey}\n`);
    fs.writeFileSync(path.join(keysDir, "gc-dev-other-key.pub"), "not-a-public-key\n");
    fs.mkdirSync(path.join(keysDir, "gc-dev-dir-key.pub"));
    process.chdir(dir);

    await expect(getDeveloperPublicKeys()).resolves.toEqual([publicKey]);
  });
});

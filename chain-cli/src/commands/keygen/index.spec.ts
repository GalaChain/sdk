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
import fs from "fs/promises";
import path from "path";

import KeyGen from "./index";

jest.setTimeout(10 * 1000);

describe("KeyGen Command", () => {
  it("should check KeyGen Command", async () => {
    const result: (string | Uint8Array)[] = [];
    jest.spyOn(process.stdout, "write").mockImplementation((v) => {
      result.push(v);
      return true;
    });

    const target = path.resolve(__dirname, "./test-key");
    await KeyGen.run([target]);

    expect(result.join()).toContain(`Writing keys to ${target}`);
    expect(result.join()).toContain(`public key... ${target}.pub`);
    expect(result.join()).toContain(`private key... ${target}`);

    // delete generated files
    await fs.unlink(`${target}.pub`);
    await fs.unlink(target);
  });

  it("refuses to overwrite an existing private key file", async () => {
    const target = path.resolve(__dirname, "./test-key-existing");
    await fs.writeFile(target, "existing-secret", { mode: 0o600 });

    await expect(KeyGen.run([target])).rejects.toThrow(/Refusing to overwrite existing key file/);
    await expect(fs.readFile(target, "utf8")).resolves.toEqual("existing-secret");

    await fs.unlink(target);
  });

  it("writes a new private key with owner-only permissions", async () => {
    const target = path.resolve(__dirname, "./test-key-mode");

    await KeyGen.run([target]);

    const info = await fs.stat(target);
    expect(info.mode & 0o777).toEqual(0o600);

    await fs.unlink(`${target}.pub`);
    await fs.unlink(target);
  });
});

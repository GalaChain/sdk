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
});

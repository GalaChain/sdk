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
import path from "path";

import Init from "../../../src/commands/init";

describe("Init Command", () => {
  afterEach(() => jest.restoreAllMocks());

  it("should check Init Command", async () => {
    const result: (string | Uint8Array)[] = [];
    jest.spyOn(process.stdout, "write").mockImplementation((v) => {
      result.push(v);
      return true;
    });

    Init.prototype.copyChaincodeTemplate = () => Promise.resolve<string>("cloned repository");

    const target = path.resolve(__dirname, "../../../test/test-project");
    await Init.run([target]);

    expect(result.join()).toContain(`Project template initialized at ${target}`);

    const fs = require("fs");
    fs.rmdirSync(path.join(target, "keys"), { recursive: true });
  });
});

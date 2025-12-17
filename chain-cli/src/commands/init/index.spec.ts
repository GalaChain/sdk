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

/* eslint-disable @typescript-eslint/no-var-requires */
import path from "path";

import Init from "./index";

describe("Init Command", () => {
  afterEach(() => jest.restoreAllMocks());

  it("should check Init Command", async () => {
    const result: (string | Uint8Array)[] = [];
    jest.spyOn(process.stdout, "write").mockImplementation((v) => {
      result.push(v);
      return true;
    });

    const mkdirMock = jest.spyOn(require("fs"), "mkdirSync").mockImplementation(() => {});
    const cpMock = jest.spyOn(require("fs"), "cpSync").mockImplementation(() => {});
    jest.spyOn(require("fs"), "writeFileSync").mockImplementation(() => {});
    jest.spyOn(require("fs"), "readFileSync").mockReturnValue('{"name": "test"}');

    jest.spyOn(require("child_process"), "execSync").mockResolvedValue(undefined);

    const target = path.resolve(__dirname, "../../__test__/test-project");
    await Init.run([target]);

    expect(result.join()).toContain(`Project template initialized at ${target}`);
    expect(mkdirMock).toHaveBeenCalledWith(path.resolve(__dirname, "../../__test__/test-project"), {
      recursive: true
    });
    expect(cpMock).toHaveBeenCalledWith(
      path.resolve(__dirname, "../../chaincode-template"),
      path.resolve(__dirname, "../../__test__/test-project"),
      { recursive: true }
    );
  });
});

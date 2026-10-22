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
import * as exec from "./exec-sync";
import { checkCliVersion, isNewerVersion } from "./galachain-utils";

describe("isNewerVersion", () => {
  it("compares version numbers by numeric component", () => {
    expect(isNewerVersion("3.10.0", "3.9.0")).toBe(true);
    expect(isNewerVersion("3.9.0", "3.10.0")).toBe(false);
    expect(isNewerVersion("3.9.0", "3.9.0")).toBe(false);
    expect(isNewerVersion("3.9.1", "3.9.0")).toBe(true);
  });
});

describe("checkCliVersion", () => {
  afterEach(() => jest.restoreAllMocks());

  it("warns when the published version is numerically newer", () => {
    jest.spyOn(exec, "execFileSync").mockImplementation((command) => {
      if (command === "npm") {
        return "3.10.0";
      }
      return "@gala-chain/cli/3.9.0 darwin-arm64 node-v24.0.0";
    });
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    checkCliVersion();

    expect(warn).toHaveBeenCalledWith(expect.stringContaining("3.10.0"));
  });

  it("does not abort when the version lookup fails", () => {
    jest.spyOn(exec, "execFileSync").mockImplementation(() => {
      throw new Error("registry unavailable");
    });
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    expect(() => checkCliVersion()).not.toThrow();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("registry unavailable"));
  });
});

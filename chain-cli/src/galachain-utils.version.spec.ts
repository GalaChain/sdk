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

  it("treats a prerelease as lower than the same release", () => {
    // When & Then
    expect(isNewerVersion("3.10.0", "3.10.0-beta.1")).toBe(true);
    expect(isNewerVersion("3.10.0-beta.1", "3.10.0")).toBe(false);
    expect(isNewerVersion("3.10.0-beta.1", "3.9.0")).toBe(true);
    expect(isNewerVersion("3.10.0-beta.1", "3.10.0-beta.1")).toBe(false);
  });

  it("orders prereleases by their identifiers", () => {
    // When & Then
    expect(isNewerVersion("3.10.0-beta.2", "3.10.0-beta.1")).toBe(true);
    expect(isNewerVersion("3.10.0-beta.10", "3.10.0-beta.2")).toBe(true);
    expect(isNewerVersion("3.10.0-beta", "3.10.0-alpha.5")).toBe(true);
    expect(isNewerVersion("3.10.0-beta.1", "3.10.0-beta")).toBe(true);
    expect(isNewerVersion("3.10.0-alpha", "3.10.0-1")).toBe(true);
  });
});

describe("checkCliVersion", () => {
  afterEach(() => jest.restoreAllMocks());

  it("warns when the published version is numerically newer", () => {
    // Given
    const execSpy = jest.spyOn(exec, "execFileSync").mockReturnValue("3.10.0");
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    // When
    checkCliVersion("3.9.0");

    // Then
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("current version is 3.9.0"));
    expect(execSpy).toHaveBeenCalledTimes(1);
    expect(execSpy).toHaveBeenCalledWith("npm", ["show", "@gala-chain/cli", "version"]);
  });

  it("warns when the running version is a prerelease of the published version", () => {
    // Given
    jest.spyOn(exec, "execFileSync").mockReturnValue("3.10.0");
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    // When
    checkCliVersion("3.10.0-beta.1");

    // Then
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("latest version is 3.10.0"));
  });

  it("does not warn when the running version is up to date", () => {
    // Given
    jest.spyOn(exec, "execFileSync").mockReturnValue("3.10.0");
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    // When
    checkCliVersion("3.10.0");

    // Then
    expect(warn).not.toHaveBeenCalled();
  });

  it("does not abort when the version lookup fails", () => {
    jest.spyOn(exec, "execFileSync").mockImplementation(() => {
      throw new Error("registry unavailable");
    });
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    expect(() => checkCliVersion("3.9.0")).not.toThrow();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("registry unavailable"));
  });
});

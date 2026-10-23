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

import { installedGrpcVersions, verifyPackageConsistency } from "./verifyPackageConsistency";

jest.mock("fs", () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn()
}));

describe("installedGrpcVersions", () => {
  it("finds nested dependency versions and lockfile package entries", () => {
    const versions = installedGrpcVersions({
      dependencies: {
        "@grpc/grpc-js": { version: "1.8.0" },
        fabric: {
          version: "2.0.0",
          dependencies: {
            "@grpc/grpc-js": { version: "1.9.0" }
          }
        }
      },
      packages: {
        "node_modules/@grpc/grpc-js": { version: "1.8.0" },
        "node_modules/@grpc/grpc-js/node_modules/other": { version: "0.0.1" },
        "node_modules/other/node_modules/@grpc/grpc-js": { version: "1.10.10" }
      }
    });

    expect(versions).toEqual(["1.10.10", "1.8.0", "1.9.0"]);
  });

  it("returns one version when nested copies match", () => {
    expect(
      installedGrpcVersions({
        dependencies: {
          "@grpc/grpc-js": { version: "1.10.10" },
          fabric: { dependencies: { "@grpc/grpc-js": { version: "1.10.10" } } }
        },
        packages: {
          "node_modules/@grpc/grpc-js": { version: "1.10.10" }
        }
      })
    ).toEqual(["1.10.10"]);
  });
});

describe("verifyPackageConsistency", () => {
  it("does not report a clean result when the lockfile cannot be read", () => {
    jest.mocked(fs.existsSync).mockReturnValue(true);
    jest.mocked(fs.readFileSync).mockImplementation(() => {
      throw new Error("EACCES");
    });
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    const log = jest.spyOn(console, "log").mockImplementation(() => undefined);

    verifyPackageConsistency();

    expect(warn.mock.calls.join("\n")).toContain("Unable to read package-lock.json");
    expect(log.mock.calls.join("\n")).not.toContain("No conflicting versions of @grpc/grpc-js detected.");

    warn.mockRestore();
    log.mockRestore();
  });

  it("reports a clean result only after a readable lockfile has one version", () => {
    jest.mocked(fs.existsSync).mockReturnValue(true);
    jest.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({
        dependencies: { "@grpc/grpc-js": { version: "1.10.10" } }
      })
    );
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    const log = jest.spyOn(console, "log").mockImplementation(() => undefined);

    verifyPackageConsistency();

    expect(log.mock.calls.join("\n")).toContain("No conflicting versions of @grpc/grpc-js detected.");
    expect(warn).not.toHaveBeenCalled();

    warn.mockRestore();
    log.mockRestore();
  });
});

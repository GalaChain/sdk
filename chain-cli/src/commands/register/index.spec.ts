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
import axios from "axios";

import { axiosGetResponse, axiosPostResponse, consts, execSyncMock } from "../../__test__/data";
import Register from "./index";

jest.mock("fs", () => ({
  ...jest.requireActual("fs"),
  readdirSync: jest.fn().mockReturnValue(["gc-dev-key.pub"]),
  readFileSync: jest
    .fn()
    .mockReturnValue(
      "04815c06dda6a0e8e9753a67aa638c2aa02e01f7b1d06b8ae5b7570c49f8d8cb894f6f8fda3beed896d1ea70ab54ad069e19d8fdbf7125f9fc23ee6109e2ac38ec\n"
    )
}));

jest.mock("../../exec-sync", () => ({
  execSync(cmd: string) {
    return execSyncMock(cmd);
  }
}));

jest.mock("axios");
axios.post = jest.fn().mockResolvedValue(axiosPostResponse);
axios.get = jest.fn().mockResolvedValue(axiosGetResponse);

let stdOut: string[] = [];
let logSpy: jest.SpyInstance;
let writeSpy: jest.SpyInstance;

beforeEach(() => {
  process.env.DEV_PRIVATE_KEY = consts.developerPrivateKey;
  process.env.CHAINCODE_ADMIN_PUBLIC_KEY = consts.chaincodeAdminPublicKey;

  // Capture both console.log and process.stdout.write
  logSpy = jest.spyOn(console, "log").mockImplementation((v) => {
    stdOut.push(v?.toString() || "");
  });

  writeSpy = jest.spyOn(process.stdout, "write").mockImplementation((v) => {
    stdOut.push(v?.toString() || "");
    return true;
  });
});

afterEach(() => {
  jest.clearAllMocks();
  logSpy.mockRestore();
  writeSpy.mockRestore();

  console.log("[Captured stdOut:]\n", stdOut.join("\n"));
  stdOut = [];

  process.env.DEV_PRIVATE_KEY = undefined;
  process.env.CHAINCODE_ADMIN_PUBLIC_KEY = undefined;
});

it("should register a chaincode", async () => {
  // When
  await Register.run(["--no-prompt"]);

  // Then
  const expectedLines = [
    "Registering chaincode on GalaChain TNT network...",
    `Chaincode name:`,
    consts.chaincodeName,
    `Chaincode admin public key:`,
    consts.chaincodeAdminPublicKey,
    `Developer public keys:`,
    consts.developerPublicKey,
    `Chaincode ${consts.chaincodeName} has been registered:`,
    '"network": "TNT"',
    `"chaincode": "${consts.chaincodeName}"`,
    '"status": "CC_TEST_STATUS"'
  ];

  const fullOutput = stdOut.join("\n");

  expectedLines.forEach((line) => {
    expect(fullOutput).toContain(line);
  });
});

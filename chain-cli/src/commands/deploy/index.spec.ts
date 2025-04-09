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
import Deploy from "./index";

jest.mock("../../exec-sync", () => ({
  execSync(cmd: string) {
    return execSyncMock(cmd);
  }
}));

jest.mock("axios");
axios.post = jest.fn().mockResolvedValue(axiosPostResponse);
axios.get = jest.fn().mockResolvedValue(axiosGetResponse);

describe("Deploy Command", () => {
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

  it("should deploy an image", async () => {
    // When
    await Deploy.run(["--no-prompt", "some/image-name:1d"]);

    // Then
    const expectedLines = [
      "Verifying Docker image some/image-name:1d...",
      `Chaincode:    ${consts.chaincodeName}`,
      `Image:        ${consts.imageName}`,
      `Image SHA256: ${consts.imageSha256}`,
      ...consts.contracts.map((contract) => `- ${contract}`),
      "Deployment scheduled to TNT:",
      '"network": "TNT"',
      `"chaincode": "${consts.chaincodeName}"`,
      '"status": "CC_TEST_STATUS"'
    ];

    const fullOutput = stdOut.join("\n");

    expectedLines.forEach((line) => {
      expect(fullOutput).toContain(line);
    });
  });
});

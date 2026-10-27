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

import {
  axiosGetResponse,
  axiosPostResponse,
  consts,
  dockerInspectResponse,
  execSyncMock
} from "../../__test__/data";
import Deploy from "./index";

jest.setTimeout(10000);

jest.mock("../../exec-sync", () => ({
  execSync(cmd: string) {
    return execSyncMock(cmd);
  },
  execFileSync(command: string, args: string[]) {
    // Reconstruct command string for the mock
    return execSyncMock(`${command} ${args.join(" ")}`);
  }
}));

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

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

  function mockStatusResponses(
    statuses: string[],
    operationIdForStatus: (submittedOperationId: string) => string
  ) {
    let submittedOperationId = "";
    let polls = 0;

    mockedAxios.post = jest.fn().mockImplementation((_url, body) => {
      submittedOperationId = body.operationId;
      return Promise.resolve(axiosPostResponse);
    });
    mockedAxios.get = jest.fn().mockImplementation((_url, config) => {
      expect(config.params.operationId).toBe(submittedOperationId);
      const status = statuses[Math.min(polls, statuses.length - 1)];
      polls += 1;
      return Promise.resolve({
        data: {
          ...axiosGetResponse.data,
          status,
          operationId: operationIdForStatus(submittedOperationId),
          imageDigest: consts.imageDigest
        }
      });
    });
  }

  it("should deploy a chaincode", async () => {
    // Given
    mockStatusResponses(["CC_DEPLOY_SCHEDULED", "CC_DEPLOY_SCHEDULED", "CC_DEPLOYED"], (id) => id);

    // When
    await Deploy.run(["--no-prompt", "some/image-name:1d"]);

    // Then
    const expectedLines = [
      "Verifying Docker image some/image-name:1d...",
      `Chaincode:    ${consts.chaincodeName}`,
      `Image:        ${consts.imageName}`,
      `Image SHA256: ${consts.imageDigest}`,
      ...consts.contracts.map((contract) => `- ${contract}`),
      "Deployment scheduled to TNT. Waiting for deployment to complete...",
      "Verifying deployment...",
      "Deployment successful!",
      '"network": "TNT"',
      `"chaincode": "${consts.chaincodeName}"`,
      '"status": "CC_DEPLOYED"'
    ];

    const fullOutput = stdOut.join("\n");

    expectedLines.forEach((line) => {
      expect(fullOutput).toContain(line);
    });
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        imageTag: consts.imageName,
        imageDigest: consts.imageDigest
      }),
      expect.anything()
    );
    const submitted = (mockedAxios.post as jest.Mock).mock.calls[0][1];
    expect(submitted.imageDigest).not.toBe(consts.imageSha256);
  });

  it("should fail to deploy a chaincode", async () => {
    // Given
    mockStatusResponses(["CC_DEPLOY_SCHEDULED", "CC_DEPLOY_FAILED"], (id) => id);

    // When & Then
    await expect(Deploy.run(["--no-prompt", "some/image-name:1d"])).rejects.toThrow(
      "Deployment failed with status: CC_DEPLOY_FAILED"
    );

    const expectedLines = ["Deployment failed!"];
    const fullOutput = stdOut.join("\n");

    expectedLines.forEach((line) => {
      expect(fullOutput).toContain(line);
    });
  });

  it("does not treat another deployment of the same chaincode as this request", async () => {
    mockStatusResponses(["CC_DEPLOYED"], () => "other-operation");

    await expect(Deploy.run(["--no-prompt", "some/image-name:1d"])).rejects.toThrow(
      "Deployment status was not verified."
    );
    expect(stdOut.join("\n")).not.toContain("Deployment successful!");
  });

  it("fails when the deployed image digest is not the signed digest", async () => {
    mockedAxios.post = jest.fn().mockImplementation((_url, body) => {
      mockedAxios.get = jest.fn().mockResolvedValue({
        data: {
          ...axiosGetResponse.data,
          status: "CC_DEPLOYED",
          operationId: body.operationId,
          imageDigest: "sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"
        }
      });
      return Promise.resolve(axiosPostResponse);
    });

    await expect(Deploy.run(["--no-prompt", "some/image-name:1d"])).rejects.toThrow(
      "Deployment did not report the signed image digest."
    );
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(stdOut.join("\n")).not.toContain("Deployment successful!");
  });

  it("fails before sending when the image has no registry digest", async () => {
    const saved = dockerInspectResponse[0].RepoDigests;
    dockerInspectResponse[0].RepoDigests = [];
    mockedAxios.post = jest.fn();

    try {
      await expect(Deploy.run(["--no-prompt", "some/image-name:1d"])).rejects.toThrow(/registry digest/);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    } finally {
      dockerInspectResponse[0].RepoDigests = saved;
    }
  });

  it("rejects an invalid image tag", async () => {
    mockedAxios.post = jest.fn();

    await expect(Deploy.run(["--no-prompt", "not a tag"])).rejects.toThrow(/not valid/);
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it("fails when polling never verifies the submitted request", async () => {
    mockStatusResponses(["CC_DEPLOY_SCHEDULED"], (id) => id);

    await expect(Deploy.run(["--no-prompt", "some/image-name:1d"])).rejects.toThrow(
      "Deployment status was not verified."
    );
    expect(stdOut.join("\n")).not.toContain("Deployment successful!");
  });
});

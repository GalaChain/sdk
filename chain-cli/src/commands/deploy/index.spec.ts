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
import { ux } from "@oclif/core";

import Deploy from "../../../src/commands/deploy";
import { deployChaincode } from "../../../src/galachain-utils";

jest.mock("../../../src/galachain-utils");

const consts = {
  developerPrivateKey: "bf2168e0e2238b9d879847987f556a093040a2cab07983a20919ac33103d0d00"
};

describe("Deploy Command", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should deploy an image", async () => {
    // Given
    const result: (string | Uint8Array)[] = [];
    jest.spyOn(process.stdout, "write").mockImplementation((v) => {
      result.push(v);
      return true;
    });

    jest.spyOn(console, "log").mockImplementation((v) => {
      result.push(v);
      return true;
    });

    jest.spyOn(ux, "prompt").mockResolvedValueOnce("Y");

    jest.mocked(deployChaincode).mockResolvedValue({
      status: "CC_DEPLOY_SCHEDULED",
      chaincode: "chaincode-name",
      channel: "channel-name"
    });

    // When
    await Deploy.run(["ttl.sh/image-name:1d", consts.developerPrivateKey]);

    // Then
    expect(result.join()).toContain(
      "Deployment scheduled to sandbox. Status CC_DEPLOY_SCHEDULED for Chaincode chaincode-name and Channel channel-name."
    );
  });

  it("should cancel the deployment", async () => {
    // Given
    const result: (string | Uint8Array)[] = [];
    jest.spyOn(process.stdout, "write").mockImplementation((v) => {
      result.push(v);
      return true;
    });

    jest.spyOn(console, "log").mockImplementation((v) => {
      result.push(v);
      return true;
    });

    jest.spyOn(ux, "prompt").mockResolvedValueOnce("n");

    jest.mocked(deployChaincode).mockResolvedValue({
      status: "CC_DEPLOY_SCHEDULED",
      org: "org-name"
    });

    // When
    await Deploy.run(["ghcr.io/gala/image-name:2.5", consts.developerPrivateKey]);

    // Then
    expect(result.join()).toContain("Deployment cancelled.");
  });

  it("should check imageTag", async () => {
    // Given
    const result: (string | Uint8Array)[] = [];
    jest.spyOn(process.stdout, "write").mockImplementation((v) => {
      result.push(v);
      return true;
    });

    jest.spyOn(console, "log").mockImplementation((v) => {
      result.push(v);
      return true;
    });

    // When
    await Deploy.run(["imageName", consts.developerPrivateKey]);

    // Then
    expect(result.join()).toContain("It should follow the pattern imageName:version.");
  });

  it("should log error when deployChaincode fail", async () => {
    // Given
    const result: (string | Uint8Array)[] = [];
    jest.spyOn(process.stdout, "write").mockImplementation((v) => {
      result.push(v);
      return true;
    });

    jest.spyOn(console, "log").mockImplementation((v) => {
      result.push(v);
      return true;
    });

    jest.spyOn(ux, "prompt").mockResolvedValueOnce("y");

    jest.mocked(deployChaincode).mockRejectedValue(new Error("Failed to deploy chaincode"));

    // When
    await Deploy.run(["imageName:version", consts.developerPrivateKey]);

    // Then
    expect(result.join()).toContain("Failed to deploy chaincode");
  });
});

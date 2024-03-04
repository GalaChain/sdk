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
import { ux } from "@oclif/core";

import axios from "axios";
import fs from "fs";

import { deployChaincode, getDeploymentResponse, getPrivateKey } from "../src/galachain-utils";

jest.mock("axios");

describe("getDeploymentResponse", () => {
  const privateKey = "bf2168e0e2238b9d879847987f556a093040a2cab07983a20919ac33103d0d00";
  const isTestnet = true;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should get deployment response", async () => {
    // Given
    axios.get = jest.fn().mockResolvedValue({
      status: 200,
      data: {
        status: "CH_CREATED"
      }
    });

    // When
    const response = await getDeploymentResponse({ privateKey, isTestnet });

    // Then
    expect(response.status).toEqual("CH_CREATED");
  });

  it("should fail when get deployment response", async () => {
    // Given
    axios.get = jest.fn().mockResolvedValue({
      status: 401
    });

    // When
    expect(async () => await getDeploymentResponse({ privateKey, isTestnet })).rejects.toThrowError(
      `Service Portal respond with status 401`
    );
  });
});

describe("deployChaincode", () => {
  const privateKey = "bf2168e0e2238b9d879847987f556a093040a2cab07983a20919ac33103d0d00";
  const isTestnet = true;
  const imageTag = "registry.image.name:latest";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should get deployChaincode response", async () => {
    // Given
    axios.post = jest.fn().mockResolvedValue({
      status: 201,
      data: {
        status: "CH_CREATED"
      }
    });

    const execSync = jest.spyOn(require("child_process"), "execSync");
    execSync.mockImplementation(
      () =>
        '[{"contractName":"AppleContract"},{"contractName":"GalaChainToken"},{"contractName":"PublicKeyContract"}]'
    );

    // When
    const response = await deployChaincode({ privateKey, isTestnet, imageTag });

    // Then
    expect(response.status).toEqual("CH_CREATED");
  });

  it("should read a file with a private key and get deployChaincode response", async () => {
    // Given
    axios.post = jest.fn().mockResolvedValue({
      status: 201,
      data: {
        status: "CH_CREATED"
      }
    });

    process.env = { ...process.env, DEV_PRIVATE_KEY: undefined };

    const execSync = jest.spyOn(require("child_process"), "execSync");
    execSync.mockImplementation(
      () =>
        '[{"contractName":"AppleContract"},{"contractName":"GalaChainToken"},{"contractName":"PublicKeyContract"}]'
    );

    jest.spyOn(fs, "readFileSync").mockImplementation(() => {
      return "bf2168e0e2238b9d879847987f556a093040a2cab07983a20919ac33103d0d00";
    });

    const postDeployChaincodePrivateKey = {
      privateKey: await getPrivateKey(),
      isTestnet,
      imageTag
    };

    console.log("dupa");
    // When
    const response = await deployChaincode(postDeployChaincodePrivateKey);

    // Then
    expect(response.status).toEqual("CH_CREATED");
  });

  it("should ask for private key and get deployChaincode response", async () => {
    // Given
    axios.post = jest.fn().mockResolvedValue({
      status: 201,
      data: {
        status: "CH_CREATED"
      }
    });

    process.env = { ...process.env, DEV_PRIVATE_KEY: undefined };

    const execSync = jest.spyOn(require("child_process"), "execSync");
    execSync.mockImplementation(
      () =>
        '[{"contractName":"AppleContract"},{"contractName":"GalaChainToken"},{"contractName":"PublicKeyContract"}]'
    );

    jest.spyOn(fs, "readFileSync").mockImplementation(() => "");

    jest.spyOn(ux, "prompt").mockResolvedValueOnce(privateKey);

    const postDeployChaincodePrivateKey = {
      privateKey: await getPrivateKey(),
      isTestnet,
      imageTag
    };
    // When
    const response = await deployChaincode(postDeployChaincodePrivateKey);

    // Then
    expect(response.status).toEqual("CH_CREATED");
  });

  it("should fail when post deployChaincode", async () => {
    // Given
    axios.post = jest.fn().mockResolvedValue({
      status: 401
    });

    const execSync = jest.spyOn(require("child_process"), "execSync");
    execSync.mockImplementation(
      () =>
        '[{"contractName":"AppleContract"},{"contractName":"GalaChainToken"},{"contractName":"PublicKeyContract"}]'
    );

    // When
    expect(async () => await deployChaincode({ privateKey, isTestnet, imageTag })).rejects.toThrowError(
      `Service Portal respond with status 401`
    );
  });
});

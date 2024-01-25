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

import { signatures } from "@gala-chain/api";
import axios from "axios";
import { promises as fsPromises } from "fs";
import { nanoid } from "nanoid";

import { ServicePortal } from "./consts";
import { GetChaincodeDeploymentDto, PostDeployChaincodeDto } from "./dto";
import { parseStringOrFileKey } from "./utils";

const ConfigFileName = ".galachainrc.json";
const PackageJsonFileName = "package.json";

export interface Config {
  org: string;
  channel: string;
  chaincode: string;
  tag?: string;
}

export async function writeConfigFile(config: Config) {
  await fsPromises.writeFile(ConfigFileName, JSON.stringify(config, null, 2));
}

export async function readConfigFile(): Promise<Config> {
  try {
    const config = JSON.parse(await fsPromises.readFile(ConfigFileName, "utf8"));
    return config;
  } catch (error) {
    throw new Error(`Can not read chain config file ${ConfigFileName}`);
  }
}

export async function readPackageJsonVersion(): Promise<string> {
  try {
    const packageJson = JSON.parse(await fsPromises.readFile(PackageJsonFileName, "utf8"));
    return packageJson.version;
  } catch (error) {
    throw new Error(`Can not find package.json file.`);
  }
}

export async function readDockerfile(): Promise<string> {
  try {
    const dockerfile = await fsPromises.readFile("Dockerfile", "utf8");
    return dockerfile;
  } catch (error) {
    throw new Error(`Can not find Dockerfile.`);
  }
}

export async function getDeploymentResponse(params: { privateKey: string | undefined; isTestnet: boolean }) {
  if (!params.privateKey) {
    params.privateKey = await getPrivateKeyPrompt();
  }

  const getChaincodeDeploymentDto: GetChaincodeDeploymentDto = {
    operationId: nanoid()
  };

  const signature = await generateSignature(getChaincodeDeploymentDto, params.privateKey);

  const ServicePortalURL = params.isTestnet
    ? ServicePortal.GET_TEST_DEPLOYMENT_URL
    : ServicePortal.GET_DEPLOYMENT_URL;
  const response = await axios.get(ServicePortalURL, {
    headers: {
      [ServicePortal.AUTH_X_GC_KEY]: signature
    },
    params: getChaincodeDeploymentDto
  });

  if (response.status !== 200) {
    throw new Error(`Service Portal respond with status ${response.status}`);
  }

  return response.data;
}

export async function deployChaincode(params: {
  privateKey: string | undefined;
  isTestnet: boolean;
  imageTag: string;
}) {
  if (!params.privateKey) {
    params.privateKey = await getPrivateKeyPrompt();
  }

  const chainCodeDto: PostDeployChaincodeDto = {
    operationId: nanoid(),
    imageTag: params.imageTag,
    contracts: []
  };

  const signature = await generateSignature(chainCodeDto, params.privateKey);

  const ServicePortalURL = params.isTestnet ? ServicePortal.DEPLOY_TEST_URL : ServicePortal.DEPLOY_URL;
  const response = await axios.post(ServicePortalURL, chainCodeDto, {
    headers: {
      [ServicePortal.AUTH_X_GC_KEY]: signature
    }
  });

  if (response.status !== 201) {
    throw new Error(`Service Portal respond with status ${response.status}`);
  }

  return response.data;
}

async function getPrivateKeyPrompt(): Promise<string> {
  console.log(
    "Private key not found. It should be provided as an argument or as an environment variable DEV_PRIVATE_KEY."
  );
  return await ux.prompt("Type the private key or the path to", { type: "mask" });
}

async function generateSignature(obj: object, privateKey: string): Promise<string> {
  const privateKeyValue = await parseStringOrFileKey(privateKey);
  const keyBuffer = signatures.normalizePrivateKey(privateKeyValue);

  return signatures.getSignature(obj, keyBuffer);
}

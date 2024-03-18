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
import * as secp from "@noble/secp256k1";
import axios from "axios";
import fs, { promises as fsPromises } from "fs";
import { nanoid } from "nanoid";
import { writeFile } from "node:fs/promises";
import path from "path";
import process from "process";

import { ServicePortal } from "./consts";
import { GetChaincodeDeploymentDto, PostDeployChaincodeDto } from "./dto";
import { execSync } from "./exec-sync";
import { parseStringOrFileKey } from "./utils";

const ConfigFileName = ".galachainrc.json";
const PackageJsonFileName = "package.json";

export const DEFAULT_PRIVATE_KEYS_DIR = "keys";
export const DEFAULT_ADMIN_PRIVATE_KEY_NAME = "gc-admin-key";
export const DEFAULT_DEV_PRIVATE_KEY_NAME = "gc-dev-key";

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
    return JSON.parse(await fsPromises.readFile(ConfigFileName, "utf8"));
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
    return await fsPromises.readFile("Dockerfile", "utf8");
  } catch (error) {
    throw new Error(`Can not find Dockerfile.`);
  }
}

export async function getDeploymentResponse(params: { privateKey: string; isTestnet: boolean }) {
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

function getContractNames(imageTag: string): { contractName: string }[] {
  const command = `docker run --rm ${imageTag} lib/src/cli.js get-contract-names | tail -n 1`;
  let response: string = "<failed>";

  try {
    response = execSync(command);
    const json = JSON.parse(response);
    if (!Array.isArray(json)) {
      throw new Error("Is not array");
    }
    json.forEach((n) => {
      if (typeof n?.contractName !== "string") {
        throw new Error("Not all elements contain 'contractName' string");
      }
    });

    return (json as { contractName: string }[]).map(({ contractName }) => ({ contractName }));
  } catch (e) {
    throw new Error(`Invalid contract names config (${e?.message}): ${response}`);
  }
}

export async function deployChaincode(params: { privateKey: string; isTestnet: boolean; imageTag: string }) {
  const chainCodeDto: PostDeployChaincodeDto = {
    operationId: nanoid(),
    imageTag: params.imageTag,
    contracts: getContractNames(params.imageTag)
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

export async function generateKeys(keysPath: string): Promise<void> {
  const adminPrivateKey = secp.utils.bytesToHex(secp.utils.randomPrivateKey());
  const adminPublicKey = secp.utils.bytesToHex(secp.getPublicKey(adminPrivateKey));

  const devPrivateKey = secp.utils.bytesToHex(secp.utils.randomPrivateKey());
  const devPublicKey = secp.utils.bytesToHex(secp.getPublicKey(devPrivateKey));

  fs.mkdir(`${keysPath}`, (err) => {
    if (err) console.error(`Could not create a directory ${keysPath}. Error: ${err}`);
  });

  await writeFile(`${keysPath}/${DEFAULT_ADMIN_PRIVATE_KEY_NAME}.pub`, adminPublicKey);
  await writeFile(`${keysPath}/${DEFAULT_ADMIN_PRIVATE_KEY_NAME}`, adminPrivateKey.toString());
  await writeFile(`${keysPath}/${DEFAULT_DEV_PRIVATE_KEY_NAME}.pub`, devPublicKey);
  await writeFile(`${keysPath}/${DEFAULT_DEV_PRIVATE_KEY_NAME}`, devPrivateKey.toString());
}

export async function getPrivateKey(keysFromArg: string | undefined) {
  return (
    keysFromArg || process.env.DEV_PRIVATE_KEY || getPrivateKeyFromFile() || (await getPrivateKeyPrompt())
  );
}

export async function overwriteApiConfig(contracts: string, channel: string, chaincodeName: string) {
  const contractsJson = JSON.parse(contracts);

  let contractJson = "";
  contractsJson.forEach((contract: { contractName: string }) => {

    // It converts CamelCase to kebab-case
    const pathFragment = contract.contractName.replace(/([A-Z])/g, "-$1").toLowerCase().replace(/^-/, "");

    contractJson =
      contractJson +
      `{ 
          "pathFragment": "${pathFragment}", 
          "chaincodeName": "${chaincodeName}", 
          "contractName": "${contract.contractName}" 
        },`;
  });
  // remove the last comma
  contractJson = contractJson.slice(0, -1);

  // write a new api-config.json file and overwrite the old one
  const apiConfigPath = path.resolve(".", "api-config.json");
  const apiConfigJson = `{
        "channels": [
          {
            "pathFragment": "product",
            "channelName": "${channel}",
            "asLocalHost": true,
            "contracts": [${contractJson}]
          }
        ]
      }`;
  fs.writeFileSync(apiConfigPath, JSON.stringify(JSON.parse(apiConfigJson), null, 2));
}

function getPrivateKeyFromFile(): string | undefined {
  try {
    return fs.readFileSync(
      `${process.cwd()}/${DEFAULT_PRIVATE_KEYS_DIR}/${DEFAULT_DEV_PRIVATE_KEY_NAME}`,
      "utf8"
    );
  } catch (e) {
    console.error(`Error reading file: ${e}`);
  }
}

async function getPrivateKeyPrompt(): Promise<string> {
  console.log(
    "Private key not found. It should be provided as an argument, as an environment variable DEV_PRIVATE_KEY or as a file."
  );
  return await ux.prompt("Type the private key or the path to", { type: "mask" });
}

async function generateSignature(obj: object, privateKey: string): Promise<string> {
  const privateKeyValue = await parseStringOrFileKey(privateKey);
  const keyBuffer = signatures.normalizePrivateKey(privateKeyValue);

  return signatures.getSignature(obj, keyBuffer);
}

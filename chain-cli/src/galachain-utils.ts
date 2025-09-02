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
import axios, { AxiosError } from "axios";
import fs, { promises as fsPromises } from "fs";
import { nanoid } from "nanoid";
import path from "path";
import process from "process";
import { Readable } from "stream";

import { ExpectedImageArchitecture, ServicePortal } from "./consts";
import { ChaincodeInfoDto, DeployChaincodeDto, GetChaincodeDeploymentDto, RegisterChaincodeDto } from "./dto";
import { BadRequestError, UnauthorizedError } from "./errors";
import { execSync } from "./exec-sync";
import { parseStringOrFileKey } from "./utils";

const ConfigFileName = ".galachainrc.json";
const PackageJsonFileName = "package.json";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const os = require("os");

const DEFAULT_PRIVATE_KEYS_DIR = ".gc-keys";
const DEFAULT_PUBLIC_KEYS_DIR = "keys";
const DEFAULT_ADMIN_PRIVATE_KEY_NAME = "gc-admin-key";
const DEFAULT_DEV_PRIVATE_KEY_NAME = "gc-dev-key";

export interface Config {
  org: string;
  channel: string;
  chaincode: string;
  tag?: string;
}

export interface LogEntry {
  message: string;
  timestamp: string;
  status: string;
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

export async function getDeploymentResponse(params: {
  privateKey: string;
  chaincodeName: string;
}): Promise<ChaincodeInfoDto> {
  const getChaincodeDeploymentDto: GetChaincodeDeploymentDto = {
    operationId: nanoid(),
    chaincode: params.chaincodeName
  };

  const signature = await generateSignature(getChaincodeDeploymentDto, params.privateKey);

  const servicePortalURL = ServicePortal.GET_DEPLOYMENT_URL;

  const response = await axios
    .get(servicePortalURL, {
      headers: {
        [ServicePortal.AUTH_X_GC_KEY]: signature
      },
      params: getChaincodeDeploymentDto
    })
    .catch((error) => {
      throw new Error(axiosErrorMessage(error));
    });

  const d = response.data;

  return {
    network: d.network,
    channel: d.channel,
    chaincode: d.chaincode,
    adminPublicKey: d.adminPublicKey,
    developersPublicKeys: d.developersPublicKeys,
    imageName: d.imageName,
    sequence: d.sequence,
    status: d.status,
    lastUpdated: d.lastUpdated
  };
}

export function getChaincodeImageInfo(imageTag: string): {
  contracts: { contractName: string }[];
  imageArchitecture: string;
  imageSha256: string;
} {
  const inspectCommand = `docker inspect ${imageTag}`;
  let dockerJson;
  try {
    const dockerImageInspect = execSync(inspectCommand);
    dockerJson = JSON.parse(dockerImageInspect);
  } catch (e) {
    throw new Error(`Invalid output of 'docker inspect' command:\n\n  ${inspectCommand}\n\nError: ${e}`);
  }

  const imageArchitecture = dockerJson?.[0]?.Os + "/" + dockerJson?.[0]?.Architecture;
  const imageSha256 = dockerJson?.[0]?.Id;

  if (imageArchitecture !== ExpectedImageArchitecture) {
    throw new Error(
      `Unsupported architecture ${imageArchitecture} of Docker image ${imageTag}, ` +
        `expected ${ExpectedImageArchitecture}.`
    );
  }

  const getContractNamesCommand = `docker run --rm ${imageTag} lib/src/cli.js get-contract-names | tail -n 1`;
  let response = "<command-not-executed-yet>";

  try {
    response = execSync(getContractNamesCommand);
    const json = JSON.parse(response);
    if (!Array.isArray(json)) {
      throw new Error(
        `Output of the following command is not an array:\n\n  ${getContractNamesCommand}\n\n` +
          `Got the following response:\n\n  ${response}`
      );
    }
    json.forEach((n) => {
      if (typeof n?.contractName !== "string") {
        throw new Error(
          `Output of the following command is not an array of objects with 'contractName' string:\n\n  ${getContractNamesCommand}\n\n` +
            `Missing 'contractName' for element ${n}. The output of the command is:\n\n  ${response}`
        );
      }
    });

    const contracts = (json as { contractName: string }[]).map(({ contractName }) => ({ contractName }));
    return { contracts, imageArchitecture, imageSha256 };
  } catch (e) {
    throw new Error(
      `There was an error while executing the following command:\n\n  ${getContractNamesCommand}\n\n` +
        `Error: ${e?.message}. The output is:\n\n  ${response}`
    );
  }
}

export async function deployChaincode(params: {
  privateKey: string;
  imageTag: string;
  chaincode: string;
  contracts: { contractName: string }[];
}) {
  const dto: DeployChaincodeDto = {
    operationId: nanoid(),
    imageTag: params.imageTag,
    chaincode: params.chaincode,
    contracts: params.contracts
  };

  const signature = await generateSignature(dto, params.privateKey);

  const response = await axios
    .post(ServicePortal.DEPLOY_URL, dto, {
      headers: {
        [ServicePortal.AUTH_X_GC_KEY]: signature
      }
    })
    .catch((error) => {
      throw new Error(axiosErrorMessage(error));
    });

  return response.data;
}

export async function registerChaincode(params: {
  privateKey: string;
  adminPublicKey: string;
  developersPublicKeys: string[];
}) {
  const dto: RegisterChaincodeDto = {
    operationId: nanoid(),
    channelAdminPublicKey: params.adminPublicKey,
    publicKeys: params.developersPublicKeys
  };

  const signature = await generateSignature(dto, params.privateKey);

  const response = await axios
    .post(ServicePortal.REGISTER_URL, dto, {
      headers: {
        [ServicePortal.AUTH_X_GC_KEY]: signature
      }
    })
    .catch((error) => {
      throw new Error(axiosErrorMessage(error));
    });

  return response.data;
}

export async function generateKeys(projectPath: string): Promise<void> {
  const keysPath = path.join(projectPath, DEFAULT_PUBLIC_KEYS_DIR);

  const adminPrivateKey = secp.utils.bytesToHex(secp.utils.randomPrivateKey());
  const adminPublicKey = secp.utils.bytesToHex(secp.getPublicKey(adminPrivateKey));

  const devPrivateKey = secp.utils.bytesToHex(secp.utils.randomPrivateKey());
  const devPublicKey = secp.utils.bytesToHex(secp.getPublicKey(devPrivateKey));

  const chaincodeName = "gc-" + signatures.getEthAddress(adminPublicKey).toLowerCase();
  const privateKeysPath = path.join(os.homedir(), DEFAULT_PRIVATE_KEYS_DIR, chaincodeName);

  // create the keys directory
  execSync(`mkdir -p ${keysPath}`);
  execSync(`mkdir -p ${privateKeysPath}`);

  // create the public and private keys files
  execSync(`echo '${adminPublicKey}' > ${keysPath}/${DEFAULT_ADMIN_PRIVATE_KEY_NAME}.pub`);
  execSync(`echo '${devPublicKey}' > ${keysPath}/${DEFAULT_DEV_PRIVATE_KEY_NAME}.pub`);

  execSync(`echo '${adminPrivateKey.toString()}' > ${privateKeysPath}/${DEFAULT_ADMIN_PRIVATE_KEY_NAME}`);
  execSync(`echo '${devPrivateKey.toString()}' > ${privateKeysPath}/${DEFAULT_DEV_PRIVATE_KEY_NAME}`);

  console.log(`Chaincode name:         ${chaincodeName}`);
  console.log(`Public keys directory:  ${keysPath}`);
  console.log(`Private keys directory: ${privateKeysPath}`);
}

export function checkCliVersion() {
  const cliLatestVersion = execSync("npm show @gala-chain/cli version");
  const cliCurrentVersion = execSync("galachain --version").split(" ")[0].split("/")[2];
  if (cliLatestVersion > cliCurrentVersion) {
    console.warn(
      `Your Chain CLI is out of date, current version is ${cliCurrentVersion}, latest version is ${cliLatestVersion}. Please run 'npm install -g @gala-chain/cli --force' to update to the latest version.`
    );
  }
}

function getAdminPublicKeyFromDefaultPath(): string {
  const adminPublicKeyPath = path.join(
    process.cwd(),
    DEFAULT_PUBLIC_KEYS_DIR,
    `${DEFAULT_ADMIN_PRIVATE_KEY_NAME}.pub`
  );

  if (!fs.existsSync(adminPublicKeyPath)) {
    throw new Error(
      `Missing required chaincode admin public key file: ${adminPublicKeyPath}. ` +
        `Please ensure the file exists and is readable. You may keep it in version control.`
    );
  }

  return fs.readFileSync(adminPublicKeyPath, "utf8").trim();
}

export async function getChaincodeDefinition(): Promise<{ name: string; adminPublicKey: string }> {
  const adminPublicKey = process.env.CHAINCODE_ADMIN_PUBLIC_KEY ?? getAdminPublicKeyFromDefaultPath();
  const name = "gc-" + signatures.getEthAddress(adminPublicKey).toLowerCase();

  return { name, adminPublicKey };
}

export async function getDeveloperPublicKeys(): Promise<string[]> {
  const keysPath = path.join(process.cwd(), DEFAULT_PUBLIC_KEYS_DIR);
  const keys = fs.readdirSync(keysPath);
  return keys
    .filter((key) => key.match(/gc-dev.*-key.*\.pub/))
    .map((key) => fs.readFileSync(path.join(keysPath, key), "utf8").trim())
    .sort();
}

export async function getPrivateKey(keysFromArg: string | undefined, chaincodeName: string) {
  return (
    keysFromArg ??
    process.env.DEV_PRIVATE_KEY ??
    (await getDefaultDevPrivateKeyFile(chaincodeName)) ??
    (await getPrivateKeyPrompt())
  );
}

export async function saveApiConfig(
  dir: string,
  contracts: string[],
  channel: string[],
  chaincodeName: string[]
) {
  if (contracts.length !== channel.length || contracts.length !== chaincodeName.length) {
    throw new Error("Invalid arguments: contracts, channel and chaincodeName must have the same length");
  }

  const apiConfig = {
    channels: channel.map((channel, index) =>
      getApiConfigForChannel(channel, chaincodeName[index], contracts[index])
    )
  };

  // Ensure directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write a new api-config.json file and overwrite the old one
  const apiConfigPath = path.resolve(dir, "api-config.json");
  fs.writeFileSync(apiConfigPath, JSON.stringify(apiConfig, null, 2));
}

function getApiConfigForChannel(channel: string, chaincodeName: string, contracts: string) {
  const contractNamesArr = JSON.parse(contracts) as { contractName: string }[];

  if (!contractNamesArr || !Array.isArray(contractNamesArr)) {
    throw new Error(`Invalid contracts JSON: ${contracts}`);
  }

  const contractsArr = contractNamesArr.map(({ contractName }) => ({
    contractName,
    chaincodeName,
    pathFragment: contractName
  }));

  return {
    pathFragment: channel.replace("-channel", ""),
    channelName: channel,
    asLocalHost: true,
    contracts: contractsArr
  };
}

function getDefaultDevPrivateKeyFile(chaincodeName: string): string | undefined {
  try {
    const defaultDevPrivateKeyPath = path.join(
      os.homedir(),
      DEFAULT_PRIVATE_KEYS_DIR,
      chaincodeName,
      DEFAULT_DEV_PRIVATE_KEY_NAME
    );
    return fs.readFileSync(defaultDevPrivateKeyPath, "utf8").trim();
  } catch (e) {
    console.error(`Error reading file: ${e}`);
    return undefined;
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

export async function getLogs(params: {
  privateKey: string;
  startTime?: string;
  endTime?: string;
  limit?: number;
  filter?: string;
}): Promise<LogEntry[]> {
  const requestParams = {
    operationId: nanoid(),
    ...(params.startTime && { startTime: params.startTime }),
    ...(params.endTime && { endTime: params.endTime }),
    ...(params.limit && { limit: params.limit.toString() }),
    ...(params.filter && { filter: params.filter })
  };

  const signature = await generateSignature(requestParams, params.privateKey);

  const servicePortalURL = ServicePortal.GET_LOGS_URL;

  try {
    const response = await axios
      .get(servicePortalURL, {
        headers: {
          [ServicePortal.AUTH_X_GC_KEY]: signature
        },
        params: requestParams
      })
      .catch((error) => {
        throw new Error(axiosErrorMessage(error));
      });

    return response.data;
  } catch (error: any) {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    if (status === 403) {
      throw new UnauthorizedError(`Unauthorized'.`);
    } else if (status === 400) {
      throw new BadRequestError(`Bad request: ${message || error.message}`);
    } else {
      throw new Error(`Failed to fetch logs: ${message || error.message}`);
    }
  }
}

export async function streamLogs(
  params: {
    privateKey: string;
    filter?: string;
  },
  onData: (data: string) => void
): Promise<void> {
  const requestParams = {
    operationId: nanoid(),
    ...(params.filter && { filter: params.filter })
  };

  const signature = await generateSignature(requestParams, params.privateKey);

  const servicePortalURL = ServicePortal.STREAM_LOGS_URL;

  try {
    const response = await axios.get(servicePortalURL, {
      headers: {
        [ServicePortal.AUTH_X_GC_KEY]: signature,
        Accept: "text/event-stream"
      },
      params: requestParams,
      responseType: "stream"
    });

    const stream = response.data as Readable;

    stream.on("data", (chunk) => {
      const data = chunk.toString();
      onData(data);
    });

    stream.on("end", () => {
      console.log("Stream ended");
    });

    stream.on("error", (error) => {
      throw error;
    });
  } catch (error: any) {
    throw new Error(`Failed to stream logs: ${error.response?.data?.message || error.message}`);
  }
}

function axiosErrorMessage(error: AxiosError<{ message: string }>) {
  const status = error?.response?.status ?? "unknown";
  const message = error?.response?.data?.message ?? "unknown";
  return `[${status}] ${message}`;
}

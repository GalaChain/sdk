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

import * as secp from "@noble/secp256k1";
import axios, { AxiosError } from "axios";
import fs, { promises as fsPromises } from "fs";
import { nanoid } from "nanoid";
import path from "path";
import process from "process";
import { Readable } from "stream";
import { StringDecoder } from "string_decoder";

import { ExpectedImageArchitecture, ServicePortal } from "./consts";
import { ChaincodeInfoDto, DeployChaincodeDto, GetChaincodeDeploymentDto, RegisterChaincodeDto } from "./dto";
import { BadRequestError, FetchLogsError, UnauthorizedError } from "./errors";
import { execFileSync } from "./exec-sync";
import signatures from "./signatures";
import { assertPrivateKeyFileArg, parseStringOrFileKey } from "./utils";

const ConfigFileName = ".galachainrc.json";
const PackageJsonFileName = "package.json";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const os = require("os");

const DEFAULT_PRIVATE_KEYS_DIR = ".gc-keys";
const DEFAULT_PUBLIC_KEYS_DIR = "keys";
const DEFAULT_ADMIN_PRIVATE_KEY_NAME = "gc-admin-key";
const DEFAULT_DEV_PRIVATE_KEY_NAME = "gc-dev-key";
const REQUEST_TIMEOUT_MS = 30_000;

function requestConfig<T extends object>(config: T): T & { timeout: number } {
  return { timeout: REQUEST_TIMEOUT_MS, ...config };
}

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
  operationId?: string;
}): Promise<ChaincodeInfoDto> {
  const getChaincodeDeploymentDto: GetChaincodeDeploymentDto = {
    operationId: params.operationId ?? nanoid(),
    chaincode: params.chaincodeName
  };

  const signature = await generateSignature(getChaincodeDeploymentDto, params.privateKey);

  const servicePortalURL = ServicePortal.GET_DEPLOYMENT_URL;

  const response = await axios
    .get(
      servicePortalURL,
      requestConfig({
        headers: {
          [ServicePortal.AUTH_X_GC_KEY]: signature
        },
        params: getChaincodeDeploymentDto
      })
    )
    .catch((error) => {
      throw new Error(axiosErrorMessage(error));
    });

  return readDeploymentResponse(response.data);
}

function deploymentField(data: Record<string, unknown>, field: string): string {
  const value = data[field];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Deployment response is missing ${field}.`);
  }
  return value;
}

export function readDeploymentResponse(data: unknown): ChaincodeInfoDto {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Deployment response is not an object.");
  }

  const record = data as Record<string, unknown>;
  if (typeof record.sequence !== "number" || !Number.isInteger(record.sequence)) {
    throw new Error("Deployment response is missing sequence.");
  }
  if (
    !Array.isArray(record.developersPublicKeys) ||
    record.developersPublicKeys.some((key) => typeof key !== "string")
  ) {
    throw new Error("Deployment response is missing developersPublicKeys.");
  }

  return {
    network: deploymentField(record, "network"),
    channel: deploymentField(record, "channel"),
    chaincode: deploymentField(record, "chaincode"),
    adminPublicKey: deploymentField(record, "adminPublicKey"),
    developersPublicKeys: record.developersPublicKeys as string[],
    imageName: deploymentField(record, "imageName"),
    sequence: record.sequence,
    status: deploymentField(record, "status"),
    lastUpdated: deploymentField(record, "lastUpdated"),
    ...(typeof record.operationId === "string" ? { operationId: record.operationId } : {}),
    ...(typeof record.imageDigest === "string" ? { imageDigest: record.imageDigest } : {})
  };
}

function imageRepository(imageTag: string): string {
  const slash = imageTag.lastIndexOf("/");
  const colon = imageTag.lastIndexOf(":");
  return colon > slash ? imageTag.slice(0, colon) : imageTag;
}

function registryDigest(imageTag: string, repoDigests: unknown): string {
  const repository = imageRepository(imageTag);
  const prefix = `${repository}@`;
  const matches = Array.isArray(repoDigests)
    ? repoDigests.filter((entry): entry is string => typeof entry === "string" && entry.startsWith(prefix))
    : [];

  if (matches.length !== 1) {
    throw new Error(
      `Docker image ${imageTag} has no single registry digest. Pull the published image before deploying.`
    );
  }

  const digest = matches[0].slice(prefix.length);
  if (!/^sha256:[a-f0-9]{64}$/.test(digest)) {
    throw new Error(`Docker image ${imageTag} has an unsupported registry digest ${digest}.`);
  }

  return digest;
}

export function getChaincodeImageInfo(imageTag: string): {
  contracts: { contractName: string }[];
  imageArchitecture: string;
  imageDigest: string;
} {
  // Using execFileSync with argument array to prevent command injection
  const inspectCommandDesc = `docker inspect <imageTag>`;
  let dockerJson;
  try {
    const dockerImageInspect = execFileSync("docker", ["inspect", imageTag]);
    dockerJson = JSON.parse(dockerImageInspect);
  } catch (e) {
    throw new Error(`Invalid output of 'docker inspect' command:\n\n  ${inspectCommandDesc}\n\nError: ${e}`);
  }

  const imageArchitecture = dockerJson?.[0]?.Os + "/" + dockerJson?.[0]?.Architecture;
  const imageDigest = registryDigest(imageTag, dockerJson?.[0]?.RepoDigests);

  if (imageArchitecture !== ExpectedImageArchitecture) {
    throw new Error(
      `Unsupported architecture ${imageArchitecture} of Docker image ${imageTag}, ` +
        `expected ${ExpectedImageArchitecture}.`
    );
  }

  // Using execFileSync with argument array to prevent command injection
  // Processing output in Node.js instead of piping to tail
  const getContractNamesCommandDesc = `docker run --rm <imageTag> lib/src/cli.js get-contract-names`;
  let response = "<command-not-executed-yet>";

  try {
    const rawOutput = execFileSync("docker", [
      "run",
      "--rm",
      imageTag,
      "lib/src/cli.js",
      "get-contract-names"
    ]);
    // Get the last non-empty line (equivalent to `tail -n 1`)
    const lines = rawOutput.split("\n").filter((line) => line.trim() !== "");
    response = lines[lines.length - 1] ?? "";

    const json = JSON.parse(response);
    if (!Array.isArray(json)) {
      throw new Error(
        `Output of the following command is not an array:\n\n  ${getContractNamesCommandDesc}\n\n` +
          `Got the following response:\n\n  ${response}`
      );
    }
    json.forEach((n) => {
      if (typeof n?.contractName !== "string") {
        throw new Error(
          `Output of the following command is not an array of objects with 'contractName' string:\n\n  ${getContractNamesCommandDesc}\n\n` +
            `Missing 'contractName' for element ${n}. The output of the command is:\n\n  ${response}`
        );
      }
    });

    const contracts = (json as { contractName: string }[]).map(({ contractName }) => ({ contractName }));
    return { contracts, imageArchitecture, imageDigest };
  } catch (e) {
    throw new Error(
      `There was an error while executing the following command:\n\n  ${getContractNamesCommandDesc}\n\n` +
        `Error: ${e?.message}. The output is:\n\n  ${response}`
    );
  }
}

export async function deployChaincode(params: {
  privateKey: string;
  imageTag: string;
  imageDigest: string;
  chaincode: string;
  contracts: { contractName: string }[];
}): Promise<{ operationId: string }> {
  const operationId = nanoid();
  const dto: DeployChaincodeDto = {
    operationId,
    imageTag: params.imageTag,
    imageDigest: params.imageDigest,
    chaincode: params.chaincode,
    contracts: params.contracts
  };

  const signature = await generateSignature(dto, params.privateKey);

  await axios
    .post(
      ServicePortal.DEPLOY_URL,
      dto,
      requestConfig({
        headers: {
          [ServicePortal.AUTH_X_GC_KEY]: signature
        }
      })
    )
    .catch((error) => {
      throw new Error(axiosErrorMessage(error));
    });

  return { operationId };
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
    .post(
      ServicePortal.REGISTER_URL,
      dto,
      requestConfig({
        headers: {
          [ServicePortal.AUTH_X_GC_KEY]: signature
        }
      })
    )
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
  fs.mkdirSync(keysPath, { recursive: true });
  fs.mkdirSync(privateKeysPath, { recursive: true, mode: 0o700 });

  // create the public and private keys files
  fs.writeFileSync(`${keysPath}/${DEFAULT_ADMIN_PRIVATE_KEY_NAME}.pub`, adminPublicKey);
  fs.writeFileSync(`${keysPath}/${DEFAULT_DEV_PRIVATE_KEY_NAME}.pub`, devPublicKey);

  fs.writeFileSync(`${privateKeysPath}/${DEFAULT_ADMIN_PRIVATE_KEY_NAME}`, adminPrivateKey.toString(), {
    mode: 0o600
  });
  fs.writeFileSync(`${privateKeysPath}/${DEFAULT_DEV_PRIVATE_KEY_NAME}`, devPrivateKey.toString(), {
    mode: 0o600
  });

  console.log(`Chaincode name:         ${chaincodeName}`);
  console.log(`Public keys directory:  ${keysPath}`);
  console.log(`Private keys directory: ${privateKeysPath}`);
}

// Compares versions by semver precedence: numeric release parts first, and a prerelease
// (e.g. 3.10.0-beta.1) is lower than the same release (3.10.0). Build metadata is ignored.
export function isNewerVersion(latest: string, current: string): boolean {
  return compareVersions(latest, current) > 0;
}

function compareVersions(a: string, b: string): number {
  const left = parseVersion(a);
  const right = parseVersion(b);
  const length = Math.max(left.release.length, right.release.length);

  for (let index = 0; index < length; index++) {
    const diff = (left.release[index] ?? 0) - (right.release[index] ?? 0);
    if (diff !== 0) {
      return Math.sign(diff);
    }
  }

  if (left.prerelease.length === 0 || right.prerelease.length === 0) {
    // a release is higher than any of its prereleases
    return Math.sign(right.prerelease.length - left.prerelease.length);
  }

  const prereleaseLength = Math.max(left.prerelease.length, right.prerelease.length);
  for (let index = 0; index < prereleaseLength; index++) {
    const l = left.prerelease[index];
    const r = right.prerelease[index];
    if (l === undefined || r === undefined) {
      // a shorter set of identifiers is lower when all preceding ones are equal
      return l === undefined ? -1 : 1;
    }
    const diff = comparePrereleaseIdentifiers(l, r);
    if (diff !== 0) {
      return diff;
    }
  }

  return 0;
}

function comparePrereleaseIdentifiers(a: string, b: string): number {
  const aNumeric = /^\d+$/.test(a);
  const bNumeric = /^\d+$/.test(b);
  if (aNumeric && bNumeric) {
    return Math.sign(parseInt(a, 10) - parseInt(b, 10));
  }
  if (aNumeric !== bNumeric) {
    // numeric identifiers are lower than alphanumeric ones
    return aNumeric ? -1 : 1;
  }
  return a < b ? -1 : a > b ? 1 : 0;
}

function parseVersion(version: string): { release: number[]; prerelease: string[] } {
  const withoutBuild = version.trim().replace(/^v/, "").split("+")[0];
  const dashIndex = withoutBuild.indexOf("-");
  const releasePart = dashIndex === -1 ? withoutBuild : withoutBuild.slice(0, dashIndex);
  const prereleasePart = dashIndex === -1 ? "" : withoutBuild.slice(dashIndex + 1);

  const release = releasePart.split(".").map((part) => {
    const numeric = parseInt(part, 10);
    return Number.isNaN(numeric) ? 0 : numeric;
  });
  const prerelease = prereleasePart === "" ? [] : prereleasePart.split(".");

  return { release, prerelease };
}

export function checkCliVersion(cliCurrentVersion: string) {
  let cliLatestVersion: string;

  try {
    cliLatestVersion = execFileSync("npm", ["show", "@gala-chain/cli", "version"]).trim();
  } catch (error) {
    console.warn(`Unable to compare Chain CLI versions: ${error}`);
    return;
  }

  if (!cliLatestVersion || !cliCurrentVersion) {
    console.warn("Unable to compare Chain CLI versions.");
    return;
  }

  if (isNewerVersion(cliLatestVersion, cliCurrentVersion)) {
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
  const developerPublicKeyFile = /^gc-dev.*-key.*\.pub$/;
  const publicKeys = new Set<string>();

  fs.readdirSync(keysPath).forEach((key) => {
    if (!developerPublicKeyFile.test(key)) {
      return;
    }

    const keyPath = path.join(keysPath, key);
    if (!fs.statSync(keyPath).isFile()) {
      return;
    }

    const contents = fs.readFileSync(keyPath, "utf8").trim();
    try {
      signatures.normalizePublicKey(contents);
    } catch {
      return;
    }
    publicKeys.add(contents);
  });

  return [...publicKeys].sort();
}

export async function getPrivateKey(keysFromArg: string | undefined, chaincodeName: string) {
  if (keysFromArg !== undefined) {
    assertPrivateKeyFileArg(keysFromArg);
  }
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

  const channelsByPathFragment = new Map<string, string>();
  for (const { pathFragment, channelName } of apiConfig.channels) {
    const existing = channelsByPathFragment.get(pathFragment);
    if (existing !== undefined) {
      throw new Error(
        `Channels "${existing}" and "${channelName}" have the same API path fragment "${pathFragment}". ` +
          "Use channel names that differ after removing the -channel suffix."
      );
    }
    channelsByPathFragment.set(pathFragment, channelName);
  }

  // Ensure directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write a new api-config.json file and overwrite the old one
  const apiConfigPath = path.resolve(dir, "api-config.json");
  fs.writeFileSync(apiConfigPath, JSON.stringify(apiConfig, null, 2));
}

function getApiConfigForChannel(channel: string, chaincodeName: string, contracts: string) {
  const contractNamesArr = JSON.parse(contracts) as { contractName?: unknown }[];

  if (!contractNamesArr || !Array.isArray(contractNamesArr)) {
    throw new Error(`Invalid contracts JSON: ${contracts}`);
  }

  const seenNames = new Set<string>();
  const contractsArr = contractNamesArr.map((entry) => {
    const contractName = entry?.contractName;
    if (typeof contractName !== "string" || contractName.trim() === "") {
      throw new Error("Contract name must be a non-empty string.");
    }
    if (seenNames.has(contractName)) {
      throw new Error(`Duplicate contract name "${contractName}".`);
    }
    seenNames.add(contractName);
    return {
      contractName,
      chaincodeName,
      pathFragment: contractName
    };
  });

  return {
    pathFragment: channelPathFragment(channel),
    channelName: channel,
    asLocalHost: true,
    contracts: contractsArr
  };
}

// Remove a trailing "-channel" suffix only. An earlier "-channel" stays in the name.
function channelPathFragment(channel: string): string {
  const suffix = "-channel";
  if (channel.endsWith(suffix)) {
    return channel.slice(0, -suffix.length);
  }
  return channel;
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
    const response = await axios.get(
      servicePortalURL,
      requestConfig({
        headers: {
          [ServicePortal.AUTH_X_GC_KEY]: signature
        },
        params: requestParams
      })
    );

    return readLogEntries(response.data);
  } catch (error) {
    if (error instanceof FetchLogsError) {
      throw error;
    }
    throw classifyLogRequestError(error);
  }
}

export function readLogEntries(data: unknown): LogEntry[] {
  if (!Array.isArray(data)) {
    throw new FetchLogsError("Log response is not a list.");
  }

  return data.map((entry, index) => {
    if (!isLogEntry(entry)) {
      throw new FetchLogsError(`Log response entry ${index} is missing message, timestamp, or status.`);
    }
    return entry;
  });
}

function isLogEntry(value: unknown): value is LogEntry {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.message === "string" &&
    typeof entry.status === "string" &&
    typeof entry.timestamp === "string" &&
    !Number.isNaN(Date.parse(entry.timestamp))
  );
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

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await axios.get(servicePortalURL, {
      headers: {
        [ServicePortal.AUTH_X_GC_KEY]: signature,
        Accept: "text/event-stream"
      },
      params: requestParams,
      responseType: "stream",
      signal: controller.signal
    });
    clearTimeout(timer);

    const stream = response.data as Readable;
    const decoder = new StringDecoder("utf8");

    await new Promise<void>((resolve, reject) => {
      const fail = (error: unknown) => {
        stream.removeAllListeners();
        reject(error instanceof Error ? error : new Error(String(error)));
      };

      stream.on("data", (chunk: Buffer) => {
        try {
          onData(decoder.write(chunk));
        } catch (error) {
          fail(error);
        }
      });

      stream.on("end", () => {
        try {
          const rest = decoder.end();
          if (rest) {
            onData(rest);
          }
          resolve();
        } catch (error) {
          fail(error);
        }
      });

      stream.on("error", (error) => {
        fail(error);
      });
    });
  } catch (error) {
    clearTimeout(timer);
    if (
      error instanceof UnauthorizedError ||
      error instanceof BadRequestError ||
      error instanceof FetchLogsError
    ) {
      throw error;
    }
    if (axios.isAxiosError(error)) {
      throw classifyLogRequestError(error);
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to stream logs: ${message}`);
  }
}

function classifyLogRequestError(error: unknown): Error {
  if (!axios.isAxiosError(error)) {
    const message = error instanceof Error ? error.message : String(error);
    return new Error(`Failed to fetch logs: ${message}`);
  }

  const status = error.response?.status;
  const data = error.response?.data as { message?: string } | undefined;
  const message = data?.message;

  if (status === 403) {
    return new UnauthorizedError("Unauthorized.");
  }
  if (status === 400) {
    return new BadRequestError(`Bad request: ${message || error.message}`);
  }
  return new Error(`Failed to fetch logs: ${message || error.message}`);
}

function axiosErrorMessage(error: AxiosError<{ message?: string }>): string {
  const status = error?.response?.status ?? "unknown";
  const message = error?.response?.data?.message ?? error?.message ?? "unknown";
  return `[${status}] ${message}`;
}

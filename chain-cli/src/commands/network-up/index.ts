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
import { Flags } from "@oclif/core";

import { Fablo, FabloConfig } from "fablo";
import * as fs from "fs";
import { readFileSync, writeFileSync } from "fs";
import path from "path";

import BaseCommand from "../../base-command";
import { getCPPs } from "../../connection-profile";
import { defaultFabloRoot } from "../../consts";
import { execSyncStdio } from "../../exec-sync";
import { saveApiConfig } from "../../galachain-utils";
import { downNetworkServices } from "../network-prune";

const defaultChaincodeDir = ".";

export interface SingleArg {
  channel: string;
  channelType: "curator" | "partner";
  chaincodeName: string;
  chaincodeDir: string | undefined;
}

export default class NetworkUp extends BaseCommand<typeof NetworkUp> {
  static override aliases = ["network:up"];

  static override description = "Start the chaincode, browser-api, and ops-api (in non-watch mode).";

  static override examples = [
    "galachain network:up -C=product-channel -t=curator -n=basic-product -d=./ --envConfig=./.dev-env --watch",
    "galachain network:up -C=product-channel -t=curator -n=basic-product -d=./ --envConfig=./.dev-env"
  ];

  static override flags = {
    channel: Flags.string({
      char: "C",
      description: "Channel name.",
      required: true,
      multiple: true
    }),
    channelType: Flags.string({
      char: "t",
      description:
        'Channel type. Can be "curator" or "partner". It means whether this is a chaincode managed by CuratorOrg or PartnerOrg.',
      required: true,
      options: ["curator", "partner"],
      multiple: true
    }),
    chaincodeName: Flags.string({
      char: "n",
      description: "Chaincode name.",
      required: true,
      multiple: true
    }),
    chaincodeDir: Flags.string({
      char: "d",
      description:
        "Root directory of chaincode source, relative to fabloRoot. " +
        `By default '${defaultChaincodeDir}' is used.`,
      default: [defaultChaincodeDir],
      multiple: true
    }),
    fabloRoot: Flags.string({
      char: "r",
      description:
        "Root directory of target network. " +
        "Should not be the same as chaincodeDir and should not be a child of chaincodeDir. " +
        `By default '${defaultFabloRoot}' is used.`,
      default: defaultFabloRoot
    }),
    envConfig: Flags.string({
      char: "e",
      description: "Path to .env file to be used for chaincodes."
    }),
    watch: Flags.boolean({
      char: "w",
      description: "Enable watch mode (live chaincode reload)."
    }),
    contracts: Flags.string({
      char: "o",
      description: "Contract names in a JSON format.",
      multiple: true
    }),
    "no-rest-api": Flags.boolean({
      description: "Do not start GalaChain REST API services."
    }),
    "no-chain-browser": Flags.boolean({
      description: "Do not start GalaChain Browser."
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(NetworkUp);
    customValidation(flags);

    const fabloRoot = path.resolve(flags.fabloRoot);
    const apiConfigPath = path.resolve(fabloRoot, "api-config.json");

    // Generate API config content
    if (flags.contracts) {
      console.log("Processing api-config.json with contracts: " + flags.contracts);
      await saveApiConfig(fabloRoot, flags.contracts, flags.channel, flags.chaincodeName);
    }

    const localhostName = process.env.LOCALHOST_NAME ?? "localhost";
    console.log("Network root directory:", fabloRoot);

    copyNetworkScriptsTo(fabloRoot);

    const singleArgs = reduce(flags).map((a) => ({
      ...a,
      chaincodeDir: a.chaincodeDir ?? defaultChaincodeDir
    }));

    const fabloConfig = flags.watch ? "fablo-config-dev-mode.json" : "fablo-config-default.json";

    await Fablo.directory(fabloRoot)
      .then(() => saveConnectionProfiles(fabloRoot, flags.watch, flags.channel ?? [], localhostName))
      .config(fabloConfig, (cfg) => updatedFabloConfig(cfg, fabloRoot, flags.watch, singleArgs))
      .then(() => updateConfigTxWithChannelProfile(fabloRoot, singleArgs))
      .then(() =>
        copyEnvFile(
          fabloRoot,
          flags.envConfig,
          singleArgs.map((a) => a.chaincodeDir)
        )
      )
      .execute("up")
      .then(async () => {
        await startNetworkServices(fabloRoot, flags, apiConfigPath);
        await printTestAdminCredentials(fabloRoot);
        if (flags.watch) {
          await streamChaincodeLogsAndExit(fabloRoot, singleArgs);
        }
      })
      .catch((error) => {
        console.error("Failed to start network:", error);
        Fablo.directory(fabloRoot).execute("prune");
      });
  }
}

interface NetworkServicesFlags {
  watch: boolean;
  "no-rest-api": boolean;
  "no-chain-browser": boolean;
}

async function startNetworkServices(
  fabloRoot: string,
  flags: NetworkServicesFlags,
  apiConfigPath: string
): Promise<void> {
  try {
    // Start browser-api only if not disabled by flags
    if (!flags["no-chain-browser"]) {
      await startBrowserApi(fabloRoot);
    }

    // Start ops-api only in non-watch mode, and if not disabled by flags
    if (!flags.watch && !flags["no-rest-api"]) {
      await startOpsApi(fabloRoot, apiConfigPath);
    }
  } catch (error) {
    console.error("Failed to start network services:", error);
    throw error;
  }
}

async function startBrowserApi(fabloRoot: string): Promise<void> {
  try {
    const commands = [
      `cd "${fabloRoot}/browser-api"`,
      "./browser-api-compose.sh up",
      "./browser-api-compose.sh success-message"
    ];

    execSyncStdio(commands.join(" && "));
  } catch (error) {
    console.error("Failed to start browser-api:", error);
    throw error;
  }
}

async function startOpsApi(fabloRoot: string, apiConfigPath: string): Promise<void> {
  try {
    const commands = [`cd "${fabloRoot}/ops-api"`, `./ops-api.sh up "${fabloRoot}" "${apiConfigPath}"`];

    execSyncStdio(commands.join(" && "));
  } catch (error) {
    console.error("Failed to start ops-api:", error);
    throw error;
  }
}

async function printTestAdminCredentials(fabloRoot: string): Promise<void> {
  const commands = [
    `cd "${fabloRoot}"`,
    `echo "Dev admin private key which you can use for signing transactions:"`,
    `echo "  $(cat dev-admin-key/dev-admin.priv.hex.txt)"`
  ];
  execSyncStdio(commands.join(" && "));
}

function streamChaincodeLogsAndExit(fabloRoot: string, args: SingleArg[]): Promise<unknown> {
  if (args.length === 0) {
    throw new Error("Error: No chaincode found in watch mode.");
  }

  const containerName = `ccaas_peer0.curator.local_${args[0].channel}_${args[0].chaincodeName}_0.0.1`;
  execSyncStdio(`docker logs -f ${containerName}`);

  return Fablo.directory(fabloRoot)
    .then(async () => {
      // Print message in yellow
      console.log("\x1b[33m\n\nChaincode process stopped, pruning network...\n\n\x1b[0m");
      // Wait 2 seconds to let the user see the message
      await new Promise((resolve) => setTimeout(resolve, 2000));
    })
    .then(() => downNetworkServices(fabloRoot))
    .execute("prune");
}

function copyEnvFile(fabloRoot: string, envConfigPath: string | undefined, chaincodeDirs: string[]): void {
  if (!envConfigPath) {
    return;
  }

  const envConfig = readFileSync(path.resolve(fabloRoot, "..", envConfigPath)).toString();
  chaincodeDirs.forEach((dir) => {
    const chaincodeEnvPath = path.resolve("./", dir, ".env");
    writeFileSync(chaincodeEnvPath, envConfig);
  });
}

function updateConfigTxWithChannelProfile(fabloRoot: string, args: SingleArg[]) {
  const update = createConfigtxProfiles(args);
  const configtxFilePath = path.resolve(fabloRoot, "configtx-policies.yml");
  fs.appendFileSync(configtxFilePath, update);
}

export function createConfigtxProfiles(args: SingleArg[]): string {
  const profiles = args.map(({ channel, channelType }) => {
    const configtxProfileName = channel.replace(/(^\w|-\w)/g, (t) => t.replace(/-/, "").toUpperCase());
    const configtxProfileDefaults =
      channelType === "curator" ? "CuratorChannelDefaults" : "PartnerChannelDefaults";
    return `  ${configtxProfileName}:\n    <<: *${configtxProfileDefaults}`;
  });
  return `\n${profiles.join("\n")}`;
}

export function updatedFabloConfig(
  initialCfg: FabloConfig,
  fabloRoot: string,
  isWatchMode: boolean,
  args: SingleArg[]
): FabloConfig {
  return args.reduce((cfg, arg) => updatedFabloConfigWithEntry(cfg, fabloRoot, isWatchMode, arg), initialCfg);
}

function updatedFabloConfigWithEntry(
  initialCfg: FabloConfig,
  fabloRoot: string,
  isWatchMode: boolean,
  arg: SingleArg
): FabloConfig {
  const updated = JSON.parse(JSON.stringify(initialCfg)); // deep copy
  const channelExists = updated.channels.find((c: { name: string }) => c.name === arg.channel);

  if (!channelExists) {
    const newChannel = {
      name: arg.channel,
      ordererGroup: "group1",
      orgs: [
        {
          name: "CuratorOrg",
          peers: ["peer0"]
        },
        {
          name: "PartnerOrg1",
          peers: ["peer0"]
        }
      ]
    };
    updated.channels.push(newChannel);
  }

  const absoluteChaincodeDir = path.resolve(arg.chaincodeDir ?? "./");
  const relativeChaincodeDir = path.relative(fabloRoot, absoluteChaincodeDir);

  const newChaincode = isWatchMode
    ? {
        channel: arg.channel,
        name: arg.chaincodeName,
        version: "0.0.1",
        lang: "ccaas",
        image: "hyperledger/fabric-nodeenv:2.5",
        chaincodeMountPath: `$CHAINCODES_BASE_DIR/${relativeChaincodeDir}`,
        chaincodeStartCommand: "echo starting && npm run start:ccaas:watch"
      }
    : {
        channel: arg.channel,
        name: arg.chaincodeName,
        version: "0.0.1",
        lang: "node",
        directory: relativeChaincodeDir
      };
  updated.chaincodes.push(newChaincode);

  return updated;
}

function customValidation(flags: any): void {
  const { channel, channelType, chaincodeName, chaincodeDir, envConfig, fabloRoot } = flags;

  /*
    SECURITY: Allowlist validation to prevent command injection.
    Using allowlist (specifying what IS allowed) rather than blocklist (what's NOT allowed)
    because blocklists are prone to bypass via overlooked dangerous characters.
  */

  // Allowlist for names: alphanumeric, hyphen, underscore, dot only
  const allowedNameChars = /^[a-zA-Z0-9._-]+$/;
  // Allowlist for paths: alphanumeric, hyphen, underscore, dot, forward slash only
  const allowedPathChars = /^[a-zA-Z0-9._/-]+$/;

  const maxLengthName = 64;
  const maxLengthPath = 256;

  // Transform envConfig and fabloRoot to arrays to use the same validation
  const envConfigArray = [envConfig].filter(Boolean);
  const fabloRootArray = [fabloRoot].filter(Boolean);

  // Validate name-like flags (channel, channelType, chaincodeName)
  // Only alphanumeric, hyphen, underscore, and dot allowed
  const nameFlags = [channel, channelType, chaincodeName];
  nameFlags.forEach((arr: string[]) => {
    arr?.forEach((flag: string) => {
      if (flag.length > maxLengthName) {
        throw new Error(`Error: Flag "${flag}" is too long. Maximum length is ${maxLengthName} characters.`);
      }
      if (!allowedNameChars.test(flag)) {
        throw new Error(
          `Error: Flag "${flag}" contains invalid characters. Only alphanumeric characters, hyphens (-), underscores (_), and dots (.) are allowed.`
        );
      }
    });
  });

  // Validate path-like flags (chaincodeDir, envConfig, fabloRoot)
  // Only alphanumeric, hyphen, underscore, dot, and forward slash allowed
  const pathFlags = [chaincodeDir, envConfigArray, fabloRootArray];
  pathFlags.forEach((arr: string[]) => {
    arr?.forEach((flag: string) => {
      if (flag.length > maxLengthPath) {
        throw new Error(`Error: Path "${flag}" is too long. Maximum length is ${maxLengthPath} characters.`);
      }
      if (!allowedPathChars.test(flag)) {
        throw new Error(
          `Error: Path "${flag}" contains invalid characters. Only alphanumeric characters, hyphens (-), underscores (_), dots (.), and forward slashes (/) are allowed.`
        );
      }
    });
  });

  /*
    Check if chaincodeDir and envConfig are valid paths
  */
  if (chaincodeDir) {
    chaincodeDir.forEach((dir: string) => {
      if (!fs.existsSync(dir)) {
        throw new Error(`Error: Chaincode directory ${dir} does not exist.`);
      }
    });
  }
  if (envConfig && !fs.existsSync(envConfig)) {
    throw new Error(`Error: Env config file ${envConfig} does not exist.`);
  }

  /*
    The same number of parameters for chaincode, channelTyle, chaincode and chaincodeDir is required
  */
  if (
    channel.length !== channelType.length ||
    channel.length !== chaincodeName.length ||
    channel.length !== chaincodeDir.length
  ) {
    throw new Error(
      `Error: Specified ${channel.length} channel names, ${channelType.length} channel types, ${chaincodeName.length} chaincodes and ${chaincodeDir.length} chaincode directories. All parameters must have the same number of values.`
    );
  }

  /*
    Channel types need to be consistend
  */
  channel.reduce(
    (types: Record<string, "curator" | "partner">, ch: string, i: number) => {
      if (!types[ch]) {
        types[ch] = channelType[i];
        return types;
      } else if (types[ch] !== channelType[i]) {
        throw new Error(
          `Error: Channel ${ch} is provided both as ${types[ch]} and ${channelType[i]}. It should be consistent.`
        );
      } else {
        return types;
      }
    },
    {} as Record<string, "curator" | "partner">
  );

  /*
    (channel, chaincodeName) pairs should be unique
  */
  channel
    .map((ch: any, i: string | number) => `(${ch}, ${chaincodeName[i]})`)
    .forEach((pair: string, i: number, arr: string[]) => {
      if (arr.filter((p) => p === pair).length > 1) {
        throw new Error(`Error: Found non-unique channel-chaincode pair: ${pair}`);
      }
    });

  /*
    Watch mode
  */
  if (flags.watch) {
    if (chaincodeName.length !== 1) {
      throw new Error("Error: Watch mode suports only a network with a single chaincode.");
    }
  }
}

function reduce(args: any): SingleArg[] {
  return args.chaincodeName.map((chaincodeName: unknown, i: number) => ({
    chaincodeName,
    chaincodeDir: args.chaincodeDir?.[i],
    channel: args.channel[i],
    channelType: args.channelType[i]
  }));
}

function copyNetworkScriptsTo(targetPath: string): void {
  const sourceScriptsDir = path.resolve(require.resolve("."), "../../../network");
  try {
    // Using Node.js fs instead of shell commands (safe from command injection)
    fs.mkdirSync(targetPath, { recursive: true });
    fs.cpSync(sourceScriptsDir, targetPath, { recursive: true });

    // List files for informational output
    const files = fs.readdirSync(targetPath);
    console.log(`Copied network scripts to ${targetPath}:`, files.join(", "));
  } catch (error) {
    console.error("Failed to copy network scripts:", error);
    throw error;
  }
}

function saveConnectionProfiles(
  fabloRoot: string,
  isWatchMode: boolean,
  channelNames: string[],
  localhostName: string
): void {
  const cryptoConfigRoot = path.resolve(fabloRoot, "fablo-target/fabric-config/crypto-config");

  // Generate connection profiles for all services
  const cppsLocal = getCPPs(cryptoConfigRoot, channelNames, localhostName, !isWatchMode, true, !isWatchMode);
  const cppsDocker = getCPPs(
    "/crypto-config",
    channelNames,
    localhostName,
    !isWatchMode,
    false,
    !isWatchMode
  );

  // Save connection profiles for ops-api and e2e tests
  const cppLocalDir = path.resolve(fabloRoot, "connection-profiles");
  fs.mkdirSync(cppLocalDir, { recursive: true });

  const cppPath = (org: string) => path.resolve(cppLocalDir, `cpp-${org}.json`);
  writeFileSync(cppPath("curator"), JSON.stringify(cppsLocal.curator, undefined, 2));
  writeFileSync(cppPath("partner"), JSON.stringify(cppsLocal.partner, undefined, 2));
  writeFileSync(cppPath("users"), JSON.stringify(cppsLocal.users, undefined, 2));

  const cppDockerDir = path.resolve(fabloRoot, "connection-profiles-docker");
  fs.mkdirSync(cppDockerDir, { recursive: true });

  const cppDockerPath = (org: string) => path.resolve(cppDockerDir, `cpp-${org}.json`);
  writeFileSync(cppDockerPath("curator"), JSON.stringify(cppsDocker.curator, undefined, 2));
  writeFileSync(cppDockerPath("partner"), JSON.stringify(cppsDocker.partner, undefined, 2));
  writeFileSync(cppDockerPath("users"), JSON.stringify(cppsDocker.users, undefined, 2));
}

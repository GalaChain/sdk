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
import { readFileSync, writeFileSync } from "fs";
import path from "path";

import BaseCommand from "../../base-command";
import { getCPPs, getCPPsBrowserApi } from "../../connection-profile";
import { defaultFabloRoot } from "../../consts";
import { execSync, execSyncStdio } from "../../exec-sync";
import { overwriteApiConfig } from "../../galachain-utils";

const defaultChaincodeDir = ".";

export interface SingleArg {
  channel: string;
  channelType: "curator" | "partner";
  chaincodeName: string;
  chaincodeDir: string | undefined;
}

export default class NetworkUp extends BaseCommand<typeof NetworkUp> {
  static override aliases = ["network:up"];

  static override description = "Start the chaincode in dev-mode and browser-api.";

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
      description: "Contract names in a JSON format."
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(NetworkUp);
    customValidation(flags);

    if (flags.contracts) {
      // This feature supports only a single channel
      console.log("Overwriting api-config.json with contracts: " + flags.contracts);
      overwriteApiConfig(flags.contracts, flags.channel[0], flags.chaincodeName[0]);
    }

    const fabloRoot = path.resolve(flags.fabloRoot);

    const localhostName = process.env.LOCALHOST_NAME ?? "localhost";
    console.log("Network root directory:", fabloRoot);

    await copyNetworkScriptsTo(fabloRoot);

    const singleArgs = reduce(flags).map((a) => ({
      ...a,
      chaincodeDir: a.chaincodeDir ?? defaultChaincodeDir
    }));

    const fabloConfig = flags.watch ? "fablo-config-dev-mode.json" : "fablo-config-default.json";

    await Fablo.directory(fabloRoot)
      .then(() => saveConnectionProfiles(fabloRoot, flags.watch, flags.channel ?? [], localhostName))
      .config(fabloConfig, (cfg) => updatedFabloConfig(cfg, fabloRoot, singleArgs))
      .then(() =>
        copyEnvFile(
          fabloRoot,
          flags.envConfig,
          singleArgs.map((a) => a.chaincodeDir)
        )
      )
      .execute("up");

    startBrowserApi(fabloRoot);

    if (flags.watch) {
      startChaincodeInWatchMode(fabloRoot, singleArgs);
    }
  }
}

function startBrowserApi(fabloRoot: string): void {
  const commands = [
    `cd "${fabloRoot}/browser-api"`,
    "./browser-api-compose.sh up",
    "./browser-api-compose.sh success-message"
  ];

  execSyncStdio(commands.join(" && "));
}

function startChaincodeInWatchMode(fabloRoot: string, args: SingleArg[]): void {
  const chaincodeName = args[0].chaincodeName;
  const commands = [`cd "${fabloRoot}"`, `./chaincode-dev-start.sh "watch" "${chaincodeName}"`];
  execSyncStdio(commands.join(" && "));
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

export function updatedFabloConfig(
  initialCfg: FabloConfig,
  fabloRoot: string,
  args: SingleArg[]
): FabloConfig {
  return args.reduce((cfg, arg) => updatedFabloConfigWithEntry(cfg, fabloRoot, arg), initialCfg);
}

function updatedFabloConfigWithEntry(
  initialCfg: FabloConfig,
  fabloRoot: string,
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

  updated.chaincodes.push({
    name: arg.chaincodeName,
    version: "0.0.1",
    lang: "node",
    channel: arg.channel,
    directory: relativeChaincodeDir
  });

  return updated;
}

function customValidation(flags: any): void {
  const { channel, channelType, chaincodeName, chaincodeDir } = flags;

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
  return args.chaincodeName.map((chaincodeName: any, i: number) => ({
    chaincodeName,
    chaincodeDir: args.chaincodeDir?.[i],
    channel: args.channel[i],
    channelType: args.channelType[i]
  }));
}

function copyNetworkScriptsTo(targetPath: string): void {
  const sourceScriptsDir = path.resolve(require.resolve("."), "../../../network");
  execSync(`mkdir -p "${targetPath}" && cd "${targetPath}" && cp -R "${sourceScriptsDir}"/* ./ && ls -lh`);
}

function saveConnectionProfiles(
  fabloRoot: string,
  isWatchMode: boolean,
  channelNames: string[],
  localhostName: string
): void {
  // e2e tests
  const cryptoConfigRoot = path.resolve(fabloRoot, "fablo-target/fabric-config/crypto-config");
  const cpps = getCPPs(cryptoConfigRoot, channelNames, localhostName, !isWatchMode, true, !isWatchMode);

  const cppDir = path.resolve(fabloRoot, "connection-profiles");
  execSync(`mkdir -p "${cppDir}"`);

  const cppPath = (org: string) => path.resolve(cppDir, `cpp-${org}.json`);
  writeFileSync(cppPath("curator"), JSON.stringify(cpps.curator, undefined, 2));
  writeFileSync(cppPath("partner"), JSON.stringify(cpps.partner, undefined, 2));
  writeFileSync(cppPath("users"), JSON.stringify(cpps.users, undefined, 2));

  // browser-api
  const cppsBrowser = getCPPsBrowserApi(
    cryptoConfigRoot,
    channelNames,
    localhostName,
    !isWatchMode,
    false,
    !isWatchMode
  );

  const cppDirBrowser = path.resolve(fabloRoot, "connection-profiles-browser");
  execSync(`mkdir -p "${cppDirBrowser}"`);

  // Browser-api needs the generated connection profile when running in watch mode and the harded coded one when running in non-watch mode
  if (isWatchMode) {
    const cppPathBrowser = (org: string) => path.resolve(cppDirBrowser, `cpp-${org}.json`);
    writeFileSync(cppPathBrowser("curator"), JSON.stringify(cppsBrowser.curator, undefined, 2));
  } else {
    const sourceCppDirBrowser = path.resolve(".", `${defaultFabloRoot}/browser-api/connection-profiles`);
    execSync(`cp "${sourceCppDirBrowser}/cpp-curator.json" "${cppDirBrowser}/"`);
  }
}

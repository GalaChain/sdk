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
import { Args, Flags, ux } from "@oclif/core";

import BaseCommand from "../../base-command";
import {
  getChaincodeDefinition,
  getDeploymentResponse,
  getDeveloperPublicKeys,
  getPrivateKey,
  registerChaincode
} from "../../galachain-utils";

export default class Register extends BaseCommand<typeof Register> {
  static override description = "Registers chaincode on GalaChain TNT network.";

  static override examples = [
    "galachain register",
    "galachain register ./dev-private-key",
    "galachain register c0fb1924408d936fb7cd0c86695885df4f66861621b5c8660df3924c4d09dd79"
  ];

  static override flags = {
    mnt: Flags.boolean({
      description: "Get info from MNT network instead of TNT (not supported yet)."
    }),
    "no-prompt": Flags.boolean({
      description: "Do not prompt for confirmation."
    })
  };

  static override args = {
    developerPrivateKey: Args.string({
      char: "k",
      description:
        "Developer's private key to sign the request. It could be a file or a string. " +
        "If not provided as an argument, the command will try to read the private key " +
        "from the environment variable DEV_PRIVATE_KEY, or from the default location " +
        "(~/.gc-keys/<chaincode-name>/gc-dev-key), or will ask for it in a prompt.",
      required: false
    })
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Register);

    try {
      this.log("Registering chaincode on GalaChain TNT network...\n");

      const chaincode = await getChaincodeDefinition();
      this.log(`  Chaincode name:\n    ${chaincode.name}`);
      this.log(`  Chaincode admin public key:\n    ${chaincode.adminPublicKey}`);

      const developersPublicKeys = await getDeveloperPublicKeys();
      if (developersPublicKeys.length === 0) {
        throw new Error("No developer public keys found.");
      }

      const developerPublicKeysList = developersPublicKeys.map((d) => `    ${d}`).join("\n");
      this.log(`  Developer public keys:\n${developerPublicKeysList}\n`);

      if (!flags["no-prompt"]) {
        const prompt = `Are you sure you want to register the chaincode on TNT? (y/n)`;
        if (!(await ux.confirm(prompt))) {
          this.log("Registration cancelled.");
          return;
        }
      }

      const developerPrivateKey = await getPrivateKey(args.developerPrivateKey, chaincode.name);

      await registerChaincode({
        privateKey: developerPrivateKey,
        adminPublicKey: chaincode.adminPublicKey,
        developersPublicKeys
      });

      this.log(`Chaincode ${chaincode.name} has been registered:`);

      const chainCodeInfo = await getDeploymentResponse({
        privateKey: developerPrivateKey,
        chaincodeName: chaincode.name
      });

      this.log(`${JSON.stringify(chainCodeInfo, null, 2)}`);
    } catch (error) {
      this.error(`${error?.message ?? error}`);
    }
  }
}

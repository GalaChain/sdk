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
import { Args, Flags } from "@oclif/core";

import BaseCommand from "../../base-command";
import { getDeploymentResponse } from "../../galachain-utils";
import { getPrivateKeyFromFile } from "../../keys";

export default class Connect extends BaseCommand<typeof Connect> {
  static override description = "Connect to a new chaincode.";

  static override examples = [
    "galachain connect ./dev-private-key",
    "galachain connect c0fb1924408d936fb7cd0c86695885df4f66861621b5c8660df3924c4d09dd79",
    "galachain connect --testnet"
  ];

  static override flags = {
    testnet: Flags.boolean({
      description: "Connect to testnet instead of mainnet."
    })
  };

  static override args = {
    developerPrivateKey: Args.string({
      char: "k",
      description:
        "Optional private key to sign the data. It could be a file or a string. " +
        "If not provided, the private key will be read from the environment variable DEV_PRIVATE_KEY.",
      required: false
    })
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Connect);

    const developerPrivateKey =
      args.developerPrivateKey ?? process.env.DEV_PRIVATE_KEY ?? getPrivateKeyFromFile();

    try {
      const response = await getDeploymentResponse({
        privateKey: developerPrivateKey,
        isTestnet: flags.testnet ?? false
      });

      this.log(`You are now connected! Chaincode ${response.chaincode} and Channel ${response.channel}.`);
    } catch (error) {
      this.error(`${error}`);
    }
  }
}

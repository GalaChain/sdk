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
import { ChaincodeInfoDto } from "../../dto";
import { getDeploymentResponse, getPrivateKey } from "../../galachain-utils";

export default class Info extends BaseCommand<typeof Info> {
  static override description = "Show the ChainCode information.";

  static override examples = [
    "galachain info",
    "galachain info ./dev-private-key --testnet",
    "galachain info c0fb1924408d936fb7cd0c86695885df4f66861621b5c8660df3924c4d09dd79"
  ];

  static override flags = {
    testnet: Flags.boolean({
      description: "Get info from testnet instead of mainnet."
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
    const { args, flags } = await this.parse(Info);

    const developerPrivateKey = args.developerPrivateKey ?? (await getPrivateKey());

    try {
      const response = await getDeploymentResponse({
        privateKey: developerPrivateKey,
        isTestnet: flags.testnet ?? false
      });

      const chainCodeInfo: ChaincodeInfoDto = {
        org: response.org,
        channel: response.channel,
        chaincode: response.chaincode,
        imageName: response.imageName,
        status: response.status,
        lastOperationId: response.lastOperationId,
        adminPublicKey: response.adminPublicKey,
        isTestnet: response.isTestnet,
        lastUpdated: response.lastUpdated
      };

      this.log(`${JSON.stringify(chainCodeInfo, null, 2)}`);
    } catch (error) {
      this.error(`${error}`);
    }
  }
}

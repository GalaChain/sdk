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
import { getChaincodeDefinition, getDeploymentResponse, getPrivateKey } from "../../galachain-utils";

export default class Info extends BaseCommand<typeof Info> {
  static override description = "Get ChainCode information.";

  static override examples = [
    "galachain info",
    "galachain info ./dev-private-key",
    "galachain info c0fb1924408d936fb7cd0c86695885df4f66861621b5c8660df3924c4d09dd79"
  ];

  static override flags = {
    mnt: Flags.boolean({
      description: "Get info from MNT network instead of TNT (not supported yet)."
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
    const { args, flags } = await this.parse(Info);

    const chaincode = await getChaincodeDefinition();
    const developerPrivateKey = await getPrivateKey(args.developerPrivateKey, chaincode.name);

    try {
      const chainCodeInfo = await getDeploymentResponse({
        privateKey: developerPrivateKey,
        chaincodeName: chaincode.name
      });

      this.log(`${JSON.stringify(chainCodeInfo, null, 2)}`);
    } catch (error) {
      this.error(error?.message ?? error);
    }
  }
}

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
  deployChaincode,
  getChaincodeDefinition,
  getChaincodeImageInfo,
  getDeploymentResponse,
  getPrivateKey
} from "../../galachain-utils";

export default class Deploy extends BaseCommand<typeof Deploy> {
  static override description =
    "Schedules deployment of published chaincode Docker image to GalaChain TNT network.";

  static override examples = [
    "galachain deploy registry.image.name:latest",
    "galachain deploy registry.image.name:latest ./dev-private-key",
    "galachain deploy registry.image.name:latest c0fb1924408d936fb7cd0c86695885df4f66861621b5c8660df3924c4d09dd79"
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
    imageTag: Args.string({
      char: "i",
      description: "Image tag to deploy. It should follow the pattern imageName:version.",
      required: true
    }),
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
    const { args, flags } = await this.parse(Deploy);

    const imageTag = args.imageTag;
    // eslint-disable-next-line
    const imageTagRegex = /^[a-zA-Z0-9\.?][+\/?a-zA-Z0-9_.-]+\:.{0,127}$/;
    if (!imageTagRegex.test(imageTag)) {
      this.log(`The image tag ${imageTag} is not valid. It should follow the pattern imageName:version.`);
      return;
    }

    const chaincode = await getChaincodeDefinition();
    const developerPrivateKey = await getPrivateKey(args.developerPrivateKey, chaincode.name);

    try {
      this.log(`Verifying Docker image ${imageTag}...`);
      const { contracts, imageSha256 } = getChaincodeImageInfo(imageTag);

      if (contracts.length === 0) {
        throw new Error("No contracts found in the Docker image.");
      }

      this.log(`\n  Chaincode:    ${chaincode.name}`);
      this.log(`  Image:        ${imageTag}`);
      this.log(`  Image SHA256: ${imageSha256}`);

      const nameList = contracts.map((c) => `\n   - ${c.contractName}`).join("");
      this.log(`  Contracts: ${nameList}\n`);

      if (!flags["no-prompt"]) {
        const prompt = `Are you sure you want to deploy the chaincode ${chaincode.name} to TNT? (y/n)`;
        if (!(await ux.confirm(prompt))) {
          this.log("Deployment cancelled.");
          return;
        }
      }

      await deployChaincode({
        privateKey: developerPrivateKey,
        imageTag,
        chaincode: chaincode.name,
        contracts
      });

      this.log(`Deployment scheduled to TNT:`);

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

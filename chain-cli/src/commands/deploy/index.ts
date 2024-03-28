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
import { deployChaincode, getPrivateKey } from "../../galachain-utils";

export default class Deploy extends BaseCommand<typeof Deploy> {
  static override description =
    "Schedules deployment of published chaincode Docker image to GalaChain sandbox.";

  static override examples = [
    "galachain deploy registry.image.name:latest",
    "galachain deploy registry.image.name:latest ./dev-private-key",
    "galachain deploy registry.image.name:latest c0fb1924408d936fb7cd0c86695885df4f66861621b5c8660df3924c4d09dd79"
  ];

  static override flags = {
    testnet: Flags.boolean({
      description: "Deploy to testnet instead of sandbox.",
      hidden: true
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
        "Optional private key to sign the data. It could be a file or a string. " +
        "If not provided, the private key will be read from the environment variable DEV_PRIVATE_KEY.",
      required: false
    })
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Deploy);

    const environment = flags.testnet ? "testnet" : "sandbox";

    const imageTag = args.imageTag;
    // eslint-disable-next-line
    const imageTagRegex = /^[a-zA-Z0-9\.?][+\/?a-zA-Z0-9_.-]+\:.{0,127}$/;
    if (!imageTagRegex.test(imageTag)) {
      this.log(`The image tag ${imageTag} is not valid. It should follow the pattern imageName:version.`);
      return;
    }

    const developerPrivateKey = await getPrivateKey(args.developerPrivateKey);

    const response = await ux.prompt(`Are you sure you want to deploy to ${environment}? (y/n)`);
    if (response.toUpperCase() !== "Y") {
      this.log("Deployment cancelled.");
      return;
    }

    try {
      const response = await deployChaincode({
        privateKey: developerPrivateKey,
        isTestnet: flags.testnet ?? false,
        imageTag: imageTag
      });

      this.log(
        `Deployment scheduled to ${environment}. Status ${response.status} for Chaincode ${response.chaincode} and Channel ${response.channel}.`
      );
    } catch (error) {
      this.log(`${error}`);
    }
  }
}

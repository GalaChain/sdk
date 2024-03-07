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
import { Args } from "@oclif/core";

import BaseCommand from "../../base-command";
import { getPrivateKey } from "../../galachain-utils";

export default class TestDeploy extends BaseCommand<typeof TestDeploy> {
  static override description =
    "Schedules deployment of published chaincode Docker image to GalaChain testnet.";

  static override examples = [
    "galachain test-deploy registry.image.name:latest",
    "galachain test-deploy registry.image.name:latest ./private-key",
    "galachain test-deploy registry.image.name:latest c0fb1924408d936fb7cd0c86695885df4f66861621b5c8660df3924c4d09dd79"
  ];

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
    const { args } = await this.parse(TestDeploy);

    const developerPrivateKey = await getPrivateKey(args.developerPrivateKey);
    if (!developerPrivateKey) {
      await this.config.runCommand("deploy", ["--testnet"]);
    } else {
      await this.config.runCommand("deploy", [args.imageTag, developerPrivateKey as string, "--testnet"]);
    }
  }
}

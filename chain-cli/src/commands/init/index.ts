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

import * as fs from "fs";
import path from "path";

import BaseCommand from "../../base-command";
import { execSync } from "../../exec-sync";
import { generateKeys } from "../../galachain-utils";
import { getPathFileName } from "../../utils";

export default class Init extends BaseCommand<typeof Init> {
  static override description = "Initialize a project template with Chain CLI.";

  static override examples = ["galachain init ./linux-mac-path/my-project-name"];

  static override args = {
    path: Args.string({
      char: "p",
      description: "Output path for project template.",
      required: true
    })
  };

  async run() {
    const { args } = await this.parse(Init);

    try {
      this.copyChaincodeTemplate(args.path);

      // Update the name field in the package.json and the package-lock.json to be `@gala-games/<project-name>`
      const fileName = getPathFileName(args.path);
      const filesToUpdate = ["package.json", "package-lock.json"];

      filesToUpdate.forEach((fileToUpdate) => {
        const projectPath = path.join(args.path, fileToUpdate);

        try {
          const fileContents = fs.readFileSync(projectPath, "utf8");
          const packageJson = JSON.parse(fileContents);

          packageJson.name = "@gala-chain/" + fileName;

          fs.writeFileSync(projectPath, JSON.stringify(packageJson, null, 2), {
            encoding: "utf8",
            flag: "w"
          });
        } catch (err) {
          this.error(`Error updating project name in ${projectPath}: ${err}`);
        }
      });

      await generateKeys(args.path);

      this.log(`Project template initialized at ${args.path}`);
    } catch (error) {
      this.error(`Error initializing project template: ${error}`);
    }
  }

  copyChaincodeTemplate(destinationPath: string): void {
    const sourceTemplateDir = path.resolve(require.resolve("."), "../../../chaincode-template");
    fs.mkdirSync(destinationPath, { recursive: true });
    fs.cpSync(sourceTemplateDir, destinationPath, { recursive: true });
  }
}

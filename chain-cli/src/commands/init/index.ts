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
import { Args, ux } from "@oclif/core";

import * as fs from "fs";
import path from "path";

import BaseCommand from "../../base-command";
import { checkCliVersion, generateKeys } from "../../galachain-utils";
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
      checkCliVersion(this.config.version);

      // Derive the project name before anything is written, so an invalid path leaves no files behind.
      const fileName = getPathFileName(args.path);

      await this.confirmOverwrite(args.path);

      this.copyChaincodeTemplate(args.path);

      // Update the name field in the package.json and the package-lock.json to be `@gala-chain/<project-name>`
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

  private async confirmOverwrite(destinationPath: string): Promise<void> {
    const entries = existingDestinationEntries(destinationPath);
    if (entries.length === 0) {
      return;
    }

    const prompt = `Destination ${destinationPath} is not empty. Overwrite existing files? (y/n)`;
    if (!(await ux.confirm(prompt))) {
      this.error(`Refusing to initialize into non-empty destination ${destinationPath}.`, { exit: 1 });
    }
  }
}

function existingDestinationEntries(destinationPath: string): string[] {
  try {
    const stat = fs.statSync(destinationPath);
    if (!stat.isDirectory()) {
      return [path.basename(destinationPath)];
    }
    return fs.readdirSync(destinationPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

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

import { Fablo } from "fablo";
import fs from "fs";
import path from "path";

import BaseCommand from "../../base-command";
import { defaultFabloRoot } from "../../consts";
import { execSyncStdio } from "../../exec-sync";

export default class NetworkPrune extends BaseCommand<typeof NetworkPrune> {
  static override aliases = ["network:prune"];

  static override description = "Removes the network entirely.";

  static override examples = ["galachain network:prune -r=./dir-target-netowrk"];

  static override flags = {
    fabloRoot: Flags.string({
      char: "r",
      description: `Root directory of target network. By default '${defaultFabloRoot}' is used.`,
      default: defaultFabloRoot
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(NetworkPrune);

    const fabloRoot = getFabloRoot(flags.fabloRoot);
    if (fabloRoot === undefined) {
      this.exit();
    }

    await Fablo.directory(fabloRoot)
      .then(() => downNetworkServices(fabloRoot))
      .execute("prune");
  }
}

function downNetworkServices(fabloRoot: string): void {
  try {
    // Down ops-api
    execSyncStdio(`cd "${fabloRoot}/ops-api" && ./ops-api.sh down`);
  } catch (e) {
    console.warn(e);
  }
  try {
    // Down browser-api
    execSyncStdio(`cd "${fabloRoot}/browser-api" && ./browser-api-compose.sh down`);
  } catch (e) {
    console.warn(e);
  }
}

function getFabloRoot(fabloDir: string): string | undefined {
  // Validate fabloDir to prevent command injection
  // Reject special characters that could be used for shell injection
  const specialChars = /[&\\#,+()$~%'":;*?<>@{}|`\n\r]/;
  if (specialChars.test(fabloDir)) {
    console.error(`Error: Path '${fabloDir}' contains unsafe characters.`);
    return undefined;
  }

  if (fs.existsSync(fabloDir)) {
    return path.resolve(fabloDir);
  } else {
    console.warn(`Directory '${fabloDir}' does not exist.`);
    return undefined;
  }
}

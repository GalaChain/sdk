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
import path from "path";

import BaseCommand from "../../base-command";
import { defaultFabloRoot } from "../../consts";
import { execSyncStdio } from "../../exec-sync";
import { Shell } from "../../shell";

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

    const fabloRoot = getOrCreateFabloRoot(flags.fabloRoot);

    await Fablo.directory(fabloRoot)
      .then(() => downBrowserApi(fabloRoot))
      .execute("prune");
  }
}

function downBrowserApi(fabloRoot: string): void {
  try {
    execSyncStdio(`cd "${fabloRoot}/browser-api" && ./browser-api-compose.sh down`);
  } catch (e) {
    // just console.warn. Ignore because command cannot stop Fablo network
    console.warn(e);
  }
}

function getOrCreateFabloRoot(fabloDir: string): string {
  const fabloRoot = path.resolve(fabloDir);
  const shell = new Shell();
  shell.mkdir(`${fabloRoot}`);
  return fabloRoot;
}

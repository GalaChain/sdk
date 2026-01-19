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

import * as secp from "@noble/secp256k1";
import { writeFile } from "node:fs/promises";

import BaseCommand from "../../base-command";

export default class Keygen extends BaseCommand<typeof Keygen> {
  static override description =
    `Generate a Public / Private key signing pair for Chain DTO (Data Transfer Object) signatures. ` +
    `Uses ${"`@noble/secp256k1`"} npm library under-the-hood. ` +
    `Always handle private keys with the utmost care.`;

  static override examples = ["galachain keygen data/user1"];

  static override args = {
    file: Args.string({
      required: true,
      char: "f",
      description:
        'Output file path for private key. Public key will be written alongside it with ".pub" suffix. '
    })
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(Keygen);

    const privateKey = secp.utils.bytesToHex(secp.utils.randomPrivateKey());
    const publicKey = secp.utils.bytesToHex(secp.getPublicKey(privateKey));

    const file: string = args.file as string;

    this.log(`Writing keys to ${file}`);

    this.log(`public key... ${file}.pub`);
    await writeFile(`${file}.pub`, publicKey.toString());

    this.log(`private key... ${args.file}`);
    await writeFile(file, privateKey.toString(), { mode: 0o600 });
  }
}

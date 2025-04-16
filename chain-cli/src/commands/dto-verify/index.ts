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

import { ChainCallDTO, signatures } from "@gala-chain/api";

import BaseCommand from "../../base-command";
import { parseJsonFromStringOrFile, readPublicKeyFromFile } from "../../utils";

export default class DtoVerify extends BaseCommand<typeof DtoVerify> {
  static override aliases = ["dto:verify"];

  static override description = "It verifies the signature in the DTO using the public key.";

  static override examples = [
    `galachain dto:verify ./publicKey '{
      "tokenClass": {
        "collection": "CLITest",
        "category": "Currency",
      },
      "signature": "/fYYooumRdFFrL4U3Nzwuf2uzBZAxKv4WrnMjLnbnJFU+Z6lQe2X/CCcLhRqq67jUDEFvOdky0g5D4sRCExXyBw=",
    }'`,
    "galachain dto:verify ./publicKey dto.json"
  ];

  static override args = {
    key: Args.string({
      char: "k",
      description: "File path to the public key.",
      required: true
    }),
    data: Args.string({
      char: "d",
      description:
        "Data representing an signed DTO object you wish to verify. Provide a JSON string " +
        "or a path to a valid JSON file.",
      required: true
    })
  };

  async run(): Promise<void> {
    const { args } = await this.parse(DtoVerify);

    let publicKey: string;
    try {
      publicKey = await readPublicKeyFromFile(args.key);
    } catch (e) {
      this.error(`Failed to read public key from file: ${args.key}. ${e}`, { exit: 1 });
    }

    const dto = (await parseJsonFromStringOrFile(args.data)) as ChainCallDTO;
    const signature = dto.signature;

    if (!signature) {
      this.error("Signature is not present in the DTO.", { exit: 1 });
    }

    delete dto.signature;

    signatures.isValid(signature, dto, publicKey)
      ? this.log("Signature is valid.")
      : this.error("Signature is not valid.", { exit: 1 });
  }
}

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

import { ChainCallDTO, serialize, signatures } from "@gala-chain/api";
import { writeFile } from "fs/promises";

import BaseCommand from "../../base-command";
import { parseJsonFromStringOrFile, parseStringOrFileKey } from "../../utils";

export default class DtoSign extends BaseCommand<typeof DtoSign> {
  static override aliases = ["dto:sign"];

  static override description = "DTO (Data Transfer Object) signing.";

  static override examples = [
    `galachain dto:sign -o=output/path ./testkey '{
      "tokenClass": {
        "collection": "CLITest",
        "category": "Currency",
      }
    }'`,
    "galachain dto:sign ./testkey dto.json -o=output/path",
    "galachain dto:sign ./testkey dto.json -d",
    "galachain dto:sign 04ea7e8e14f2a0 dto.json -s -o=output/path -d"
  ];

  static override flags = {
    outputFile: Flags.string({
      char: "o",
      description:
        "(optional) File path to an output directory where the signed DTO JSON file will be written. " +
        "If not provided, signed DTO will be printed to stdout."
    }),
    derSignature: Flags.boolean({
      char: "d",
      default: false,
      description: "(optional) If provided, the signature will be used as DER format."
    }),
    onlySignature: Flags.boolean({
      char: "s",
      default: false,
      description:
        "(optional) If provided, only the signature will be printed to stdout or written to a file."
    })
  };

  static override args = {
    key: Args.string({
      char: "k",
      description: "Private key string or path to the private key file.",
      required: true
    }),
    data: Args.string({
      char: "D",
      description:
        "Data representing an unsigned DTO object you wish to sign. Provide a JSON string " +
        "or a path to a valid JSON file.",
      required: true
    })
  };

  async run(): Promise<void> {
    const { flags, args } = await this.parse(DtoSign);

    const privateKey = (await parseStringOrFileKey(args.key)) as string;
    const keyBuffer = signatures.normalizePrivateKey(privateKey);

    const dto = (await parseJsonFromStringOrFile(args.data)) as ChainCallDTO;

    dto.signature = flags.derSignature
      ? await signatures.getDERSignature(dto, keyBuffer)
      : await signatures.getSignature(dto, keyBuffer);
    dto.signature = Buffer.from(dto.signature, "hex").toString("base64");

    const output = flags.onlySignature ? dto.signature : serialize(dto);

    if (flags.outputFile) {
      await writeFile(flags.outputFile, output, "utf-8").catch((e) => {
        this.log(`Failed to writeFile to ${flags.outputFile}. ${e}`);
        this.log(output);
        return;
      });
    } else {
      this.log(output);
    }
  }
}

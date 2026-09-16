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
import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";

const cliSrc = path.resolve(__dirname);
const apiSrc = path.resolve(__dirname, "../../chain-api/src");

const copiedFiles: Array<[string, string]> = [
  ["api/utils/signatures/eth.ts", "utils/signatures/eth.ts"],
  ["api/utils/signatures/eth.spec.ts", "utils/signatures/eth.spec.ts"],
  ["api/utils/signatures/getPayloadToSign.ts", "utils/signatures/getPayloadToSign.ts"],
  ["api/utils/signatures/index.ts", "utils/signatures/index.ts"],
  ["api/utils/serialize.ts", "utils/serialize.ts"],
  ["api/utils/error.ts", "utils/error.ts"]
];

function listFiles(dir: string, prefix = ""): string[] {
  return readdirSync(dir)
    .flatMap((name) => {
      const rel = prefix ? `${prefix}/${name}` : name;
      const full = path.join(dir, name);
      return statSync(full).isDirectory() ? listFiles(full, rel) : [rel];
    })
    .sort();
}

describe("copied API files", () => {
  it.each(copiedFiles)("%s matches chain-api %s", (cliRel, apiRel) => {
    const cli = readFileSync(path.join(cliSrc, cliRel), "utf8");
    const api = readFileSync(path.join(apiSrc, apiRel), "utf8");
    expect(cli).toEqual(api);
  });

  it("ethers tree matches chain-api", () => {
    const cliFiles = listFiles(path.join(cliSrc, "api/ethers"));
    const apiFiles = listFiles(path.join(apiSrc, "ethers"));
    expect(cliFiles).toEqual(apiFiles);

    for (const rel of apiFiles) {
      const cli = readFileSync(path.join(cliSrc, "api/ethers", rel), "utf8");
      const api = readFileSync(path.join(apiSrc, "ethers", rel), "utf8");
      expect(cli).toEqual(api);
    }
  });
});

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
import { readFileSync } from "fs";
import path from "path";

const cliSrc = path.resolve(__dirname);
const apiSrc = path.resolve(__dirname, "../../chain-api/src");

const copiedFiles: Array<[string, string]> = [["signatures/serialize.ts", "utils/serialize.ts"]];

describe("copied API files", () => {
  it.each(copiedFiles)("%s matches chain-api %s", (cliRel, apiRel) => {
    const cli = readFileSync(path.join(cliSrc, cliRel), "utf8");
    const api = readFileSync(path.join(apiSrc, apiRel), "utf8");
    expect(cli).toEqual(api);
  });
});

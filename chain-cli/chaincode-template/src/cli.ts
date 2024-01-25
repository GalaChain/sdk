#!/usr/bin/env node

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
// Import tracing to ensure this is the first in the application
import "./tracer";

// Import and run standard fabric-chaincode-node cli
import "fabric-shim/cli";

const [, , customCommand] = process.argv;
if (customCommand === "get-contract-names") {
  // importing contracts would produce a lot of noise, so we set the log level to error
  process.env.CORE_CHAINCODE_LOGGING_LEVEL = "error";
  process.env.LOG_LEVEL = "error";

  const { contracts } = require("./index");
  const response = (contracts ?? [])
    .filter((c: any) => typeof c === "function")
    .map((Cls) => new Cls())
    .filter((c: { getName?: string }) => typeof c.getName === "function")
    .map((c) => c.getName())
    .filter((name: string) => name !== undefined)
    .sort()
    .map((contractName: string) => ({ contractName }));
  console.log(JSON.stringify(response));

  process.exit(0);
}

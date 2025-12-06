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

// Import and run standard fabric-chaincode-node cli
import type { ContractAPI } from "@gala-chain/api";
import type { GalaContract } from "@gala-chain/chaincode";
import "fabric-shim/cli";
import fs from "fs";

const [, , customCommand] = process.argv;
if (customCommand === "get-contract-names") {
  printContractNames();
  process.exit(0);
}

if (customCommand === "get-contract-api") {
  saveContractAPI("/tmp/contract-api.json");
  process.exit(0);
}

function getContractInstances(): GalaContract[] {
    // importing contracts would produce a lot of noise, so we set the log level to error
    process.env.CORE_CHAINCODE_LOGGING_LEVEL = "error";
    process.env.LOG_LEVEL = "error";

    const { contracts } = require("./index");
    return (contracts ?? [])
      .filter((c: any) => typeof c === "function")
      .map((Cls) => new Cls())
      .filter((c: GalaContract) => typeof c.getName === "function");
}

function printContractNames() {
  const response = getContractInstances()
    .map((c) => c.getName())
    .filter((name: string) => name !== undefined)
    .sort()
    .map((contractName: string) => ({ contractName }));
  
  console.log(JSON.stringify(response));
}

function saveContractAPI(path: string) {
  const response = getContractInstances()
    .map((c) => c.getContractAPI())
    .filter((api: ContractAPI) => api !== undefined)
    .sort((a, b) => a.contractName.localeCompare(b.contractName));
  
  fs.writeFileSync(path, JSON.stringify(response));
}

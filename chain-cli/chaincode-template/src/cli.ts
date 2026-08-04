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

import "dotenv/config";

import type { ContractAPI } from "@gala-chain/api";
import type { GalaContract } from "@gala-chain/chaincode";
import fs from "fs";

const [, , customCommand] = process.argv;

async function bootstrap(): Promise<void> {
  if (customCommand === "get-contract-names") {
    printContractNames();
    return;
  }

  if (customCommand === "get-contract-api") {
    saveContractAPI("/tmp/contract-api.json");
    return;
  }

  if (customCommand === "otel:verify") {
    const { verifyOtelConnection } = await import("@gala-chain/chaincode");
    const ok = await verifyOtelConnection();
    process.exit(ok ? 0 : 1);
  }

  // Chaincode start: verify OTEL (no-op when endpoint unset), then hand off to fabric-shim.
  const { verifyOtelConnection } = await import("@gala-chain/chaincode");
  await verifyOtelConnection();
  await import("fabric-shim/cli");
}

function getContractInstances(): GalaContract[] {
  // importing contracts would produce a lot of noise, so we set the log level to error
  process.env.CORE_CHAINCODE_LOGGING_LEVEL = "error";
  process.env.LOG_LEVEL = "error";

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { contracts } = require("./index");
  return (contracts ?? [])
    .filter((c: unknown) => typeof c === "function")
    .map((Cls: new () => GalaContract) => new Cls())
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

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});

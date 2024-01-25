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

require("dotenv/config"); // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import

if (process.env.GALA_NETWORK_ROOT_PATH === undefined) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const path = require("path");
  const networkRoot = path.resolve(__dirname, "../test-network");
  process.env.GALA_NETWORK_ROOT_PATH = networkRoot;
}

// we use dev mode by default for tests
if (process.env.GALA_CLIENT_DEV_MODE === undefined) {
  process.env.GALA_CLIENT_DEV_MODE = "true";
}

// Force less information in logs.
// We want this, because while running tests from command line Fabric produces
// a lot of logs, and it's hard to see the actual test output.
// Also, we need to add it in Jest config file, to change it early enough, since
// the log level for chaincodes is configured during import resolution.
process.env.CORE_CHAINCODE_LOGGING_LEVEL = "error";
process.env.LOG_LEVEL = "error";

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testEnvironment: "node"
};

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

/* eslint-disable */
export default {
  displayName: "chaincode",
  preset: "../jest.preset.js",
  testEnvironment: "node",
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.spec.json" }]
  },
  moduleFileExtensions: ["ts", "js", "html"],
  coverageDirectory: "../coverage/chaincode",
  setupFilesAfterEnv: ["setimmediate"]
};

// For testing purposes we use initial admin key pair
process.env.DEV_ADMIN_USER_ID = "client|admin";
process.env.DEV_ADMIN_PRIVATE_KEY = "88698cb1145865953be1a6dafd9646c3dd4c0ec3955b35d89676242129636a0b";
process.env.DEV_ADMIN_PUBLIC_KEY =
  "048e1adb2489bdd6f387da77315a8902be3a7a06bc10bedbd099cdfc5a59a74a4c0e14c1bebc8e38e9f0e18a466e1e603b8faab4d4d354afbb57d979f2b16886db";

// by default in tests we use role based auth
process.env.USE_RBAC = "true";

// Force less information in logs.
// We want this, because while running tests from command line Fabric produces
// a lot of logs, and it's hard to see the actual test output.
// Also, we need to add it in Jest config file, to change it early enough, since
// the log level for chaincodes is configured during import resolution.
process.env.CORE_CHAINCODE_LOGGING_LEVEL = "error";
process.env.LOG_LEVEL = "error";
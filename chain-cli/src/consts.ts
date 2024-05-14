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

const GC_API_URL = process.env.GC_API_URL ?? "https://gateway.stage.galachain.com/cli/";
export const defaultFabloRoot = "./test-network";
export const ExpectedImageArchitecture = "linux/amd64";

export const ServicePortal = {
  GET_TEST_DEPLOYMENT_URL: GC_API_URL + "api/test-deployment",
  GET_DEPLOYMENT_URL: GC_API_URL + "api/deployment",
  DEPLOY_TEST_URL: GC_API_URL + "api/test-deploy",
  DEPLOY_URL: GC_API_URL + "api/deploy",
  AUTH_X_GC_KEY: "x-gc-authorization"
};

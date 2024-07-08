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
import { ChainClientBuilder, loadJson } from "./generic";
import { HFClientBuilder } from "./hf";
import { RestApiClientBuilder, loadRestApiConfig } from "./rest-api";

export interface HFClientConfig {
  orgMsp: string;
  userId?: string;
  userSecret?: string;
  connectionProfilePath: string;
}

function forConnectionProfile(hf: HFClientConfig): ChainClientBuilder {
  const connectionProfile = loadJson(hf.connectionProfilePath);

  if (!connectionProfile.organizations?.[hf.orgMsp]) {
    const allowedOrgs =
      typeof connectionProfile.organizations === "object"
        ? Object.keys(connectionProfile.organizations ?? {})
        : [];
    throw new Error(
      `Organization ${hf.orgMsp} not found in connection profile. Allowed orgs: ${allowedOrgs.join(", ")}`
    );
  }

  const userId = hf.userId ?? process.env.GC_USER_ID;
  if (!userId) {
    throw new Error("Missing user id. Please provide it manually or in GC_USER_ID environment variable.");
  }

  const adminPass = hf.userSecret ?? process.env.GC_USER_PASS;
  if (!adminPass) {
    throw new Error("Missing user pass. Please provide it manually or in GC_USER_PASS environment variable.");
  }

  return new HFClientBuilder(hf.orgMsp, userId, adminPass, connectionProfile);
}

export interface RestApiClientConfig {
  orgMsp: string;
  apiUrl: string;
  userId?: string;
  userSecret?: string;
  configPath: string;
}

function forApiConfig(api: RestApiClientConfig): ChainClientBuilder {
  const config = loadRestApiConfig(api.configPath);

  const adminKey = api.userId ?? process.env.GC_API_KEY;
  if (!adminKey) {
    throw new Error("Missing admin key. Please provide it manually or GC_API_KEY environment variable.");
  }

  const adminSecret = api.userSecret ?? process.env.GC_API_SECRET;
  if (!adminSecret) {
    throw new Error(
      "Missing admin secret. Please provide it manually or GC_API_SECRET environment variable."
    );
  }

  return new RestApiClientBuilder(api.apiUrl, api.orgMsp, { adminKey, adminSecret }, config);
}

export const gcclient = {
  forConnectionProfile,
  forApiConfig
};

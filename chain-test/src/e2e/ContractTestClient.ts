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
import {
  ChainClient,
  ChainClientBuilder,
  ChainUser,
  ChainUserAPI,
  CommonContractAPI,
  ContractConfig,
  HFClientConfig,
  RestApiClientConfig,
  buildChainUserAPI,
  commonContractAPI,
  gcclient
} from "@gala-chain/client";
import { jest } from "@jest/globals";
import * as path from "path";

// use this timeout in each test that uses ContractTestClient
jest.setTimeout(60 * 1000);

export function networkRoot() {
  if (process.env.GALA_NETWORK_ROOT_PATH === undefined) {
    throw new Error("Missing GALA_NETWORK_ROOT_PATH env variable");
  }
  return process.env.GALA_NETWORK_ROOT_PATH;
}

function defaultOpsApiConfigPath() {
  // by default project root is a parent of network root
  return path.resolve(networkRoot(), "..", "api-config.json");
}

function defaultConnectionProfilePath(orgKey: "curator" | "users" | "partner"): string {
  return path.resolve(networkRoot(), `connection-profiles/cpp-${orgKey}.json`);
}

const defaultParams = {
  CuratorOrg: {
    orgMsp: "CuratorOrg",
    adminId: process.env.CURATORORG_CA_ADMIN_NAME ?? "admin",
    adminPass: process.env.CURATORORG_CA_ADMIN_PASSWORD ?? "adminpw",
    connectionProfilePath: process.env.CURATORORG_CONNECTION_PROFILE_PATH,
    defaultConnectionProfilePath: () => defaultConnectionProfilePath("curator"),
    apiUrl: process.env.CURATORORG_OPS_API_URL, // note: no default value
    configPath: process.env.CURATORORG_OPS_API_CONFIG_PATH
  },
  UsersOrg1: {
    orgMsp: "UsersOrg1",
    adminId: process.env.USERSORG1_CA_ADMIN_NAME ?? "admin",
    adminPass: process.env.USERSORG1_CA_ADMIN_PASSWORD ?? "adminpw",
    connectionProfilePath: process.env.USERSORG1_CONNECTION_PROFILE_PATH,
    defaultConnectionProfilePath: () => defaultConnectionProfilePath("users"),
    apiUrl: process.env.USERSORG1_OPS_API_URL, // note: no default value
    configPath: process.env.USERSORG1_OPS_API_CONFIG_PATH
  },
  PartnerOrg1: {
    orgMsp: "PartnerOrg1",
    adminId: process.env.PARTNERORG1_CA_ADMIN_NAME ?? "admin",
    adminPass: process.env.PARTNERORG1_CA_ADMIN_PASSWORD ?? "adminpw",
    connectionProfilePath: process.env.PARTNERORG1_CONNECTION_PROFILE_PATH,
    defaultConnectionProfilePath: () => defaultConnectionProfilePath("partner"),
    apiUrl: process.env.PARTNERORG1_OPS_API_URL,
    configPath: process.env.PARTNERORG1_OPS_API_CONFIG_PATH
  }
};

interface TestClientParams {
  orgMsp?: string;
  adminId?: string;
  adminPass?: string;
  connectionProfilePath?: string;
  apiUrl?: string;
  configPath?: string;
}

function buildHFParams(params: TestClientParams): HFClientConfig {
  if (params.orgMsp === undefined) {
    throw new Error("Missing orgMsp in params");
  }

  const noDefaults = defaultParams[params.orgMsp] === undefined;
  const missingParams =
    params.adminId === undefined ||
    params.adminPass === undefined ||
    params.connectionProfilePath === undefined;
  if (noDefaults && missingParams) {
    const msg =
      `Missing adminId, adminPass or connectionProfilePath in params, ` +
      `and no default values are available for this orgMsp: ${params.orgMsp}`;
    throw new Error(msg);
  }

  return {
    orgMsp: params.orgMsp,
    userId: params.adminId ?? defaultParams[params.orgMsp].adminId,
    userSecret: params.adminPass ?? defaultParams[params.orgMsp].adminPass,
    connectionProfilePath:
      params.connectionProfilePath ?? defaultParams[params.orgMsp].defaultConnectionProfilePath()
  };
}

function buildRestApiParams(params: TestClientParams & { apiUrl: string }): RestApiClientConfig {
  return {
    orgMsp: params.orgMsp ?? "CuratorOrg",
    apiUrl: params.apiUrl,
    userId: params.adminId,
    userSecret: params.adminPass,
    configPath: params.configPath ?? defaultOpsApiConfigPath()
  };
}

function getBuilder(params: TestClientParams): ChainClientBuilder {
  const isApiUrlDefined = (p: TestClientParams): p is TestClientParams & { apiUrl: string } =>
    p.apiUrl !== undefined;

  if (isApiUrlDefined(params)) {
    const restApiParams = buildRestApiParams(params);
    return gcclient.forApiConfig(restApiParams);
  } else {
    const hfParams = buildHFParams(params);
    return gcclient.forConnectionProfile(hfParams);
  }
}

function createForCurator(
  user: ChainUser,
  contract: ContractConfig
): ChainClient & CommonContractAPI & ChainUserAPI {
  const builder = getBuilder(defaultParams.CuratorOrg); // TODO override with user params??

  return builder
    .forContract(contract)
    .forUser(user.name)
    .extendAPI(commonContractAPI)
    .extendAPI(buildChainUserAPI(user));
}

function createForUser(
  user: ChainUser,
  contract: ContractConfig
): ChainClient & CommonContractAPI & ChainUserAPI {
  const builder = getBuilder(defaultParams.UsersOrg1);

  return builder
    .forContract(contract)
    .forUser(user.name)
    .extendAPI(commonContractAPI)
    .extendAPI(buildChainUserAPI(user));
}

function createForPartner(
  user: ChainUser,
  contract: ContractConfig
): ChainClient & CommonContractAPI & ChainUserAPI {
  const builder = getBuilder(defaultParams.PartnerOrg1);

  return builder
    .forContract(contract)
    .forUser(user.name)
    .extendAPI(commonContractAPI)
    .extendAPI(buildChainUserAPI(user));
}

export const ContractTestClient = {
  createForCurator: createForCurator,
  createForUser: createForUser,
  createForPartner: createForPartner,
  getBuilder: getBuilder
};

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
  buildChainUserAPI,
  commonContractAPI
} from "@gala-chain/api";
import { HFClientConfig, RestApiClientConfig, gcclient } from "@gala-chain/client";
import { jest } from "@jest/globals";
import * as path from "path";

import { MockedChaincodeClientBuilder } from "./MockedChaincodeClient";

/**
 * Test client factory for creating GalaChain contract test clients.
 *
 * Provides utilities for creating test clients connected to different organizations
 * (Curator, Users, Partner) with support for multiple connection types:
 * - Hyperledger Fabric direct connection
 * - REST API connection
 * - Mocked chaincode connection for unit testing
 *
 * @example
 * ```typescript
 * // Create curator client
 * const curatorClient = ContractTestClient.createForCurator(user, contractConfig);
 *
 * // Create user client
 * const userClient = ContractTestClient.createForUser(user, contractConfig);
 * ```
 */

// use this timeout in each test that uses ContractTestClient
jest.setTimeout(60 * 1000);

/**
 * Gets the network root path from environment variables.
 *
 * @returns Path to the GalaChain network root directory
 * @throws Error if GALA_NETWORK_ROOT_PATH environment variable is not set
 */
export function networkRoot() {
  if (process.env.GALA_NETWORK_ROOT_PATH === undefined) {
    throw new Error("Missing GALA_NETWORK_ROOT_PATH env variable");
  }
  return process.env.GALA_NETWORK_ROOT_PATH;
}

/**
 * Gets the default operations API configuration file path.
 *
 * @returns Path to the default api-config.json file
 * @internal
 */
function defaultOpsApiConfigPath() {
  // by default project root is a parent of network root
  return path.resolve(networkRoot(), "..", "api-config.json");
}

/**
 * Gets the default connection profile path for a given organization.
 *
 * @param orgKey - Organization key (curator, users, or partner)
 * @returns Path to the connection profile JSON file
 * @internal
 */
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
    configPath: process.env.CURATORORG_OPS_API_CONFIG_PATH,
    mockedChaincodeDir: process.env.CURATORORG_MOCKED_CHAINCODE_DIR
  },
  UsersOrg1: {
    orgMsp: "UsersOrg1",
    adminId: process.env.USERSORG1_CA_ADMIN_NAME ?? "admin",
    adminPass: process.env.USERSORG1_CA_ADMIN_PASSWORD ?? "adminpw",
    connectionProfilePath: process.env.USERSORG1_CONNECTION_PROFILE_PATH,
    defaultConnectionProfilePath: () => defaultConnectionProfilePath("users"),
    apiUrl: process.env.USERSORG1_OPS_API_URL, // note: no default value
    configPath: process.env.USERSORG1_OPS_API_CONFIG_PATH,
    mockedChaincodeDir: process.env.USERSORG1_MOCKED_CHAINCODE_DIR
  },
  PartnerOrg1: {
    orgMsp: "PartnerOrg1",
    adminId: process.env.PARTNERORG1_CA_ADMIN_NAME ?? "admin",
    adminPass: process.env.PARTNERORG1_CA_ADMIN_PASSWORD ?? "adminpw",
    connectionProfilePath: process.env.PARTNERORG1_CONNECTION_PROFILE_PATH,
    defaultConnectionProfilePath: () => defaultConnectionProfilePath("partner"),
    apiUrl: process.env.PARTNERORG1_OPS_API_URL,
    configPath: process.env.PARTNERORG1_OPS_API_CONFIG_PATH,
    mockedChaincodeDir: process.env.PARTNERORG1_MOCKED_CHAINCODE_DIR
  }
};

/**
 * Configuration parameters for test client creation.
 * All parameters are optional and will use defaults based on organization.
 */
interface TestClientParams {
  orgMsp?: string;
  adminId?: string;
  adminPass?: string;
  connectionProfilePath?: string;
  apiUrl?: string;
  configPath?: string;
  mockedChaincodeDir?: string;
}

/**
 * Test client parameters specifically for REST API connections.
 * Extends base parameters with required apiUrl.
 */
type TestClientParamsForApi = TestClientParams & { apiUrl: string };

/**
 * Type guard to check if parameters include API URL for REST API connection.
 *
 * @param p - Test client parameters to check
 * @returns True if apiUrl is defined
 * @internal
 */
function isApiUrlDefined(p: TestClientParams): p is TestClientParamsForApi {
  return p.apiUrl !== undefined;
}

/**
 * Test client parameters specifically for mocked chaincode connections.
 * Extends base parameters with required mockedChaincodeDir.
 */
type TestClientParamsForDir = TestClientParams & { mockedChaincodeDir: string };

/**
 * Type guard to check if parameters include chaincode directory for mocked connection.
 *
 * @param p - Test client parameters to check
 * @returns True if mockedChaincodeDir is defined
 * @internal
 */
function isChaincodeDirDefined(p: TestClientParams): p is TestClientParamsForDir {
  return p.mockedChaincodeDir !== undefined;
}

/**
 * Builds Hyperledger Fabric client configuration from test client parameters.
 *
 * @param params - Test client parameters
 * @returns HF client configuration
 * @throws Error if required parameters are missing and no defaults available
 * @internal
 */
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

/**
 * Builds REST API client configuration from test client parameters.
 *
 * @param params - Test client parameters with API URL
 * @returns REST API client configuration
 * @internal
 */
function buildRestApiParams(params: TestClientParamsForApi): RestApiClientConfig {
  return {
    orgMsp: params.orgMsp ?? "CuratorOrg",
    apiUrl: params.apiUrl,
    userId: params.adminId,
    userSecret: params.adminPass,
    configPath: params.configPath ?? defaultOpsApiConfigPath()
  };
}

/**
 * Gets the appropriate chain client builder based on provided parameters.
 *
 * Determines connection type based on available parameters:
 * - If mockedChaincodeDir is provided, returns MockedChaincodeClientBuilder
 * - If apiUrl is provided, returns REST API client builder
 * - Otherwise, returns Hyperledger Fabric client builder
 *
 * @param params - Test client parameters
 * @returns Appropriate chain client builder
 * @internal
 */
function getBuilder(params: TestClientParams): ChainClientBuilder {
  if (isChaincodeDirDefined(params)) {
    return new MockedChaincodeClientBuilder(params);
  } else if (isApiUrlDefined(params)) {
    const restApiParams = buildRestApiParams(params);
    return gcclient.forApiConfig(restApiParams);
  } else {
    const hfParams = buildHFParams(params);
    return gcclient.forConnectionProfile(hfParams);
  }
}

/**
 * Creates a test client for the Curator organization.
 *
 * @param user - Chain user to authenticate as
 * @param contract - Contract configuration to connect to
 * @returns Chain client with common contract and user APIs
 */
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

/**
 * Creates a test client for the Users organization.
 *
 * @param user - Chain user to authenticate as
 * @param contract - Contract configuration to connect to
 * @returns Chain client with common contract and user APIs
 */
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

/**
 * Creates a test client for the Partner organization.
 *
 * @param user - Chain user to authenticate as
 * @param contract - Contract configuration to connect to
 * @returns Chain client with common contract and user APIs
 */
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

/**
 * Factory object for creating contract test clients for different organizations.
 *
 * Provides methods to create test clients connected to Curator, Users, or Partner
 * organizations with appropriate defaults and configuration.
 *
 * @example
 * ```typescript
 * import { ContractTestClient } from "@gala-chain/test";
 *
 * // Create curator client for admin operations
 * const curatorClient = ContractTestClient.createForCurator(adminUser, contractConfig);
 *
 * // Create user client for regular user operations
 * const userClient = ContractTestClient.createForUser(testUser, contractConfig);
 *
 * // Get builder for custom configuration
 * const customBuilder = ContractTestClient.getBuilder(customParams);
 * ```
 */
export const ContractTestClient = {
  createForCurator: createForCurator,
  createForUser: createForUser,
  createForPartner: createForPartner,
  getBuilder: getBuilder
};

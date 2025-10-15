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
  ChainUser,
  ChainUserAPI,
  CommonContractAPI,
  ContractConfig,
  GalaChainResponseType,
  PublicKeyContractAPI,
  RegisterEthUserDto,
  RegisterUserDto,
  commonContractAPI,
  createValidSubmitDTO,
  publicKeyContractAPI
} from "@gala-chain/api";
import * as fs from "fs";
import * as path from "path";

import { networkRoot } from "./ContractTestClient";
import { createChainClient } from "./createChainClient";
import { randomize } from "./tokenOps";

/**
 * Configuration for a contract API that extends the base contract configuration
 * with an API factory function.
 *
 * @template API - The type of API methods that will be available on the client
 */
interface ContractAPIConfig<API = object> extends ContractConfig {
  /** Factory function that creates API methods for the given chain client */
  api: (c: ChainClient) => API;
}

/**
 * Configuration object mapping contract names to their API configurations.
 * Used to configure multiple contracts for a test client.
 */
interface ChainClientOptions {
  [key: string]: ContractAPIConfig;
}

/**
 * A chain client that combines basic ChainClient functionality with ChainUserAPI methods.
 * This provides both low-level blockchain interaction and user-specific operations.
 */
type TestChainClient = ChainClient & ChainUserAPI;

/**
 * Maps chain client options to their corresponding client types with API methods.
 * Each configured contract becomes a property on the result with the appropriate API methods.
 *
 * @template T - The chain client options configuration
 */
type ChainClientResult<T extends ChainClientOptions> = {
  [K in keyof T]: T[K] extends ContractAPIConfig<infer API>
    ? TestChainClient & API
    : T[K] extends string
      ? TestChainClient & CommonContractAPI
      : never;
};

/**
 * A collection of configured chain clients with a disconnect method.
 * Each configured contract is available as a property with its specific API methods.
 *
 * @template T - The chain client options configuration
 *
 * @example
 * ```typescript
 * const clients = await TestClients.create();
 * // Access default contracts
 * await clients.assets.CreateTokenClass(dto);
 * await clients.pk.RegisterUser(dto);
 * // Cleanup
 * await clients.disconnect();
 * ```
 */
export type ChainClients<T extends ChainClientOptions = DefaultChainClientOptions> = ChainClientResult<T> & {
  /** Disconnects all configured chain clients */
  disconnect: () => Promise<void>;
};

/**
 * Creates chain client objects from configuration, attaching API methods to each client.
 *
 * @template T - The chain client options configuration
 * @param user - The chain user to use for authentication
 * @param obj - Configuration object mapping contract names to their configurations
 * @returns Mapped chain clients with their respective API methods
 * @internal
 */
function createChainClientsObj<T extends ChainClientOptions>(user: ChainUser, obj: T): ChainClientResult<T> {
  const result: ChainClientResult<T> = {} as ChainClientResult<T>;

  for (const [key, contract] of Object.entries(obj)) {
    const client = createChainClient(user, contract).extendAPI(contract.api);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    result[key] = client;
  }

  return result;
}

/**
 * Chain client options that includes a required public key contract configuration.
 * This ensures that public key management functionality is available.
 */
export interface ChainClientOptionsWithPK extends ChainClientOptions {
  /** Public key contract configuration for user registration and key management */
  pk: ContractAPIConfig<PublicKeyContractAPI>;
}

/**
 * Default chain client configuration that includes the standard GalaChain contracts.
 * Provides access to asset management and public key functionality.
 */
export interface DefaultChainClientOptions extends ChainClientOptions {
  /** Assets contract configuration for token operations */
  assets: ContractAPIConfig<CommonContractAPI>;
  /** Public key contract configuration for user management */
  pk: ContractAPIConfig<PublicKeyContractAPI>;
}

/**
 * Creates the default chain client configuration with standard GalaChain contracts.
 * Includes assets contract for token operations and public key contract for user management.
 *
 * @returns Default configuration object with assets and pk contracts
 * @internal
 */
function defaultChainClientsOptions(): DefaultChainClientOptions {
  return {
    assets: {
      channel: "product-channel",
      chaincode: "basic-product",
      contract: "GalaChainToken",
      api: commonContractAPI
    },
    pk: {
      channel: "product-channel",
      chaincode: "basic-product",
      contract: "PublicKeyContract",
      api: publicKeyContractAPI
    }
  };
}

/**
 * Creates chain clients for testing GalaChain contracts.
 *
 * This function has multiple overloads to support different configuration scenarios:
 * - `create()` - Creates clients with default user and configuration
 * - `create(user)` - Creates clients with specific user and default configuration
 * - `create(opts)` - Creates clients with default user and custom configuration
 * - `create(user, opts)` - Creates clients with specific user and custom configuration
 *
 * @template T - The chain client options configuration
 * @param user - Chain user, user name string, or configuration object
 * @param opts - Optional contract configuration
 * @returns Promise resolving to configured chain clients
 *
 * @example
 * ```typescript
 * // Default configuration with random curator user
 * const clients1 = await create();
 *
 * // Specific user with default configuration
 * const clients2 = await create(ChainUser.withRandomKeys(\"alice\"));
 *
 * // Custom configuration with default user
 * const clients3 = await create({
 *   myContract: { channel: \"ch1\", chaincode: \"cc1\", contract: \"MyContract\", api: myAPI }
 * });
 *
 * // Specific user with custom configuration
 * const clients4 = await create(\"bob\", customConfig);
 * ```
 */
async function create(
  user?: ChainUser | string | undefined
): Promise<ChainClients<DefaultChainClientOptions>>;

async function create<T extends ChainClientOptions>(
  user?: ChainUser | string | undefined,
  opts?: T
): Promise<ChainClients<T>>;

async function create<T extends ChainClientOptions>(opts: T): Promise<ChainClients<T>>;

async function create<T extends ChainClientOptions>(
  user?: ChainUser | string | undefined | T,
  opts?: T
): Promise<ChainClients<T>> {
  if (user === undefined) {
    return create(randomize("curator-"), opts);
  }

  if (typeof user === "string") {
    return create(ChainUser.withRandomKeys(user), opts);
  }

  if (!isUserConfig(user)) {
    return create(ChainUser.withRandomKeys(), user);
  }

  if (opts === undefined) {
    return create(user, defaultChainClientsOptions() as unknown as T);
  }

  const clients: ChainClientResult<ChainClientOptions> = createChainClientsObj(user, opts);

  const disconnect = async () => {
    await Promise.all(Object.values<ChainClient>(clients).map((c) => c.disconnect()));
  };

  return { ...clients, disconnect } as unknown as ChainClients<T>;
}

/**
 * Admin chain clients that provide elevated privileges for test setup.
 * Includes all standard client functionality plus the ability to create and register new users.
 *
 * @template T - The chain client options configuration
 *
 * @example
 * ```typescript
 * const adminClients = await TestClients.createForAdmin();
 * const user1 = await adminClients.createRegisteredUser();
 * const user2 = await adminClients.createRegisteredUser("alice");
 * ```
 */
export type AdminChainClients<T extends ChainClientOptions = DefaultChainClientOptions> = ChainClients<
  T & ChainClientOptionsWithPK
> & {
  /**
   * Creates and registers a new user on the blockchain.
   *
   * @param userAlias - Optional alias for the user. If not provided, generates a random user with ETH address
   * @returns Promise resolving to the created and registered ChainUser
   */
  createRegisteredUser(userAlias?: string): Promise<ChainUser>;
};

/**
 * Creates admin chain clients with elevated privileges for test setup.
 * Admin clients can create and register new users, and have access to all configured contracts.
 *
 * @template T - The chain client options configuration
 * @param opts - Optional configuration for contracts. If not provided, uses default configuration
 * @returns Promise resolving to admin chain clients with user creation capabilities
 *
 * @example
 * ```typescript
 * // Create with default configuration
 * const adminClients = await createForAdmin();
 *
 * // Create with custom configuration
 * const customAdminClients = await createForAdmin({
 *   myContract: {
 *     channel: "my-channel",
 *     chaincode: "my-chaincode",
 *     contract: "MyContract",
 *     api: myContractAPI
 *   }
 * });
 * ```
 */
async function createForAdmin<T extends ChainClientOptions>(opts?: T): Promise<AdminChainClients<T>> {
  if (opts === undefined) {
    return createForAdmin(defaultChainClientsOptions() as unknown as T);
  }

  if (opts.pk === undefined) {
    return createForAdmin({ ...opts, pk: defaultChainClientsOptions().pk });
  }

  const admin = getAdminUser();
  const clients = (await create(admin, opts)) as unknown as ChainClients<T & ChainClientOptionsWithPK>;
  const pk = (clients as ChainClients<ChainClientOptionsWithPK>).pk;

  return {
    ...clients,
    createRegisteredUser: async (userAlias?: string) => createRegisteredUser(pk, userAlias)
  };
}

/**
 * Type guard to check if a value is a valid ChainUser configuration.
 *
 * @param user - Value to check
 * @returns True if the value is a ChainUser, false otherwise
 * @internal
 */
function isUserConfig(user: ChainUser | unknown): user is ChainUser {
  return (
    typeof user === "object" &&
    !!user &&
    "prefix" in user &&
    "name" in user &&
    "identityKey" in user &&
    "ethAddress" in user &&
    "privateKey" in user &&
    "publicKey" in user
  );
}

/**
 * Attempts to read admin private key from a file path.
 *
 * @param keyPath - Path to the private key file
 * @returns Private key string if file exists and is readable, undefined otherwise
 * @internal
 */
function getAdminKeyFromPath(keyPath: string) {
  try {
    return fs.readFileSync(keyPath, "utf-8").toString();
  } catch (e) {
    return undefined;
  }
}

/**
 * Gets the admin user configuration for privileged operations.
 * Reads private key from environment variable or default file path.
 *
 * @returns ChainUser configured with admin privileges
 * @throws Error if admin private key cannot be found
 * @internal
 */
function getAdminUser() {
  const defaultKeyPath = path.resolve(networkRoot(), "dev-admin-key/dev-admin.priv.hex.txt");
  const privateKey = process.env.DEV_ADMIN_PRIVATE_KEY ?? getAdminKeyFromPath(defaultKeyPath);

  if (privateKey === undefined) {
    throw new Error(
      `Admin private key not found in ${defaultKeyPath} or environment variable DEV_ADMIN_PRIVATE_KEY`
    );
  }

  return new ChainUser({ name: "admin", privateKey });
}

/**
 * Creates and registers a new user on the blockchain.
 *
 * @param client - Chain client with public key contract API for user registration
 * @param userAlias - Optional alias for the user. If provided, registers with identity; if not, registers as ETH user
 * @returns Promise resolving to the created and registered ChainUser
 * @throws Error if user registration fails
 * @internal
 */
async function createRegisteredUser(
  client: TestChainClient & PublicKeyContractAPI,
  userAlias?: string
): Promise<ChainUser> {
  const user = ChainUser.withRandomKeys(userAlias);

  if (userAlias === undefined) {
    const dto = await createValidSubmitDTO(RegisterEthUserDto, { publicKey: user.publicKey });
    const signedDto = await dto.signed(client.privateKey);
    const response = await client.RegisterEthUser(signedDto);
    if (response.Status !== GalaChainResponseType.Success) {
      throw new Error(`Failed to register eth user: ${response.Message}`);
    }
  } else {
    const dto = await createValidSubmitDTO(RegisterUserDto, {
      user: user.identityKey,
      publicKey: user.publicKey
    });
    const signedDto = await dto.signed(client.privateKey);
    const response = await client.RegisterUser(signedDto);
    if (response.Status !== GalaChainResponseType.Success) {
      throw new Error(`Failed to register user: ${response.Message}`);
    }
  }

  return user;
}

/**
 * Factory object for creating different types of test clients.
 * Provides methods to create regular chain clients and admin clients with user management capabilities.
 *
 * @example
 * ```typescript
 * // Create regular clients
 * const clients = await TestClients.create();
 *
 * // Create admin clients for test setup
 * const adminClients = await TestClients.createForAdmin();
 * const testUser = await adminClients.createRegisteredUser();
 *
 * // Cleanup
 * await clients.disconnect();
 * await adminClients.disconnect();
 * ```
 */
export const TestClients = {
  /**
   * Creates chain clients for interacting with GalaChain contracts.
   * Supports multiple overloads for different configuration scenarios.
   */
  create,
  /**
   * Creates admin chain clients with user management capabilities.
   * Used for test setup and scenarios requiring user creation.
   */
  createForAdmin
};

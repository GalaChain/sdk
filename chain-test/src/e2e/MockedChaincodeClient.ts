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
  ChainCallDTO,
  ChainClient,
  ChainClientBuilder,
  ClassConstructor,
  ClassType,
  ContractConfig,
  GalaChainResponse,
  Inferred,
  serialize
} from "@gala-chain/api";
import { Contract } from "fabric-contract-api";
import path from "path";

import { TestChaincode } from "../unit";

/**
 * Mocked chaincode client implementation for testing.
 *
 * Provides a complete testing environment that simulates chaincode execution
 * without requiring a full Hyperledger Fabric network. Useful for unit and
 * integration testing of chaincode logic.
 *
 * @example
 * ```typescript
 * const builder = new MockedChaincodeClientBuilder({
 *   mockedChaincodeDir: "/path/to/chaincode"
 * });
 * const client = builder.forContract(contractConfig);
 * const response = await client.submitTransaction("MyMethod", dto);
 * ```
 */

/**
 * Configuration parameters for creating a mocked chaincode client.
 */
export interface MockedChaincodeClientParams {
  mockedChaincodeDir: string;
  orgMsp?: string;
  adminId?: string;
}

/**
 * Interface for a dynamically imported chaincode library.
 * @internal
 */
interface ImportedChaincodeLib {
  contracts: (ClassConstructor<Contract> & { name: string })[];
}

/**
 * Processed chaincode library with contracts indexed by name.
 * @internal
 */
interface ChaincodeLib {
  contracts: (ClassConstructor<Contract> & { name: string })[];
  contractsByName: Record<string, ClassConstructor<Contract>>;
}

/**
 * Global state storage for mocked chaincode instances.
 * Organized by channel -> chaincode -> key-value pairs.
 * @internal
 */
const globalState = {} as Record<string, Record<string, Record<string, string>>>;

/**
 * Gets or creates blockchain state for a specific channel and chaincode.
 *
 * @param channel - Channel name
 * @param chaincode - Chaincode name
 * @returns State object for the channel/chaincode combination
 * @internal
 */
function getOrCreateState(channel: string, chaincode: string) {
  if (!globalState[channel]) {
    globalState[channel] = {};
  }
  if (!globalState[channel][chaincode]) {
    globalState[channel][chaincode] = {};
  }
  return globalState[channel][chaincode];
}

/**
 * Builder for creating mocked chaincode clients.
 *
 * Dynamically loads chaincode contracts from a specified directory and
 * creates test clients that execute chaincode methods in-memory.
 */
export class MockedChaincodeClientBuilder implements ChainClientBuilder {
  private readonly mockedChaincodeDir: string;
  private readonly mockedChaincodeIndexJs: string;
  private readonly mockedChaincodeLib: Promise<ChaincodeLib>;
  private readonly orgMsp: string;
  private readonly adminId: string;

  /**
   * Creates a new mocked chaincode client builder.
   *
   * @param params - Configuration parameters including chaincode directory
   */
  constructor(params: MockedChaincodeClientParams) {
    this.mockedChaincodeDir = params.mockedChaincodeDir;
    this.mockedChaincodeIndexJs = chaincodeIndexJsPath(this.mockedChaincodeDir);
    this.orgMsp = params.orgMsp ?? "MockedOrg";
    this.adminId = params.adminId ?? "client|mocked-user";

    this.mockedChaincodeLib = Promise.resolve()
      .then(async () => (await import(this.mockedChaincodeIndexJs)) as ImportedChaincodeLib) // TODO verify or throw
      .then((lib) => {
        const contractsByName = {} as Record<string, ClassConstructor<Contract>>;
        lib.contracts.forEach((contract) => {
          contractsByName[new contract().getName()] = contract;
        });
        return { ...lib, contractsByName };
      });
  }

  /**
   * Creates a mocked chaincode client for a specific contract.
   *
   * @param config - Contract configuration
   * @returns Mocked chaincode client instance
   * @throws Error if the specified contract is not found in the chaincode
   */
  public forContract(config: ContractConfig): MockedChaincodeClient {
    const chaincode = this.mockedChaincodeLib.then((lib) => {
      const contract = lib.contractsByName[config.contract];
      if (!contract) {
        throw new Error(`Contract ${config.contract} not found in ${this.mockedChaincodeDir}`);
      }
      const state = getOrCreateState(config.channel, config.chaincode);
      return new TestChaincode([contract], state, {}, this.adminId, this.orgMsp);
    });
    return new MockedChaincodeClient(this, chaincode, config, this.orgMsp, this.adminId);
  }
}

/**
 * Gets the path to the chaincode's main JavaScript file.
 *
 * @param chaincodeDir - Directory containing the chaincode
 * @returns Path to the main chaincode JavaScript file
 * @internal
 */
function chaincodeIndexJsPath(chaincodeDir: string) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const chaincodePackageJson = require(path.resolve(chaincodeDir, "package.json")) as { main: string };
  const chaincodeIndexJsPath = path.resolve(chaincodeDir, chaincodePackageJson.main);
  return chaincodeIndexJsPath;
}

/**
 * Mocked implementation of ChainClient for testing chaincode methods.
 *
 * Executes chaincode methods in-memory using TestChaincode instead of
 * submitting transactions to a real Hyperledger Fabric network.
 */
export class MockedChaincodeClient extends ChainClient {
  private readonly chaincode: Promise<TestChaincode>;
  private transactionDelayMs: number;
  private readonly customBuilder: MockedChaincodeClientBuilder;

  /**
   * Creates a new mocked chaincode client.
   *
   * @param builder - The builder that created this client
   * @param chaincode - Promise resolving to the test chaincode instance
   * @param contractConfig - Contract configuration
   * @param orgMsp - Organization MSP ID
   * @param userId - User ID for authentication
   */
  constructor(
    builder: MockedChaincodeClientBuilder,
    chaincode: Promise<TestChaincode>,
    contractConfig: ContractConfig,
    orgMsp: string,
    userId: string
  ) {
    super(Promise.resolve(builder), userId, contractConfig, orgMsp);
    this.transactionDelayMs = 0;
    this.chaincode = chaincode;
    this.customBuilder = builder;
  }

  /**
   * Applies optional transaction delay for testing timing scenarios.
   * @internal
   */
  private async optionalDelay() {
    if (this.transactionDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.transactionDelayMs));
    }
  }

  /**
   * Submits a transaction to the mocked chaincode (with write access).
   *
   * @template T - Expected response type
   * @param method - Contract method name to invoke
   * @param dtoOrResp - DTO to pass as argument, or response class if no DTO
   * @param resp - Response class when DTO is provided
   * @returns Promise resolving to the method response
   */
  async submitTransaction<T>(
    method: string,
    dtoOrResp?: ChainCallDTO | ClassType<Inferred<T>>,
    resp?: ClassType<Inferred<T>>
  ): Promise<GalaChainResponse<T>> {
    await this.optionalDelay();
    const chaincode = await this.chaincode;
    const { fullMethod, args, responseClass } = this.getParameters(method, dtoOrResp, resp);
    const response = await chaincode.invoke<Record<string, unknown>>(fullMethod, ...args);
    return GalaChainResponse.deserialize(responseClass, response);
  }

  /**
   * Evaluates a transaction on the mocked chaincode (read-only access).
   *
   * @template T - Expected response type
   * @param method - Contract method name to query
   * @param dtoOrResp - DTO to pass as argument, or response class if no DTO
   * @param resp - Response class when DTO is provided
   * @returns Promise resolving to the method response
   */
  async evaluateTransaction<T>(
    method: string,
    dtoOrResp?: ChainCallDTO | ClassType<Inferred<T>>,
    resp?: ClassType<Inferred<T>>
  ): Promise<GalaChainResponse<T>> {
    await this.optionalDelay();
    const chaincode = await this.chaincode;
    const { fullMethod, args, responseClass } = this.getParameters(method, dtoOrResp, resp);
    const response = await chaincode.query<Record<string, unknown>>(fullMethod, ...args);
    return GalaChainResponse.deserialize(responseClass, response);
  }

  /**
   * Processes method parameters for chaincode invocation.
   *
   * @template T - Expected response type
   * @param method - Contract method name
   * @param dtoOrResp - DTO or response class
   * @param resp - Response class
   * @returns Processed parameters for chaincode invocation
   * @internal
   */
  private getParameters<T>(
    method: string,
    dtoOrResp?: ChainCallDTO | Record<string, unknown> | ClassType<Inferred<T>>,
    resp?: ClassType<Inferred<T>>
  ): {
    fullMethod: string;
    args: string[];
    responseClass: ClassType<Inferred<T>>;
  } {
    const fullMethod = `${this.contractConfig.contract}:${method}`;
    const [dto, responseType] = isClassType(dtoOrResp) ? [undefined, dtoOrResp] : [dtoOrResp, resp];
    const args = dto === undefined ? [] : [serialize(dto)];
    const responseClass = responseType ?? (Object as unknown as ClassType<Inferred<T>>);
    return { fullMethod, args, responseClass };
  }

  /**
   * Creates a new client instance for a different user.
   *
   * @param userId - New user ID to authenticate as
   * @param secret - User secret (unused in mocked implementation)
   * @returns New client instance for the specified user
   */
  forUser(userId: string, secret?: string | undefined): ChainClient {
    // secret is ignored in mocked client
    return new MockedChaincodeClient(
      this.customBuilder,
      this.chaincode.then((c) => c.setCallingUser(`client|${userId}`)),
      this.contractConfig,
      this.orgMsp,
      userId
    );
  }

  /**
   * Disconnects the client (no-op for mocked implementation).
   */
  async disconnect(): Promise<void> {
    // do nothing
  }

  /**
   * Sets a delay for transactions to simulate network latency.
   *
   * @param transactionDelayMs - Delay in milliseconds
   * @returns This client instance for method chaining
   */
  withTransactionDelay(transactionDelayMs: number) {
    this.transactionDelayMs = transactionDelayMs;
    return this;
  }
}

/**
 * Type guard to check if an object is a class constructor.
 *
 * @param obj - Object to check
 * @returns True if object is a class constructor function
 * @internal
 */
function isClassType(obj: unknown): obj is ClassType<unknown> {
  return typeof obj === "function";
}

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
import { ClassConstructor, NotImplementedError } from "@gala-chain/api";
import { Context, Contract } from "fabric-contract-api";

import GalaJSONSerializer from "./GalaJSONSerializer";
import { ChaincodeStubClassType, TestChaincodeStub } from "./TestChaincodeStub";

/**
 * Interface for Hyperledger Fabric's ChaincodeFromContract class.
 * This is used internally to create chaincode instances from contract classes.
 * @internal
 */
interface ChaincodeFromContractClassType {
  // eslint-disable-next-line  @typescript-eslint/no-misused-new
  new (
    contractClasses: Array<{ new (): Contract }>,
    serializers,
    metadata,
    title,
    version
  ): ChaincodeFromContractClassType;

  Invoke(
    stub: ChaincodeStubClassType
  ): Promise<{ status: 200; payload: Buffer } | { status: 500; message: Error }>;
}

const ChaincodeFromContract =
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("fabric-shim/lib/contract-spi/chaincodefromcontract") as ChaincodeFromContractClassType;

const serializers = {
  transaction: "galaJsonSerializer",
  serializers: {
    galaJsonSerializer: GalaJSONSerializer
  }
};

/**
 * Standard response type for chaincode invocations.
 * Can be either a single object or an array of objects.
 */
type InvokeResponse = Record<string, unknown> | Array<Record<string, unknown>>;

/**
 * Test harness for Hyperledger Fabric chaincode contracts.
 *
 * Provides a testing environment that simulates blockchain interactions without requiring
 * a full Fabric network. Supports transaction invocation, state management, and user identity simulation.
 *
 * @example
 * ```typescript
 * // Create test chaincode with contract classes
 * const testChaincode = new TestChaincode([MyContract, TokenContract]);
 *
 * // Set calling user context
 * testChaincode.setCallingUser("client|alice");
 *
 * // Invoke contract methods
 * const result = await testChaincode.invoke("CreateTokenClass", tokenClassDto);
 *
 * // Query contract methods (read-only)
 * const balance = await testChaincode.query("FetchBalance", balanceDto);
 *
 * // Access contract instances for direct testing
 * const contractInstance = testChaincode.getContractInstance(MyContract);
 * ```
 */
export class TestChaincode {
  private readonly chaincode: ChaincodeFromContractClassType;

  /**
   * Creates a new test chaincode instance.
   *
   * @param contracts - Array of contract classes to include in the chaincode
   * @param state - Initial blockchain state as a key-value map
   * @param writes - Storage for tracking state writes during tests
   * @param callingUser - Default calling user in format "prefix|userId" (e.g., "client|alice")
   * @param callingUserMsp - MSP (Membership Service Provider) ID for the calling user
   * @param callHistory - Array to track method invocation history for testing
   */
  public constructor(
    contracts: ClassConstructor<Contract>[],
    private readonly state: Record<string, string> = {},
    private readonly writes: Record<string, string>[] = [],
    public callingUser = "client|admin",
    public callingUserMsp = "CuratorOrg",
    public readonly callHistory: unknown[] = []
  ) {
    const getCurrentCallingUser = () => {
      const [prefix, userId] = this.callingUser.split("|");
      if (userId === undefined) {
        throw new Error(`invalid calling user ${this.callingUser}, expected format: client|userId`);
      } else {
        return { userId, prefix };
      }
    };

    const contractsWrapped = contracts.map((c) => {
      const wrapped = class extends c {
        beforeTransaction(ctx: Context): Promise<void> {
          const { userId, prefix } = getCurrentCallingUser();

          callHistory.push({ ...ctx.stub.getFunctionAndParameters(), callingUser: `${prefix}|${userId}` });

          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          ctx.clientIdentity.id = `x509::/OU=${prefix}/CN=${userId}:`;

          return super.beforeTransaction(ctx);
        }
      };

      // ensure we have the same name as the original class
      Object.defineProperty(wrapped, "name", { value: c.name });

      return wrapped as unknown as ClassConstructor<Contract>;
    });

    this.chaincode = new ChaincodeFromContract(contractsWrapped, serializers, {}, "gala-chain-test", "0.0.1");
  }

  /**
   * Sets the calling user for subsequent chaincode invocations.
   *
   * @param user - User identifier in format "prefix|userId" (e.g., "client|alice", "curator|admin")
   * @returns This TestChaincode instance for method chaining
   */
  public setCallingUser(user: string): TestChaincode {
    this.callingUser = user;
    return this;
  }

  /**
   * Sets the MSP (Membership Service Provider) for the calling user.
   *
   * @param msp - MSP ID (e.g., "CuratorOrg", "UserOrg")
   * @returns This TestChaincode instance for method chaining
   */
  public setCallingUserMsp(msp: string): TestChaincode {
    this.callingUserMsp = msp;
    return this;
  }

  /**
   * Invokes a chaincode method with write capabilities (submit transaction).
   * Changes made during invocation are persisted to the state.
   *
   * @template T - Expected return type of the invocation
   * @param method - Name of the contract method to invoke
   * @param args - Arguments to pass to the method (strings or serializable objects)
   * @returns Promise resolving to the method's return value
   * @throws Error if the invocation fails
   */
  public async invoke<T = InvokeResponse>(
    method: string,
    ...args: (string | { serialize: () => string })[]
  ): Promise<T> {
    const argsSerialized = args.map((arg) => (typeof arg === "string" ? arg : arg.serialize()));
    const newWrites = {};
    const stub = new TestChaincodeStub([method, ...argsSerialized], this.state, newWrites);
    stub.mockCreator(this.callingUserMsp, this.callingUser);
    const rawResponse = await this.chaincode.Invoke(stub);

    if (rawResponse.status === 200) {
      const stringResponse = rawResponse.payload.toString();
      this.writes.push(newWrites);
      return JSON.parse(stringResponse) as T;
    } else {
      throw rawResponse.message;
    }
  }

  /**
   * Queries a chaincode method with read-only access (evaluate transaction).
   * Changes made during query are not persisted to the state.
   *
   * @template T - Expected return type of the query
   * @param method - Name of the contract method to query
   * @param args - Arguments to pass to the method (strings or serializable objects)
   * @returns Promise resolving to the method's return value
   * @throws Error if the query fails
   */
  public async query<T = InvokeResponse>(
    method: string,
    ...args: (string | { serialize: () => string })[]
  ): Promise<T> {
    const argsSerialized = args.map((arg) => (typeof arg === "string" ? arg : arg.serialize()));
    const copyOfState = { ...this.state }; // to prevent writes
    const stub = new TestChaincodeStub([method, ...argsSerialized], copyOfState, {});
    stub.mockCreator(this.callingUserMsp, this.callingUser);
    const rawResponse = await this.chaincode.Invoke(stub);

    if (rawResponse.status === 200) {
      const stringResponse = rawResponse.payload.toString();

      return JSON.parse(stringResponse) as T;
    } else {
      throw rawResponse.message;
    }
  }

  /**
   * Gets a direct reference to a contract instance for low-level testing.
   * Useful for accessing contract internals or calling methods directly.
   *
   * @template T - Type of the contract class
   * @param contractClass - Constructor function of the contract class
   * @returns The contract instance
   * @throws NotImplementedError if the contract class is not found in the chaincode
   */
  public getContractInstance<T extends Contract>(
    // eslint-disable-next-line @typescript-eslint/ban-types
    contractClass: { new (...args: unknown[]): T } & Function
  ): T {
    // The code below accesses internals of chaincode implementation
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    const data = this.chaincode.contractImplementations[contractClass.name] as
      | { name: string; contractInstance: T }
      | undefined;

    if (data === undefined) {
      throw new NotImplementedError(`Cannot get contract instance for ${contractClass.name}`);
    } else {
      return data.contractInstance;
    }
  }

  public getState(skipKeysStartingWith: string[] = ["\u0000UNTX\u0000"]): Record<string, string> {
    return Object.entries(this.state).reduce((acc, [key, value]) => {
      if (!skipKeysStartingWith?.some((prefix) => key.startsWith(prefix))) {
        acc[key] = value;
      }
      return acc;
    }, {});
  }

  public getWrites(skipKeysStartingWith: string[] = ["\u0000UNTX\u0000"]): Record<string, string> {
    return Object.entries(this.writes).reduce((acc, [key, value]) => {
      if (!skipKeysStartingWith?.some((prefix) => key.startsWith(prefix))) {
        acc[key] = value;
      }
      return acc;
    }, {});
  }
}

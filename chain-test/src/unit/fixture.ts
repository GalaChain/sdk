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
  ChainObject,
  ClassConstructor,
  GalaChainResponse,
  RangedChainObject,
  SigningScheme,
  UserAlias,
  UserProfile,
  signatures
} from "@gala-chain/api";
import { Context, Contract } from "fabric-contract-api";
import { ChaincodeResponse, ChaincodeStub } from "fabric-shim";
import Logger from "fabric-shim/lib/logger";

import { ChainUserWithRoles } from "../data/users";
import { CachedKV, FabricIterable } from "./FabricIterable";
import { TestChaincodeStub, x509Identity } from "./TestChaincodeStub";

/**
 * Interface for GalaChain logger instance with various logging methods.
 * Provides structured logging capabilities for chaincode testing.
 * @internal
 */
interface GalaLoggerInstance {
  getLogger(name?: string): Logger;

  error(message: string): void;

  warn(message: string): void;

  info(message: string): void;

  debug(message: string): void;

  log(
    level: "debug" | "info" | "warn" | "error",
    msg:
      | string
      | (Record<string, unknown> & {
          message: string;
        })
  ): void;

  logTimeline(timelineActionDescription: string, context: string, metaData?: unknown[], error?: Error): void;
}

/**
 * Extended chaincode stub with GalaChain-specific caching and write tracking capabilities.
 * Provides additional methods for state management and transaction monitoring.
 * @internal
 */
type GalaChainStub = ChaincodeStub & {
  getTxID(): string;
  getCachedState(key: string): Promise<Uint8Array>;
  getCachedStateByPartialCompositeKey(objectType: string, attributes: string[]): FabricIterable<CachedKV>;
  flushWrites(): Promise<void>;
  getReads(): Record<string, Uint8Array>;
  getWrites(): Record<string, Uint8Array>;
  getWritesCount(): number;
  getDeletes(): Record<string, true>;
  setReads(reads: Record<string, Uint8Array>): void;
  setWrites(writes: Record<string, Uint8Array>): void;
  setDeletes(deletes: Record<string, true>): void;
  invokeChaincode(chaincodeName: string, args: string[], channel: string): Promise<ChaincodeResponse>;
  get externalChaincodeWasInvoked(): boolean;
};

/**
 * Data structure representing the currently authenticated user in a transaction context.
 * Contains user identity, addresses, and role information.
 * @internal
 */
interface CallingUserData {
  alias?: UserAlias;
  ethAddress?: string;
  tonAddress?: string;
  roles: string[];
  signedBy: UserAlias[];
  signatureQuorum: number;
  allowedSigners: UserAlias[];
  isMultisig: boolean;
}

interface CallingUserDataDryRun {
  alias: UserAlias;
  ethAddress?: string;
  tonAddress?: string;
  roles: string[];
}

/**
 * Configuration options for GalaChain context during testing.
 * Controls authentication and user registration requirements.
 * @internal
 */
interface GalaChainContextConfig {
  readonly adminPublicKey?: string;
}

interface TestOperationContext {
  channelId: string;
  chaincodeId: string;
  methodName: string;
  fullOperationId: string;
}

/**
 * Extended Hyperledger Fabric context with GalaChain-specific testing capabilities.
 * Provides user management, logging, and state tracking for contract testing.
 * @internal
 */
type TestGalaChainContext = Context & {
  readonly stub: GalaChainStub;
  readonly logger: GalaLoggerInstance;
  set callingUserData(d: CallingUserData);
  get callingUser(): UserAlias;
  get callingUserAddress(): { address: string; signing: SigningScheme };
  get callingUserRoles(): string[];
  get callingUserSignedBy(): UserAlias[];
  get callingUserSignatureQuorum(): number;
  get callingUserAllowedSigners(): UserAlias[];
  get isMultisig(): boolean;
  get callingUserProfile(): UserProfile;
  resetCallingUser(): void;
  get config(): GalaChainContextConfig;
  setDryRunOnBehalfOf(d: CallingUserDataDryRun): void;
  createReadOnlyContext(index: number | undefined): TestGalaChainContext;
  isDryRun: boolean;
  get txUnixTime(): number;
  get operationCtx(): TestOperationContext;
  setChaincodeStub(stub: ChaincodeStub): void;
};

/**
 * GalaChain contract interface with lifecycle methods and context creation.
 * @internal
 */
type GalaContract<Ctx extends TestGalaChainContext> = Contract & {
  beforeTransaction(ctx: Ctx): Promise<void>;
  createContext(): Ctx;
};

const defaultCaClientIdentity = x509Identity("test", "TestOrg");

/**
 * Type that wraps contract methods to ensure they return GalaChainResponse.
 * Transforms contract method signatures for consistent response handling.
 * @internal
 */
type Wrapped<Contract> = {
  [K in keyof Contract]: Contract[K] extends (...args: infer A) => Promise<GalaChainResponse<infer R>>
    ? Contract[K] // If it already returns Promise<GalaChainResponse<R>>, keep it as is.
    : Contract[K] extends (...args: infer A) => Promise<infer R>
      ? (...args: A) => Promise<GalaChainResponse<R>> // Otherwise, transform Promise<R> to Promise<GalaChainResponse<R>>.
      : Contract[K]; // Keep non-Promise methods as is.
};

/**
 * Test fixture for GalaChain contracts providing a complete testing environment.
 *
 * Manages contract instances, blockchain state, user identities, and transaction context
 * for comprehensive unit testing of chaincode contracts without requiring a full Fabric network.
 *
 * @template Ctx - The GalaChain context type
 * @template T - The contract type being tested
 *
 * @example
 * ```typescript
 * // Create fixture for MyContract
 * const testFixture = fixture(MyContract)
 *   .callingUser(testUser)
 *   .savedState(existingTokenClass, existingBalance)
 *   .registeredUsers(user1, user2);
 *
 * // Test contract method
 * const response = await testFixture.contract.CreateTokenClass(testFixture.ctx, createDto);
 *
 * // Check state changes
 * const writes = testFixture.getWrites();
 * expect(writes).toHaveProperty(newTokenClass.getCompositeKey());
 * ```
 */
class Fixture<Ctx extends TestGalaChainContext, T extends GalaContract<Ctx>> {
  public readonly state: Record<string, string> = {};
  public readonly contract: Wrapped<T>;
  public readonly ctx: Ctx;
  private readonly stub: TestChaincodeStub;
  private readonly allWrites: Record<string, string> = {};

  /**
   * Creates a new test fixture for the specified contract class.
   *
   * @param contractClass - Constructor of the contract class to test
   */
  constructor(contractClass: ClassConstructor<T>) {
    const contractInstance = new contractClass() as Wrapped<T>; // it's done by @GalaTransaction decorator
    this.contract = new Proxy(contractInstance, {
      get: (target, prop) => {
        // check if target property is a function with ctx + dto as parameters
        if (typeof target[prop as string] === "function" && target[prop as string].length === 2) {
          const method = target[prop as string];
          return async (ctx: Ctx, dto?: ChainCallDTO) => {
            await contractInstance.beforeTransaction(ctx);
            const result = dto
              ? await method.call(contractInstance, ctx, dto)
              : await method.call(contractInstance, ctx);
            await contractInstance.afterTransaction(ctx, result);
            ctx.resetCallingUser();
            return result;
          };
        }

        return target[prop];
      }
    });

    this.stub = new TestChaincodeStub([], this.state, this.allWrites);

    const ctxInstance = this.contract.createContext() as Ctx;
    ctxInstance.setChaincodeStub(this.stub);
    ctxInstance.logging = {
      setLevel: Logger.setLevel,
      getLogger: (name) => {
        return Logger.getLogger(name ? `${contractClass?.name}:${name}` : contractClass?.name);
      }
    };
    ctxInstance.clientIdentity = defaultCaClientIdentity;
    this.ctx = ctxInstance;
  }

  /**
   * Registers users in the blockchain state for testing.
   * Adds both public key mappings and user profiles to the mock state.
   *
   * @param users - Array of users to register with their roles
   * @returns This fixture instance for method chaining
   */
  registeredUsers(...users: ChainUserWithRoles[]): Fixture<Ctx, T> {
    const publicKeys = users.map((u) => ({
      key: `\u0000GCPK\u0000${u.identityKey}\u0000`,
      value: JSON.stringify({ publicKey: signatures.normalizePublicKey(u.publicKey).toString("base64") })
    }));

    const userProfiles = users.map((u) => ({
      key: `\u0000GCUP\u0000${u.ethAddress}\u0000`,
      value: JSON.stringify({ alias: u.identityKey, ethAddress: u.ethAddress, roles: u.roles })
    }));

    return this.savedKVState(...publicKeys, ...userProfiles);
  }

  /**
   * Sets the certificate authority client identity for the transaction context.
   *
   * @param caUser - User identifier for the CA identity
   * @param mspId - Optional MSP ID, defaults to current context MSP
   * @returns This fixture instance for method chaining
   */
  caClientIdentity(caUser: string, mspId?: string): Fixture<Ctx, T> {
    this.ctx.clientIdentity = x509Identity(caUser, mspId ?? this.ctx.clientIdentity.getMSPID());
    return this;
  }

  /**
   * Sets the calling user context for contract method invocations.
   *
   * @param user - User data with identity, addresses, and roles
   * @returns This fixture instance for method chaining
   */
  callingUser(
    user: ChainUserWithRoles | { alias: UserAlias; ethAddress?: string; tonAddress?: string; roles: string[] }
  ): Fixture<Ctx, T> {
    if ("identityKey" in user) {
      this.ctx.callingUserData = {
        alias: user.identityKey,
        ethAddress: user.ethAddress,
        roles: user.roles,
        signedBy: [],
        signatureQuorum: 0,
        allowedSigners: [],
        isMultisig: false
      };
      return this;
    }

    this.ctx.callingUserData = {
      ...user,
      signedBy: [],
      signatureQuorum: 0,
      allowedSigners: [],
      isMultisig: false
    };
    return this;
  }

  /**
   * Adds ChainObjects to the mock blockchain state.
   * Objects are serialized and stored using their composite keys.
   *
   * @param objs - Array of ChainObjects to save to state
   * @returns This fixture instance for method chaining
   * @throws Error if composite key generation fails
   */
  savedState(...objs: ChainObject[]): Fixture<Ctx, T> {
    objs.forEach((o) => {
      try {
        this.state[o.getCompositeKey()] = o.serialize();
      } catch (e) {
        throw new Error(`getCompositeKey() failure for: ${o.serialize()}. Error: ${e}`);
      }
    });
    return this;
  }

  /**
   * Adds arbitrary key-value pairs to the mock blockchain state.
   *
   * @param objs - Array of key-value objects to save to state
   * @returns This fixture instance for method chaining
   */
  savedKVState(...objs: { key: string; value: string }[]): Fixture<Ctx, T> {
    objs.forEach(({ key, value }) => {
      this.state[key] = value;
    });
    return this;
  }

  /**
   * Adds RangedChainObjects to the mock blockchain state.
   * Objects are stored using their ranged keys for efficient range queries.
   *
   * @param objs - Array of RangedChainObjects to save to state
   * @returns This fixture instance for method chaining
   */
  savedRangeState(objs: RangedChainObject[]): Fixture<Ctx, T> {
    objs.forEach((o) => {
      this.state[o.getRangedKey()] = o.serialize();
    });
    return this;
  }

  /**
   * Retrieves all state writes performed during contract execution.
   * Useful for testing assertions about what was written to the blockchain.
   *
   * @param skipKeysStartingWith - Array of key prefixes to exclude from results
   * @returns Object containing all state writes as key-value pairs
   */
  getWrites: (skipKeysStartingWith?: string[]) => Record<string, string> = (
    skipKeysStartingWith = ["\u0000UNTX\u0000"]
  ) => {
    return Object.entries(this.allWrites).reduce((acc, [key, value]) => {
      const shouldSkip = skipKeysStartingWith.some((prefix) => key.startsWith(prefix));
      if (!shouldSkip) {
        acc[key] = value;
      }
      return acc;
    }, {});
  };
}

/**
 * Factory function for creating test fixtures for GalaChain contracts.
 *
 * Provides a fluent interface for setting up comprehensive unit tests with mock blockchain state,
 * user context, and contract execution environment.
 *
 * @template Ctx - The GalaChain context type
 * @template T - The contract type being tested
 * @param contractClass - Constructor of the contract class to test
 * @returns A new Fixture instance for the specified contract
 *
 * @example
 * ```typescript
 * // Basic fixture setup
 * const testFixture = fixture(TokenContract)
 *   .callingUser(curator)
 *   .registeredUsers(user1, user2, user3);
 *
 * // Test contract methods
 * const response = await testFixture.contract.CreateTokenClass(
 *   testFixture.ctx,
 *   createTokenClassDto
 * );
 *
 * // Advanced setup with pre-existing state
 * const advancedFixture = fixture(MarketplaceContract)
 *   .savedState(existingTokenClass, initialBalance)
 *   .callingUser(marketplaceOwner)
 *   .caClientIdentity(\"admin\", \"MarketplaceOrg\");
 * ```
 */
export function fixture<Ctx extends TestGalaChainContext, T extends GalaContract<Ctx>>(
  contractClass: ClassConstructor<T>
) {
  return new Fixture<Ctx, T>(contractClass);
}

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
  GC_NETWORK_ID,
  TokenAllowance,
  TokenBalance,
  TokenBurn,
  TokenClass,
  TokenClassKey,
  TokenInstance,
  TokenInstanceKey
} from "@gala-chain/api";
import BigNumber from "bignumber.js";

import users from "./users";
import { createInstanceFn, createPlainFn } from "./utils";

/**
 * Test data factory for GalaChain currency-related objects.
 *
 * Provides pre-configured test objects for token classes, allowances, balances,
 * and other currency-related blockchain entities. Uses environment variables
 * for configuration flexibility in different test environments.
 *
 * @example
 * ```typescript
 * import currency from "@gala-chain/test";
 *
 * // Use plain objects for DTOs
 * const tokenClass = currency.tokenClassPlain();
 *
 * // Use class instances for testing chaincode
 * const tokenBalance = currency.tokenBalance();
 * ```
 */

process.env.GALA_TOKEN_CLASS_COLLECTION = process.env.GALA_TOKEN_CLASS_COLLECTION ?? "TEST";
process.env.GALA_TOKEN_CLASS_CATEGORY = process.env.GALA_TOKEN_CLASS_CATEGORY ?? "Currency";
process.env.GALA_TOKEN_CLASS_TYPE = process.env.GALA_TOKEN_CLASS_TYPE ?? "TEST";
process.env.GALA_TOKEN_CLASS_ADDITIONAL_KEY = process.env.GALA_TOKEN_CLASS_ADDITIONAL_KEY ?? "none";

/**
 * Creates a plain token class key object for testing.
 * Uses environment variables for configuration flexibility.
 */
const tokenClassKeyPlain = createPlainFn({
  collection: process.env.GALA_TOKEN_CLASS_COLLECTION,
  category: process.env.GALA_TOKEN_CLASS_CATEGORY,
  type: process.env.GALA_TOKEN_CLASS_TYPE,
  additionalKey: process.env.GALA_TOKEN_CLASS_ADDITIONAL_KEY
});

/**
 * Creates a plain token class object with default test values.
 * Includes standard properties for automated test currency.
 */
const tokenClassPlain = createPlainFn({
  ...tokenClassKeyPlain(),
  description: "Generated via automated test suite.",
  decimals: 10,
  image: "https://app.gala.games/test-image-placeholder-url.png",
  isNonFungible: false,
  maxCapacity: new BigNumber(100000000000000),
  maxSupply: new BigNumber(100000000000000),
  name: "AUTOMATEDTESTCOIN",
  network: GC_NETWORK_ID,
  symbol: "AUTC",
  totalBurned: new BigNumber(0),
  totalMintAllowance: new BigNumber(0),
  totalSupply: new BigNumber(0),
  authorities: [users.admin.identityKey]
});

/**
 * Creates a plain token allowance object for testing.
 *
 * @param txUnixTime - Unix timestamp for the allowance creation time
 * @returns Plain object representing a token allowance
 */
const tokenAllowancePlain = (txUnixTime: number) => ({
  ...tokenClassKeyPlain(),
  allowanceType: 4,
  quantity: new BigNumber(1000000000000),
  quantitySpent: new BigNumber(0),
  created: txUnixTime,
  expires: 0,
  instance: new BigNumber(0),
  grantedBy: users.admin.identityKey,
  grantedTo: users.admin.identityKey,
  uses: new BigNumber(1),
  usesSpent: new BigNumber(0)
});

/**
 * Creates a plain token burn allowance object for testing.
 * Grants burn permission from testUser1 to testUser2.
 *
 * @param txUnixTime - Unix timestamp for the allowance creation time
 * @returns Plain object representing a burn allowance
 */
const tokenBurnAllowancePlain = (txUnixTime: number) => ({
  ...tokenClassKeyPlain(),
  allowanceType: 6,
  quantity: new BigNumber(1),
  quantitySpent: new BigNumber(0),
  created: txUnixTime,
  expires: 0,
  instance: new BigNumber(0),
  grantedBy: users.testUser1.identityKey,
  grantedTo: users.testUser2.identityKey,
  uses: new BigNumber(1),
  usesSpent: new BigNumber(0)
});

/**
 * Creates a plain token burn allowance object from testUser3 to testUser2.
 *
 * @param txUnixTime - Unix timestamp for the allowance creation time
 * @returns Plain object representing a burn allowance from user3
 */
const tokenBurnAllowanceUser3Plain = (txUnixTime: number) => ({
  ...tokenClassKeyPlain(),
  allowanceType: 6,
  quantity: new BigNumber(1),
  quantitySpent: new BigNumber(0),
  created: txUnixTime,
  expires: 0,
  instance: new BigNumber(0),
  grantedBy: users.testUser3.identityKey,
  grantedTo: users.testUser2.identityKey,
  uses: new BigNumber(1),
  usesSpent: new BigNumber(0)
});

/**
 * Creates a plain token mint allowance object for testing.
 * Grants mint permission from testUser1 to testUser2.
 *
 * @param txUnixTime - Unix timestamp for the allowance creation time
 * @returns Plain object representing a mint allowance
 */
const tokenMintAllowancePlain = (txUnixTime: number) => ({
  ...tokenClassKeyPlain(),
  allowanceType: 4,
  quantity: new BigNumber(1),
  quantitySpent: new BigNumber(0),
  created: txUnixTime,
  expires: 0,
  instance: new BigNumber(0),
  grantedBy: users.testUser1.identityKey,
  grantedTo: users.testUser2.identityKey,
  uses: new BigNumber(1),
  usesSpent: new BigNumber(0)
});

/**
 * Creates a plain token instance key object for testing.
 * Uses instance 0 for fungible tokens.
 */
const tokenInstanceKeyPlain = createPlainFn({
  ...tokenClassKeyPlain(),
  instance: new BigNumber(0)
});

/**
 * Creates a plain token instance object for testing.
 * Configured as a fungible token instance.
 */
const tokenInstancePlain = createPlainFn({
  ...tokenInstanceKeyPlain(),
  isNonFungible: false
});

/**
 * Creates a plain token balance object for testing.
 * Assigns balance to testUser1 with default quantity of 1000.
 */
const tokenBalancePlain = createPlainFn({
  ...tokenClassKeyPlain(),
  owner: users.testUser1.identityKey,
  inUseHolds: [],
  lockedHolds: [],
  instanceIds: [],
  quantity: new BigNumber("1000")
});

/**
 * Creates a plain token burn record object for testing.
 *
 * @param txUnixTime - Unix timestamp for the burn transaction
 * @returns Plain object representing a token burn
 */
const tokenBurnPlain = (txUnixTime: number) => ({
  ...tokenInstanceKeyPlain(),
  burnedBy: users.testUser1.identityKey,
  created: txUnixTime,
  quantity: new BigNumber(1)
});

/**
 * Creates a plain token burn counter object for testing.
 * Extends burn record with additional metadata for tracking.
 *
 * @param txUnixTime - Unix timestamp for the burn transaction
 * @param timeKey - Time-based key for the burn counter
 * @param epoch - Epoch identifier for the burn
 * @param totalKnownBurnsCount - Total count of known burns
 * @returns Plain object representing a token burn counter
 */
const tokenBurnCounterPlain = (
  txUnixTime: number,
  timeKey: string,
  epoch: string,
  totalKnownBurnsCount: BigNumber
) => ({
  ...tokenBurnPlain(txUnixTime),
  timeKey,
  epoch,
  totalKnownBurnsCount
});

/**
 * Test data factory object containing all currency-related test utilities.
 * Provides both plain objects (for DTOs) and class instances (for chaincode testing).
 *
 * Each property comes in two forms:
 * - `*Plain` functions return plain JavaScript objects
 * - Regular properties return class instances
 *
 * @example
 * ```typescript
 * // Get plain object for DTO creation
 * const plainTokenClass = currency.tokenClassPlain();
 *
 * // Get class instance for chaincode testing
 * const tokenClassInstance = currency.tokenClass();
 * ```
 */
export default {
  tokenClassKeyPlain,
  tokenClassKey: createInstanceFn(TokenClassKey, tokenClassKeyPlain()),
  tokenClassPlain: tokenClassPlain,
  tokenClass: createInstanceFn(TokenClass, tokenClassPlain()),
  tokenAllowancePlain,
  tokenAllowance: createInstanceFn(TokenAllowance, tokenAllowancePlain(1)),
  tokenBurnAllowancePlain,
  tokenBurnAllowance: createInstanceFn(TokenAllowance, tokenBurnAllowancePlain(1)),
  tokenBurnAllowanceUser3Plain,
  tokenBurnAllowanceUser3: createInstanceFn(TokenAllowance, tokenBurnAllowanceUser3Plain(1)),
  tokenMintAllowancePlain,
  tokenMintAllowance: createInstanceFn(TokenAllowance, tokenMintAllowancePlain(1)),
  tokenInstanceKeyPlain,
  tokenInstanceKey: createInstanceFn(TokenInstanceKey, tokenInstanceKeyPlain()),
  tokenInstancePlain,
  tokenInstance: createInstanceFn(TokenInstance, tokenInstancePlain()),
  tokenBalancePlain,
  tokenBalance: createInstanceFn(TokenBalance, tokenBalancePlain()),
  tokenBurnPlain,
  tokenBurn: createInstanceFn(TokenBurn, tokenBurnPlain(1)),
  tokenBurnCounterPlain
};

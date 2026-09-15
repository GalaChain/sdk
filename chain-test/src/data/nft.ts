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
import BigNumber from "bignumber.js";

import { tokenFixtureClass } from "./tokenFixtureClasses";
import users from "./users";
import { createInstanceFn, createPlainFn } from "./utils";

/**
 * Test data factory for GalaChain NFT-related objects.
 *
 * Provides pre-configured test objects for non-fungible token classes, instances,
 * allowances, and balances. Configured with test elixir potion NFTs.
 *
 * @example
 * ```typescript
 * import nft from "@gala-chain/test";
 *
 * // Use plain objects for DTOs
 * const tokenClass = nft.tokenClassPlain();
 *
 * // Use class instances for testing chaincode
 * const tokenBalance = nft.tokenBalance();
 * ```
 */

/**
 * Creates a plain NFT token class key object for testing.
 * Configured as a Test Elixir potion NFT.
 */
const tokenClassKeyPlain = createPlainFn({
  collection: "TEST",
  category: "Item",
  type: "Potion",
  additionalKey: "Elixir"
});

/**
 * Creates a plain NFT token class object with default test values.
 * Configured as a non-fungible elixir potion with standard NFT properties.
 */
const tokenClassPlain = createPlainFn({
  ...tokenClassKeyPlain(),
  description: "Generated via automated test suite.",
  decimals: 0,
  image: "https://app.gala.games/test-image-placeholder-url.png",
  isNonFungible: true,
  maxCapacity: new BigNumber(100000000),
  maxSupply: new BigNumber(100000000),
  name: "TestElixirNft",
  network: "GC",
  symbol: "GALAXR",
  totalBurned: new BigNumber(0),
  totalMintAllowance: new BigNumber(0),
  totalSupply: new BigNumber(0),
  authorities: [users.admin.identityKey]
});

/**
 * Creates a plain NFT token allowance object for testing.
 * Grants transfer allowance from testUser2 to testUser1.
 *
 * @param txUnixTime - Unix timestamp for the allowance creation time
 * @returns Plain object representing an NFT transfer allowance
 */
const tokenAllowancePlain = (txUnixTime: number) => ({
  allowanceType: 1,
  additionalKey: "Elixir",
  quantity: new BigNumber(100),
  quantitySpent: new BigNumber(0),
  category: "Item",
  collection: "TEST",
  created: txUnixTime,
  expires: 0,
  instance: new BigNumber(1),
  grantedBy: users.testUser2.identityKey,
  grantedTo: users.testUser1.identityKey,
  type: "Potion",
  uses: new BigNumber(1),
  usesSpent: new BigNumber(0)
});

/**
 * Creates a plain NFT mint allowance object for testing.
 * Grants mint permission to admin user.
 *
 * @param txUnixTime - Unix timestamp for the allowance creation time
 * @returns Plain object representing an NFT mint allowance
 */
const tokenMintAllowancePlain = (txUnixTime: number) => ({
  allowanceType: 4,
  additionalKey: "Elixir",
  quantity: new BigNumber(2),
  quantitySpent: new BigNumber(0),
  category: "Item",
  collection: "TEST",
  created: txUnixTime,
  expires: 0,
  instance: new BigNumber(0),
  grantedBy: users.admin.identityKey,
  grantedTo: users.admin.identityKey,
  type: "Potion",
  uses: new BigNumber(1),
  usesSpent: new BigNumber(0)
});

/**
 * Creates a plain NFT token instance key object for testing.
 * Represents instance #1 of the test NFT.
 */
const tokenInstance1KeyPlain = createPlainFn({
  ...tokenClassKeyPlain(),
  instance: new BigNumber(1)
});

/**
 * Creates a plain NFT token instance object for testing.
 * Represents instance #1 owned by testUser1.
 */
const tokenInstance1Plain = createPlainFn({
  ...tokenInstance1KeyPlain(),
  isNonFungible: true,
  owner: users.testUser1.identityKey
});

/**
 * Creates a plain NFT collection name authorization for the "TestProject" name,
 * authorizing admin. Token instance metadata project names are claimed in this
 * registry, so this record lets admin write "TestProject" metadata documents.
 */
const projectAuthorizationPlain = createPlainFn({
  collection: "TestProject",
  authorizedUsers: [users.admin.identityKey]
});

/**
 * Creates a plain NFT token instance metadata object for testing.
 * Represents an OpenSea-style metadata document for instance #1 and project
 * "TestProject", created by admin.
 *
 * @param txUnixTime - Unix timestamp for the metadata creation time
 * @returns Plain object representing token instance metadata
 */
const tokenInstance1MetadataPlain = (txUnixTime: number) => ({
  ...tokenInstance1KeyPlain(),
  project: "TestProject",
  name: "Test Elixir #1",
  description: "Generated via automated test suite.",
  image: "https://app.gala.games/test-image-placeholder-url.png",
  attributes: [
    {
      traitType: "Potency",
      value: 9,
      displayType: "number"
    }
  ],
  customFields: [{ key: "gameId", value: "elixir-001" }],
  createdBy: users.admin.identityKey,
  lastModifiedBy: users.admin.identityKey,
  created: txUnixTime,
  lastModified: txUnixTime
});

/**
 * Creates a plain NFT token balance object for testing.
 * Assigns NFT instance #1 to testUser1.
 */
const tokenBalancePlain = createPlainFn({
  ...tokenClassKeyPlain(),
  owner: users.testUser1.identityKey,
  instanceIds: [new BigNumber(1)],
  lockedHolds: [],
  quantity: new BigNumber(1)
});

/**
 * Creates a plain NFT token burn record object for testing.
 *
 * @param txUnixTime - Unix timestamp for the burn transaction
 * @returns Plain object representing an NFT burn
 */
const tokenBurnPlain = (txUnixTime: number) => ({
  ...tokenInstance1KeyPlain(),
  burnedBy: users.testUser1.identityKey,
  created: txUnixTime,
  quantity: new BigNumber(1)
});

/**
 * Creates a plain NFT token burn counter object for testing.
 * Extends burn record with additional metadata for tracking.
 *
 * @param txUnixTime - Unix timestamp for the burn transaction
 * @param timeKey - Time-based key for the burn counter
 * @param epoch - Epoch identifier for the burn
 * @param totalKnownBurnsCount - Total count of known burns
 * @returns Plain object representing an NFT burn counter
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
 * Test data factory object containing all NFT-related test utilities.
 * Provides both plain objects (for DTOs) and class instances (for chaincode testing).
 *
 * Each property comes in two forms:
 * - `*Plain` functions return plain JavaScript objects
 * - Regular properties return class instances
 *
 * @example
 * ```typescript
 * // Get plain object for DTO creation
 * const plainTokenClass = nft.tokenClassPlain();
 *
 * // Get class instance for chaincode testing
 * const tokenClassInstance = nft.tokenClass();
 * ```
 */
function boundInstance(
  name: Parameters<typeof tokenFixtureClass>[0],
  plain: object
): (override?: (p: object) => object) => any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (override?: (p: any) => any) =>
    createInstanceFn(tokenFixtureClass(name) as any, plain as any)(override);
}

export default {
  tokenClassKeyPlain,
  tokenClassKey: boundInstance("TokenClassKey", tokenClassKeyPlain()),
  tokenClassPlain,
  tokenClass: boundInstance("TokenClass", tokenClassPlain()),
  tokenAllowancePlain,
  tokenAllowance: boundInstance("TokenAllowance", tokenAllowancePlain(1)),
  tokenMintAllowancePlain,
  tokenMintAllowance: boundInstance("TokenAllowance", tokenMintAllowancePlain(1)),
  tokenInstance1KeyPlain,
  tokenInstance1Key: boundInstance("TokenInstanceKey", tokenInstance1KeyPlain()),
  tokenInstance1Plain,
  tokenInstance1: boundInstance("TokenInstance", tokenInstance1Plain()),
  tokenInstance1MetadataPlain,
  tokenInstance1Metadata: boundInstance("TokenInstanceMetadata", tokenInstance1MetadataPlain(1)),
  projectAuthorizationPlain,
  projectAuthorization: boundInstance("NftCollectionAuthorization", projectAuthorizationPlain()),
  tokenBalancePlain,
  tokenBalance: boundInstance("TokenBalance", tokenBalancePlain()),
  tokenBurnPlain,
  tokenBurn: boundInstance("TokenBurn", tokenBurnPlain(1)),
  tokenBurnCounterPlain
};

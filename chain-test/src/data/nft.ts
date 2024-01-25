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

const tokenClassKeyPlain = createPlainFn({
  collection: "TEST",
  category: "Item",
  type: "Potion",
  additionalKey: "Elixir"
});

const tokenClassPlain = createPlainFn({
  ...tokenClassKeyPlain(),
  description: "Generated via automated test suite.",
  decimals: 0,
  image: "https://app.gala.games/test-image-placeholder-url.png",
  isNonFungible: true,
  maxCapacity: new BigNumber(100000000),
  maxSupply: new BigNumber(100000000),
  name: "TestElixirNft",
  network: GC_NETWORK_ID,
  symbol: "GALAXR",
  totalBurned: new BigNumber(0),
  totalMintAllowance: new BigNumber(0),
  totalSupply: new BigNumber(0),
  authorities: [users.testAdminId]
});

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
  grantedBy: users.testUser2Id,
  grantedTo: users.testUser1Id,
  type: "Potion",
  uses: new BigNumber(1),
  usesSpent: new BigNumber(0)
});

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
  grantedBy: users.testAdminId,
  grantedTo: users.testAdminId,
  type: "Potion",
  uses: new BigNumber(1),
  usesSpent: new BigNumber(0)
});

const tokenInstance1KeyPlain = createPlainFn({
  ...tokenClassKeyPlain(),
  instance: new BigNumber(1)
});

const tokenInstance1Plain = createPlainFn({
  ...tokenInstance1KeyPlain(),
  isNonFungible: true,
  owner: users.testUser1Id
});

const tokenBalancePlain = createPlainFn({
  ...tokenClassKeyPlain(),
  owner: users.testUser1Id,
  instanceIds: [new BigNumber(1)],
  lockedHolds: [],
  inUseHolds: [],
  quantity: new BigNumber(1)
});

const tokenBurnPlain = (txUnixTime: number) => ({
  ...tokenInstance1KeyPlain(),
  burnedBy: users.testUser1Id,
  created: txUnixTime,
  quantity: new BigNumber(1)
});

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

export default {
  tokenClassKeyPlain,
  tokenClassKey: createInstanceFn(TokenClassKey, tokenClassKeyPlain()),
  tokenClassPlain,
  tokenClass: createInstanceFn(TokenClass, tokenClassPlain()),
  tokenAllowancePlain,
  tokenAllowance: createInstanceFn(TokenAllowance, tokenAllowancePlain(1)),
  tokenMintAllowancePlain,
  tokenMintAllowance: createInstanceFn(TokenAllowance, tokenMintAllowancePlain(1)),
  tokenInstance1KeyPlain,
  tokenInstance1Key: createInstanceFn(TokenInstanceKey, tokenInstance1KeyPlain()),
  tokenInstance1Plain,
  tokenInstance1: createInstanceFn(TokenInstance, tokenInstance1Plain()),
  tokenBalancePlain,
  tokenBalance: createInstanceFn(TokenBalance, tokenBalancePlain()),
  tokenBurnPlain,
  tokenBurn: createInstanceFn(TokenBurn, tokenBurnPlain(1)),
  tokenBurnCounterPlain
};

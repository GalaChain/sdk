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
import { TokenMintRequest, TokenMintStatus, UserAlias, createValidRangedChainObject } from "@gala-chain/api";
import { fixture, users } from "@gala-chain/test";
import BigNumber from "bignumber.js";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { currency } from "../testdata";
import { GalaChainContext } from "../types";
import { inverseEpoch, inverseTime, lookbackTimeOffset, supplyLookbackWindowMs } from "../utils";
import { fetchMintSupply } from "./fetchMintSupply";

describe("fetchMintSupply", () => {
  const tokenClass = currency.tokenClass();

  const request = async (
    ctx: GalaChainContext,
    id: string,
    ageMs: number,
    baseline: string,
    owner: UserAlias,
    quantity = "1"
  ) =>
    createValidRangedChainObject(TokenMintRequest, {
      collection: tokenClass.collection,
      category: tokenClass.category,
      type: tokenClass.type,
      additionalKey: tokenClass.additionalKey,
      timeKey: inverseTime(ctx, ageMs),
      totalKnownMintsCount: new BigNumber(baseline),
      requestor: users.admin.identityKey,
      owner,
      created: ctx.txUnixTime - ageMs,
      quantity: new BigNumber(quantity),
      state: TokenMintStatus.Minted,
      id,
      epoch: inverseEpoch(ctx, 0)
    });

  it("includes every recent request and stops at a request the oldest baseline already counts", async () => {
    // Given
    const testFixture = fixture(GalaChainTokenContract).savedState(tokenClass);
    const { ctx } = testFixture;

    const requests: TokenMintRequest[] = [];
    for (let i = 0; i < 201; i += 1) {
      requests.push(await request(ctx, `recent-${i}`, 1, "107", `client|recent${i}` as UserAlias));
    }
    // "edge" is the oldest request in the window. Its baseline counts "beyond", which is older than
    // the baseline cutoff, so the read stops there and takes "beyond" from the baseline.
    const edgeAge = 1 + supplyLookbackWindowMs;
    requests.push(
      await request(ctx, "edge", edgeAge, "100", users.testUser1.identityKey, "7"),
      await request(ctx, "beyond", edgeAge + lookbackTimeOffset, "0", users.testUser2.identityKey, "100")
    );
    testFixture.savedRangeState(requests);

    // When
    const supply = await fetchMintSupply(ctx as GalaChainContext, tokenClass, 0);

    // Then
    expect(supply.toNumber()).toEqual(308);
  });

  it("keeps a request older than the window that the oldest baseline does not count", async () => {
    // Given
    const testFixture = fixture(GalaChainTokenContract).savedState(tokenClass);
    const { ctx } = testFixture;

    // Each baseline was read lookbackTimeOffset before its request: "o" did not see "x", and "n" saw "x"
    // but not "o". "x" is outside the five-second window of "n", but it is not in the baseline of "o".
    const requests = [
      await request(ctx, "n", 0, "1", users.testUser1.identityKey),
      await request(ctx, "o", 2500, "0", users.testUser2.identityKey),
      await request(ctx, "x", 5500, "0", users.testUser3.identityKey)
    ];
    testFixture.savedRangeState(requests);

    // When
    const supply = await fetchMintSupply(ctx as GalaChainContext, tokenClass, 0);

    // Then
    expect(supply.toNumber()).toEqual(3);
  });
});

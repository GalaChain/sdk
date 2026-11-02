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
import { inverseEpoch, inverseTime, supplyLookbackWindowMs } from "../utils";
import { fetchMintSupply } from "./fetchMintSupply";

describe("fetchMintSupply", () => {
  it("includes every recent request and stops beyond the five-second window", async () => {
    const tokenClass = currency.tokenClass();
    const testFixture = fixture(GalaChainTokenContract).savedState(tokenClass);
    const { ctx } = testFixture;

    const request = async (id: string, ageMs: number, owner: UserAlias, quantity = "1") =>
      createValidRangedChainObject(TokenMintRequest, {
        collection: tokenClass.collection,
        category: tokenClass.category,
        type: tokenClass.type,
        additionalKey: tokenClass.additionalKey,
        timeKey: inverseTime(ctx, ageMs),
        totalKnownMintsCount: new BigNumber("0"),
        requestor: users.admin.identityKey,
        owner,
        created: ctx.txUnixTime - ageMs,
        quantity: new BigNumber(quantity),
        state: TokenMintStatus.Minted,
        id,
        epoch: inverseEpoch(ctx, 0)
      });

    const requests: TokenMintRequest[] = [];
    for (let i = 0; i < 201; i += 1) {
      requests.push(await request(`recent-${i}`, 1, `client|recent${i}` as UserAlias));
    }
    requests.push(
      await request("edge", 1 + supplyLookbackWindowMs, users.testUser1.identityKey, "7"),
      await request("beyond", 2 + supplyLookbackWindowMs, users.testUser2.identityKey, "100")
    );
    testFixture.savedRangeState(requests);

    const supply = await fetchMintSupply(ctx as GalaChainContext, tokenClass, 0);

    expect(supply.isEqualTo("208")).toBe(true);
  });
});

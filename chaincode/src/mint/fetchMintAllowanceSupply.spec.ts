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
  TokenMintAllowanceRequest,
  TokenMintStatus,
  UserAlias,
  createValidRangedChainObject
} from "@gala-chain/api";
import { fixture, users } from "@gala-chain/test";
import BigNumber from "bignumber.js";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { currency } from "../testdata/index";
import { GalaChainContext } from "../types";
import { inverseEpoch, inverseTime } from "../utils";
import { allowanceSupplyWindowMs, fetchMintAllowanceSupply } from "./fetchMintAllowanceSupply";

describe("fetchMintAllowanceSupply", () => {
  async function allowanceRequest(
    ctx: GalaChainContext,
    tokenClass: ReturnType<typeof currency.tokenClass>,
    fields: { id: string; ageMs: number; grantedTo: string; baseline: string; quantity: string }
  ) {
    return createValidRangedChainObject(TokenMintAllowanceRequest, {
      collection: tokenClass.collection,
      category: tokenClass.category,
      type: tokenClass.type,
      additionalKey: tokenClass.additionalKey,
      timeKey: inverseTime(ctx, fields.ageMs),
      grantedTo: fields.grantedTo as UserAlias,
      totalKnownMintAllowancesCount: new BigNumber(fields.baseline),
      created: ctx.txUnixTime - fields.ageMs,
      grantedBy: users.admin.identityKey,
      quantity: new BigNumber(fields.quantity),
      state: TokenMintStatus.Minted,
      id: fields.id,
      uses: new BigNumber("1"),
      epoch: inverseEpoch(ctx, 0)
    });
  }

  it("includes every recipient of the newest grant", async () => {
    const tokenClass = currency.tokenClass();
    const testFixture = fixture(GalaChainTokenContract).savedState(tokenClass);
    const { ctx } = testFixture;
    const requests: TokenMintAllowanceRequest[] = [];

    for (let i = 0; i < 201; i += 1) {
      requests.push(
        await allowanceRequest(ctx, tokenClass, {
          id: `allowance-${i}`,
          ageMs: 1,
          grantedTo: `client|user${i}`,
          baseline: "0",
          quantity: "1"
        })
      );
    }

    testFixture.savedRangeState(requests);

    const supply = await fetchMintAllowanceSupply(ctx, tokenClass, 0);

    expect(supply.isEqualTo("201")).toBe(true);
  });

  it("uses the newest grant baseline and does not add older grants again", async () => {
    const tokenClass = currency.tokenClass();
    const testFixture = fixture(GalaChainTokenContract).savedState(tokenClass);
    const { ctx } = testFixture;
    const older = await allowanceRequest(ctx, tokenClass, {
      id: "older",
      ageMs: 10_000,
      grantedTo: users.testUser1.identityKey,
      baseline: "0",
      quantity: "10"
    });
    const newer = await allowanceRequest(ctx, tokenClass, {
      id: "newer",
      ageMs: 1,
      grantedTo: users.testUser2.identityKey,
      baseline: "100",
      quantity: "1"
    });

    testFixture.savedRangeState([older, newer]);

    const supply = await fetchMintAllowanceSupply(ctx, tokenClass, 0);

    expect(supply.isEqualTo("101")).toBe(true);
  });

  it("adds grants inside five seconds and drops the grant beyond them", async () => {
    const tokenClass = currency.tokenClass();
    const testFixture = fixture(GalaChainTokenContract).savedState(tokenClass);
    const { ctx } = testFixture;
    const beyondWindow = await allowanceRequest(ctx, tokenClass, {
      id: "beyond-window",
      ageMs: 1 + allowanceSupplyWindowMs + 1,
      grantedTo: users.admin.identityKey,
      baseline: "0",
      quantity: "100"
    });
    const edgeOfWindow = await allowanceRequest(ctx, tokenClass, {
      id: "edge-of-window",
      ageMs: 1 + allowanceSupplyWindowMs,
      grantedTo: users.testUser1.identityKey,
      baseline: "0",
      quantity: "7"
    });
    const newer = await allowanceRequest(ctx, tokenClass, {
      id: "newer",
      ageMs: 1,
      grantedTo: users.testUser2.identityKey,
      baseline: "0",
      quantity: "3"
    });

    testFixture.savedRangeState([beyondWindow, edgeOfWindow, newer]);

    const supply = await fetchMintAllowanceSupply(ctx, tokenClass, 0);

    expect(supply.isEqualTo("10")).toBe(true);
  });

  it("does not add a newer baseline on top of an older grant inside the window", async () => {
    const tokenClass = currency.tokenClass();
    const testFixture = fixture(GalaChainTokenContract).savedState(tokenClass);
    const { ctx } = testFixture;
    const older = await allowanceRequest(ctx, tokenClass, {
      id: "older",
      ageMs: 4_000,
      grantedTo: users.testUser1.identityKey,
      baseline: "0",
      quantity: "10"
    });
    const newer = await allowanceRequest(ctx, tokenClass, {
      id: "newer",
      ageMs: 1,
      grantedTo: users.testUser2.identityKey,
      baseline: "10",
      quantity: "5"
    });

    testFixture.savedRangeState([older, newer]);

    const supply = await fetchMintAllowanceSupply(ctx, tokenClass, 0);

    expect(supply.isEqualTo("15")).toBe(true);
  });
});

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
  TokenMintRequest,
  TokenMintStatus,
  createValidRangedChainObject
} from "@gala-chain/api";
import { fixture, users } from "@gala-chain/test";
import BigNumber from "bignumber.js";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { currency } from "../testdata/index";
import { inverseEpoch, inverseTime } from "../utils";
import { fetchMintAllowanceSupply } from "./fetchMintAllowanceSupply";
import { fetchTokenClassWithKnownSupply } from "./fetchTokenClassWithSupply";

describe("mint supply", () => {
  it("reads known mint supply from the token class total", async () => {
    const tokenClass = currency.tokenClass();
    tokenClass.totalSupply = new BigNumber("7");
    const testFixture = fixture(GalaChainTokenContract).savedState(tokenClass);
    const { ctx } = testFixture;

    const mintRequest = await createValidRangedChainObject(TokenMintRequest, {
      id: "older-mint",
      collection: tokenClass.collection,
      category: tokenClass.category,
      type: tokenClass.type,
      additionalKey: tokenClass.additionalKey,
      timeKey: inverseTime(ctx, 1),
      totalKnownMintsCount: new BigNumber("0"),
      requestor: users.admin.identityKey,
      owner: users.testUser1.identityKey,
      created: ctx.txUnixTime,
      quantity: new BigNumber("1"),
      state: TokenMintStatus.Minted,
      epoch: inverseEpoch(ctx, 0)
    });

    testFixture.savedRangeState([mintRequest]);

    const result = await fetchTokenClassWithKnownSupply(ctx, currency.tokenClassKey());

    expect(result.knownMintSupply?.isEqualTo("7")).toBe(true);
    expect(result.totalSupply.isEqualTo("7")).toBe(true);
  });

  it("sums allowance supply across more than 200 records", async () => {
    const tokenClass = currency.tokenClass();
    const testFixture = fixture(GalaChainTokenContract).savedState(tokenClass);
    const { ctx } = testFixture;
    const requests: TokenMintAllowanceRequest[] = [];

    for (let i = 0; i < 201; i += 1) {
      requests.push(
        await createValidRangedChainObject(TokenMintAllowanceRequest, {
          collection: tokenClass.collection,
          category: tokenClass.category,
          type: tokenClass.type,
          additionalKey: tokenClass.additionalKey,
          timeKey: inverseTime(ctx, i + 1),
          grantedTo: users.testUser1.identityKey,
          totalKnownMintAllowancesCount: new BigNumber("0"),
          created: ctx.txUnixTime - i,
          grantedBy: users.admin.identityKey,
          quantity: new BigNumber("1"),
          state: TokenMintStatus.Minted,
          id: `allowance-${i}`,
          uses: new BigNumber("1"),
          epoch: inverseEpoch(ctx, 0)
        })
      );
    }

    testFixture.savedRangeState(requests);
    const supply = await fetchMintAllowanceSupply(ctx, tokenClass, 0);

    expect(supply.isEqualTo("201")).toBe(true);
  });
});

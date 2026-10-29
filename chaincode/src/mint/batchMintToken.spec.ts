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
import { RangedChainObject, TokenMintRequest, UserAlias, asValidUserAlias } from "@gala-chain/api";
import { fixture, users } from "@gala-chain/test";
import BigNumber from "bignumber.js";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { currency } from "../testdata";
import { GalaChainContext } from "../types";
import { batchMintToken } from "./batchMintToken";
import { fetchMintSupply } from "./fetchMintSupply";

describe("batchMintToken", () => {
  it("should report the supply of a batch minting to several owners", async () => {
    // Given
    const alice = asValidUserAlias("client|alice");
    const bob = asValidUserAlias("client|bob");
    const tokenAllowance = currency.tokenAllowance();
    tokenAllowance.uses = new BigNumber("2");

    const { ctx, getWrites } = fixture<GalaChainContext, GalaChainTokenContract>(GalaChainTokenContract)
      .registeredUsers(users.admin)
      .callingUser(users.admin)
      .savedState(currency.tokenClass(), currency.tokenInstance(), tokenAllowance)
      .savedRangeState([]);

    const mintTo = (owner: UserAlias) => ({
      tokenClassKey: currency.tokenClassKey(),
      owner,
      quantity: new BigNumber("1"),
      authorizedOnBehalf: undefined
    });

    await batchMintToken(ctx, [mintTo(alice), mintTo(bob)]);
    await ctx.stub.flushWrites();

    const mintRequests = Object.entries(getWrites())
      .filter(([key]) => key.startsWith(TokenMintRequest.INDEX_KEY))
      .map(([, value]) => RangedChainObject.deserialize(TokenMintRequest, value));

    expect(mintRequests.map((r) => [r.owner, r.totalKnownMintsCount.toString()])).toEqual([
      [alice, "0"],
      [bob, "1"]
    ]);

    const { ctx: nextCtx } = fixture<GalaChainContext, GalaChainTokenContract>(
      GalaChainTokenContract
    ).savedRangeState(mintRequests);

    // When
    const supply = await fetchMintSupply(nextCtx, currency.tokenClassKey(), 0);

    // Then
    expect(supply).toEqual(new BigNumber("2"));
  });
});

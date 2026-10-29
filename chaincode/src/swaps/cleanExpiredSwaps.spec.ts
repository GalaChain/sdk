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
  TokenInstanceQuantity,
  TokenSwapRequest,
  TokenSwapRequestInstanceOffered,
  TokenSwapRequestInstanceWanted,
  TokenSwapRequestOfferedBy
} from "@gala-chain/api";
import { fixture, users } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { currency, nft } from "../testdata";
import { cleanTokenSwaps } from "./cleanExpiredSwaps";

function swapWithUses(uses: string, usesSpent: string): TokenSwapRequest {
  const offered = plainToInstance(TokenInstanceQuantity, {
    tokenInstance: nft.tokenInstance1Key(),
    quantity: new BigNumber("1")
  });
  const wanted = plainToInstance(TokenInstanceQuantity, {
    tokenInstance: currency.tokenInstanceKey(),
    quantity: new BigNumber("1")
  });
  const swap = plainToInstance(TokenSwapRequest, {
    created: 1,
    txid: `tx-${uses}-${usesSpent}`,
    offered: [offered],
    wanted: [wanted],
    offeredBy: users.testUser1.identityKey,
    fillIds: [],
    uses: new BigNumber(uses),
    usesSpent: new BigNumber(usesSpent),
    expires: 0
  });
  swap.swapRequestId = swap.getCompositeKey();
  return swap;
}

function indexesFor(swap: TokenSwapRequest) {
  const offeredInstance = swap.offered[0].tokenInstance;
  const wantedInstance = swap.wanted[0].tokenInstance;
  return [
    plainToInstance(TokenSwapRequestOfferedBy, {
      offeredBy: swap.offeredBy,
      swapRequestId: swap.swapRequestId
    }),
    plainToInstance(TokenSwapRequestInstanceOffered, {
      ...offeredInstance,
      swapRequestId: swap.swapRequestId
    }),
    plainToInstance(TokenSwapRequestInstanceWanted, {
      ...wantedInstance,
      swapRequestId: swap.swapRequestId
    })
  ];
}

describe("cleanTokenSwaps use comparison", () => {
  it.each([
    ["10", "2"],
    ["100", "20"]
  ])("keeps an active swap when uses=%s and usesSpent=%s", async (uses, usesSpent) => {
    const swap = swapWithUses(uses, usesSpent);
    const { ctx, getWrites } = fixture(GalaChainTokenContract).savedState(swap);

    const response = await cleanTokenSwaps(ctx, {});

    expect(response.deletes).toEqual([]);
    expect(getWrites()).toEqual({});
  });

  it("deletes a swap whose uses are numerically spent", async () => {
    const swap = swapWithUses("9", "10");
    const indexes = indexesFor(swap);
    const { ctx } = fixture(GalaChainTokenContract).savedState(swap, ...indexes);

    const response = await cleanTokenSwaps(ctx, {});

    expect(response.deletes.map((deleted) => deleted.swapRequestId)).toEqual([swap.swapRequestId]);
  });

  it("deletes an expired swap that lists the same token twice", async () => {
    // Given
    const swap = swapWithUses("1", "1");
    swap.offered = [swap.offered[0], swap.offered[0]];
    const other = swapWithUses("2", "2");
    const { ctx, getWrites } = fixture(GalaChainTokenContract).savedState(
      swap,
      ...indexesFor(swap),
      other,
      ...indexesFor(other)
    );

    // When
    const response = await cleanTokenSwaps(ctx, {});

    // Then
    expect(response.deletes.map((deleted) => deleted.swapRequestId).sort()).toEqual(
      [swap.swapRequestId, other.swapRequestId].sort()
    );
    const deletedKeys = [swap, ...indexesFor(swap), other, ...indexesFor(other)].map((o) =>
      o.getCompositeKey()
    );
    await ctx.stub.flushWrites();
    expect(Object.keys(getWrites()).sort()).toEqual(deletedKeys.sort());
  });
});

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
import { TokenClass, TokenInstanceQuantity, TokenSwapRequest } from "@gala-chain/api";
import { fixture, users } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { currency, nft } from "../testdata";
import { fetchTokenSwaps } from "./fetchTokenSwaps";
import { requestTokenSwap } from "./requestTokenSwap";

function leg(tokenInstance: object, quantity: string): TokenInstanceQuantity {
  return plainToInstance(TokenInstanceQuantity, {
    tokenInstance,
    quantity: new BigNumber(quantity)
  });
}

function swapAt(created: number): TokenSwapRequest {
  const swap = plainToInstance(TokenSwapRequest, {
    created,
    txid: `tx-${created}`,
    offered: [leg(currency.tokenInstanceKey(), "1")],
    wanted: [leg(nft.tokenInstance1Key(), "1")],
    offeredBy: users.testUser1.identityKey,
    fillIds: [],
    uses: new BigNumber("1"),
    usesSpent: new BigNumber("1"),
    expires: 0
  });
  swap.swapRequestId = swap.getCompositeKey();
  return swap;
}

describe("swap quantity precision and creation filter", () => {
  it("rejects a fungible swap quantity with too many decimal places", async () => {
    const tokenClass = plainToInstance(TokenClass, { ...currency.tokenClass(), decimals: 2 });
    const { ctx } = fixture(GalaChainTokenContract)
      .callingUser(users.testUser1)
      .savedState(
        tokenClass,
        currency.tokenInstance(),
        currency.tokenBalance(),
        nft.tokenClass(),
        nft.tokenInstance1()
      );

    const request = requestTokenSwap(ctx, {
      offeredBy: users.testUser1.identityKey,
      offered: [leg(currency.tokenInstanceKey(), "1.001")],
      wanted: [leg(nft.tokenInstance1Key(), "1")],
      uses: new BigNumber("1"),
      expires: 0
    });

    await expect(request).rejects.toThrow(/decimal places/);
  });

  it("returns swaps created at or after the supplied timestamp", async () => {
    const earlier = swapAt(1_000);
    const exact = swapAt(2_000);
    const later = swapAt(3_000);
    const { ctx } = fixture(GalaChainTokenContract).savedState(earlier, exact, later);

    const results = await fetchTokenSwaps(ctx, 2_000);

    expect(results.map((swap) => swap.created).sort()).toEqual([2_000, 3_000]);
  });
});

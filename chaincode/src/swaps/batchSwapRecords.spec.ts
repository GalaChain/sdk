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
  TokenBalance,
  TokenInstanceQuantity,
  TokenSwapRequest,
  TokenSwapRequestInstanceWanted
} from "@gala-chain/api";
import { fixture, users } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { currency, nft } from "../testdata";
import { ensureTokenSwapIndexing } from "./ensureTokenSwapIndexing";
import { fillTokenSwap } from "./fillTokenSwap";
import { requestTokenSwap } from "./requestTokenSwap";

function leg(tokenInstance: object, quantity: string): TokenInstanceQuantity {
  return plainToInstance(TokenInstanceQuantity, {
    tokenInstance,
    quantity: new BigNumber(quantity)
  });
}

describe("batch swap records", () => {
  it("stores two swap requests from one transaction under different keys", async () => {
    const { ctx } = fixture(GalaChainTokenContract)
      .callingUser(users.testUser1)
      .savedState(
        currency.tokenClass(),
        currency.tokenInstance(),
        currency.tokenBalance(),
        nft.tokenClass(),
        nft.tokenInstance1()
      );

    const params = {
      offeredBy: users.testUser1.identityKey,
      offered: [leg(currency.tokenInstanceKey(), "1")],
      wanted: [leg(nft.tokenInstance1Key(), "1")],
      uses: new BigNumber("1"),
      expires: 0
    };

    const first = await requestTokenSwap(ctx, params);
    const second = await requestTokenSwap(ctx, params);

    expect(first.swapRequestId).not.toEqual(second.swapRequestId);
    expect(second.requestOrdinal).toEqual("1");

    const requestKeys = Object.keys(ctx.stub.getWrites()).filter((key) =>
      key.startsWith("\u0000GCTSR\u0000")
    );
    expect(requestKeys).toEqual(expect.arrayContaining([first.swapRequestId, second.swapRequestId]));
  });

  it("stores two fills of one swap from one transaction under different keys", async () => {
    const currencyInstanceKey = currency.tokenInstanceKey();
    const swap = plainToInstance(TokenSwapRequest, {
      created: 1,
      txid: "test-tx-id",
      offered: [leg(currencyInstanceKey, "1")],
      wanted: [leg(currencyInstanceKey, "1")],
      offeredBy: users.testUser1.identityKey,
      offeredTo: users.testUser2.identityKey,
      fillIds: [],
      uses: new BigNumber("2"),
      usesSpent: new BigNumber("0"),
      expires: 0
    });
    swap.swapRequestId = swap.getCompositeKey();

    const offeredBalance = plainToInstance(TokenBalance, {
      ...currency.tokenBalance(),
      lockedHolds: [
        {
          createdBy: users.testUser1.identityKey,
          instanceId: currencyInstanceKey.instance,
          quantity: new BigNumber("2"),
          name: swap.swapRequestId,
          created: 1,
          expires: 0
        }
      ]
    });
    const wantedBalance = plainToInstance(TokenBalance, {
      ...currency.tokenBalance(),
      owner: users.testUser2.identityKey,
      quantity: new BigNumber("2"),
      lockedHolds: []
    });

    const { ctx } = fixture(GalaChainTokenContract)
      .callingUser(users.testUser2)
      .savedState(currency.tokenClass(), currency.tokenInstance(), swap, offeredBalance, wantedBalance);

    const first = await fillTokenSwap(ctx, {
      swapRequestId: swap.swapRequestId,
      filledBy: users.testUser2.identityKey,
      uses: new BigNumber("1")
    });
    const second = await fillTokenSwap(ctx, {
      swapRequestId: swap.swapRequestId,
      filledBy: users.testUser2.identityKey,
      uses: new BigNumber("1")
    });

    expect(first.getCompositeKey()).not.toEqual(second.getCompositeKey());
    expect(second.fillOrdinal).toEqual("1");
  });

  it("restores a missing wanted-instance index", async () => {
    const swap = plainToInstance(TokenSwapRequest, {
      created: 1,
      txid: "test-tx-id",
      offered: [leg(currency.tokenInstanceKey(), "1")],
      wanted: [leg(nft.tokenInstance1Key(), "1")],
      offeredBy: users.testUser1.identityKey,
      fillIds: [],
      uses: new BigNumber("1"),
      usesSpent: new BigNumber("1"),
      expires: 0
    });
    swap.swapRequestId = swap.getCompositeKey();

    const { ctx } = fixture(GalaChainTokenContract).savedState(swap);
    const response = await ensureTokenSwapIndexing(ctx, { swapRequestIds: [swap.swapRequestId] });

    const wanted = plainToInstance(TokenSwapRequestInstanceWanted, {
      ...nft.tokenInstance1Key(),
      swapRequestId: swap.swapRequestId
    });
    expect(response.noOp).toEqual(false);
    expect(response.writes.map((write) => write.getCompositeKey())).toContain(wanted.getCompositeKey());
  });
});

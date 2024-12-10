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
  FetchLoanOffersDto,
  GalaChainResponse,
  Lender,
  LoanOffer,
  LoanStatus,
  createValidDTO
} from "@gala-chain/api";
import { fixture, nft, users } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToClass as plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { GalaChainContext } from "../types";

describe("FetchLoanOffers", () => {
  test("FetchLoanOffers provides LoanOffers from chain", async () => {
    // Given
    const { ctx, contract, getWrites } = fixture<GalaChainContext, GalaChainTokenContract>(
      GalaChainTokenContract
    )
      .registeredUsers(users.tokenHolder)
      .savedState();
    const dto = (await createValidDTO(FetchLoanOffersDto, {})).signed(users.tokenHolder.privateKey);

    // When
    const res = await contract.FetchLoanOffers(ctx, dto);

    // Then
    expect(res).toEqual(GalaChainResponse.Success([]));
    expect(getWrites()).toEqual({});
  });

  test("FetchLoanOffers optionally filters by owner and TokenQueryKey", async () => {
    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();

    const mockOffers: LoanOffer[] = [1, 2, 3].map((elem) => {
      return plainToInstance(LoanOffer, {
        ...nftInstanceKey,
        instance: new BigNumber(elem),
        owner: users.tokenHolder.identityKey,
        created: 1,
        id: elem,
        status: LoanStatus.Open,
        uses: new BigNumber("10"),
        usesSpent: new BigNumber("0"),
        expires: 0
      });
    });

    const lendings: Lender[] = mockOffers.map((elem) => elem.Lender());

    const { ctx, contract, getWrites } = fixture<GalaChainContext, GalaChainTokenContract>(
      GalaChainTokenContract
    )
      .registeredUsers(users.tokenHolder)
      .savedState(
        nftClass,
        nftInstance,
        mockOffers[0],
        mockOffers[1],
        mockOffers[2],
        lendings[0],
        lendings[1],
        lendings[2]
      );

    const dto = (
      await createValidDTO(FetchLoanOffersDto, {
        owner: users.tokenHolder.identityKey,
        tokenQuery: nftInstanceKey.toQueryKey()
      })
    ).signed(users.tokenHolder.privateKey);

    // When
    const res = await contract.FetchLoanOffers(ctx, dto);

    // Then
    expect(res).toEqual(GalaChainResponse.Success([...mockOffers]));
    expect(getWrites()).toEqual({});
  });

  test("FetchLoanOffers optionally filters by owner status", async () => {
    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();

    const mockOffers: LoanOffer[] = [1, 2, 3].map((elem) => {
      return plainToInstance(LoanOffer, {
        ...nftInstanceKey,
        instance: new BigNumber(elem),
        owner: users.tokenHolder.identityKey,
        created: 1,
        id: elem,
        status: LoanStatus.Open,
        uses: new BigNumber("10"),
        usesSpent: new BigNumber("0"),
        expires: 0
      });
    });

    const { ctx, contract, getWrites } = fixture<GalaChainContext, GalaChainTokenContract>(
      GalaChainTokenContract
    )
      .registeredUsers(users.tokenHolder)
      .savedState(nftClass, nftInstance, mockOffers[0], mockOffers[1], mockOffers[2]);

    const dto = (
      await createValidDTO(FetchLoanOffersDto, {
        owner: users.tokenHolder.identityKey,
        status: LoanStatus.Fulfilled
      })
    ).signed(users.tokenHolder.privateKey);

    const res = await contract.FetchLoanOffers(ctx, dto);

    expect(res).toEqual(GalaChainResponse.Success([]));
    expect(getWrites()).toEqual({});
  });

  test("FetchLoanOffers optionally filters by TokenQueryKey (and optionally status) agnostic to owner.", async () => {
    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();

    const openOffers: LoanOffer[] = [1, 2, 3].map((elem) => {
      return plainToInstance(LoanOffer, {
        ...nftInstanceKey,
        instance: new BigNumber(elem),
        owner: users.tokenHolder.identityKey,
        created: 1,
        id: elem,
        status: LoanStatus.Open,
        uses: new BigNumber("10"),
        usesSpent: new BigNumber("0"),
        expires: 0
      });
    });

    const fulfilledOffers: LoanOffer[] = [4, 5, 6].map((elem) => {
      return plainToInstance(LoanOffer, {
        ...nftInstanceKey,
        instance: new BigNumber(elem),
        owner: users.tokenHolder.identityKey,
        created: 1,
        id: elem,
        status: LoanStatus.Fulfilled,
        uses: new BigNumber("10"),
        usesSpent: new BigNumber("0"),
        expires: 0
      });
    });

    const { ctx, contract, getWrites } = fixture<GalaChainContext, GalaChainTokenContract>(
      GalaChainTokenContract
    )
      .registeredUsers(users.tokenHolder)
      .savedState(
        nftClass,
        nftInstance,
        openOffers[0],
        openOffers[1],
        openOffers[2],
        fulfilledOffers[0],
        fulfilledOffers[1],
        fulfilledOffers[2]
      );

    const dto = (
      await createValidDTO(FetchLoanOffersDto, {
        tokenQuery: nftInstanceKey.toQueryKey(),
        status: LoanStatus.Open
      })
    ).signed(users.tokenHolder.privateKey);

    const res = await contract.FetchLoanOffers(ctx, dto);

    expect(res).toEqual(GalaChainResponse.Success([...openOffers]));
    expect(getWrites()).toEqual({});
  });
});

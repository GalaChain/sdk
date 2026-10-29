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
  AllowanceType,
  GalaChainResponse,
  RequestTokenSwapDto,
  TokenAllowance,
  TokenBalance,
  TokenHold,
  TokenInstanceQuantity,
  TokenSwapRequest,
  TokenSwapRequestInstanceOffered,
  TokenSwapRequestInstanceWanted,
  TokenSwapRequestOfferedBy,
  createValidDTO
} from "@gala-chain/api";
import { fixture, users, writesMap } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToClass as plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { InsufficientAllowanceError } from "../allowances";
import { currency, nft } from "../testdata/index";
import { SwapDtoValidationError } from "./SwapError";

test("RequestTokenSwap, NFT for currency", async () => {
  // Given - User 1 holds an NFT, wants to swap it for test currency
  const nftInstance = nft.tokenInstance1();
  const nftInstanceKey = nft.tokenInstance1Key();
  const nftClass = nft.tokenClass();

  const currencyInstance = currency.tokenInstance();
  const currencyInstanceKey = currency.tokenInstanceKey();
  const currencyClass = currency.tokenClass();
  const tokenAllowance = currency.tokenAllowance();

  const nfttokenBalance = nft.tokenBalance();

  const nftSalePrice = new BigNumber("1000000");

  const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
    .registeredUsers(users.testUser1)
    .savedState(currencyClass, nftClass, nftInstance, currencyInstance, tokenAllowance, nfttokenBalance);

  const dto = (
    await createValidDTO(RequestTokenSwapDto, {
      offeredBy: users.testUser1.identityKey,
      offered: [
        plainToInstance(TokenInstanceQuantity, {
          tokenInstance: nftInstanceKey,
          quantity: new BigNumber("1")
        })
      ],
      wanted: [
        plainToInstance(TokenInstanceQuantity, {
          tokenInstance: currencyInstanceKey,
          quantity: nftSalePrice
        })
      ],
      uses: new BigNumber("1"),
      expires: 0,
      uniqueKey: "test-swap"
    })
  )
    .withOperation("asset-channel_basic-asset_GalaChainToken:RequestTokenSwap")
    .signed(users.testUser1.privateKey);

  const expectedCurrencySwap = plainToInstance(TokenSwapRequest, {
    created: ctx.txUnixTime,
    txid: ctx.stub.getTxID(),
    swapRequestId: `\u0000GCTSR\u0000${ctx.txUnixTime}\u0000${ctx.stub.getTxID()}\u0000`,
    offered: [
      {
        tokenInstance: nftInstanceKey,
        quantity: new BigNumber("1")
      }
    ],
    wanted: [
      {
        tokenInstance: currencyInstanceKey,
        quantity: nftSalePrice
      }
    ],
    offeredBy: users.testUser1.identityKey,
    offeredTo: undefined,
    fillIds: [],
    uses: new BigNumber("1"),
    usesSpent: new BigNumber("0"),
    expires: 0
  });

  const swapRequestId = expectedCurrencySwap.getCompositeKey();
  expectedCurrencySwap.swapRequestId = swapRequestId;

  const tokenHold = new TokenHold({
    createdBy: users.testUser1.identityKey,
    created: ctx.txUnixTime,
    expires: 0,
    instanceId: nftInstanceKey.instance,
    quantity: new BigNumber("1"),
    lockAuthority: users.testUser1.identityKey,
    name: swapRequestId
  });

  const expectedInstanceOffered = plainToInstance(TokenSwapRequestInstanceOffered, {
    ...nftInstanceKey,
    swapRequestId
  });

  const expectedInstanceWanted = plainToInstance(TokenSwapRequestInstanceWanted, {
    ...currencyInstanceKey,
    swapRequestId
  });

  const expectedOfferedBy = plainToInstance(TokenSwapRequestOfferedBy, {
    offeredBy: users.testUser1.identityKey,
    swapRequestId: swapRequestId
  });

  // When
  const response = await contract.RequestTokenSwap(ctx, dto);

  // Then
  expect(response).toEqual(GalaChainResponse.Success(expectedCurrencySwap));
  expect(getWrites()).toEqual(
    writesMap(
      plainToInstance(TokenBalance, { ...nfttokenBalance, lockedHolds: [tokenHold] }),
      expectedCurrencySwap,
      expectedInstanceOffered,
      expectedInstanceWanted,
      expectedOfferedBy
    )
  );
});

test("RequestTokenSwap on behalf fails when fungible swap allowance covers one use but not uses", async () => {
  // Given - testUser1 owns currency; testUser2 has a Swap allowance for quantity 1 only
  const currencyInstance = currency.tokenInstance();
  const currencyInstanceKey = currency.tokenInstanceKey();
  const currencyClass = currency.tokenClass();
  const nftInstance = nft.tokenInstance1();
  const nftInstanceKey = nft.tokenInstance1Key();
  const nftClass = nft.tokenClass();

  const currencyBalance = plainToInstance(TokenBalance, {
    ...currency.tokenBalance(),
    owner: users.testUser1.identityKey,
    quantity: new BigNumber("1000")
  });

  const swapAllowance = plainToInstance(TokenAllowance, {
    ...currency.tokenAllowancePlain(1),
    grantedBy: users.testUser1.identityKey,
    grantedTo: users.testUser2.identityKey,
    allowanceType: AllowanceType.Swap,
    quantity: new BigNumber("1"),
    quantitySpent: new BigNumber("0"),
    uses: new BigNumber("1"),
    usesSpent: new BigNumber("0")
  });

  const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
    .registeredUsers(users.testUser1, users.testUser2)
    .savedState(currencyClass, currencyInstance, nftClass, nftInstance, currencyBalance, swapAllowance);

  const dto = (
    await createValidDTO(RequestTokenSwapDto, {
      offeredBy: users.testUser1.identityKey,
      offered: [
        plainToInstance(TokenInstanceQuantity, {
          tokenInstance: currencyInstanceKey,
          quantity: new BigNumber("1")
        })
      ],
      wanted: [
        plainToInstance(TokenInstanceQuantity, {
          tokenInstance: nftInstanceKey,
          quantity: new BigNumber("1")
        })
      ],
      uses: new BigNumber("100"),
      expires: 0,
      uniqueKey: "test-swap-on-behalf-fungible-uses"
    })
  )
    .withOperation("asset-channel_basic-asset_GalaChainToken:RequestTokenSwap")
    .signed(users.testUser2.privateKey);

  // When
  const response = await contract.RequestTokenSwap(ctx, dto);

  // Then - allowance must cover quantity * uses (100), not per-use quantity (1)
  expect(response).toEqual(
    GalaChainResponse.Error(
      new InsufficientAllowanceError(
        users.testUser2.identityKey,
        new BigNumber("1"),
        AllowanceType.Swap,
        new BigNumber("100"),
        currencyInstanceKey,
        users.testUser1.identityKey
      )
    )
  );
  expect(getWrites()).toEqual({});
});

test("RequestTokenSwap on behalf rejects multi-use NFT offer", async () => {
  // Given - testUser1 owns an NFT; testUser2 requests a multi-use swap on their behalf
  const nftInstance = nft.tokenInstance1();
  const nftInstanceKey = nft.tokenInstance1Key();
  const nftClass = nft.tokenClass();
  const currencyInstance = currency.tokenInstance();
  const currencyInstanceKey = currency.tokenInstanceKey();
  const currencyClass = currency.tokenClass();
  const nfttokenBalance = nft.tokenBalance();

  const swapAllowance = plainToInstance(TokenAllowance, {
    ...nft.tokenAllowancePlain(1),
    grantedBy: users.testUser1.identityKey,
    grantedTo: users.testUser2.identityKey,
    allowanceType: AllowanceType.Swap,
    quantity: new BigNumber("1"),
    quantitySpent: new BigNumber("0"),
    uses: new BigNumber("1"),
    usesSpent: new BigNumber("0")
  });

  const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
    .registeredUsers(users.testUser1, users.testUser2)
    .savedState(currencyClass, currencyInstance, nftClass, nftInstance, nfttokenBalance, swapAllowance);

  const dto = (
    await createValidDTO(RequestTokenSwapDto, {
      offeredBy: users.testUser1.identityKey,
      offered: [
        plainToInstance(TokenInstanceQuantity, {
          tokenInstance: nftInstanceKey,
          quantity: new BigNumber("1")
        })
      ],
      wanted: [
        plainToInstance(TokenInstanceQuantity, {
          tokenInstance: currencyInstanceKey,
          quantity: new BigNumber("1000000")
        })
      ],
      uses: new BigNumber("100"),
      expires: 0,
      uniqueKey: "test-swap-on-behalf-nft-multi-use"
    })
  )
    .withOperation("asset-channel_basic-asset_GalaChainToken:RequestTokenSwap")
    .signed(users.testUser2.privateKey);

  // When
  const response = await contract.RequestTokenSwap(ctx, dto);

  // Then - one NFT instance cannot back multiple uses; allowance is not consumed and nothing is locked
  expect(response).toEqual(
    GalaChainResponse.Error(
      new SwapDtoValidationError("requestTokenSwap", [
        "Offered non-fungible token instance cannot be used for more than one swap use when offered on behalf of the owner"
      ])
    )
  );
  expect(getWrites()).toEqual({});
});

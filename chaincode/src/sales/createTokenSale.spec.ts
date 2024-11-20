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
  CreateTokenSaleDto,
  GalaChainResponse,
  TokenSale,
  TokenSaleDtoValidationError,
  TokenSaleOwner,
  TokenSaleQuantity,
  TokenSaleTokenCost,
  TokenSaleTokenSold,
  createValidSubmitDTO
} from "@gala-chain/api";
import { currency, fixture, nft, users, writesMap } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";

describe("CreateTokenSale", () => {
  it("should create TokenSale, NFT for currency", async () => {
    // Given - Admin sells an NFT, wants to sell it for test currency
    const nftClassKey = nft.tokenClassKey();
    const nftClass = nft.tokenClass();

    const currencyClass = currency.tokenClass();
    const currencyClassKey = currency.tokenClassKey();
    const tokenAllowance = currency.tokenAllowance();

    const nfttokenBalance = nft.tokenBalance();

    const nftSalePrice = new BigNumber("1000000");

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.admin)
      .savedState(currencyClass, nftClass, tokenAllowance, nfttokenBalance);

    const dto: CreateTokenSaleDto = await createValidSubmitDTO(CreateTokenSaleDto, {
      owner: users.admin.identityKey,
      selling: [
        plainToInstance(TokenSaleQuantity, {
          tokenClassKey: nftClassKey,
          quantity: new BigNumber("1")
        })
      ],
      quantity: new BigNumber(1),
      cost: [
        plainToInstance(TokenSaleQuantity, {
          tokenClassKey: currencyClassKey,
          quantity: nftSalePrice
        })
      ],
      start: ctx.txUnixTime + 2000,
      end: 0,
      uniqueKey: "blah1"
    }).signed(users.admin.privateKey);

    const expectedSale: TokenSale = plainToInstance(TokenSale, {
      created: ctx.txUnixTime,
      txid: ctx.stub.getTxID(),
      tokenSaleId: `\u0000GCTSR\u0000${ctx.txUnixTime}\u0000${ctx.stub.getTxID()}\u0000`,
      selling: [
        {
          tokenClassKey: nftClassKey,
          quantity: new BigNumber("1")
        }
      ],
      cost: [
        {
          tokenClassKey: currencyClassKey,
          quantity: nftSalePrice
        }
      ],
      owner: users.admin.identityKey,
      start: ctx.txUnixTime + 2000,
      end: 0,
      fulfillmentIds: [],
      quantity: new BigNumber(1),
      quantityFulfilled: new BigNumber(0)
    });

    const tokenSaleId = expectedSale.getCompositeKey();
    expectedSale.tokenSaleId = tokenSaleId;

    const expectedTokenForSale = plainToInstance(TokenSaleTokenSold, {
      ...nftClassKey,
      quantity: new BigNumber("1"),
      tokenSaleId
    });

    const expectedTokenCost = plainToInstance(TokenSaleTokenCost, {
      ...currencyClassKey,
      quantity: nftSalePrice,
      tokenSaleId,
      instance: new BigNumber(0)
    });

    const expectedSaleOwner = plainToInstance(TokenSaleOwner, {
      owner: users.admin.identityKey,
      tokenSaleId: tokenSaleId
    });

    // When
    const response = await contract.CreateTokenSale(ctx, dto);

    // Then
    expect(response).toEqual(GalaChainResponse.Success(expectedSale));
    expect(getWrites()).toEqual(
      expect.objectContaining(
        writesMap(expectedSale, expectedTokenCost, expectedSaleOwner, expectedTokenForSale)
      )
    );
  });

  it("sale end time cannot be before current time", async () => {
    // Given - Admin sells an NFT, wants to sell it for test currency
    const nftClassKey = nft.tokenClassKey();
    const nftClass = nft.tokenClass();

    const currencyClass = currency.tokenClass();
    const currencyClassKey = currency.tokenClassKey();
    const tokenAllowance = currency.tokenAllowance();

    const nfttokenBalance = nft.tokenBalance();

    const nftSalePrice = new BigNumber("1000000");

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.admin)
      .savedState(currencyClass, nftClass, tokenAllowance, nfttokenBalance);

    const dto: CreateTokenSaleDto = await createValidSubmitDTO(CreateTokenSaleDto, {
      owner: users.admin.identityKey,
      selling: [
        plainToInstance(TokenSaleQuantity, {
          tokenClassKey: nftClassKey,
          quantity: new BigNumber("1")
        })
      ],
      quantity: new BigNumber(1),
      cost: [
        plainToInstance(TokenSaleQuantity, {
          tokenClassKey: currencyClassKey,
          quantity: nftSalePrice
        })
      ],
      start: ctx.txUnixTime + 2000,
      end: 1,
      uniqueKey: "blah1"
    }).signed(users.admin.privateKey);

    // When
    const response = await contract.CreateTokenSale(ctx, dto).catch((e) => e);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(
        new TokenSaleDtoValidationError("createTokenSale", [
          `If end is provided it must be a valid epoch time in the future: ${dto.end}`
        ])
      )
    );
    expect(getWrites()).toEqual(writesMap());
  });
});

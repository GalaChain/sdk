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
import { FetchTokenSaleByIdDto, GalaChainResponse, TokenSale, createValidDTO } from "@gala-chain/api";
import { currency, fixture, nft, transactionError, users, writesMap } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";

describe("FetchTokenSale", () => {
  it("should fetch TokenSale by id", async () => {
    // Given
    const currencyClass = currency.tokenClass();
    const currencyClassKey = currency.tokenClassKey();
    const nftSalePrice = new BigNumber("1000000");

    const nftClass = nft.tokenClass();
    const nftClassKey = nft.tokenClassKey();

    const givenSale: TokenSale = plainToInstance(TokenSale, {
      created: 1,
      txid: "test-tx-id",
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
      start: 1,
      end: 0,
      fulfillmentIds: [],
      quantity: new BigNumber(2),
      quantityFulfilled: new BigNumber(0)
    });
    givenSale.tokenSaleId = givenSale.getCompositeKey();

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser2)
      .savedState(nftClass, currencyClass, givenSale);

    // When
    const dto = await createValidDTO(FetchTokenSaleByIdDto, {
      tokenSaleId: givenSale.tokenSaleId,
      uniqueKey: "blah1"
    }).signed(users.testUser2.privateKey);

    const response = await contract.FetchTokenSaleById(ctx, dto);

    // Then
    expect(response).toEqual(GalaChainResponse.Success(givenSale));
    expect(getWrites()).toEqual(writesMap());
  });

  it("should fail to fetch TokenSale if id does not exist", async () => {
    // Given
    const currencyClass = currency.tokenClass();
    const currencyClassKey = currency.tokenClassKey();
    const nftSalePrice = new BigNumber("1000000");

    const nftClass = nft.tokenClass();
    const nftClassKey = nft.tokenClassKey();

    const givenSale: TokenSale = plainToInstance(TokenSale, {
      created: 1,
      txid: "test-tx-id",
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
      start: 1,
      end: 0,
      fulfillmentIds: [],
      quantity: new BigNumber(2),
      quantityFulfilled: new BigNumber(0)
    });
    givenSale.tokenSaleId = givenSale.getCompositeKey();

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser2)
      .savedState(nftClass, currencyClass);

    // When
    const dto = await createValidDTO(FetchTokenSaleByIdDto, {
      tokenSaleId: givenSale.tokenSaleId,
      uniqueKey: "blah2"
    }).signed(users.testUser2.privateKey);

    const response = await contract.FetchTokenSaleById(ctx, dto).catch((e) => e);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error({ message: `Token sale with tokenSaleId ${givenSale.tokenSaleId} not found.` })
    );
    expect(getWrites()).toEqual(writesMap());
  });
});

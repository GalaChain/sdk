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
  FulfillTokenSaleDto,
  GalaChainResponse,
  TokenAllowance,
  TokenBalance,
  TokenClass,
  TokenInstance,
  TokenSale,
  TokenSaleDtoValidationError,
  TokenSaleFulfillment,
  TokenSaleMintAllowance,
  createValidDTO,
  createValidSubmitDTO
} from "@gala-chain/api";
import { currency, fixture, nft, users, writesMap } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";

describe("FulfillTokenSale", () => {
  it("should fulfill TokenSale", async () => {
    // Given
    const currencyClass = currency.tokenClass();
    const currencyClassKey = currency.tokenClassKey();
    const currencyInstance = currency.tokenInstance();
    const nftSalePrice = new BigNumber("1000000");
    const tokenBalance = plainToInstance(TokenBalance, {
      ...currency.tokenBalance(),
      quantity: nftSalePrice,
      owner: users.testUser2.identityKey
    });

    const nftInstance = nft.tokenInstance1();
    const nftClass = nft.tokenClass();
    const nftClassKey = nft.tokenClassKey();
    const nftTokenBalance = nft.tokenBalance();
    const tokenAllowance = nft.tokenAllowance();
    const tokenMintAllowance = nft.tokenMintAllowance();
    tokenMintAllowance.quantity = new BigNumber(1);

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
      quantity: new BigNumber(1),
      quantityFulfilled: new BigNumber(0)
    });
    givenSale.tokenSaleId = givenSale.getCompositeKey();

    const givenSaleMintAllowance: TokenSaleMintAllowance = plainToInstance(TokenSaleMintAllowance, {
      ...nftClassKey,
      quantity: tokenMintAllowance.quantity,
      tokenSaleId: givenSale.tokenSaleId
    });
    givenSaleMintAllowance.allowanceObjectKey = tokenMintAllowance.getCompositeKey();

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser2)
      .savedState(
        nftClass,
        currencyClass,
        currencyInstance,
        tokenAllowance,
        givenSale,
        givenSaleMintAllowance,
        tokenBalance,
        tokenMintAllowance
      );

    const dto: FulfillTokenSaleDto = await createValidDTO(FulfillTokenSaleDto, {
      fulfilledBy: users.testUser2.identityKey,
      quantity: new BigNumber(1),
      tokenSaleId: givenSale.tokenSaleId,
      uniqueKey: "blah2"
    }).signed(users.testUser2.privateKey);

    const expectedTokenSaleFulfillment: TokenSaleFulfillment = plainToInstance(TokenSaleFulfillment, {
      tokenSaleId: givenSale.tokenSaleId,
      fulfilledBy: users.testUser2.identityKey,
      quantity: new BigNumber(1),
      created: ctx.txUnixTime
    });

    const expectedTokenSale = plainToInstance(TokenSale, {
      ...givenSale,
      quantityFulfilled: new BigNumber(1),
      fulfillmentIds: [expectedTokenSaleFulfillment.getCompositeKey()]
    });

    // When
    const response = await contract.FulfillTokenSale(ctx, dto);

    // Then
    expect(response).toEqual(GalaChainResponse.Success(expectedTokenSaleFulfillment));
    expect(getWrites()).toEqual(
      expect.objectContaining(
        writesMap(
          plainToInstance(TokenAllowance, {
            ...tokenMintAllowance,
            usesSpent: new BigNumber(1),
            quantitySpent: new BigNumber(1),
            expires: ctx.txUnixTime
          }),
          plainToInstance(TokenBalance, { ...tokenBalance, quantity: new BigNumber(0) }),
          plainToInstance(TokenBalance, { ...nftTokenBalance, owner: users.testUser2.identityKey }),
          plainToInstance(TokenBalance, { ...tokenBalance, owner: users.admin.identityKey }),
          plainToInstance(TokenClass, { ...nftClass, totalSupply: new BigNumber(1) }),
          plainToInstance(TokenInstance, { ...nftInstance, owner: users.testUser2.identityKey }),
          expectedTokenSaleFulfillment,
          expectedTokenSale
        )
      )
    );
  });

  it("should fail if calling user does not match fulfiller", async () => {
    // Given
    const currencyClass = currency.tokenClass();
    const currencyClassKey = currency.tokenClassKey();
    const currencyInstance = currency.tokenInstance();
    const nftSalePrice = new BigNumber("1000000");
    const tokenBalance = plainToInstance(TokenBalance, {
      ...currency.tokenBalance(),
      quantity: nftSalePrice,
      owner: users.testUser2.identityKey
    });

    const nftClass = nft.tokenClass();
    const nftClassKey = nft.tokenClassKey();
    const tokenAllowance = nft.tokenAllowance();
    const tokenMintAllowance = nft.tokenMintAllowance();
    tokenMintAllowance.quantity = new BigNumber(1);

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
      quantity: new BigNumber(1),
      quantityFulfilled: new BigNumber(0)
    });
    givenSale.tokenSaleId = givenSale.getCompositeKey();

    const givenSaleMintAllowance: TokenSaleMintAllowance = plainToInstance(TokenSaleMintAllowance, {
      ...nftClassKey,
      quantity: tokenMintAllowance.quantity,
      tokenSaleId: givenSale.tokenSaleId
    });
    givenSaleMintAllowance.allowanceObjectKey = tokenMintAllowance.getCompositeKey();

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser1)
      .savedState(
        nftClass,
        currencyClass,
        currencyInstance,
        tokenAllowance,
        givenSale,
        givenSaleMintAllowance,
        tokenBalance,
        tokenMintAllowance
      );

    const dto: FulfillTokenSaleDto = await createValidDTO(FulfillTokenSaleDto, {
      fulfilledBy: users.testUser2.identityKey,
      quantity: new BigNumber(1),
      tokenSaleId: givenSale.tokenSaleId,
      uniqueKey: "blah2"
    }).signed(users.testUser1.privateKey);

    // When
    const response = await contract.FulfillTokenSale(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(
        new TokenSaleDtoValidationError("fulfillTokenSale", [
          `Sales cannot be initated on another's behalf at this time. TokenSaleId ${givenSale.tokenSaleId}`
        ])
      )
    );
    expect(getWrites()).toEqual(writesMap());
  });

  it("should fail if sale hasn't started", async () => {
    // Given
    const currencyClass = currency.tokenClass();
    const currencyClassKey = currency.tokenClassKey();
    const currencyInstance = currency.tokenInstance();
    const nftSalePrice = new BigNumber("1000000");
    const tokenBalance = plainToInstance(TokenBalance, {
      ...currency.tokenBalance(),
      quantity: nftSalePrice,
      owner: users.testUser2.identityKey
    });

    const nftClass = nft.tokenClass();
    const nftClassKey = nft.tokenClassKey();
    const tokenAllowance = nft.tokenAllowance();
    const tokenMintAllowance = nft.tokenMintAllowance();
    tokenMintAllowance.quantity = new BigNumber(1);

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
      start: Date.now() + 4000,
      end: 0,
      fulfillmentIds: [],
      quantity: new BigNumber(1),
      quantityFulfilled: new BigNumber(0)
    });
    givenSale.tokenSaleId = givenSale.getCompositeKey();

    const givenSaleMintAllowance: TokenSaleMintAllowance = plainToInstance(TokenSaleMintAllowance, {
      ...nftClassKey,
      quantity: tokenMintAllowance.quantity,
      tokenSaleId: givenSale.tokenSaleId
    });
    givenSaleMintAllowance.allowanceObjectKey = tokenMintAllowance.getCompositeKey();

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser2)
      .savedState(
        nftClass,
        currencyClass,
        currencyInstance,
        tokenAllowance,
        givenSale,
        givenSaleMintAllowance,
        tokenBalance,
        tokenMintAllowance
      );

    const dto: FulfillTokenSaleDto = await createValidDTO(FulfillTokenSaleDto, {
      fulfilledBy: users.testUser2.identityKey,
      quantity: new BigNumber(1),
      tokenSaleId: givenSale.tokenSaleId,
      uniqueKey: "blah2"
    }).signed(users.testUser2.privateKey);

    // When
    const response = await contract.FulfillTokenSale(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(
        new TokenSaleDtoValidationError("fulfillTokenSale", [
          `Token sale has not started. tokenSaleId ${givenSale.tokenSaleId}`
        ])
      )
    );
    expect(getWrites()).toEqual(writesMap());
  });

  it("should fail if sale has ended", async () => {
    // Given
    const currencyClass = currency.tokenClass();
    const currencyClassKey = currency.tokenClassKey();
    const currencyInstance = currency.tokenInstance();
    const nftSalePrice = new BigNumber("1000000");
    const tokenBalance = plainToInstance(TokenBalance, {
      ...currency.tokenBalance(),
      quantity: nftSalePrice,
      owner: users.testUser2.identityKey
    });

    const nftClass = nft.tokenClass();
    const nftClassKey = nft.tokenClassKey();
    const tokenAllowance = nft.tokenAllowance();
    const tokenMintAllowance = nft.tokenMintAllowance();
    tokenMintAllowance.quantity = new BigNumber(1);

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
      end: 2,
      fulfillmentIds: [],
      quantity: new BigNumber(1),
      quantityFulfilled: new BigNumber(0)
    });
    givenSale.tokenSaleId = givenSale.getCompositeKey();

    const givenSaleMintAllowance: TokenSaleMintAllowance = plainToInstance(TokenSaleMintAllowance, {
      ...nftClassKey,
      quantity: tokenMintAllowance.quantity,
      tokenSaleId: givenSale.tokenSaleId
    });
    givenSaleMintAllowance.allowanceObjectKey = tokenMintAllowance.getCompositeKey();

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser2)
      .savedState(
        nftClass,
        currencyClass,
        currencyInstance,
        tokenAllowance,
        givenSale,
        givenSaleMintAllowance,
        tokenBalance,
        tokenMintAllowance
      );

    const dto: FulfillTokenSaleDto = await createValidSubmitDTO(FulfillTokenSaleDto, {
      fulfilledBy: users.testUser2.identityKey,
      quantity: new BigNumber(1),
      tokenSaleId: givenSale.tokenSaleId,
      uniqueKey: "blah2"
    }).signed(users.testUser2.privateKey);

    // When
    const response = await contract.FulfillTokenSale(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(
        new TokenSaleDtoValidationError("fulfillTokenSale", [
          `Token sale has ended. tokenSaleId ${givenSale.tokenSaleId}`
        ])
      )
    );
    expect(getWrites()).toEqual(writesMap());
  });

  it("should fail if full sale quantity is fulfilled already", async () => {
    // Given
    const currencyClass = currency.tokenClass();
    const currencyClassKey = currency.tokenClassKey();
    const currencyInstance = currency.tokenInstance();
    const nftSalePrice = new BigNumber("1000000");
    const tokenBalance = plainToInstance(TokenBalance, {
      ...currency.tokenBalance(),
      quantity: nftSalePrice,
      owner: users.testUser2.identityKey
    });

    const nftClass = nft.tokenClass();
    const nftClassKey = nft.tokenClassKey();
    const tokenAllowance = nft.tokenAllowance();
    const tokenMintAllowance = nft.tokenMintAllowance();
    tokenMintAllowance.quantity = new BigNumber(1);

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
      quantity: new BigNumber(1),
      quantityFulfilled: new BigNumber(1)
    });
    givenSale.tokenSaleId = givenSale.getCompositeKey();

    const givenSaleMintAllowance: TokenSaleMintAllowance = plainToInstance(TokenSaleMintAllowance, {
      ...nftClassKey,
      quantity: tokenMintAllowance.quantity,
      tokenSaleId: givenSale.tokenSaleId
    });
    givenSaleMintAllowance.allowanceObjectKey = tokenMintAllowance.getCompositeKey();

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser2)
      .savedState(
        nftClass,
        currencyClass,
        currencyInstance,
        tokenAllowance,
        givenSale,
        givenSaleMintAllowance,
        tokenBalance,
        tokenMintAllowance
      );

    const dto: FulfillTokenSaleDto = await createValidSubmitDTO(FulfillTokenSaleDto, {
      fulfilledBy: users.testUser2.identityKey,
      quantity: new BigNumber(1),
      tokenSaleId: givenSale.tokenSaleId,
      uniqueKey: "blah2"
    }).signed(users.testUser2.privateKey);

    // When
    const response = await contract.FulfillTokenSale(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(
        new TokenSaleDtoValidationError("fulfillTokenSale", [
          `Sales quantity remaining must be >= 0 (1 - 1 = 0. tokenSaleId ${givenSale.tokenSaleId})`,
          `Insufficient quantity remaining on this sale to fulfill. tokenSaleId ${givenSale.tokenSaleId}`
        ])
      )
    );
    expect(getWrites()).toEqual(writesMap());
  });

  it("should fail if fullfillment quantity is more than remaining quantity", async () => {
    // Given
    const currencyClass = currency.tokenClass();
    const currencyClassKey = currency.tokenClassKey();
    const currencyInstance = currency.tokenInstance();
    const nftSalePrice = new BigNumber("1000000");
    const tokenBalance = plainToInstance(TokenBalance, {
      ...currency.tokenBalance(),
      quantity: nftSalePrice,
      owner: users.testUser2.identityKey
    });

    const nftClass = nft.tokenClass();
    const nftClassKey = nft.tokenClassKey();
    const tokenAllowance = nft.tokenAllowance();
    const tokenMintAllowance = nft.tokenMintAllowance();
    tokenMintAllowance.quantity = new BigNumber(2);

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
      quantityFulfilled: new BigNumber(1)
    });
    givenSale.tokenSaleId = givenSale.getCompositeKey();

    const givenSaleMintAllowance: TokenSaleMintAllowance = plainToInstance(TokenSaleMintAllowance, {
      ...nftClassKey,
      quantity: tokenMintAllowance.quantity,
      tokenSaleId: givenSale.tokenSaleId
    });
    givenSaleMintAllowance.allowanceObjectKey = tokenMintAllowance.getCompositeKey();

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser2)
      .savedState(
        nftClass,
        currencyClass,
        currencyInstance,
        tokenAllowance,
        givenSale,
        givenSaleMintAllowance,
        tokenBalance,
        tokenMintAllowance
      );

    const dto: FulfillTokenSaleDto = await createValidSubmitDTO(FulfillTokenSaleDto, {
      fulfilledBy: users.testUser2.identityKey,
      quantity: new BigNumber(2),
      tokenSaleId: givenSale.tokenSaleId,
      uniqueKey: "blah2"
    }).signed(users.testUser2.privateKey);

    // When
    const response = await contract.FulfillTokenSale(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(
        new TokenSaleDtoValidationError("fulfillTokenSale", [
          `Insufficient quantity remaining on this sale to fulfill. tokenSaleId ${givenSale.tokenSaleId}`
        ])
      )
    );
    expect(getWrites()).toEqual(writesMap());
  });

  it("should fail if fullfillment quantity is zero", async () => {
    // Given
    const currencyClass = currency.tokenClass();
    const currencyClassKey = currency.tokenClassKey();
    const currencyInstance = currency.tokenInstance();
    const nftSalePrice = new BigNumber("1000000");
    const tokenBalance = plainToInstance(TokenBalance, {
      ...currency.tokenBalance(),
      quantity: nftSalePrice,
      owner: users.testUser2.identityKey
    });

    const nftClass = nft.tokenClass();
    const nftClassKey = nft.tokenClassKey();
    const tokenAllowance = nft.tokenAllowance();
    const tokenMintAllowance = nft.tokenMintAllowance();
    tokenMintAllowance.quantity = new BigNumber(1);

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
      quantityFulfilled: new BigNumber(1)
    });
    givenSale.tokenSaleId = givenSale.getCompositeKey();

    const givenSaleMintAllowance: TokenSaleMintAllowance = plainToInstance(TokenSaleMintAllowance, {
      ...nftClassKey,
      quantity: tokenMintAllowance.quantity,
      tokenSaleId: givenSale.tokenSaleId
    });
    givenSaleMintAllowance.allowanceObjectKey = tokenMintAllowance.getCompositeKey();

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser2)
      .savedState(
        nftClass,
        currencyClass,
        currencyInstance,
        tokenAllowance,
        givenSale,
        givenSaleMintAllowance,
        tokenBalance,
        tokenMintAllowance
      );

    const dto: FulfillTokenSaleDto = await createValidSubmitDTO(FulfillTokenSaleDto, {
      fulfilledBy: users.testUser2.identityKey,
      quantity: new BigNumber(0),
      tokenSaleId: givenSale.tokenSaleId,
      uniqueKey: "blah2"
    }).signed(users.testUser2.privateKey);

    // When
    const response = await contract.FulfillTokenSale(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(
        new TokenSaleDtoValidationError("fulfillTokenSale", [
          `Quantity must be > 0. tokenSaleId ${givenSale.tokenSaleId}`
        ])
      )
    );
    expect(getWrites()).toEqual(writesMap());
  });

  it("should fail if insufficient mint allowance", async () => {
    // Given
    const currencyClass = currency.tokenClass();
    const currencyClassKey = currency.tokenClassKey();
    const currencyInstance = currency.tokenInstance();
    const nftSalePrice = new BigNumber("1000000");
    const tokenBalance = plainToInstance(TokenBalance, {
      ...currency.tokenBalance(),
      quantity: nftSalePrice.multipliedBy(2),
      owner: users.testUser2.identityKey
    });

    const nftClass = nft.tokenClass();
    const nftClassKey = nft.tokenClassKey();
    const tokenAllowance = nft.tokenAllowance();
    const tokenMintAllowance = nft.tokenMintAllowance();
    tokenMintAllowance.quantity = new BigNumber(1);

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

    const givenSaleMintAllowance: TokenSaleMintAllowance = plainToInstance(TokenSaleMintAllowance, {
      ...nftClassKey,
      quantity: tokenMintAllowance.quantity,
      tokenSaleId: givenSale.tokenSaleId
    });
    givenSaleMintAllowance.allowanceObjectKey = tokenMintAllowance.getCompositeKey();

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser2)
      .savedState(
        nftClass,
        currencyClass,
        currencyInstance,
        tokenAllowance,
        givenSale,
        givenSaleMintAllowance,
        tokenBalance,
        tokenMintAllowance
      );

    const dto: FulfillTokenSaleDto = await createValidSubmitDTO(FulfillTokenSaleDto, {
      fulfilledBy: users.testUser2.identityKey,
      quantity: new BigNumber(2),
      tokenSaleId: givenSale.tokenSaleId,
      uniqueKey: "blah2"
    }).signed(users.testUser2.privateKey);

    // When
    const response = await contract.FulfillTokenSale(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(
        new TokenSaleDtoValidationError("fulfillTokenSale", [
          `Insufficient allowance 1, needed: 2 for TEST$Item$Potion$Elixir on sale ${givenSale.tokenSaleId}`
        ])
      )
    );
    expect(getWrites()).toEqual(writesMap());
  });
});

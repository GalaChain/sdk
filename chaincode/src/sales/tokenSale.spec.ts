import {
  CreateTokenSaleDto,
  FulfillTokenSaleDto,
  GalaChainResponse,
  TokenAllowance,
  TokenBalance,
  TokenInstanceQuantity,
  TokenSale,
  TokenSaleFulfillment,
  TokenSaleOwner,
  TokenSaleTokenCost,
  TokenSaleTokenSold
} from "@gala-chain/api";
import { currency, fixture, nft, users, writesMap } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";

describe("TokenSale", () => {
  it("should create TokenSale, NFT for currency", async () => {
    // Given - Admin sells an NFT, wants to sell it for test currency
    const nftClassKey = nft.tokenClassKey();
    const nftClass = nft.tokenClass();

    const currencyClass = currency.tokenClass();
    const currencyClassKey = currency.tokenClassKey();
    const tokenAllowance = currency.tokenAllowance();

    const nfttokenBalance = nft.tokenBalance();

    const nftSalePrice = new BigNumber("1000000");

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testAdminId)
      .savedState(currencyClass, nftClass, tokenAllowance, nfttokenBalance);

    const dto: CreateTokenSaleDto = plainToInstance(CreateTokenSaleDto, {
      owner: users.testAdminId,
      selling: [
        plainToInstance(TokenInstanceQuantity, {
          tokenClassKey: nftClassKey,
          quantity: new BigNumber("1")
        })
      ],
      quantity: new BigNumber(1),
      cost: [
        plainToInstance(TokenInstanceQuantity, {
          tokenClassKey: currencyClassKey,
          quantity: nftSalePrice
        })
      ],
      start: ctx.txUnixTime + 2000,
      end: 0
    });

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
      owner: users.testAdminId,
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
      tokenSaleId
    });

    const expectedSaleOwner = plainToInstance(TokenSaleOwner, {
      owner: users.testAdminId,
      tokenSaleId: tokenSaleId
    });

    // When
    const response = await contract.CreateTokenSale(ctx, dto);

    // Then
    expect(response).toEqual(GalaChainResponse.Success(expectedSale));
    expect(writes).toEqual(
      writesMap(expectedSale, expectedTokenCost, expectedSaleOwner, expectedTokenForSale)
    );
  });

  it("should fulfill TokenSale", async () => {
    // Given
    const currencyClass = currency.tokenClass();
    const currencyClassKey = currency.tokenClassKey();
    const currencyInstance = currency.tokenInstance();
    const currencyInstanceKey = currency.tokenInstanceKey();
    const nftSalePrice = new BigNumber("1000000");
    const tokenBalance = plainToInstance(TokenBalance, {
      ...currency.tokenBalance(),
      quantity: nftSalePrice,
      owner: users.testUser2Id
    });

    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();
    const nftClassKey = nft.tokenClassKey();
    const nftTokenBalance = nft.tokenBalance();
    const tokenAllowance = nft.tokenAllowance();
    const tokenMintAllowance = nft.tokenMintAllowance();

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
      owner: users.testAdminId,
      start: 1,
      end: 0,
      fulfillmentIds: [],
      quantity: new BigNumber(2),
      quantityFulfilled: new BigNumber(0)
    });
    givenSale.tokenSaleId = givenSale.getCompositeKey();

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testUser2Id)
      .savedState(
        nftClass,
        nftInstance,
        currencyClass,
        currencyInstance,
        tokenAllowance,
        givenSale,
        tokenBalance,
        tokenMintAllowance
      );

    const dto: FulfillTokenSaleDto = plainToInstance(FulfillTokenSaleDto, {
      fulfilledBy: users.testUser2Id,
      // quantity: new BigNumber(1),
      tokenSaleId: givenSale.tokenSaleId,
      expectedTokenSale: givenSale
    });

    const expectedTokenSaleFulfillment: TokenSaleFulfillment = plainToInstance(TokenSaleFulfillment, {
      tokenSaleId: givenSale.tokenSaleId,
      fulfilledBy: users.testUser2Id,
      quantity: new BigNumber(1),
      created: ctx.txUnixTime
    });

    const expectedTokenSale = plainToInstance(TokenSale, {
      ...givenSale,
      fullfillmentIds: [expectedTokenSaleFulfillment.getCompositeKey()]
    });

    // When
    const response = await contract.FulfillTokenSale(ctx, dto);

    // Then
    expect(response).toEqual(GalaChainResponse.Success(expectedTokenSaleFulfillment));
    expect(writes).toEqual(
      writesMap(
        plainToInstance(TokenAllowance, {
          ...tokenMintAllowance,
          usesSpent: new BigNumber(1),
          quantitySpent: new BigNumber(1),
          expires: ctx.txUnixTime
        }),
        plainToInstance(TokenBalance, { ...tokenBalance, quantity: new BigNumber(0) }),
        // TODO: this NFT is supposed to be minted to testUser2
        plainToInstance(TokenBalance, { ...nftTokenBalance, owner: users.testAdminId }),
        plainToInstance(TokenBalance, { ...tokenBalance, owner: users.testAdminId }),
        expectedTokenSaleFulfillment,
        expectedTokenSale
      )
    );
  });
});

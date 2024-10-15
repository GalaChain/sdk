import {
  CreateTokenSaleDto,
  FetchTokenSaleByIdDto,
  FulfillTokenSaleDto,
  GalaChainResponse,
  TokenAllowance,
  TokenBalance,
  TokenClass,
  TokenInstance,
  TokenSale,
  TokenSaleFulfillment,
  TokenSaleMintAllowance,
  TokenSaleOwner,
  TokenSaleQuantity,
  TokenSaleTokenCost,
  TokenSaleTokenSold,
  createValidDTO
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

    const dto: CreateTokenSaleDto = await createValidDTO(CreateTokenSaleDto, {
      owner: users.testAdminId,
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
      tokenSaleId,
      instance: new BigNumber(0)
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
      expect.objectContaining(
        writesMap(expectedSale, expectedTokenCost, expectedSaleOwner, expectedTokenForSale)
      )
    );
  });

  it("should fulfill TokenSale", async () => {
    // Given
    const currencyClass = currency.tokenClass();
    const currencyClassKey = currency.tokenClassKey();
    const currencyInstance = currency.tokenInstance();
    const nftSalePrice = new BigNumber("1000000");
    const tokenBalance = plainToInstance(TokenBalance, {
      ...currency.tokenBalance(),
      quantity: nftSalePrice,
      owner: users.testUser2Id
    });

    const nftInstance = nft.tokenInstance1();
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
      quantity: new BigNumber(1),
      quantityFulfilled: new BigNumber(0)
    });
    givenSale.tokenSaleId = givenSale.getCompositeKey();

    const givenSaleMintAllowance: TokenSaleMintAllowance = plainToInstance(TokenSaleMintAllowance, {
      ...nftClass,
      quantity: new BigNumber(1),
      tokenSaleId: givenSale.tokenSaleId
    });
    givenSaleMintAllowance.allowanceObjectKey = tokenMintAllowance.getCompositeKey();

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testUser2Id)
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
      fulfilledBy: users.testUser2Id,
      quantity: new BigNumber(1),
      tokenSaleId: givenSale.tokenSaleId,
      uniqueKey: "blah2"
    });

    const expectedTokenSaleFulfillment: TokenSaleFulfillment = plainToInstance(TokenSaleFulfillment, {
      tokenSaleId: givenSale.tokenSaleId,
      fulfilledBy: users.testUser2Id,
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
    expect(writes).toEqual(
      expect.objectContaining(
        writesMap(
          plainToInstance(TokenAllowance, {
            ...tokenMintAllowance,
            usesSpent: new BigNumber(1),
            quantitySpent: new BigNumber(1),
            expires: ctx.txUnixTime
          }),
          plainToInstance(TokenBalance, { ...tokenBalance, quantity: new BigNumber(0) }),
          plainToInstance(TokenBalance, { ...nftTokenBalance, owner: users.testUser2Id }),
          plainToInstance(TokenBalance, { ...tokenBalance, owner: users.testAdminId }),
          plainToInstance(TokenClass, { ...nftClass, totalSupply: new BigNumber(1) }),
          plainToInstance(TokenInstance, { ...nftInstance, owner: users.testUser2Id }),
          expectedTokenSaleFulfillment,
          expectedTokenSale
        )
      )
    );
  });

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
      .savedState(nftClass, currencyClass, givenSale);

    // When
    const response = await contract.FetchTokenSaleById(
      ctx,
      plainToInstance(FetchTokenSaleByIdDto, { tokenSaleId: givenSale.tokenSaleId })
    );

    // Then
    expect(response).toEqual(GalaChainResponse.Success(givenSale));
    expect(writes).toEqual(writesMap());
  });
});

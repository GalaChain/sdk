import {
  BatchFillTokenSwapDto,
  ErrorCode,
  ExpectedTokenSwap,
  FillTokenSwapDto,
  GalaChainResponse,
  TokenBalance,
  TokenInstance,
  TokenSwapFill,
  TokenSwapRequest,
  createValidDTO
} from "@gala-chain/api";
import { currency, fixture, nft, users, writesMap } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";

describe("FillTokenSwap", () => {
  test("NFT for currency", async () => {
    // Given
    const currencyClass = currency.tokenClass();
    const currencyInstance = currency.tokenInstance();
    const currencyInstanceKey = currency.tokenInstanceKey();
    const nftSalePrice = new BigNumber("1000000");
    const tokenBalance = plainToInstance(TokenBalance, {
      ...currency.tokenBalance(),
      quantity: nftSalePrice,
      owner: users.testUser2.identityKey
    });

    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();
    const tokenAllowance = nft.tokenAllowance();

    const expectedCurrencySwap = plainToInstance(TokenSwapRequest, {
      created: 1,
      txid: "test-tx-id",
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
      offeredTo: users.testUser2.identityKey,
      fillIds: [],
      uses: new BigNumber("1"),
      usesSpent: new BigNumber("0"),
      expires: 0
    });

    expectedCurrencySwap.swapRequestId = expectedCurrencySwap.getCompositeKey();

    const nftBalance = plainToInstance(TokenBalance, {
      ...nft.tokenBalance(),
      lockedHolds: [
        {
          createdBy: users.testUser1.identityKey,
          instanceId: nftInstance.instance,
          quantity: new BigNumber("1"),
          name: expectedCurrencySwap.swapRequestId,
          created: 1,
          expires: 0
        }
      ]
    });

    expect(expectedCurrencySwap.swapRequestId).toBe(`\u0000GCTSR\u00001\u0000test-tx-id\u0000`);

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser2)
      .savedState(
        nftClass,
        nftInstance,
        currencyClass,
        currencyInstance,
        tokenAllowance,
        expectedCurrencySwap,
        tokenBalance,
        nftBalance
      );

    const dto = (
      await createValidDTO(FillTokenSwapDto, {
        swapRequestId: expectedCurrencySwap.getCompositeKey(),
        uses: new BigNumber("1"),
        uniqueKey: "test-fill-token-swap-dto"
      })
    ).signed(users.testUser2.privateKey);

    const expectedResponse = plainToInstance(TokenSwapFill, {
      created: ctx.txUnixTime,
      filledBy: users.testUser2.identityKey,
      swapRequestId: expectedCurrencySwap.getCompositeKey(),
      uses: new BigNumber("1")
    });

    const response = await contract.FillTokenSwap(ctx, dto).catch((e) => e);

    expect(response).toEqual(GalaChainResponse.Success(expectedResponse));
    expect(getWrites()).toEqual(
      writesMap(
        plainToInstance(TokenBalance, {
          ...nftBalance,
          quantity: new BigNumber(0),
          instanceIds: [],
          lockedHolds: []
        }),
        plainToInstance(TokenBalance, {
          ...nftBalance,
          owner: users.testUser2.identityKey,
          quantity: new BigNumber(1),
          instanceIds: [new BigNumber(1)],
          lockedHolds: []
        }),
        plainToInstance(TokenInstance, {
          ...nftInstance,
          owner: users.testUser2.identityKey
        }),
        plainToInstance(TokenBalance, {
          ...tokenBalance,
          quantity: new BigNumber("0"),
          lockedHolds: []
        }),
        plainToInstance(TokenBalance, {
          ...tokenBalance,
          owner: users.testUser1.identityKey,
          quantity: new BigNumber("1000000"),
          lockedHolds: []
        }),
        expectedResponse,
        plainToInstance(TokenSwapRequest, {
          ...expectedCurrencySwap,
          fillIds: [expectedResponse.getCompositeKey()],
          usesSpent: new BigNumber("1")
        })
      )
    );
  });

  test("NFT for currency with expected swap", async () => {
    // Given
    const currencyClass = currency.tokenClass();
    const currencyInstance = currency.tokenInstance();
    const currencyInstanceKey = currency.tokenInstanceKey();
    const nftSalePrice = new BigNumber("1000000");
    const tokenBalance = plainToInstance(TokenBalance, {
      ...currency.tokenBalance(),
      quantity: nftSalePrice,
      owner: users.testUser2.identityKey
    });

    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();
    const tokenAllowance = nft.tokenAllowance();

    const expectedCurrencySwap = plainToInstance(TokenSwapRequest, {
      created: 1,
      txid: "test-tx-id",
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
      offeredTo: users.testUser2.identityKey,
      fillIds: [],
      uses: new BigNumber("1"),
      usesSpent: new BigNumber("0"),
      expires: 0
    });

    expectedCurrencySwap.swapRequestId = expectedCurrencySwap.getCompositeKey();

    const nftBalance = plainToInstance(TokenBalance, {
      ...nft.tokenBalance(),
      lockedHolds: [
        {
          createdBy: users.testUser1.identityKey,
          instanceId: nftInstance.instance,
          quantity: new BigNumber("1"),
          name: expectedCurrencySwap.swapRequestId,
          created: 1,
          expires: 0
        }
      ]
    });

    expect(expectedCurrencySwap.swapRequestId).toBe(`\u0000GCTSR\u00001\u0000test-tx-id\u0000`);

    const { ctx, contract } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser2)
      .savedState(
        nftClass,
        nftInstance,
        currencyClass,
        currencyInstance,
        tokenAllowance,
        expectedCurrencySwap,
        tokenBalance,
        nftBalance
      );

    const expectedTokenSwap = plainToInstance(ExpectedTokenSwap, {
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
      ]
    });

    const dto = (
      await createValidDTO(FillTokenSwapDto, {
        swapRequestId: expectedCurrencySwap.getCompositeKey(),
        uses: new BigNumber("1"),
        expectedTokenSwap: expectedTokenSwap,
        uniqueKey: "test-fill-token-swap-dto"
      })
    ).signed(users.testUser2.privateKey);

    const expectedResponse = plainToInstance(TokenSwapFill, {
      created: ctx.txUnixTime,
      filledBy: users.testUser2.identityKey,
      swapRequestId: expectedCurrencySwap.getCompositeKey(),
      uses: new BigNumber("1")
    });

    const response = await contract.FillTokenSwap(ctx, dto).catch((e) => e);

    expect(response).toEqual(GalaChainResponse.Success(expectedResponse));
  });

  test("should fail when token swap doesn't match the expected token swap", async () => {
    // Given
    const currencyClass = currency.tokenClass();
    const currencyInstance = currency.tokenInstance();
    const currencyInstanceKey = currency.tokenInstanceKey();
    const nftSalePrice = new BigNumber("1000000");
    const tokenBalance = plainToInstance(TokenBalance, {
      ...currency.tokenBalance(),
      quantity: nftSalePrice,
      owner: users.testUser2.identityKey
    });

    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();
    const tokenAllowance = nft.tokenAllowance();

    const expectedCurrencySwap = plainToInstance(TokenSwapRequest, {
      created: 1,
      txid: "test-tx-id",
      offered: [
        {
          tokenInstance: nftInstanceKey,
          quantity: new BigNumber("0.000001")
        }
      ],
      wanted: [
        {
          tokenInstance: nftInstanceKey,
          quantity: nftSalePrice
        }
      ],
      offeredBy: users.testUser1.identityKey,
      offeredTo: users.testUser2.identityKey,
      fillIds: [],
      uses: new BigNumber("1"),
      usesSpent: new BigNumber("0"),
      expires: 0
    });

    expectedCurrencySwap.swapRequestId = expectedCurrencySwap.getCompositeKey();

    const nftBalance = plainToInstance(TokenBalance, {
      ...nft.tokenBalance(),
      lockedHolds: [
        {
          createdBy: users.testUser1.identityKey,
          instanceId: nftInstance.instance,
          quantity: new BigNumber("1"),
          name: expectedCurrencySwap.swapRequestId,
          created: 1,
          expires: 0
        }
      ]
    });

    expect(expectedCurrencySwap.swapRequestId).toBe(`\u0000GCTSR\u00001\u0000test-tx-id\u0000`);

    const { ctx, contract } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser2)
      .savedState(
        nftClass,
        nftInstance,
        currencyClass,
        currencyInstance,
        tokenAllowance,
        expectedCurrencySwap,
        tokenBalance,
        nftBalance
      );

    const expectedTokenSwap = plainToInstance(ExpectedTokenSwap, {
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
      ]
    });

    const dto = (
      await createValidDTO(FillTokenSwapDto, {
        swapRequestId: expectedCurrencySwap.getCompositeKey(),
        uses: new BigNumber("1"),
        expectedTokenSwap: expectedTokenSwap,
        uniqueKey: "test-fill-token-swap-dto"
      })
    ).signed(users.testUser2.privateKey);

    const failedResponse = await contract.FillTokenSwap(ctx, dto).catch((e) => e);

    expect(failedResponse).toEqual(
      expect.objectContaining({
        ErrorCode: ErrorCode.VALIDATION_FAILED,
        ErrorKey: "SWAP_DTO_VALIDATION",
        Status: 0,
        Message: expect.stringContaining(
          "Expected offered token quantity of 1 does not match actual quantity of 0.000001"
        )
      })
    );
  });
});

test("should fail when token swap doesn't match the expected token swap using BatchFillTokenSwap", async () => {
  // Given
  const currencyClass = currency.tokenClass();
  const currencyInstance = currency.tokenInstance();
  const currencyInstanceKey = currency.tokenInstanceKey();
  const nftSalePrice = new BigNumber("1000000");
  const tokenBalance = plainToInstance(TokenBalance, {
    ...currency.tokenBalance(),
    quantity: nftSalePrice,
    owner: users.testUser2.identityKey
  });

  const nftInstance = nft.tokenInstance1();
  const nftInstanceKey = nft.tokenInstance1Key();
  const nftClass = nft.tokenClass();
  const tokenAllowance = nft.tokenAllowance();

  const expectedCurrencySwap = plainToInstance(TokenSwapRequest, {
    created: 1,
    txid: "test-tx-id",
    offered: [
      {
        tokenInstance: nftInstanceKey,
        quantity: new BigNumber("0.000001")
      }
    ],
    wanted: [
      {
        tokenInstance: nftInstanceKey,
        quantity: nftSalePrice
      }
    ],
    offeredBy: users.testUser1.identityKey,
    offeredTo: users.testUser2.identityKey,
    fillIds: [],
    uses: new BigNumber("1"),
    usesSpent: new BigNumber("0"),
    expires: 0
  });

  expectedCurrencySwap.swapRequestId = expectedCurrencySwap.getCompositeKey();

  const nftBalance = plainToInstance(TokenBalance, {
    ...nft.tokenBalance(),
    lockedHolds: [
      {
        createdBy: users.testUser1.identityKey,
        instanceId: nftInstance.instance,
        quantity: new BigNumber("1"),
        name: expectedCurrencySwap.swapRequestId,
        created: 1,
        expires: 0
      }
    ]
  });

  expect(expectedCurrencySwap.swapRequestId).toBe(`\u0000GCTSR\u00001\u0000test-tx-id\u0000`);

  const { ctx, contract } = fixture(GalaChainTokenContract)
    .registeredUsers(users.testUser2)
    .savedState(
      nftClass,
      nftInstance,
      currencyClass,
      currencyInstance,
      tokenAllowance,
      expectedCurrencySwap,
      tokenBalance,
      nftBalance
    );

  const expectedTokenSwap = plainToInstance(ExpectedTokenSwap, {
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
    ]
  });

  const fillDto = await createValidDTO(FillTokenSwapDto, {
    swapRequestId: expectedCurrencySwap.getCompositeKey(),
    uses: new BigNumber("1"),
    expectedTokenSwap: expectedTokenSwap,
    uniqueKey: "test-fill-token-swap-dto"
  });

  const batchFillDto = (
    await createValidDTO(BatchFillTokenSwapDto, {
      swapDtos: [fillDto],
      uniqueKey: "batch-fill-token-swap-dto"
    })
  ).signed(users.testUser2.privateKey);

  const failedResponse = await contract.BatchFillTokenSwap(ctx, batchFillDto).catch((e) => e);

  expect(failedResponse).toEqual(
    expect.objectContaining({
      ErrorCode: ErrorCode.VALIDATION_FAILED,
      ErrorKey: "SWAP_DTO_VALIDATION",
      Status: 0,
      Message: expect.stringContaining(
        "Expected offered token quantity of 1 does not match actual quantity of 0.000001"
      )
    })
  );
});

import {
  GalaChainResponse,
  RequestTokenSwapDto,
  TokenBalance,
  TokenHold,
  TokenInstanceQuantity,
  TokenSwapRequest,
  TokenSwapRequestInstanceOffered,
  TokenSwapRequestInstanceWanted,
  TokenSwapRequestOfferedBy,
  createValidDTO
} from "@gala-chain/api";
import { currency, fixture, nft, users, writesMap } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToClass as plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";

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
  ).signed(users.testUser1.privateKey);

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

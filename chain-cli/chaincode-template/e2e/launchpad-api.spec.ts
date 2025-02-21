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
  ChainCallDTO,
  ConfigurePlatformFeeAddressDto,
  CreateSaleResponse,
  CreateTokenClassDto,
  CreateTokenSaleDTO,
  ExactTokenQuantityDto,
  FetchBalancesDto,
  FetchBalancesWithPaginationDto,
  FetchBalancesWithPaginationResponse,
  FetchSaleDto,
  FinalizeTokenAllocationDto,
  GalaChainResponse,
  GetPoolDto,
  LaunchpadFinalizeFeeAllocation,
  LaunchpadSale,
  MintTokenWithAllowanceDto,
  NativeTokenQuantityDto,
  PlatformFeeConfig,
  Pool,
  PreMintCalculationDto,
  SaleStatus,
  SwapDto,
  TokenBalance,
  TokenClassKey,
  TokenInstanceKey,
  TradeResponse,
  TransferTokenDto
} from "@gala-chain/api";
import {
  ChainClient,
  ChainUser,
  CommonContractAPI,
  commonContractAPI,
  publicKeyContractAPI
} from "@gala-chain/client";
import { AdminChainClients, TestClients, transactionError, transactionSuccess } from "@gala-chain/test";
import { BigNumber } from "bignumber.js";

import {
  calMemeTokensInTest,
  calMemeTokensOutTest,
  calNativeTokensInTest,
  calNativeTokensOutTest
} from "./launchpadTestHelper";

jest.setTimeout(100000);

describe("LaunchpadContract", () => {
  const LaunchpadContractConfig = {
    Launchpad: {
      channel: "product-channel",
      chaincode: "basic-product",
      contract: "Launchpad",
      api: LaunchpadContractAPI
    }
  };

  const DexV3ContractConfig = {
    dexV3Contract: {
      channel: "product-channel",
      chaincode: "basic-product",
      contract: "DexV3Contract",
      api: dexV3ContractAPI
    }
  };

  const GalaTokenContractConfig = {
    token: {
      channel: "product-channel",
      chaincode: "basic-product",
      contract: "GalaChainToken",
      api: GalaTokenContractAPI
    }
  };

  const PublicKeyContractConfig = {
    Public: {
      channel: "product-channel",
      chaincode: "basic-product",
      contract: "PublicKeyContract",
      api: publicKeyContractAPI
    }
  };

  let client: AdminChainClients<typeof LaunchpadContractConfig>;
  let user: ChainUser;

  let client1: AdminChainClients<typeof GalaTokenContractConfig>;
  let user1: ChainUser;

  let client2: AdminChainClients<typeof LaunchpadContractConfig>;
  let user2: ChainUser;

  let client3: AdminChainClients<typeof DexV3ContractConfig>;
  let user3: ChainUser;

  let client4: AdminChainClients<typeof PublicKeyContractConfig>;
  let user4: ChainUser;
  let user5: ChainUser;

  let vaultAddress: any;
  const totalSupply = 10000000;

  beforeAll(async () => {
    client = await TestClients.createForAdmin(LaunchpadContractConfig);
    user = await client.createRegisteredUser();

    client1 = await TestClients.createForAdmin(GalaTokenContractConfig);
    user1 = await client1.createRegisteredUser();

    client2 = await TestClients.createForAdmin(LaunchpadContractConfig);
    user2 = await client2.createRegisteredUser();

    client3 = await TestClients.createForAdmin(DexV3ContractConfig);
    user3 = await client2.createRegisteredUser();

    client4 = await TestClients.createForAdmin(PublicKeyContractConfig);
    user4 = await client4.createRegisteredUser();

    user5 = await client.createRegisteredUser();
  });

  afterAll(async () => {
    await client.disconnect();
    await client1.disconnect();
    await client2.disconnect();
    await client4.disconnect();
  });

  //Create sale helper function
  async function createSale(
    client: AdminChainClients<typeof LaunchpadContractConfig>,
    user: ChainUser,
    tokenName: string,
    tokenSymbol: string
  ) {
    const createLaunchpadSaleDTO = new CreateTokenSaleDTO(
      tokenName,
      tokenSymbol,
      `${tokenName} sale description`,
      "www.test.com",
      new BigNumber("0"),
      "UnitTest",
      "Test"
    );
    createLaunchpadSaleDTO.websiteUrl = "www.abcd.com";
    // Sign the DTO using the user's private key
    createLaunchpadSaleDTO.sign(user.privateKey);

    // Call the CreateSale function
    const response = await client.Launchpad.CreateSale(createLaunchpadSaleDTO);
    return response;
  }

  test("Creating Test Gala for Test", async () => {
    // Creating Gala Dummy token for Buying
    // Minting 100,000,000GALA  to user1

    let classKey = new TokenClassKey();

    classKey.collection = "GALA";
    classKey.category = "Unit";
    classKey.type = "none";
    classKey.additionalKey = "none";

    let tokenClassDto = new CreateTokenClassDto();

    tokenClassDto.tokenClass = classKey;
    tokenClassDto.name = "GALA";
    tokenClassDto.symbol = "gala";
    tokenClassDto.description = "TEST TEST";
    tokenClassDto.image = "www.resolveUserAlias.com";
    tokenClassDto.decimals = 8;
    tokenClassDto.maxSupply = new BigNumber("3e+7");
    tokenClassDto.maxCapacity = new BigNumber("3e+7");
    tokenClassDto.totalMintAllowance = new BigNumber(0);
    tokenClassDto.totalSupply = new BigNumber(0);
    tokenClassDto.totalBurned = new BigNumber(0);
    tokenClassDto.network = "GC";
    tokenClassDto.isNonFungible = false;

    tokenClassDto.sign(user1.privateKey);

    let res2 = await client1.token.CreateToken(tokenClassDto);

    let mintDTO = new MintTokenWithAllowanceDto();

    mintDTO.tokenClass = classKey;
    mintDTO.quantity = new BigNumber("3e+7");
    mintDTO.owner = user1.identityKey;
    mintDTO.tokenInstance = new BigNumber(0);

    mintDTO.sign(user1.privateKey);

    let response = await client1.token.MintTokenWithAllowance(mintDTO);

    let tokenIntance = new TokenInstanceKey();
    tokenIntance.collection = "GALA";
    tokenIntance.category = "Unit";
    tokenIntance.type = "none";
    tokenIntance.additionalKey = "none";
    tokenIntance.instance = new BigNumber(0);

    const transferTokenDto = new TransferTokenDto();
    transferTokenDto.from = user1.identityKey;
    transferTokenDto.to = user2.identityKey;
    transferTokenDto.tokenInstance = tokenIntance;
    transferTokenDto.quantity = new BigNumber("5e+6");
    transferTokenDto.sign(user1.privateKey);

    const transferResponse = await client1.token.TransferToken(transferTokenDto);

    //Transferring Gala to user
    const transferTokenUserDto = new TransferTokenDto();
    transferTokenUserDto.from = user1.identityKey;
    transferTokenUserDto.to = user.identityKey;
    transferTokenUserDto.tokenInstance = tokenIntance;
    transferTokenUserDto.quantity = new BigNumber("2e+6");
    transferTokenUserDto.sign(user1.privateKey);

    const transferResponseUser = await client1.token.TransferToken(transferTokenUserDto);
  });

  describe("Create Sale ", () => {
    test("Create Sale Test", async () => {
      const createLaunchpadSaleDTO = new CreateTokenSaleDTO(
        "Asset",
        "ART",
        "created for sale",
        "www.test.com",
        new BigNumber("0"),
        "UnitTest",
        "none"
      );
      createLaunchpadSaleDTO.websiteUrl = "google.com";

      createLaunchpadSaleDTO.sign(user.privateKey);
      const response = await client.Launchpad.CreateSale(createLaunchpadSaleDTO);

      expect(response).toBeDefined();
      expect(response).toMatchObject({
        Data: expect.objectContaining({
          creatorAddress: expect.stringMatching(/^eth\|[a-fA-F0-9]{40}$/),
          description: "created for sale",
          image: "www.test.com",
          initialBuyQuantity: "0",
          symbol: "ART",
          telegramUrl: "",
          tokenName: "Asset",
          twitterUrl: "",
          vaultAddress: expect.stringMatching(
            /^service\|UnitTest\$none\$ART\$eth:[a-fA-F0-9]{40}\$launchpad$/
          ),
          websiteUrl: "google.com",
          collection: "UnitTest",
          category: "none"
        }),
        Status: 1
      });
    });

    test("It should revert if token name is not given", async () => {
      const createLaunchpadSaleDTO = new CreateTokenSaleDTO(
        "",
        "saleEight",
        "created for sale",
        "www.test.com",
        new BigNumber("0"),
        "UnitTest",
        "none"
      );
      createLaunchpadSaleDTO.sign(user.privateKey);
      const response = await client.Launchpad.CreateSale(createLaunchpadSaleDTO);

      expect(response).toEqual(transactionError());
      expect(response.Message).toContain("tokenName should not be empty");
    });

    test("It should revert if token symbol is not given", async () => {
      const createLaunchpadSaleDTO = new CreateTokenSaleDTO(
        "Asset8",
        "",
        "created for sale",
        "www.test.com",
        new BigNumber("0"),
        "UnitTest",
        "none"
      );

      createLaunchpadSaleDTO.sign(user.privateKey);
      const response = await client.Launchpad.CreateSale(createLaunchpadSaleDTO);

      expect(response).toEqual(transactionError());
      expect(response.Message).toContain("tokenSymbol should not be empty");
    });

    test("It should revert in token description is empty", async () => {
      const createLaunchpadSaleDTO = new CreateTokenSaleDTO(
        "Asset8",
        "saleEight",
        "",
        "www.test.com",
        new BigNumber("0"),
        "UnitTest",
        "none"
      );

      const response = await client.Launchpad.CreateSale(createLaunchpadSaleDTO);

      expect(response).toEqual(transactionError());
      expect(response.Message).toContain("tokenDescription should not be empty");
    });

    test("Sale cannot be created without social link", async () => {
      const createLaunchpadSaleDTO = new CreateTokenSaleDTO(
        "Asset8",
        "saleEight",
        "created for sale",
        "www.test.com",
        new BigNumber("0"),
        "UnitTest",
        "none"
      );

      createLaunchpadSaleDTO.sign(user.privateKey);
      const response = await client.Launchpad.CreateSale(createLaunchpadSaleDTO);

      expect(response.Message).toEqual("Token sale creation requires atleast one social link.");
    });
    test("Same sale cannot be created with same user", async () => {
      const createLaunchpadSaleDTO = new CreateTokenSaleDTO(
        "Asset8",
        "saleEight",
        "www.ipfs.com",
        "www.test.com",
        new BigNumber("0"),
        "UnitTest",
        "none"
      );
      createLaunchpadSaleDTO.websiteUrl = "www.website.com";

      createLaunchpadSaleDTO.sign(user.privateKey);
      const response = await client.Launchpad.CreateSale(createLaunchpadSaleDTO);

      const createLaunchpadSale2DTO = new CreateTokenSaleDTO(
        "Asset8",
        "saleEight",
        "www.ipfs.com",
        "www.test.com",
        new BigNumber("0"),
        "UnitTest",
        "none"
      );
      createLaunchpadSale2DTO.websiteUrl = "www.website.com";

      createLaunchpadSale2DTO.sign(user.privateKey);
      const response2 = await client.Launchpad.CreateSale(createLaunchpadSale2DTO);

      expect(response2.Message).toContain("This token and a sale associated with it already exists");
    });

    test("20 Million tokens are pre minted to vault address (10 Million for sale + 10 Million for Buffer and Dex)", async () => {
      const sale = await createSale(client, user, "Asset9", "saleNine");
      vaultAddress = sale.Data?.vaultAddress;

      //Fetch Token Balance from Vault

      const FetchBalanceDto = new FetchBalancesDto();
      FetchBalanceDto.owner = vaultAddress;
      FetchBalanceDto.collection = "UnitTest";
      FetchBalanceDto.category = "Test";
      FetchBalanceDto.type = "SALENINE";

      const fetchBalanceRes = await client1.token.FetchBalances(FetchBalanceDto);
      const balanceOfVault = (fetchBalanceRes?.Data?.[0] as any).quantity;

      expect(BigNumber(balanceOfVault)).toEqual(BigNumber("2e+7"));
    });

    test("Initial Buy Amount Test (for sale owner) ", async () => {
      //Fetch User's Gala Balance

      const FetchGalaBalanceDto = new FetchBalancesDto();
      FetchGalaBalanceDto.owner = user.identityKey;
      FetchGalaBalanceDto.collection = "GALA";
      FetchGalaBalanceDto.category = "Unit";
      FetchGalaBalanceDto.type = "none";

      const fetchGalaBalanceRes = await client1.token.FetchBalances(FetchGalaBalanceDto);
      const galaBalanceBeforeBuy = (fetchGalaBalanceRes?.Data?.[0] as any).quantity;

      //Creating New Sale
      const createLaunchpadSaleDTO = new CreateTokenSaleDTO(
        "Asset7",
        "saleSeven",
        "created for sale",
        "www.test.com",
        new BigNumber("50"),
        "UnitTest",
        "Test"
      );
      createLaunchpadSaleDTO.websiteUrl = "www.combat.com";

      createLaunchpadSaleDTO.sign(user.privateKey);
      const response = await client.Launchpad.CreateSale(createLaunchpadSaleDTO);

      const initialBuyAmountFromSale = Number(response.Data?.initialBuyQuantity);
      expect(initialBuyAmountFromSale).toEqual(50);

      //Fetch User's Gala Balance after Buy
      const fetchGalaBalanceAfterRes = await client1.token.FetchBalances(FetchGalaBalanceDto);
      const galaBalanceAfter = (fetchGalaBalanceAfterRes?.Data?.[0] as any).quantity;

      const galaBalanceDiff = galaBalanceBeforeBuy - galaBalanceAfter;
      expect(galaBalanceDiff).toEqual(50);

      //Ftech User's Token Balance
      const tokenBalanceDTO = new FetchBalancesDto();

      tokenBalanceDTO.owner = user.identityKey;
      tokenBalanceDTO.collection = "UnitTest";
      tokenBalanceDTO.category = "Test";
      tokenBalanceDTO.type = "SALESEVEN";

      const fetchTokenBalanceRes = await client1.token.FetchBalances(tokenBalanceDTO);
      const tokenBalanceOfUser = (fetchTokenBalanceRes?.Data?.[0] as any).quantity;
      expect(Number(tokenBalanceOfUser)).toBeCloseTo(1295968.384);
    });
  });

  test("User 1 Buys whole supply , then same amout of gala to be used to buy with native", async () => {
    //Buy with exact token

    const sale = await createSale(client, user, "Asset24", "saleTwentyFour");
    vaultAddress = sale.Data?.vaultAddress;

    //Fetch Gala Balance before buy
    const FetchGalaBalanceDto = new FetchBalancesDto();
    FetchGalaBalanceDto.owner = user.identityKey;
    FetchGalaBalanceDto.collection = "GALA";
    FetchGalaBalanceDto.category = "Unit";
    FetchGalaBalanceDto.type = "none";

    const fetchGalaBalanceRes = await client1.token.FetchBalances(FetchGalaBalanceDto);

    const galaBalanceBeforeBuy = (fetchGalaBalanceRes?.Data?.[0] as any).quantity;

    const buyWithExactDTO = new ExactTokenQuantityDto();
    buyWithExactDTO.vaultAddress = vaultAddress;
    buyWithExactDTO.tokenQuantity = new BigNumber("9999999");

    buyWithExactDTO.sign(user.privateKey);

    const buyWithExactRes = await client.Launchpad.BuyExactToken(buyWithExactDTO);

    const fetchGalaBalanceAfterRes = await client1.token.FetchBalances(FetchGalaBalanceDto);

    const galaBalanceAfterBuy = (fetchGalaBalanceAfterRes?.Data?.[0] as any).quantity;

    let balanceDiff = galaBalanceBeforeBuy - galaBalanceAfterBuy;

    // Buy with native

    const sale2 = await createSale(client, user, "Asset25", "saleTwentyFive");
    vaultAddress = sale2.Data?.vaultAddress;

    balanceDiff = roundToDecimal(balanceDiff, 8);

    const buyWithNativeDTO = new NativeTokenQuantityDto();
    buyWithNativeDTO.vaultAddress = vaultAddress;
    buyWithNativeDTO.nativeTokenQuantity = new BigNumber(balanceDiff);

    buyWithNativeDTO.sign(user2.privateKey);

    const buyWithNativeRes = await client.Launchpad.BuyWithNative(buyWithNativeDTO);

    //Token Sale Quantity from sale
    const fetchSaleDetailsDTO = new FetchSaleDto();
    fetchSaleDetailsDTO.vaultAddress = vaultAddress;

    const fetchSaleDetailsRes = await client.Launchpad.FetchSale(fetchSaleDetailsDTO);
    const sellingTokenQuantity = fetchSaleDetailsRes.Data?.sellingTokenQuantity;

    const tokensSold = totalSupply - Number(sellingTokenQuantity);

    expect(tokensSold).toBeCloseTo(9999999);
  });

  test("1st token buy price should be equal to the base price", async () => {
    const sale = await createSale(client, user, "Asset10", "SaleTen");

    vaultAddress = sale.Data?.vaultAddress;

    //User's Gala balance before buy
    const FetchGalaBalanceDto = new FetchBalancesDto();
    FetchGalaBalanceDto.owner = user1.identityKey;
    FetchGalaBalanceDto.collection = "GALA";
    FetchGalaBalanceDto.category = "Unit";
    FetchGalaBalanceDto.type = "none";

    const fetchGalaBalanceRes = await client1.token.FetchBalances(FetchGalaBalanceDto);
    const balanceBeforeBuy = (fetchGalaBalanceRes?.Data?.[0] as any).quantity;

    const buyExactTokenDTO = new ExactTokenQuantityDto();
    buyExactTokenDTO.vaultAddress = vaultAddress;
    buyExactTokenDTO.tokenAmount = new BigNumber("1");

    buyExactTokenDTO.sign(user1.privateKey);

    const buyExactTokenRes = await client.Launchpad.BuyExactToken(buyExactTokenDTO);

    const fetchGalaBalanceAfterRes = await client1.token.FetchBalances(FetchGalaBalanceDto);

    const balanceAfterBuy = (fetchGalaBalanceAfterRes?.Data?.[0] as any).quantity;

    const balanceDiff = balanceBeforeBuy - balanceAfterBuy;

    expect(balanceDiff).toBeCloseTo(0.000016510486602783203); // Base Price
  });

  describe("Buy and Sell Functions test", () => {
    test("Buy with Native", async () => {
      const sale = await createSale(client, user, "Asset13", "saleThirteen");
      vaultAddress = sale.Data?.vaultAddress;

      const buyWithNativeDTO = new NativeTokenQuantityDto();
      buyWithNativeDTO.vaultAddress = vaultAddress;
      buyWithNativeDTO.nativeTokenQuantity = new BigNumber("31.27520343");

      buyWithNativeDTO.sign(user1.privateKey);

      //Fetch User's Gala Balance

      const FetchGalaBalanceDto = new FetchBalancesDto();
      FetchGalaBalanceDto.owner = user1.identityKey;
      FetchGalaBalanceDto.collection = "GALA";
      FetchGalaBalanceDto.category = "Unit";
      FetchGalaBalanceDto.type = "none";

      const fetchGalaBalanceBeforeRes = await client1.token.FetchBalances(FetchGalaBalanceDto);

      const balanceOfUserBeforeBuy = (fetchGalaBalanceBeforeRes?.Data?.[0] as any).quantity;

      const buyWithNativeRes = await client.Launchpad.BuyWithNative(buyWithNativeDTO);

      const fetchGalaBalanceAfterRes = await client1.token.FetchBalances(FetchGalaBalanceDto);

      const balanceOfUserAfterBuy = (fetchGalaBalanceAfterRes?.Data?.[0] as any).quantity;
      const balanceDiff = balanceOfUserBeforeBuy - balanceOfUserAfterBuy;

      expect(balanceDiff).toBeCloseTo(31.27520343);

      //Fetching token balance
      const tokenBalanceDTO = new FetchBalancesDto();

      tokenBalanceDTO.owner = user1.identityKey;
      tokenBalanceDTO.collection = "UnitTest";
      tokenBalanceDTO.category = "Test";
      tokenBalanceDTO.type = "SALETHIRTEEN";

      const fetchTokenBalanceRes = await client1.token.FetchBalances(tokenBalanceDTO);

      const tokenBalanceAfterBuy = (fetchTokenBalanceRes?.Data?.[0] as any).quantity;

      //Fetch tokens sold from sale

      const fetchSaleDetailDTO = new FetchSaleDto();
      fetchSaleDetailDTO.vaultAddress = vaultAddress;

      const fetchSaleRes = await client.Launchpad.FetchSale(fetchSaleDetailDTO);

      const sellingQty = fetchSaleRes.Data?.sellingTokenQuantity;

      const tokensSold = 10000000 - Number(sellingQty);

      expect(tokensSold).toBeCloseTo(Number(tokenBalanceAfterBuy));
    });

    test("Buy Exact tokens", async () => {
      const sale = await createSale(client, user, "Asset14", "saleFourteen");
      vaultAddress = sale.Data?.vaultAddress;

      const buyWithExactDTO = new ExactTokenQuantityDto();
      buyWithExactDTO.vaultAddress = vaultAddress;
      buyWithExactDTO.tokenQuantity = new BigNumber("2000000");

      buyWithExactDTO.sign(user1.privateKey);

      const buyExactTokenRes = await client.Launchpad.BuyExactToken(buyWithExactDTO);

      const tokenQuantitySold = buyExactTokenRes.Data?.outputQuantity;
      //Fetch User's Token Balance

      const tokenBalanceDTO = new FetchBalancesDto();

      tokenBalanceDTO.owner = user1.identityKey;
      tokenBalanceDTO.collection = "UnitTest";
      tokenBalanceDTO.category = "Test";
      tokenBalanceDTO.type = "SALEFOURTEEN";

      const fetchBalanceRes = await client1.token.FetchBalances(tokenBalanceDTO);
      const tokenbalanceOfUser = (fetchBalanceRes?.Data?.[0] as any).quantity;

      expect(tokenbalanceOfUser).toEqual(tokenQuantitySold);

      //Fetch Sale
      const fetchSaleDetailDTO = new FetchSaleDto();
      fetchSaleDetailDTO.vaultAddress = vaultAddress;

      const fetchSaleRes = await client.Launchpad.FetchSale(fetchSaleDetailDTO);
      const sellingQty = fetchSaleRes.Data?.sellingTokenQuantity;
      const tokensSold = 10000000 - Number(sellingQty);

      expect(Number(tokenbalanceOfUser)).toBeCloseTo(tokensSold);
    });

    test("Sell With Native", async () => {
      const sale = await createSale(client, user, "Asset16", "saleSixteen");
      vaultAddress = sale.Data?.vaultAddress;

      const buyWithNativeDTO = new NativeTokenQuantityDto();
      buyWithNativeDTO.vaultAddress = vaultAddress;
      buyWithNativeDTO.nativeTokenQuantity = new BigNumber("31.27520343");

      //Gala Balance Before Buy

      const FetchGalaBalanceDto = new FetchBalancesDto();
      FetchGalaBalanceDto.owner = user1.identityKey;
      FetchGalaBalanceDto.collection = "GALA";
      FetchGalaBalanceDto.category = "Unit";
      FetchGalaBalanceDto.type = "none";

      const fetchGalaBalanceBeforeRes = await client1.token.FetchBalances(FetchGalaBalanceDto);

      const balanceOfUserBeforeBuy = (fetchGalaBalanceBeforeRes?.Data?.[0] as any).quantity;

      buyWithNativeDTO.sign(user1.privateKey);

      const buyWithNativeRes = await client.Launchpad.BuyWithNative(buyWithNativeDTO);

      //Sell With Native

      const sellWithNativeDTO = new NativeTokenQuantityDto();
      sellWithNativeDTO.vaultAddress = vaultAddress;
      sellWithNativeDTO.nativeTokenQuantity = new BigNumber("31.27520343");

      sellWithNativeDTO.sign(user1.privateKey);

      const sellWithNativeRes = await client.Launchpad.SellWithNative(sellWithNativeDTO);

      //Gala Balance After Sell

      const fetchGalaBalanceAfterRes = await client1.token.FetchBalances(FetchGalaBalanceDto);

      const balanceOfUserAfterSell = (fetchGalaBalanceAfterRes?.Data?.[0] as any).quantity;
      expect(balanceOfUserBeforeBuy).toEqual(balanceOfUserAfterSell);

      const sellTokenQty = sellWithNativeRes.Data?.tokenQuantity;

      //Fetch Sale

      const fetchSaleDTO = new FetchSaleDto();
      fetchSaleDTO.vaultAddress = vaultAddress;

      const fetchSaleRes = await client.Launchpad.FetchSale(fetchSaleDTO);

      const sellingTokenQuantity = fetchSaleRes.Data?.sellingTokenQuantity;

      expect(Number(sellingTokenQuantity)).toEqual(10000000);

      //User's Token Balance
      const tokenBalanceDTO = new FetchBalancesDto();

      tokenBalanceDTO.owner = user1.identityKey;
      tokenBalanceDTO.collection = "UnitTest";
      tokenBalanceDTO.category = "Test";
      tokenBalanceDTO.type = "SALESIXTEEN";

      const fetchBalanceRes = await client1.token.FetchBalances(tokenBalanceDTO);

      const tokenbalanceOfUser = (fetchBalanceRes?.Data?.[0] as any).quantity;
      expect(Number(tokenbalanceOfUser)).toEqual(0);
    });

    test("Sell Exact Tokens", async () => {
      const sale = await createSale(client, user, "Asset20", "saleTwenty");
      vaultAddress = sale.Data?.vaultAddress;

      const buyWithExactDTO = new ExactTokenQuantityDto();
      buyWithExactDTO.vaultAddress = vaultAddress;
      buyWithExactDTO.tokenQuantity = new BigNumber("2000000");

      buyWithExactDTO.sign(user1.privateKey);

      const buyExactTokenRes = await client.Launchpad.BuyExactToken(buyWithExactDTO);

      // User's Token Balance before sell
      const tokenBalanceDTO = new FetchBalancesDto();

      tokenBalanceDTO.owner = user1.identityKey;
      tokenBalanceDTO.collection = "UnitTest";
      tokenBalanceDTO.category = "Test";
      tokenBalanceDTO.type = "SALETWENTY";

      const fetchBalanceRes = await client1.token.FetchBalances(tokenBalanceDTO);
      const tokenbalanceOfUserAfterBuy = (fetchBalanceRes?.Data?.[0] as any).quantity;

      const sellExactTokenDTO = new ExactTokenQuantityDto();
      sellExactTokenDTO.vaultAddress = vaultAddress;
      sellExactTokenDTO.tokenQuantity = new BigNumber("5000");

      sellExactTokenDTO.sign(user1.privateKey);

      const sellExactTokenRes = await client.Launchpad.SellToken(sellExactTokenDTO);

      const fetchBalanceSellRes = await client1.token.FetchBalances(tokenBalanceDTO);

      const tokenbalanceOfUserAfterSell = (fetchBalanceSellRes?.Data?.[0] as any).quantity;

      const balanceDiff = tokenbalanceOfUserAfterBuy - tokenbalanceOfUserAfterSell;

      expect(balanceDiff).toEqual(5000);
    });

    test("Buy and Sell using both Exact Functions", async () => {
      const sale = await createSale(client, user, "Asset2", "saleTwo");
      vaultAddress = sale.Data?.vaultAddress;

      const tokensToBuyAndSell = 1000000;
      let sellingTokenQuantity = totalSupply;
      let currentSupply = 0;

      for (let i = 1; i <= 10; i++) {
        let tokens = tokensToBuyAndSell * i;

        if (i === 10) {
          tokens = 999999;
        }

        const amountOutMeme = new BigNumber(tokens);

        const initialfetchSaleDto = new FetchSaleDto();
        initialfetchSaleDto.vaultAddress = vaultAddress;

        const initialFetchSaleDetails = await client.Launchpad.FetchSale(initialfetchSaleDto);

        sellingTokenQuantity = Number(initialFetchSaleDetails.Data?.sellingTokenQuantity);
        currentSupply = totalSupply - sellingTokenQuantity;

        const buyExactDto = new ExactTokenQuantityDto();
        buyExactDto.vaultAddress = vaultAddress;
        buyExactDto.tokenQuantity = new BigNumber(amountOutMeme); // 1000000

        const calculatedAmount = await client.Launchpad.CallNativeTokenIn(buyExactDto);

        // Declare calculatedAmountNumber at the beginning

        // Calculating Current Supply
        const fetchSaleDTO = new FetchSaleDto();
        fetchSaleDTO.vaultAddress = vaultAddress;

        const fetchSaleDetails = await client.Launchpad.FetchSale(fetchSaleDTO);

        // Extracting sellingTokenQuantity from the response
        sellingTokenQuantity = Number(fetchSaleDetails.Data?.sellingTokenQuantity);

        // Calculate currentSupply
        currentSupply = totalSupply - sellingTokenQuantity;
        // Calculate expectedAmount using the calNativeTokensInTest function

        const expectedAmount = calNativeTokensInTest(currentSupply, tokens);

        expect(Number(calculatedAmount.Data)).toBeCloseTo(Number(expectedAmount));

        const FetchBalanceDto = new FetchBalancesDto();
        FetchBalanceDto.owner = user1.identityKey;
        FetchBalanceDto.collection = "GALA";
        FetchBalanceDto.category = "Unit";
        FetchBalanceDto.type = "none";
        FetchBalanceDto.additionalKey = "none";

        const fetchBalanceRes = await client1.token.FetchBalances(FetchBalanceDto);

        const TokenBalance = (fetchBalanceRes?.Data?.[0] as any).quantity;

        const buyExactDTO = new ExactTokenQuantityDto();
        buyExactDTO.vaultAddress = vaultAddress;
        buyExactDTO.tokenQuantity = amountOutMeme;

        buyExactDTO.sign(user1.privateKey);

        const buyExactTokenRes = await client.Launchpad.BuyExactToken(buyExactDTO);

        //Fetch Sale Details After purchase
        const updatedSaleDetails = await client.Launchpad.FetchSale(fetchSaleDTO);

        const updatedSellingTokenQuantity = Number(updatedSaleDetails.Data?.sellingTokenQuantity);

        const updatedCurrentSupply = totalSupply - updatedSellingTokenQuantity;

        const FetchBalanceResAfter = await client1.token.FetchBalances(FetchBalanceDto);

        const TokenBalanceAfter = (FetchBalanceResAfter.Data?.[0] as any).quantity;

        const balanceDiffBuy = TokenBalance - TokenBalanceAfter;

        expect(balanceDiffBuy).toBeCloseTo(Number(calculatedAmount.Data));

        const expectedSellingQuantity = totalSupply - (currentSupply + Number(amountOutMeme));

        expect(updatedSellingTokenQuantity).toEqual(expectedSellingQuantity);

        //return

        //**Sell Tokens Test**
        const sellExactTokenDTO = new ExactTokenQuantityDto();
        sellExactTokenDTO.vaultAddress = vaultAddress;
        sellExactTokenDTO.tokenQuantity = amountOutMeme;

        const sellExpected = await client.Launchpad.CallNativeTokenOut(sellExactTokenDTO);

        const balanceBeforeSellRes = await client1.token.FetchBalances(FetchBalanceDto);

        const balanceBeforeSell = (balanceBeforeSellRes.Data?.[0] as any).quantity;

        sellExactTokenDTO.sign(user1.privateKey);

        const sellExactTokeRes = await client.Launchpad.SellToken(sellExactTokenDTO);

        const balanceAfterSellRes = await client1.token.FetchBalances(FetchBalanceDto);

        const balanceAfterSell = (balanceAfterSellRes.Data?.[0] as any).quantity;

        const balanceDiffSell = balanceAfterSell - balanceBeforeSell;

        expect(balanceDiffSell).toBeCloseTo(Number(sellExpected.Data));

        // Total tokens sold should be back to the previous state

        //Fetch sale details

        const fetchSaleDetailsDTO = new FetchSaleDto();

        fetchSaleDetailsDTO.vaultAddress = vaultAddress;

        const fetchaSaleDetailsRes = await client.Launchpad.FetchSale(fetchSaleDetailsDTO);

        const sellingTokenQuantityAfterSell = Number(fetchaSaleDetailsRes.Data?.sellingTokenQuantity);

        const CurrentSupplyAfterSell = totalSupply - sellingTokenQuantityAfterSell;

        expect(currentSupply).toEqual(CurrentSupplyAfterSell);
      }
    });

    test("Buy and Sell using both Native Functions", async () => {
      // creating new sale

      const sale = await createSale(client, user, "Asset3", "saleThree");

      vaultAddress = sale.Data?.vaultAddress;

      let arr: string[] = [
        "31.27520343",
        "100.3731319",
        "322.1326962",
        "1033.837164",
        "3317.947211",
        "10648.46001",
        "34174.65481",
        "109678.4915",
        "351996.8694",
        "1129679.89"
      ];

      let nativeCoins = 0;

      for (let i = 0; i < 10; i++) {
        nativeCoins += Number(arr[i]);
        nativeCoins = roundToDecimal(nativeCoins, 8);

        const nativeTokensIn = nativeCoins;

        const NativeTokenQuantityDTO = new NativeTokenQuantityDto();
        NativeTokenQuantityDTO.vaultAddress = vaultAddress;
        NativeTokenQuantityDTO.nativeTokenQuantity = new BigNumber(nativeTokensIn);

        const calculatedReturns = await client.Launchpad.CallMemeTokenOut(NativeTokenQuantityDTO);

        NativeTokenQuantityDTO.sign(user1.privateKey);

        const buyWithNativeRes = await client.Launchpad.BuyWithNative(NativeTokenQuantityDTO);

        //Fetch User's Token Balance
        const FetchBalanceDto = new FetchBalancesDto();
        FetchBalanceDto.owner = user1.identityKey;
        FetchBalanceDto.collection = "UnitTest";
        FetchBalanceDto.category = "Test";
        FetchBalanceDto.type = "SALETHREE";

        const fetchBalanceRes = await client1.token.FetchBalances(FetchBalanceDto);

        const balanceOfUser = (fetchBalanceRes?.Data?.[0] as any).quantity;

        expect(Number(calculatedReturns.Data)).toBeCloseTo(Number(balanceOfUser));

        const callWithNativeTokenDTO = new ExactTokenQuantityDto();
        callWithNativeTokenDTO.vaultAddress = vaultAddress;
        callWithNativeTokenDTO.tokenQuantity = new BigNumber(balanceOfUser);

        const callNativeTokensOutVal = await client.Launchpad.CallNativeTokenOut(callWithNativeTokenDTO);

        const callMemeTokensInDTO = new NativeTokenQuantityDto();
        callMemeTokensInDTO.vaultAddress = vaultAddress;
        callMemeTokensInDTO.nativeTokenQuantity = new BigNumber(callNativeTokensOutVal.Data ?? "0");

        const callMemeTokensForBalance = await client.Launchpad.CallMemeTokenIn(callMemeTokensInDTO);

        callMemeTokensInDTO.sign(user1.privateKey);
        const sellWithNativeRes = await client.Launchpad.SellWithNative(callMemeTokensInDTO);

        expect(Number(calculatedReturns.Data)).toBeCloseTo(Number(callMemeTokensForBalance.Data));

        const remainingBalance = await client1.token.FetchBalances(FetchBalanceDto);

        const remainingBalanceUser = (remainingBalance?.Data?.[0] as any).quantity;

        //Fetch Total tokens sold from sale

        const fetchSaleDetailsDto = new FetchSaleDto();
        fetchSaleDetailsDto.vaultAddress = vaultAddress;

        const fetchsaleRes = await client.Launchpad.FetchSale(fetchSaleDetailsDto);
        const tokenBalance = 10000000 - Number(fetchsaleRes.Data?.sellingTokenQuantity);

        expect(Number(remainingBalanceUser)).toBeCloseTo(tokenBalance);
      }
    });

    test("It should buyWithNative and Sell with Exact tokens (Cross Function Check)", async () => {
      const sale = await createSale(client, user, "Asset5", "saleFive");
      vaultAddress = sale.Data?.vaultAddress;

      let arr: string[] = [
        "31.27520343",
        "100.3731319",
        "322.1326962",
        "1033.837164",
        "3317.947211",
        "10648.46001",
        "34174.65481",
        "109678.4915",
        "351996.8694",
        "1129679.89"
      ];

      let nativeCoins = 0;

      for (let i = 0; i < 10; i++) {
        nativeCoins += Number(arr[i]);
        nativeCoins = roundToDecimal(nativeCoins, 8);

        const nativeTokensIn = nativeCoins;

        const callMemeTokensOutDTO = new NativeTokenQuantityDto();
        callMemeTokensOutDTO.vaultAddress = vaultAddress;
        callMemeTokensOutDTO.nativeTokenQuantity = new BigNumber(nativeTokensIn);

        const calculatedReturn = await client.Launchpad.CallMemeTokenOut(callMemeTokensOutDTO);

        //BuyWithNative

        callMemeTokensOutDTO.sign(user1.privateKey);
        const buyWithNativeRes = await client.Launchpad.BuyWithNative(callMemeTokensOutDTO);

        //Fetch User's Token Balance
        const FetchBalanceDto = new FetchBalancesDto();
        FetchBalanceDto.owner = user1.identityKey;
        FetchBalanceDto.collection = "UnitTest";
        FetchBalanceDto.category = "Test";
        FetchBalanceDto.type = "SALEFIVE";

        const fetchBalanceRes = await client1.token.FetchBalances(FetchBalanceDto);

        const balanceOfUser = (fetchBalanceRes?.Data?.[0] as any).quantity;

        expect(Number(calculatedReturn.Data)).toBeCloseTo(Number(balanceOfUser));

        const calNativeTokensOutDTO = new ExactTokenQuantityDto();
        calNativeTokensOutDTO.vaultAddress = vaultAddress;
        calNativeTokensOutDTO.tokenQuantity = new BigNumber(calculatedReturn.Data ?? "0");

        const sellExpected = await client.Launchpad.CallNativeTokenOut(calNativeTokensOutDTO);

        //Gala Balance Before Sell

        const FetchGalaBalanceDto = new FetchBalancesDto();
        FetchGalaBalanceDto.owner = user1.identityKey;
        FetchGalaBalanceDto.collection = "GALA";
        FetchGalaBalanceDto.category = "Unit";
        FetchGalaBalanceDto.type = "none";

        const fetchGalaBalanceRes = await client1.token.FetchBalances(FetchGalaBalanceDto);

        const balanceBeforeSell = (fetchGalaBalanceRes?.Data?.[0] as any).quantity;

        //Sell Tokens

        const sellExactTokensDTO = new ExactTokenQuantityDto();
        sellExactTokensDTO.vaultAddress = vaultAddress;
        sellExactTokensDTO.tokenQuantity = new BigNumber(calculatedReturn.Data ?? "0");

        sellExactTokensDTO.sign(user1.privateKey);

        const sellExactTokenRes = await client.Launchpad.SellToken(sellExactTokensDTO);

        const fetchGalaBalanceAfterRes = await client1.token.FetchBalances(FetchGalaBalanceDto);

        const balanceAfterSell = (fetchGalaBalanceAfterRes?.Data?.[0] as any).quantity;

        const balanceDiff = balanceAfterSell - balanceBeforeSell;
        expect(balanceDiff).toBeCloseTo(Number(sellExpected.Data));

        //Total tokens sold should be back to the previous state (after sell)

        const fetchSaleDetailsDto = new FetchSaleDto();
        fetchSaleDetailsDto.vaultAddress = vaultAddress;

        const fetchSaleDetailsRes = await client.Launchpad.FetchSale(fetchSaleDetailsDto);

        const fetchSellingQuantity = fetchSaleDetailsRes.Data?.sellingTokenQuantity;

        expect(Number(fetchSellingQuantity)).toEqual(10000000);
      }
    });

    test("It should BuyExactToken and SellWithNative (Cross Function Check)", async () => {
      const sale = await createSale(client, user, "Asset6", "saleSIX");
      vaultAddress = vaultAddress = sale.Data?.vaultAddress;

      const tokensToBuyAndSell = 1000000;
      let sellingTokenQuantity = totalSupply;
      let currentSupply = 0;

      for (let i = 1; i <= 10; i++) {
        let tokens = tokensToBuyAndSell * i;

        if (i === 10) {
          tokens = 999999;
        }

        const amountOutMeme = new BigNumber(tokens);

        const callNativeTokenInDTO = new ExactTokenQuantityDto();
        callNativeTokenInDTO.vaultAddress = vaultAddress;
        callNativeTokenInDTO.tokenQuantity = amountOutMeme;

        const calculatedAmountOfNativeCoins = await client.Launchpad.CallNativeTokenIn(callNativeTokenInDTO);

        const fetchSaleDetailsDTO = new FetchSaleDto();
        fetchSaleDetailsDTO.vaultAddress = vaultAddress;

        const fetchSaleDetailsRes = await client.Launchpad.FetchSale(fetchSaleDetailsDTO);
        const tokenSold = Number(fetchSaleDetailsRes.Data?.sellingTokenQuantity);

        const curSupply = totalSupply - tokenSold;

        const expectedAmount = calNativeTokensInTest(curSupply, tokens);
        //Check that calculated amount from on-chain matches the off-chain calculation
        expect(Number(calculatedAmountOfNativeCoins.Data)).toBeCloseTo(Number(expectedAmount));

        const FetchGalaBalanceDto = new FetchBalancesDto();
        FetchGalaBalanceDto.owner = user1.identityKey;
        FetchGalaBalanceDto.collection = "GALA";
        FetchGalaBalanceDto.category = "Unit";
        FetchGalaBalanceDto.type = "none";

        const fetchGalaBalanceRes = await client1.token.FetchBalances(FetchGalaBalanceDto);

        const balanceBeforeBuy = (fetchGalaBalanceRes?.Data?.[0] as any).quantity;

        //Buy Tokens

        const buyExactTokenDTO = new ExactTokenQuantityDto();
        buyExactTokenDTO.vaultAddress = vaultAddress;
        buyExactTokenDTO.tokenQuantity = new BigNumber(amountOutMeme);

        buyExactTokenDTO.sign(user1.privateKey);

        const buyExactTokenRes = await client.Launchpad.BuyExactToken(buyExactTokenDTO);

        const fetchGalaBalanceAfterBuyRes = await client1.token.FetchBalances(FetchGalaBalanceDto);

        const balanceAfterBuy = (fetchGalaBalanceAfterBuyRes?.Data?.[0] as any).quantity;

        const balanceDiff = balanceBeforeBuy - balanceAfterBuy;

        expect(balanceDiff).toBeCloseTo(Number(calculatedAmountOfNativeCoins.Data));

        //Total tokens sold after buy

        const fetchSaleRes = await client.Launchpad.FetchSale(fetchSaleDetailsDTO);

        const sellingQty = Number(fetchSaleRes.Data?.sellingTokenQuantity);

        const totalTokensSoldAfterBuy = totalSupply - sellingQty;

        const updatedSupply = new BigNumber(curSupply).plus(amountOutMeme);

        expect(Number(totalTokensSoldAfterBuy)).toBeCloseTo(Number(updatedSupply));

        const sellExpectedDTO = new ExactTokenQuantityDto();
        sellExpectedDTO.vaultAddress = vaultAddress;
        sellExpectedDTO.tokenQuantity = new BigNumber(amountOutMeme);

        const sellExpected = await client.Launchpad.CallNativeTokenOut(sellExpectedDTO);

        //Fetch User's Gala Balance Before Sell
        const fetchGalaBalanceBeforeSell = await client1.token.FetchBalances(FetchGalaBalanceDto);

        const balanceBeforeSell = (fetchGalaBalanceBeforeSell?.Data?.[0] as any).quantity;

        const callMemeOutValDTO = new NativeTokenQuantityDto();
        callMemeOutValDTO.vaultAddress = vaultAddress;
        callMemeOutValDTO.nativeTokenQuantity = new BigNumber(calculatedAmountOfNativeCoins.Data ?? "0");

        const calMemeOutVal = await client.Launchpad.CallMemeTokenIn(callMemeOutValDTO);
        expect(Number(sellExpected.Data)).toBeCloseTo(Number(calculatedAmountOfNativeCoins.Data));

        //Selling

        const sellWithNativeDTO = new NativeTokenQuantityDto();
        sellWithNativeDTO.vaultAddress = vaultAddress;
        sellWithNativeDTO.nativeTokenQuantity = new BigNumber(calculatedAmountOfNativeCoins.Data ?? "0");

        sellWithNativeDTO.sign(user1.privateKey);

        const sellWithNativeRes = await client.Launchpad.SellWithNative(sellWithNativeDTO);

        //Token Selling Quantity should be back to initial

        const fetchTokenSellingQtyRes = await client.Launchpad.FetchSale(fetchSaleDetailsDTO);

        const tokensSellingQty = Number(fetchTokenSellingQtyRes.Data?.sellingTokenQuantity);
        expect(Number(calculatedAmountOfNativeCoins.Data)).toBeCloseTo(Number(sellExpected.Data));
      }
    });
  });

  describe("Slippage Test ", () => {
    test("BuyWithNative  || It should rever if expected amount is greater than the actual amount", async () => {
      const sale = await createSale(client, user, "Asset22", "saleTwentyTwo");
      vaultAddress = sale.Data?.vaultAddress;

      const buyWithNativeDTO = new NativeTokenQuantityDto();
      buyWithNativeDTO.vaultAddress = vaultAddress;
      buyWithNativeDTO.nativeTokenQuantity = new BigNumber("100");

      const callMemeTokenOutRes = await client.Launchpad.CallMemeTokenOut(buyWithNativeDTO);

      const callMemeTokenOutVal = Number(callMemeTokenOutRes.Data);

      const increasedExpectedAmout = callMemeTokenOutVal + 10;

      buyWithNativeDTO.expectedToken = new BigNumber(increasedExpectedAmout);

      buyWithNativeDTO.sign(user1.privateKey);
      const buyWithNativeRes = await client.Launchpad.BuyWithNative(buyWithNativeDTO);
      expect(buyWithNativeRes.Message).toBe(
        "Tokens expected from this operation are more than the the actual amount that will be provided."
      );
    });

    test("BuyWithExactToken  || It should revert if tokens expected to perform this operation are less than the actual amount required", async () => {
      const sale = await createSale(client, user, "Asset23", "saleTwentyThree");
      vaultAddress = sale.Data?.vaultAddress;

      const buyWithExactDTO = new ExactTokenQuantityDto();
      buyWithExactDTO.vaultAddress = vaultAddress;
      buyWithExactDTO.tokenQuantity = new BigNumber("2000000");

      const callNativeTokenInRes = await client.Launchpad.CallNativeTokenIn(buyWithExactDTO);

      const callNativeTokenInResVal = Number(callNativeTokenInRes.Data);
      const expecteGalaForBuy = callNativeTokenInResVal - 5;

      buyWithExactDTO.expectedNativeToken = new BigNumber(expecteGalaForBuy);

      buyWithExactDTO.sign(user1.privateKey);

      const buyWithExactTokenRes = await client.Launchpad.BuyExactToken(buyWithExactDTO);

      expect(buyWithExactTokenRes.Message).toBe(
        "Gala tokens expected to perform this operation are less than the actual amount required."
      );
    });

    test("SellWithNative || It should revert if Token amount expected to cost for this operation is less than the the actual amount required", async () => {
      const sale = await createSale(client, user, "Asset32", "saleThirtyTwo");
      vaultAddress = sale.Data?.vaultAddress;

      const buyWithNativeDTO = new NativeTokenQuantityDto();
      buyWithNativeDTO.vaultAddress = vaultAddress;
      buyWithNativeDTO.nativeTokenQuantity = new BigNumber("100");

      buyWithNativeDTO.sign(user1.privateKey);
      const buyWithNativeRes = await client.Launchpad.BuyWithNative(buyWithNativeDTO);

      //Sell With Native

      const sellWithNativeDTO = new NativeTokenQuantityDto();
      sellWithNativeDTO.vaultAddress = vaultAddress;
      sellWithNativeDTO.nativeTokenQuantity = new BigNumber("50");

      const callMemeTokenInRes = await client.Launchpad.CallMemeTokenIn(sellWithNativeDTO);

      const callTokenInVal = Number(callMemeTokenInRes.Data);

      const decreaseGalaSellQuantity = callTokenInVal - 2;

      sellWithNativeDTO.expectedToken = new BigNumber(decreaseGalaSellQuantity);

      sellWithNativeDTO.sign(user1.privateKey);
      const sellWithNativeRes = await client.Launchpad.SellWithNative(sellWithNativeDTO);

      await expect(sellWithNativeRes.Message).toBe(
        "Token amount expected to cost for this operation is less than the the actual amount required."
      );
    });

    test("SellWithExactTokens || It should rever if Expected Gala tokens from this operation exceeds the actual amount that will be provided.", async () => {
      const sale = await createSale(client, user, "Asset26", "saleTwentySix");
      vaultAddress = sale.Data?.vaultAddress;

      const buyWithExactDTO = new ExactTokenQuantityDto();
      buyWithExactDTO.vaultAddress = vaultAddress;
      buyWithExactDTO.tokenAmount = new BigNumber("2000000");

      buyWithExactDTO.sign(user1.privateKey);

      const buyWithExactTokenRes = await client.Launchpad.BuyExactToken(buyWithExactDTO);

      //  Sell With Exact tokens

      const sellWithExactDTO = new ExactTokenQuantityDto();
      sellWithExactDTO.vaultAddress = vaultAddress;
      sellWithExactDTO.tokenQuantity = new BigNumber("500");

      const callNativeTokenOutRes = await client.Launchpad.CallNativeTokenOut(sellWithExactDTO);

      const callNativeTokenOutVal = Number(callNativeTokenOutRes.Data);

      const increasedExpectedNativeValue = callNativeTokenOutVal + 1;

      sellWithExactDTO.expectedNativeToken = new BigNumber(increasedExpectedNativeValue);

      sellWithExactDTO.sign(user1.privateKey);

      const sellWithNativerRes = await client.Launchpad.SellToken(sellWithExactDTO);

      expect(sellWithNativerRes.Message).toEqual(
        "Expected Gala tokens from this operation exceeds the actual amount that will be provided."
      );
    });
  });

  describe("Configure and fetch Platform fee", () => {
    test("Sale will not be finalized if platform fee address is not configured", async () => {
      const sale = await createSale(client, user, "Asset50", "saleFifty");
      vaultAddress = sale.Data?.vaultAddress;

      const buyWithNativeDTO = new NativeTokenQuantityDto();
      buyWithNativeDTO.vaultAddress = vaultAddress;
      buyWithNativeDTO.nativeTokenQuantity = new BigNumber("1640986"); //Exceeded MARKET_CAP

      buyWithNativeDTO.sign(user1.privateKey);

      const buyRes = await client.Launchpad.BuyWithNative(buyWithNativeDTO);
      expect(buyRes.Message).toEqual("Platform fee configuration is yet to be defined.");

      //Fetch Sale Details
      const fetchSaleDetailsDTO = new FetchSaleDto();
      fetchSaleDetailsDTO.vaultAddress = vaultAddress;

      const fetchSaleRes = await client.Launchpad.FetchSale(fetchSaleDetailsDTO);
      expect(fetchSaleRes.Data?.saleStatus).toEqual(SaleStatus.ONGOING);
    });
    test("It will revert if none of the input field are present", async () => {
      const configPlatformFeeAddressDTO = new ConfigurePlatformFeeAddressDto();
      configPlatformFeeAddressDTO.newPlatformFeeAddress = "";
      configPlatformFeeAddressDTO.newAuthorities = [];

      configPlatformFeeAddressDTO.sign(user3.privateKey);
      const configRes = await client.Launchpad.ConfigurePlatformFeeAddress(configPlatformFeeAddressDTO);

      expect(configRes.Status).toEqual(0);
      expect(configRes.Message).toEqual("None of the input fields are present.");
    });

    test("Only Platform Fee Address can be changed", async () => {
      const configPlatformFeeAddressDTO = new ConfigurePlatformFeeAddressDto();
      configPlatformFeeAddressDTO.newPlatformFeeAddress = user5.identityKey;

      configPlatformFeeAddressDTO.sign(user3.privateKey);

      const configRes = await client.Launchpad.ConfigurePlatformFeeAddress(configPlatformFeeAddressDTO);

      expect(configRes.Status).toEqual(1);
      expect(configRes.Data?.feeAddress).toEqual(user5.identityKey);
    });

    test("Only New Authority Address can be changed/Added", async () => {
      const configPlatformFeeAddressDTO = new ConfigurePlatformFeeAddressDto();
      configPlatformFeeAddressDTO.newAuthorities = [user2.identityKey, user1.identityKey];
      configPlatformFeeAddressDTO.newPlatformFeeAddress = user5.identityKey;
      configPlatformFeeAddressDTO.sign(user3.privateKey);

      const configRes = await client.Launchpad.ConfigurePlatformFeeAddress(configPlatformFeeAddressDTO);

      expect(configRes.Status).toEqual(1);
      expect(configRes.Data?.feeAddress).toEqual(user5.identityKey);

      const callingUserDto = new ChainCallDTO();
      callingUserDto.sign(user1.privateKey);
      //Fetch Currenct Fee Address and Authorities
      const fetchCurrentConfig = await client.Launchpad.FetchPlatformAddressConfig(callingUserDto);
      expect(fetchCurrentConfig.Data?.authorities[0]).toEqual(user2.identityKey);
      expect(fetchCurrentConfig.Data?.authorities[1]).toEqual(user1.identityKey);
    });

    test("It will revert if non authority tries to update the addresss", async () => {
      const configPlatformFeeAddressDTO = new ConfigurePlatformFeeAddressDto();
      configPlatformFeeAddressDTO.newAuthorities = [user.identityKey];
      configPlatformFeeAddressDTO.sign(user4.privateKey);

      const configRes = await client.Launchpad.ConfigurePlatformFeeAddress(configPlatformFeeAddressDTO);

      expect(configRes.Status).toEqual(0);
      expect(configRes.Message).toEqual(
        `CallingUser ${user4.identityKey} is not authorized to create or update`
      );
    });
  });

  describe("Finalise", () => {
    //User5 will be considered as platform fee address as per last configured platform fee address
    test("Finalization of sale should work with default fee values", async () => {
      const sale = await createSale(client, user, "Asset48", "saleFortyEight");
      vaultAddress = vaultAddress = sale.Data?.vaultAddress;

      const buyWithNativeDTO = new NativeTokenQuantityDto();
      buyWithNativeDTO.vaultAddress = vaultAddress;
      buyWithNativeDTO.nativeTokenQuantity = new BigNumber("1640986");

      buyWithNativeDTO.sign(user1.privateKey);

      const buyRes = await client.Launchpad.BuyWithNative(buyWithNativeDTO);

      //Fetch Sale Details
      const fetchSaleDetailsDTO = new FetchSaleDto();
      fetchSaleDetailsDTO.vaultAddress = vaultAddress;

      const fetchSaleRes = await client.Launchpad.FetchSale(fetchSaleDetailsDTO);
      expect(fetchSaleRes.Data?.saleStatus).toEqual(SaleStatus.END);

      //Check Balance of Default INITIAL_PLATFORM_FEE_ADDRESS
      const FetchGalaBalancePlatformAddressDto = new FetchBalancesDto();
      FetchGalaBalancePlatformAddressDto.owner = user5.identityKey;
      FetchGalaBalancePlatformAddressDto.collection = "GALA";
      FetchGalaBalancePlatformAddressDto.category = "Unit";
      FetchGalaBalancePlatformAddressDto.type = "none";

      const FetchGalaBalancePlatformRes = await client1.token.FetchBalances(
        FetchGalaBalancePlatformAddressDto
      );
      const platformBalance = (FetchGalaBalancePlatformRes?.Data?.[0] as any).quantity;

      //Default Platform Fee Value is 10%
      const mCap_Value = Number("1640985.8441726");
      const TEN_PERCENT_GALA = mCap_Value * 0.1;

      expect(Number(platformBalance)).toBeCloseTo(TEN_PERCENT_GALA);
    });
    test("Finalise sale @Token Supply exceeding 10 Million", async () => {
      const sale = await createSale(client, user, "Asset17", "saleSeventeen");
      vaultAddress = sale.Data?.vaultAddress;

      const BuyExactToken = new ExactTokenQuantityDto();
      BuyExactToken.vaultAddress = vaultAddress;
      BuyExactToken.tokenQuantity = new BigNumber("9999999");
      BuyExactToken.expectedNativeToken = new BigNumber("1700000");

      BuyExactToken.sign(user1.privateKey);
      const buyres = await client.Launchpad.BuyExactToken(BuyExactToken);

      const BuyExactToken1 = new ExactTokenQuantityDto();
      BuyExactToken1.vaultAddress = vaultAddress;
      BuyExactToken1.tokenQuantity = new BigNumber("2");
      BuyExactToken1.expectedNativeToken = new BigNumber("1700000");

      BuyExactToken1.sign(user2.privateKey);
      const buyres1 = await client.Launchpad.BuyExactToken(BuyExactToken1);

      const fetchSaleDetails = new FetchSaleDto();
      fetchSaleDetails.vaultAddress = vaultAddress;

      const fetchSaleStatus = await client.Launchpad.FetchSale(fetchSaleDetails);

      expect(fetchSaleStatus.Data?.saleStatus).toBe(SaleStatus.END);
    });

    test("Finalise Sale  @Native Gala equivalent to MARKET_CAP ", async () => {
      //Creation of sale

      const sale = await createSale(client, user, "Asset18", "saleEighteen");
      vaultAddress = vaultAddress = sale.Data?.vaultAddress;

      const buyWithNativeDTO = new NativeTokenQuantityDto();

      buyWithNativeDTO.vaultAddress = vaultAddress;
      buyWithNativeDTO.nativeTokenQuantity = new BigNumber("1640984");

      buyWithNativeDTO.sign(user2.privateKey);

      const buyRes = await client.Launchpad.BuyWithNative(buyWithNativeDTO);

      const buyWithNativeDTO1 = new NativeTokenQuantityDto();
      buyWithNativeDTO1.vaultAddress = vaultAddress;
      buyWithNativeDTO1.nativeTokenQuantity = new BigNumber("50");

      buyWithNativeDTO1.sign(user2.privateKey);

      const buyres1 = await client.Launchpad.BuyWithNative(buyWithNativeDTO1);

      const fetchSaleDetails = new FetchSaleDto();
      fetchSaleDetails.vaultAddress = vaultAddress;

      const fetchSaleStatus = await client.Launchpad.FetchSale(fetchSaleDetails);

      expect(fetchSaleStatus.Data?.saleStatus).toBe(SaleStatus.END);
    });

    test("Finalise Sale @Checking Allocation", async () => {
      const sale = await createSale(client, user, "Asset33", "saleThirtyThree");
      vaultAddress = sale.Data?.vaultAddress;

      //Creater balance before Finalize
      const fetchOwnerBalanceDTO = new FetchBalancesDto();
      fetchOwnerBalanceDTO.owner = user.identityKey;
      fetchOwnerBalanceDTO.collection = "GALA";
      fetchOwnerBalanceDTO.category = "Unit";
      fetchOwnerBalanceDTO.type = "none";
      fetchOwnerBalanceDTO.additionalKey = "none";

      const fetchCreaterBalanceBefore = await client1.token.FetchBalances(fetchOwnerBalanceDTO);
      const tokenBalanceBefore = (fetchCreaterBalanceBefore?.Data?.[0] as any).quantity;

      //Platform balance before
      const fetchBalancePlatformFeeDTO = new FetchBalancesDto();
      fetchBalancePlatformFeeDTO.owner = user5.identityKey;
      fetchBalancePlatformFeeDTO.collection = "GALA";
      fetchBalancePlatformFeeDTO.category = "Unit";
      fetchBalancePlatformFeeDTO.type = "none";
      fetchBalancePlatformFeeDTO.additionalKey = "none";

      const fetchPlatformFeeAddressBalance = await client1.token.FetchBalances(fetchBalancePlatformFeeDTO);
      const fetchPlatformFeeAddressBalanceVal = (fetchPlatformFeeAddressBalance?.Data?.[0] as any).quantity;

      const buyWithNativeDTO = new NativeTokenQuantityDto();
      buyWithNativeDTO.vaultAddress = vaultAddress;
      buyWithNativeDTO.nativeTokenQuantity = new BigNumber("1640984");

      buyWithNativeDTO.sign(user1.privateKey);

      const buyWithNativeRes = await client.Launchpad.BuyWithNative(buyWithNativeDTO);

      const buyWithNative1DTO = new NativeTokenQuantityDto();
      buyWithNative1DTO.vaultAddress = vaultAddress;
      buyWithNative1DTO.nativeTokenQuantity = new BigNumber("5");

      buyWithNative1DTO.sign(user2.privateKey);

      const buyWithNativeRes1 = await client.Launchpad.BuyWithNative(buyWithNative1DTO);
      const fetchSaleDetails = new FetchSaleDto();
      fetchSaleDetails.vaultAddress = vaultAddress;

      const fetchSaleStatus = await client.Launchpad.FetchSale(fetchSaleDetails);

      expect(fetchSaleStatus.Data?.saleStatus).toBe(SaleStatus.END);

      const mCap_Value = Number("1640985.8441726");
      const SIXTY_PERCENT_GALA = mCap_Value * 0.6;

      const fetchCreaterBalanceAfter = await client1.token.FetchBalances(fetchOwnerBalanceDTO);
      const tokenBalanceAfter = (fetchCreaterBalanceAfter?.Data?.[0] as any).quantity;
      const tokenBalanceDiff = tokenBalanceAfter - tokenBalanceBefore;

      // Owner's Gala Balance should be 60% of the Gala collected
      expect(tokenBalanceDiff).toBeCloseTo(SIXTY_PERCENT_GALA);

      //Fetch Balance from PlatformFeeAddress
      const fetchPlatformFeeAddressBalanceAfter =
        await client1.token.FetchBalances(fetchBalancePlatformFeeDTO);

      const fetchPlatformFeeAddressBalanceValAfter = (fetchPlatformFeeAddressBalanceAfter?.Data?.[0] as any)
        .quantity;
      const platformBalanceDiff = fetchPlatformFeeAddressBalanceValAfter - fetchPlatformFeeAddressBalanceVal;

      const TEN_PERCENT_GALA = mCap_Value * 0.1;
      expect(platformBalanceDiff).toBeCloseTo(TEN_PERCENT_GALA);

      //Left tokens left in vault should be totalBurned

      const tokenBalanceFromVaultDTO = new FetchBalancesDto();
      tokenBalanceFromVaultDTO.owner = vaultAddress;
      tokenBalanceFromVaultDTO.collection = "UnitTest";
      tokenBalanceFromVaultDTO.category = "Test";
      tokenBalanceFromVaultDTO.type = "SALETHIRTYTHREE";

      const fetchVaultRes = await client1.token.FetchBalances(tokenBalanceFromVaultDTO);

      const tokenLeftInVaultVal = (fetchVaultRes?.Data?.[0] as any).quantity;

      expect(Number(tokenLeftInVaultVal)).toEqual(0);
    });

    test("Pool Gets created after finalization", async () => {
      const sale = await createSale(client, user3, "Asset29", "saleTwentyNine");
      vaultAddress = sale.Data?.vaultAddress;
      const buyWithNativeDTO = new NativeTokenQuantityDto();

      buyWithNativeDTO.vaultAddress = vaultAddress;
      buyWithNativeDTO.nativeTokenQuantity = new BigNumber("1640986");

      buyWithNativeDTO.sign(user2.privateKey);

      const buyRes = await client.Launchpad.BuyWithNative(buyWithNativeDTO);

      const token0classKey = new TokenClassKey();
      token0classKey.collection = "GALA";
      token0classKey.category = "Unit";
      token0classKey.type = "none";
      token0classKey.additionalKey = "none";

      const token1classKey = new TokenClassKey();
      token1classKey.collection = "UnitTest";
      token1classKey.category = "Test";
      token1classKey.type = "SALETWENTYNINE";
      token1classKey.additionalKey = user3.identityKey.replace(/\|/, ":");

      //Fetch sale status
      const fetchSaleDetailsDTO = new FetchSaleDto();
      fetchSaleDetailsDTO.vaultAddress = vaultAddress;

      const saleStatus1 = await client.Launchpad.FetchSale(fetchSaleDetailsDTO);

      const getPoolDTO = new GetPoolDto(token0classKey, token1classKey, 3000);

      const response = await client3.dexV3Contract.getPoolData(getPoolDTO);

      expect(response.Status).toEqual(1);
    });

    test("User will not be able to buy when the sale end", async () => {
      const sale = await createSale(client, user3, "Asset30", "saleThirty");
      vaultAddress = sale.Data?.vaultAddress;
      const buyWithNativeDTO = new NativeTokenQuantityDto();

      buyWithNativeDTO.vaultAddress = vaultAddress;
      buyWithNativeDTO.nativeTokenQuantity = new BigNumber("1640986");

      buyWithNativeDTO.sign(user1.privateKey);

      const buyRes = await client.Launchpad.BuyWithNative(buyWithNativeDTO);

      // Buy after sale ends

      const buyWithNative1DTO = new NativeTokenQuantityDto();

      buyWithNative1DTO.vaultAddress = vaultAddress;
      buyWithNative1DTO.nativeTokenQuantity = new BigNumber("10");

      buyWithNative1DTO.sign(user1.privateKey);

      const buyRes1 = await client.Launchpad.BuyWithNative(buyWithNativeDTO);

      expect(buyRes1.Message).toEqual("This sale has already ended.");
    });
  });

  describe("Configurable Platform Fee and Admin Allocation Check", () => {
    test("Set Allocation test", async () => {
      const setPlatformFeeAllocationDTO = new FinalizeTokenAllocationDto();
      setPlatformFeeAllocationDTO.platformFeePercentage = 0.2;
      setPlatformFeeAllocationDTO.ownerFeePercentage = 0.3;

      setPlatformFeeAllocationDTO.sign(user2.privateKey);
      const setPlatformAllocationRes =
        await client.Launchpad.FinalizeTokenAllocation(setPlatformFeeAllocationDTO);

      expect(setPlatformAllocationRes).toBeDefined();
      expect(setPlatformAllocationRes.Status).toBe(1);
      expect(setPlatformAllocationRes.Data).toBeDefined();

      // Verify the allocation percentages in the response
      expect(setPlatformAllocationRes.Data?.liquidityAllocationPercentage).toBe(0.5);
      expect(setPlatformAllocationRes.Data?.ownerAllocationPercentage).toBe(0.3);
      expect(setPlatformAllocationRes.Data?.platformFeePercentage).toBe(0.2);
    });

    test("It will rever if total sum while setting allocation exceeds 1 (ie 100%)", async () => {
      const setPlatformFeeAllocationDTO = new FinalizeTokenAllocationDto();
      setPlatformFeeAllocationDTO.platformFeePercentage = 0.2;
      setPlatformFeeAllocationDTO.ownerFeePercentage = 0.9;

      setPlatformFeeAllocationDTO.sign(user1.privateKey);
      const setPlatformAllocationRes =
        await client.Launchpad.FinalizeTokenAllocation(setPlatformFeeAllocationDTO);

      expect(setPlatformAllocationRes.Status).toBe(0);
      expect(setPlatformAllocationRes.Message).toEqual(
        "Total allocation (Platform Fee + Owner Allocation) cannot exceed 1."
      );
    });

    test("Check Whether Finalize Allocation is happening according to the provided allocation", async () => {
      const setPlatformFeeAllocationDTO = new FinalizeTokenAllocationDto();
      setPlatformFeeAllocationDTO.platformFeePercentage = 0.05;
      setPlatformFeeAllocationDTO.ownerFeePercentage = 0.3;

      //Platform Gala Balance Before
      const FetchGalaBalancePlatformDto = new FetchBalancesDto();
      FetchGalaBalancePlatformDto.owner = user5.identityKey;
      FetchGalaBalancePlatformDto.collection = "GALA";
      FetchGalaBalancePlatformDto.category = "Unit";
      FetchGalaBalancePlatformDto.type = "none";

      const FetchGalaBalancePlatformBeforeRes =
        await client1.token.FetchBalances(FetchGalaBalancePlatformDto);
      const platformBalanceBefore = (FetchGalaBalancePlatformBeforeRes?.Data?.[0] as any).quantity;

      //Fetch User 3 gala balance
      const FetchGalaBalanceDto = new FetchBalancesDto();
      FetchGalaBalanceDto.owner = user.identityKey;
      FetchGalaBalanceDto.collection = "GALA";
      FetchGalaBalanceDto.category = "Unit";
      FetchGalaBalanceDto.type = "none";

      const fetchGalaBalanceBeforeRes = await client1.token.FetchBalances(FetchGalaBalanceDto);
      const ownerTokenBalanceBefore = (fetchGalaBalanceBeforeRes?.Data?.[0] as any).quantity;

      setPlatformFeeAllocationDTO.sign(user2.privateKey);
      const setPlatformAllocationRes =
        await client.Launchpad.FinalizeTokenAllocation(setPlatformFeeAllocationDTO);

      const sale = await createSale(client, user, "Asset37", "saleThirtyEight");
      vaultAddress = sale.Data?.vaultAddress;

      const buyWithNativeDTO = new NativeTokenQuantityDto();
      buyWithNativeDTO.vaultAddress = vaultAddress;
      buyWithNativeDTO.nativeTokenQuantity = new BigNumber("1640986");

      buyWithNativeDTO.sign(user1.privateKey);

      const buyRes = await client.Launchpad.BuyWithNative(buyWithNativeDTO);

      //Fetch Sale Details
      const fetchSaleDetailsDTO = new FetchSaleDto();
      fetchSaleDetailsDTO.vaultAddress = vaultAddress;

      const fetchSaleRes = await client.Launchpad.FetchSale(fetchSaleDetailsDTO);
      expect(fetchSaleRes.Data?.saleStatus).toEqual(SaleStatus.END);

      //30% of Market Cap
      const THIRTY_PERCENT_MCAP = Number(LaunchpadSale.MARKET_CAP) * 0.3;

      //5% of Market Cap
      const FIVE_PERCENT_MCAP = Number(LaunchpadSale.MARKET_CAP) * 0.05;

      const fetchGalaBalanceRes = await client1.token.FetchBalances(FetchGalaBalanceDto);
      const ownerTokenBalanceAfter = (fetchGalaBalanceRes?.Data?.[0] as any).quantity;

      const balanceDifferenc = ownerTokenBalanceAfter - ownerTokenBalanceBefore;
      expect(Number(balanceDifferenc)).toBeCloseTo(THIRTY_PERCENT_MCAP);

      //Platform Gala Balance
      const fetchGalaBalancePlatformRes = await client1.token.FetchBalances(FetchGalaBalancePlatformDto);
      const platformTokenBalance = (fetchGalaBalancePlatformRes?.Data?.[0] as any).quantity;

      const platforBalanceDiff = platformTokenBalance - platformBalanceBefore;
      expect(Number(platforBalanceDiff)).toBeCloseTo(FIVE_PERCENT_MCAP);
    });
  });

  describe("Calculations Check", () => {
    test("Calculate Native Tokens Out Test", async () => {
      const sale = await createSale(client, user, "Asset36", "saleThirtySix");
      vaultAddress = sale.Data?.vaultAddress;

      //Creating 63452 Supply

      const buyExactTokenDTO = new ExactTokenQuantityDto();
      buyExactTokenDTO.vaultAddress = vaultAddress;
      buyExactTokenDTO.tokenQuantity = new BigNumber("63452");
      buyExactTokenDTO.sign(user1.privateKey);
      const buyExactTokenRes = await client.Launchpad.BuyExactToken(buyExactTokenDTO);
      expect(buyExactTokenRes).toEqual(transactionSuccess());

      const fetchSaleDTO = new FetchSaleDto();
      fetchSaleDTO.vaultAddress = vaultAddress;

      const fetchSaleRes = await client.Launchpad.FetchSale(fetchSaleDTO);
      const currentSellingQty = Number(fetchSaleRes.Data?.sellingTokenQuantity);

      const currentSupply = totalSupply - currentSellingQty;

      //Calculations Native tokens out on-chain call
      const calNativeTokenOutDTO = new ExactTokenQuantityDto();
      calNativeTokenOutDTO.vaultAddress = vaultAddress;
      calNativeTokenOutDTO.tokenQuantity = new BigNumber("1345");

      const calNativeTokensOutRes = await client.Launchpad.CallNativeTokenOut(calNativeTokenOutDTO);

      //Calculate Native Tokens Out Test Off-Chain
      const calculatedTestRes = calNativeTokensOutTest(currentSupply, 1345);
      expect(Number(calNativeTokensOutRes.Data)).toEqual(calculatedTestRes);
    });

    test("Calculate Meme Tokens Out Test", async () => {
      const sale = await createSale(client, user, "Asset37", "saleThirtySeven");
      vaultAddress = sale.Data?.vaultAddress;

      //Creating Supply

      const buyWithNativeDTO = new NativeTokenQuantityDto();
      buyWithNativeDTO.vaultAddress = vaultAddress;
      buyWithNativeDTO.nativeTokenQuantity = new BigNumber("80");
      buyWithNativeDTO.sign(user1.privateKey);

      const buyWithNativeRes = await client.Launchpad.BuyWithNative(buyWithNativeDTO);
      expect(buyWithNativeRes).toEqual(transactionSuccess());

      const fetchSaleDTO = new FetchSaleDto();
      fetchSaleDTO.vaultAddress = vaultAddress;

      const fetchSaleRes = await client.Launchpad.FetchSale(fetchSaleDTO);
      const currentSellingQty = Number(fetchSaleRes.Data?.sellingTokenQuantity);

      const currentSupply = totalSupply - currentSellingQty;

      //Calculate Meme Tokens Out on-chain call
      const calMemeTokensOutDTO = new NativeTokenQuantityDto();
      calMemeTokensOutDTO.vaultAddress = vaultAddress;
      calMemeTokensOutDTO.nativeTokenQuantity = new BigNumber("73");

      const calMemeTokenOutRes = await client.Launchpad.CallMemeTokenOut(calMemeTokensOutDTO);

      //Calculate Meme Tokens Out Test off-chain
      const calculatedTestRes = calMemeTokensOutTest(currentSupply, 73);

      expect(Number(calMemeTokenOutRes.Data)).toBeCloseTo(Number(calculatedTestRes));
    });

    test("Calculate Native Tokens In Test", async () => {
      // const totalSupply = 10000000 ;

      const sale = await createSale(client, user, "Asset39", "saleThirtyNine");
      vaultAddress = sale.Data?.vaultAddress;

      //Creating 7002 Supply
      const buyExactTokenDTO = new ExactTokenQuantityDto();
      buyExactTokenDTO.vaultAddress = vaultAddress;
      buyExactTokenDTO.tokenQuantity = new BigNumber("7002");
      buyExactTokenDTO.sign(user1.privateKey);
      const buyExactTokenRes = await client.Launchpad.BuyExactToken(buyExactTokenDTO);

      expect(buyExactTokenRes).toEqual(transactionSuccess());

      const fetchSaleDTO = new FetchSaleDto();
      fetchSaleDTO.vaultAddress = vaultAddress;

      const fetchSaleRes = await client.Launchpad.FetchSale(fetchSaleDTO);
      const currentSellingQty = Number(fetchSaleRes.Data?.sellingTokenQuantity);

      const currentSupply = totalSupply - currentSellingQty;

      const calculateNativeTokenInDTO = new ExactTokenQuantityDto();
      calculateNativeTokenInDTO.vaultAddress = vaultAddress;
      calculateNativeTokenInDTO.tokenQuantity = new BigNumber("672");

      //Calculate Native Tokens In on-chain call
      const calculateNativeTokenInRes = await client.Launchpad.CallNativeTokenIn(calculateNativeTokenInDTO);

      //Calculate Native Tokens In off-chain
      const calculatedTestRes = calNativeTokensInTest(currentSupply, 672);

      expect(Number(calculateNativeTokenInRes.Data)).toEqual(Number(calculatedTestRes));
    });

    test("Calculate Meme Token In Test", async () => {
      // const totalSupply = 10000000 ;

      const sale = await createSale(client, user, "Asset40", "saleForty");
      vaultAddress = sale.Data?.vaultAddress;

      //Creating 711264 Supply
      const buyExactTokenDTO = new ExactTokenQuantityDto();
      buyExactTokenDTO.vaultAddress = vaultAddress;
      buyExactTokenDTO.tokenQuantity = new BigNumber("711264");
      buyExactTokenDTO.sign(user2.privateKey);
      const buyExactTokenRes = await client.Launchpad.BuyExactToken(buyExactTokenDTO);

      expect(buyExactTokenRes).toEqual(transactionSuccess());

      const fetchSaleDTO = new FetchSaleDto();
      fetchSaleDTO.vaultAddress = vaultAddress;

      const fetchSaleRes = await client.Launchpad.FetchSale(fetchSaleDTO);
      const currentSellingQty = Number(fetchSaleRes.Data?.sellingTokenQuantity);

      const currentSupply = totalSupply - currentSellingQty;

      //Calculate Meme Token In on-chain call
      const calculateMemeTokenInDTO = new NativeTokenQuantityDto();
      calculateMemeTokenInDTO.vaultAddress = vaultAddress;
      calculateMemeTokenInDTO.nativeTokenQuantity = new BigNumber("10");

      const calculateMemeTokenInRes = await client.Launchpad.CallMemeTokenIn(calculateMemeTokenInDTO);

      //Calculate Meme Token In off-chain
      const calculatedTestRes = calMemeTokensInTest(currentSupply, 10);

      expect(Number(calculateMemeTokenInRes.Data)).toEqual(Number(calculatedTestRes));
    });

    test("Calculate memes tokens out for preminting", async () => {
      const nativeAmountDTO = new PreMintCalculationDto();
      nativeAmountDTO.nativeTokenQuantity = new BigNumber("50");
      const preMintVal = await client.Launchpad.CalculatePreMintTokens(nativeAmountDTO);

      expect(Number(preMintVal.Data)).toEqual(1295968.3836584872964);
    });
  });
});

interface LaunchpadContractAPI {
  CreateSale(dto: CreateTokenSaleDTO): Promise<GalaChainResponse<CreateSaleResponse>>;
  BuyExactToken(dto: ExactTokenQuantityDto): Promise<GalaChainResponse<TradeResponse>>;
  SellToken(dto: ExactTokenQuantityDto): Promise<GalaChainResponse<TradeResponse>>;
  BuyWithNative(dto: NativeTokenQuantityDto): Promise<GalaChainResponse<TradeResponse>>;
  SellWithNative(dto: NativeTokenQuantityDto): Promise<GalaChainResponse<TradeResponse>>;
  CallNativeTokenIn(dto: ExactTokenQuantityDto): Promise<GalaChainResponse<BigNumber>>;
  CallMemeTokenOut(dto: NativeTokenQuantityDto): Promise<GalaChainResponse<BigNumber>>;
  CallNativeTokenOut(dto: ExactTokenQuantityDto): Promise<GalaChainResponse<BigNumber>>;
  CallMemeTokenIn(dto: NativeTokenQuantityDto): Promise<GalaChainResponse<BigNumber>>;
  CalculatePreMintTokens(dto: PreMintCalculationDto): Promise<GalaChainResponse<BigNumber>>;
  FetchSale(dto: FetchSaleDto): Promise<GalaChainResponse<LaunchpadSale>>;
  ConfigurePlatformFeeAddress(
    dto: ConfigurePlatformFeeAddressDto
  ): Promise<GalaChainResponse<PlatformFeeConfig>>;
  FinalizeTokenAllocation(
    dto: FinalizeTokenAllocationDto
  ): Promise<GalaChainResponse<LaunchpadFinalizeFeeAllocation>>;
  FetchPlatformAddressConfig(dto: ChainCallDTO): Promise<GalaChainResponse<PlatformFeeConfig>>;
}

function LaunchpadContractAPI(client: ChainClient): LaunchpadContractAPI & CommonContractAPI {
  return {
    ...commonContractAPI(client),

    CreateSale(dto: CreateTokenSaleDTO) {
      return client.submitTransaction("CreateSale", dto) as Promise<GalaChainResponse<CreateSaleResponse>>;
    },
    BuyExactToken(dto: ExactTokenQuantityDto) {
      return client.submitTransaction("BuyExactToken", dto) as Promise<GalaChainResponse<TradeResponse>>;
    },
    SellToken(dto: ExactTokenQuantityDto) {
      return client.submitTransaction("SellExactToken", dto) as Promise<GalaChainResponse<TradeResponse>>;
    },
    BuyWithNative(dto: NativeTokenQuantityDto) {
      return client.submitTransaction("BuyWithNative", dto) as Promise<GalaChainResponse<TradeResponse>>;
    },
    SellWithNative(dto: NativeTokenQuantityDto) {
      return client.submitTransaction("SellWithNative", dto) as Promise<GalaChainResponse<TradeResponse>>;
    },
    CallNativeTokenIn(dto: ExactTokenQuantityDto) {
      return client.submitTransaction("CallNativeTokenIn", dto) as Promise<GalaChainResponse<BigNumber>>;
    },
    CallMemeTokenOut(dto: NativeTokenQuantityDto) {
      return client.submitTransaction("CallMemeTokenOut", dto) as Promise<GalaChainResponse<BigNumber>>;
    },
    CallNativeTokenOut(dto: ExactTokenQuantityDto) {
      return client.submitTransaction("CallNativeTokenOut", dto) as Promise<GalaChainResponse<BigNumber>>;
    },
    CallMemeTokenIn(dto: NativeTokenQuantityDto) {
      return client.submitTransaction("CallMemeTokenIn", dto) as Promise<GalaChainResponse<BigNumber>>;
    },
    CalculatePreMintTokens(dto: PreMintCalculationDto) {
      return client.submitTransaction("CalculatePreMintTokens", dto) as Promise<GalaChainResponse<BigNumber>>;
    },
    FetchSale(dto: FetchSaleDto) {
      return client.evaluateTransaction("FetchSaleDetails", dto) as Promise<GalaChainResponse<LaunchpadSale>>;
    },
    ConfigurePlatformFeeAddress(dto: ConfigurePlatformFeeAddressDto) {
      return client.submitTransaction("ConfigurePlatformFeeAddress", dto) as Promise<
        GalaChainResponse<PlatformFeeConfig>
      >;
    },
    FinalizeTokenAllocation(dto: FinalizeTokenAllocationDto) {
      return client.submitTransaction("FinalizeTokenAllocation", dto) as Promise<
        GalaChainResponse<LaunchpadFinalizeFeeAllocation>
      >;
    },
    FetchPlatformAddressConfig(dto: ChainCallDTO) {
      return client.evaluateTransaction("FetchPlatformAddressConfig", dto) as Promise<
        GalaChainResponse<PlatformFeeConfig>
      >;
    }
  };
}

interface GalaTokenContractAPI {
  CreateToken(dto: CreateTokenClassDto): Promise<GalaChainResponse<TokenClassKey>>;
  DeleteToken(dto: TokenClassKey): Promise<GalaChainResponse<TokenClassKey>>;
  MintTokenWithAllowance(dto: MintTokenWithAllowanceDto): Promise<GalaChainResponse<TokenInstanceKey[]>>;
  TransferToken(dto: TransferTokenDto): Promise<GalaChainResponse<TokenBalance[]>>;
  FetchBalances(dto: FetchBalancesDto): Promise<GalaChainResponse<TokenBalance[]>>;
  FetchBalancesWithPagination(
    dto: FetchBalancesWithPaginationDto
  ): Promise<GalaChainResponse<FetchBalancesWithPaginationResponse>>;
}

function GalaTokenContractAPI(client: ChainClient): GalaTokenContractAPI & CommonContractAPI {
  return {
    ...commonContractAPI(client),

    CreateToken(dto: CreateTokenClassDto) {
      return client.submitTransaction("CreateTokenClass", dto) as Promise<GalaChainResponse<TokenClassKey>>;
    },
    DeleteToken(dto: TokenClassKey) {
      return client.submitTransaction("DeleteTokenClass", dto) as Promise<GalaChainResponse<TokenClassKey>>;
    },
    MintTokenWithAllowance(dto: MintTokenWithAllowanceDto) {
      return client.submitTransaction("MintTokenWithAllowance", dto) as Promise<
        GalaChainResponse<TokenInstanceKey[]>
      >;
    },
    TransferToken(dto: TransferTokenDto) {
      return client.submitTransaction("TransferToken", dto) as Promise<GalaChainResponse<TokenBalance[]>>;
    },
    FetchBalances(dto: FetchBalancesDto) {
      return client.submitTransaction("FetchBalances", dto) as Promise<GalaChainResponse<TokenBalance[]>>;
    },
    FetchBalancesWithPagination(dto: FetchBalancesWithPaginationDto) {
      return client.submitTransaction("FetchBalancesWithPagination", dto) as Promise<
        GalaChainResponse<FetchBalancesWithPaginationResponse>
      >;
    }
  };
}

interface DexV3ContractAPI {
  getPoolData(dto: GetPoolDto): Promise<GalaChainResponse<Pool>>;
  Swap(dto: SwapDto): Promise<GalaChainResponse<void>>;
}

function dexV3ContractAPI(client: ChainClient): DexV3ContractAPI & CommonContractAPI {
  return {
    ...commonContractAPI(client),

    getPoolData(dto: GetPoolDto) {
      return client.submitTransaction("GetPoolData", dto) as Promise<GalaChainResponse<Pool>>;
    },
    Swap(dto: SwapDto) {
      return client.submitTransaction("Swap", dto) as Promise<GalaChainResponse<void>>;
    }
  };
}

function roundToDecimal(value, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

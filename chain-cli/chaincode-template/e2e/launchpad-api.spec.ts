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
  FetchBalancesDto,
  FetchBalancesWithPaginationDto,
  GalaChainResponse,
  MintTokenWithAllowanceDto,
  TokenBalance,
  TokenInstanceKey,
  TransferTokenDto
} from "@gala-chain/api";
import { TokenClassKey } from "@gala-chain/api";
import { CreateTokenClassDto } from "@gala-chain/api";
import { ChainClient, ChainUser, CommonContractAPI, commonContractAPI } from "@gala-chain/client";
import { AdminChainClients, transactionError } from "@gala-chain/test";
import { TestClients } from "@gala-chain/test";
import { BigNumber } from "bignumber.js";

import { LaunchPadSale } from "../src/launchpad/LaunchPadSale";
import { saleStatus } from "../src/launchpad/constants";
import { INITIAL_PLATFORM_FEE_ADDRESS } from "../src/launchpad/constants";
import {
  createSaleResponse,
  createTokenSaleDTO,
  exactTokenAmountDto,
  fetchSaleDto,
  nativeTokenAmountDto,
  preMintCalculationDto,
  tradeResponse
} from "../src/launchpad/dtos";
import { FetchBalancesWithPaginationResponse } from "../src/token/dtos";
import { GetPoolDto, SwapDto } from "../src/v3/dtos";
import { Pool } from "../src/v3/pool";
import { calNativeTokensInTest } from "./testHelper";
import { Console } from "console";

jest.setTimeout(100000);

describe("LaunchPadContract", () => {
  const LaunchPadContractConfig = {
    LaunchPad: {
      channel: "product-channel",
      chaincode: "basic-product",
      contract: "LaunchPad",
      api: LaunchPadContractAPI
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

  let client: AdminChainClients<typeof LaunchPadContractConfig>;
  let user: ChainUser;

  let client1: AdminChainClients<typeof GalaTokenContractConfig>;
  let user1: ChainUser;

  let client2: AdminChainClients<typeof LaunchPadContractConfig>;
  let user2: ChainUser;

  let client3: AdminChainClients<typeof DexV3ContractConfig>;
  let user3: ChainUser;

  let vaultAddress: any;

  beforeAll(async () => {
    client = await TestClients.createForAdmin(LaunchPadContractConfig);
    user = await client.createRegisteredUser();

    client1 = await TestClients.createForAdmin(GalaTokenContractConfig);
    user1 = await client1.createRegisteredUser();

    client2 = await TestClients.createForAdmin(LaunchPadContractConfig);
    user2 = await client2.createRegisteredUser();

    client3 = await TestClients.createForAdmin(DexV3ContractConfig);
    user3 = await client2.createRegisteredUser();
  });

  afterAll(async () => {
    await client.disconnect();
    await client1.disconnect();
    await client2.disconnect();
  });

  //Create sale helper function
  async function createSale(
    client: AdminChainClients<typeof LaunchPadContractConfig>,
    user: ChainUser,
    tokenName: string,
    tokenSymbol: string
  ) {
    const createLaunchPadSaleDTO = new createTokenSaleDTO();
    createLaunchPadSaleDTO.tokenName = tokenName;
    createLaunchPadSaleDTO.tokenSymbol = tokenSymbol;
    createLaunchPadSaleDTO.tokenDescription = `${tokenName} sale description`;
    createLaunchPadSaleDTO.tokenImage = "www.test.com";
    createLaunchPadSaleDTO.preBuyAmount = new BigNumber("0");
    createLaunchPadSaleDTO.websiteUrl = "firefox.com";

    // Sign the DTO using the user's private key
    createLaunchPadSaleDTO.sign(user.privateKey);

    // Call the CreateSale function
    const response = await client.LaunchPad.CreateSale(createLaunchPadSaleDTO);
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
    tokenClassDto.maxSupply = new BigNumber("2e+7");
    tokenClassDto.maxCapacity = new BigNumber("2e+7");
    tokenClassDto.totalMintAllowance = new BigNumber(0);
    tokenClassDto.totalSupply = new BigNumber(0);
    tokenClassDto.totalBurned = new BigNumber(0);
    tokenClassDto.network = "GC";
    tokenClassDto.isNonFungible = false;

    tokenClassDto.sign(user1.privateKey);

    let res2 = await client1.token.CreateToken(tokenClassDto);

    let mintDTO = new MintTokenWithAllowanceDto();

    mintDTO.tokenClass = classKey;
    mintDTO.quantity = new BigNumber("2e+7");
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
      const createLaunchPadSaleDTO = new createTokenSaleDTO();
      createLaunchPadSaleDTO.tokenName = "Assett";
      createLaunchPadSaleDTO.tokenSymbol = "ART";
      createLaunchPadSaleDTO.tokenDescription = "created for sale";
      createLaunchPadSaleDTO.tokenImage = "www.test.com";
      createLaunchPadSaleDTO.preBuyAmount = new BigNumber("0");
      createLaunchPadSaleDTO.websiteUrl = "google.com";

      createLaunchPadSaleDTO.sign(user.privateKey);
      const response = await client.LaunchPad.CreateSale(createLaunchPadSaleDTO);

      expect(response).toBeDefined();
      expect(response).toMatchObject({
        Data: expect.objectContaining({
          creatorAddress: expect.stringMatching(/^eth\|[a-fA-F0-9]{40}$/), // Dynamic address check
          description: "created for sale",
          image: "www.test.com",
          initialBuyAmount: "0",
          symbol: "ART",
          telegramUrl: "",
          tokenName: "Assett",
          twitterUrl: "",
          vaultAddress: expect.stringMatching(/^service\|Token\$Unit\$ART\$eth:[a-fA-F0-9]{40}\$launchpad$/), // Dynamic vaultAddress check
          websiteUrl: "google.com"
        }),
        Status: 1 // Ensure Status is correct
      });
    });

    test("It should revert if token name is not given", async () => {
      const createLaunchPadSaleDTO = new createTokenSaleDTO();
      createLaunchPadSaleDTO.tokenName = "";
      createLaunchPadSaleDTO.tokenSymbol = "saleEight";
      createLaunchPadSaleDTO.tokenDescription = "created for sale";
      createLaunchPadSaleDTO.tokenImage = "www.test.com";
      createLaunchPadSaleDTO.preBuyAmount = new BigNumber("0");

      createLaunchPadSaleDTO.sign(user.privateKey);
      const response = await client.LaunchPad.CreateSale(createLaunchPadSaleDTO);

      expect(response).toEqual(transactionError());
      expect(response.Message).toContain("tokenName should not be empty");
    });

    test("It should revert if token symbol is not given", async () => {
      const createLaunchPadSaleDTO = new createTokenSaleDTO();
      createLaunchPadSaleDTO.tokenName = "Asset8";
      createLaunchPadSaleDTO.tokenSymbol = "";
      createLaunchPadSaleDTO.tokenDescription = "created for sale";
      createLaunchPadSaleDTO.tokenImage = "www.test.com";
      createLaunchPadSaleDTO.preBuyAmount = new BigNumber("0");

      createLaunchPadSaleDTO.sign(user.privateKey);
      const response = await client.LaunchPad.CreateSale(createLaunchPadSaleDTO);

      expect(response).toEqual(transactionError());
      expect(response.Message).toContain("tokenSymbol should not be empty");
    });

    test("It should revert in token description is empty", async () => {
      const createLaunchPadSaleDTO = new createTokenSaleDTO();
      createLaunchPadSaleDTO.tokenName = "Asset8";
      createLaunchPadSaleDTO.tokenSymbol = "saleEight";
      createLaunchPadSaleDTO.tokenDescription = "";
      createLaunchPadSaleDTO.tokenImage = "www.test.com";
      createLaunchPadSaleDTO.preBuyAmount = new BigNumber("0");

      createLaunchPadSaleDTO.sign(user.privateKey);
      const response = await client.LaunchPad.CreateSale(createLaunchPadSaleDTO);

      expect(response).toEqual(transactionError());
      expect(response.Message).toContain("tokenDescription should not be empty");
    });

    test("Sale cannot be created without social link", async () => {
      const createLaunchPadSaleDTO = new createTokenSaleDTO();
      createLaunchPadSaleDTO.tokenName = "Asset31";
      createLaunchPadSaleDTO.tokenSymbol = "saleThirtyOne";
      createLaunchPadSaleDTO.tokenDescription = "test token description1";
      createLaunchPadSaleDTO.tokenImage = "www.test.com";
      createLaunchPadSaleDTO.preBuyAmount = new BigNumber("0");

      createLaunchPadSaleDTO.sign(user.privateKey);
      const response = await client.LaunchPad.CreateSale(createLaunchPadSaleDTO);

      expect(response.Message).toEqual("Token sale creation requires atleast one social link.");
    });
    test("Same sale cannot be created with same user", async () => {
      const createLaunchPadSaleDTO = new createTokenSaleDTO();
      createLaunchPadSaleDTO.tokenName = "Asset8";
      createLaunchPadSaleDTO.tokenSymbol = "saleEight";
      createLaunchPadSaleDTO.tokenDescription = "test token description1";
      createLaunchPadSaleDTO.tokenImage = "www.test.com";
      createLaunchPadSaleDTO.preBuyAmount = new BigNumber("0");
      createLaunchPadSaleDTO.websiteUrl = "fix.com";

      createLaunchPadSaleDTO.sign(user.privateKey);
      const response = await client.LaunchPad.CreateSale(createLaunchPadSaleDTO);

      const createLaunchPadSale2DTO = new createTokenSaleDTO();
      createLaunchPadSale2DTO.tokenName = "Asset8";
      createLaunchPadSale2DTO.tokenSymbol = "saleEight";
      createLaunchPadSale2DTO.tokenDescription = "test token description2";
      createLaunchPadSale2DTO.tokenImage = "www.test.com";
      createLaunchPadSale2DTO.preBuyAmount = new BigNumber("0");
      createLaunchPadSale2DTO.websiteUrl = "fix.com";
      createLaunchPadSale2DTO.sign(user.privateKey);
      const response2 = await client.LaunchPad.CreateSale(createLaunchPadSale2DTO);

      expect(response2.Message).toContain("This token and a sale associtated with it already exists");
    });

    test("20 Million tokens are pre minted to vault address (10 Million for sale + 10 Million for Buffer and Dex)", async () => {
      const sale = await createSale(client, user, "Asset9", "saleNine");
      vaultAddress = sale.Data?.vaultAddress;

      //Fetch Token Balance from Vault

      const FetchBalanceDto = new FetchBalancesDto();
      FetchBalanceDto.owner = vaultAddress;
      FetchBalanceDto.collection = "Token";
      FetchBalanceDto.category = "Unit";
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
      const createLaunchPadSaleDTO = new createTokenSaleDTO();
      createLaunchPadSaleDTO.tokenName = "Asset7";
      createLaunchPadSaleDTO.tokenSymbol = "saleSeven";
      createLaunchPadSaleDTO.tokenDescription = "created for sale";
      createLaunchPadSaleDTO.tokenImage = "www.test.com";
      createLaunchPadSaleDTO.preBuyAmount = new BigNumber("50");
      createLaunchPadSaleDTO.websiteUrl = "twilio.com";

      createLaunchPadSaleDTO.sign(user.privateKey);
      const response = await client.LaunchPad.CreateSale(createLaunchPadSaleDTO);

      const initialBuyAmountFromSale = Number(response.Data?.initialBuyAmount);

      expect(initialBuyAmountFromSale).toEqual(50);

      //Fetch User's Gala Balance after Buy
      const fetchGalaBalanceAfterRes = await client1.token.FetchBalances(FetchGalaBalanceDto);
      const galaBalanceAfter = (fetchGalaBalanceAfterRes?.Data?.[0] as any).quantity;
      const galaBalanceDiff = galaBalanceBeforeBuy - galaBalanceAfter;

      expect(galaBalanceDiff).toEqual(50);

      //Ftech User's Token Balance
      const tokenBalanceDTO = new FetchBalancesDto();

      tokenBalanceDTO.owner = user.identityKey;
      tokenBalanceDTO.collection = "Token";
      tokenBalanceDTO.category = "Unit";
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

    const buyWithExactDTO = new exactTokenAmountDto();
    buyWithExactDTO.vaultAddress = vaultAddress;
    buyWithExactDTO.tokenAmount = new BigNumber("9999999");

    buyWithExactDTO.sign(user.privateKey);

    const buyWithExactRes = await client.LaunchPad.BuyExactToken(buyWithExactDTO);

    const fetchGalaBalanceAfterRes = await client1.token.FetchBalances(FetchGalaBalanceDto);

    const galaBalanceAfterBuy = (fetchGalaBalanceAfterRes?.Data?.[0] as any).quantity;

    let balanceDiff = galaBalanceBeforeBuy - galaBalanceAfterBuy;

    // Buy with native

    const sale2 = await createSale(client, user, "Asset25", "saleTwentyFive");
    vaultAddress = sale2.Data?.vaultAddress;

    balanceDiff = roundToDecimal(balanceDiff, 8);

    const buyWithNativeDTO = new nativeTokenAmountDto();
    buyWithNativeDTO.vaultAddress = vaultAddress;
    buyWithNativeDTO.nativeTokenAmount = new BigNumber(balanceDiff);

    buyWithNativeDTO.sign(user2.privateKey);

    const buyWithNativeRes = await client.LaunchPad.BuyWithNative(buyWithNativeDTO);

    //Token Sale Quantity from sale

    const totalSupply = 10000000;

    const fetchSaleDetailsDTO = new fetchSaleDto();
    fetchSaleDetailsDTO.vaultAddress = vaultAddress;

    const fetchSaleDetailsRes = await client.LaunchPad.FetchSale(fetchSaleDetailsDTO);
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

    const buyExactTokenDTO = new exactTokenAmountDto();
    buyExactTokenDTO.vaultAddress = vaultAddress;
    buyExactTokenDTO.tokenAmount = new BigNumber("1");

    buyExactTokenDTO.sign(user1.privateKey);

    const buyExactTokenRes = await client.LaunchPad.BuyExactToken(buyExactTokenDTO);

    const fetchGalaBalanceAfterRes = await client1.token.FetchBalances(FetchGalaBalanceDto);

    const balanceAfterBuy = (fetchGalaBalanceAfterRes?.Data?.[0] as any).quantity;

    const balanceDiff = balanceBeforeBuy - balanceAfterBuy;

    expect(balanceDiff).toBeCloseTo(Number(0.00001650667150665));
  });

  describe("Buy and Sell Functions test", () => {
    test("Buy with Native", async () => {
      const sale = await createSale(client, user, "Asset13", "saleThirteen");
      vaultAddress = sale.Data?.vaultAddress;

      const buyWithNativeDTO = new nativeTokenAmountDto();
      buyWithNativeDTO.vaultAddress = vaultAddress;
      buyWithNativeDTO.nativeTokenAmount = new BigNumber("31.27520343");

      buyWithNativeDTO.sign(user1.privateKey);

      //Fetch User's Gala Balance

      const FetchGalaBalanceDto = new FetchBalancesDto();
      FetchGalaBalanceDto.owner = user1.identityKey;
      FetchGalaBalanceDto.collection = "GALA";
      FetchGalaBalanceDto.category = "Unit";
      FetchGalaBalanceDto.type = "none";

      const fetchGalaBalanceBeforeRes = await client1.token.FetchBalances(FetchGalaBalanceDto);

      const balanceOfUserBeforeBuy = (fetchGalaBalanceBeforeRes?.Data?.[0] as any).quantity;

      const buyWithNativeRes = await client.LaunchPad.BuyWithNative(buyWithNativeDTO);

      const fetchGalaBalanceAfterRes = await client1.token.FetchBalances(FetchGalaBalanceDto);

      const balanceOfUserAfterBuy = (fetchGalaBalanceAfterRes?.Data?.[0] as any).quantity;
      const balanceDiff = balanceOfUserBeforeBuy - balanceOfUserAfterBuy;

      expect(balanceDiff).toBeCloseTo(31.27520343);

      //Fetching token balance
      const tokenBalanceDTO = new FetchBalancesDto();

      tokenBalanceDTO.owner = user1.identityKey;
      tokenBalanceDTO.collection = "Token";
      tokenBalanceDTO.category = "Unit";
      tokenBalanceDTO.type = "SALETHIRTEEN";

      const fetchTokenBalanceRes = await client1.token.FetchBalances(tokenBalanceDTO);

      const tokenBalanceAfterBuy = (fetchTokenBalanceRes?.Data?.[0] as any).quantity;

      //Fetch tokens sold from sale

      const fetchSaleDetailDTO = new fetchSaleDto();
      fetchSaleDetailDTO.vaultAddress = vaultAddress;

      const fetchSaleRes = await client.LaunchPad.FetchSale(fetchSaleDetailDTO);

      const sellingQty = fetchSaleRes.Data?.sellingTokenQuantity;

      const tokensSold = 10000000 - Number(sellingQty);

      expect(tokensSold).toBeCloseTo(Number(tokenBalanceAfterBuy));
    });

    test("Buy Exact tokens", async () => {
      const sale = await createSale(client, user, "Asset14", "saleFourteen");
      vaultAddress = sale.Data?.vaultAddress;

      const buyWithExactDTO = new exactTokenAmountDto();
      buyWithExactDTO.vaultAddress = vaultAddress;
      buyWithExactDTO.tokenAmount = new BigNumber("2000000");

      buyWithExactDTO.sign(user1.privateKey);

      const buyExactTokenRes = await client.LaunchPad.BuyExactToken(buyWithExactDTO);

      const tokenQuantitySold = buyExactTokenRes.Data?.outputAmount;
      //Fetch User's Token Balance

      const tokenBalanceDTO = new FetchBalancesDto();

      tokenBalanceDTO.owner = user1.identityKey;
      tokenBalanceDTO.collection = "Token";
      tokenBalanceDTO.category = "Unit";
      tokenBalanceDTO.type = "SALEFOURTEEN";

      const fetchBalanceRes = await client1.token.FetchBalances(tokenBalanceDTO);
      const tokenbalanceOfUser = (fetchBalanceRes?.Data?.[0] as any).quantity;

      expect(tokenbalanceOfUser).toEqual(tokenQuantitySold);

      //Fetch Sale

      const fetchSaleDetailDTO = new fetchSaleDto();
      fetchSaleDetailDTO.vaultAddress = vaultAddress;

      const fetchSaleRes = await client.LaunchPad.FetchSale(fetchSaleDetailDTO);

      const sellingQty = fetchSaleRes.Data?.sellingTokenQuantity;

      const tokensSold = 10000000 - Number(sellingQty);

      expect(Number(tokenbalanceOfUser)).toBeCloseTo(tokensSold);
    });

    test("Sell With Native", async () => {
      const sale = await createSale(client, user, "Asset16", "saleSixteen");
      vaultAddress = sale.Data?.vaultAddress;

      const buyWithNativeDTO = new nativeTokenAmountDto();
      buyWithNativeDTO.vaultAddress = vaultAddress;
      buyWithNativeDTO.nativeTokenAmount = new BigNumber("31.27520343");

      //Gala Balance Before Buy

      const FetchGalaBalanceDto = new FetchBalancesDto();
      FetchGalaBalanceDto.owner = user1.identityKey;
      FetchGalaBalanceDto.collection = "GALA";
      FetchGalaBalanceDto.category = "Unit";
      FetchGalaBalanceDto.type = "none";

      const fetchGalaBalanceBeforeRes = await client1.token.FetchBalances(FetchGalaBalanceDto);

      const balanceOfUserBeforeBuy = (fetchGalaBalanceBeforeRes?.Data?.[0] as any).quantity;

      buyWithNativeDTO.sign(user1.privateKey);

      const buyWithNativeRes = await client.LaunchPad.BuyWithNative(buyWithNativeDTO);

      //Sell With Native

      const sellWithNativeDTO = new nativeTokenAmountDto();
      sellWithNativeDTO.vaultAddress = vaultAddress;
      sellWithNativeDTO.nativeTokenAmount = new BigNumber("31.27520343");

      sellWithNativeDTO.sign(user1.privateKey);

      const sellWithNativeRes = await client.LaunchPad.SellWithNative(sellWithNativeDTO);

      //Gala Balance After Sell

      const fetchGalaBalanceAfterRes = await client1.token.FetchBalances(FetchGalaBalanceDto);

      const balanceOfUserAfterSell = (fetchGalaBalanceAfterRes?.Data?.[0] as any).quantity;
      expect(balanceOfUserBeforeBuy).toEqual(balanceOfUserAfterSell);

      const sellTokenQty = sellWithNativeRes.Data?.tokenAmount;

      //Fetch Sale

      const fetchSaleDTO = new fetchSaleDto();
      fetchSaleDTO.vaultAddress = vaultAddress;

      const fetchSaleRes = await client.LaunchPad.FetchSale(fetchSaleDTO);

      const sellingTokenQuantity = fetchSaleRes.Data?.sellingTokenQuantity;

      expect(Number(sellingTokenQuantity)).toEqual(10000000);

      //User's Token Balance
      const tokenBalanceDTO = new FetchBalancesDto();

      tokenBalanceDTO.owner = user1.identityKey;
      tokenBalanceDTO.collection = "Token";
      tokenBalanceDTO.category = "Unit";
      tokenBalanceDTO.type = "SALESIXTEEN";

      const fetchBalanceRes = await client1.token.FetchBalances(tokenBalanceDTO);

      const tokenbalanceOfUser = (fetchBalanceRes?.Data?.[0] as any).quantity;
      expect(Number(tokenbalanceOfUser)).toEqual(0);
    });

    test("Sell Exact Tokens", async () => {
      const sale = await createSale(client, user, "Asset20", "saleTwenty");
      vaultAddress = sale.Data?.vaultAddress;

      const buyWithExactDTO = new exactTokenAmountDto();
      buyWithExactDTO.vaultAddress = vaultAddress;
      buyWithExactDTO.tokenAmount = new BigNumber("2000000");

      buyWithExactDTO.sign(user1.privateKey);

      const buyExactTokenRes = await client.LaunchPad.BuyExactToken(buyWithExactDTO);

      // User's Token Balance before sell
      const tokenBalanceDTO = new FetchBalancesDto();

      tokenBalanceDTO.owner = user1.identityKey;
      tokenBalanceDTO.collection = "Token";
      tokenBalanceDTO.category = "Unit";
      tokenBalanceDTO.type = "SALETWENTY";

      const fetchBalanceRes = await client1.token.FetchBalances(tokenBalanceDTO);
      const tokenbalanceOfUserAfterBuy = (fetchBalanceRes?.Data?.[0] as any).quantity;

      const sellExactTokenDTO = new exactTokenAmountDto();
      sellExactTokenDTO.vaultAddress = vaultAddress;
      sellExactTokenDTO.tokenAmount = new BigNumber("5000");

      sellExactTokenDTO.sign(user1.privateKey);

      const sellExactTokenRes = await client.LaunchPad.SellToken(sellExactTokenDTO);

      const fetchBalanceSellRes = await client1.token.FetchBalances(tokenBalanceDTO);

      const tokenbalanceOfUserAfterSell = (fetchBalanceSellRes?.Data?.[0] as any).quantity;

      const balanceDiff = tokenbalanceOfUserAfterBuy - tokenbalanceOfUserAfterSell;

      expect(balanceDiff).toEqual(5000);
    });

    test("Buy and Sell using both Exact Functions", async () => {
      const sale = await createSale(client, user, "Asset2", "saleTwo");
      vaultAddress = sale.Data?.vaultAddress;

      const totalSupply = 10000000;
      const tokensToBuyAndSell = 1000000;
      let sellingTokenQuantity = totalSupply;
      let currentSupply = 0;

      for (let i = 1; i <= 10; i++) {
        let tokens = tokensToBuyAndSell * i;

        //comment this if you want to test till complete supply
        // if buy till 9999999
        if (i === 10) {
          tokens = 999999;
        }

        const amountOutMeme = new BigNumber(tokens);

        const initialfetchSaleDto = new fetchSaleDto();
        initialfetchSaleDto.vaultAddress = vaultAddress;

        const initialFetchSaleDetails = await client.LaunchPad.FetchSale(initialfetchSaleDto);

        sellingTokenQuantity = Number(initialFetchSaleDetails.Data?.sellingTokenQuantity);
        currentSupply = totalSupply - sellingTokenQuantity;

        const buyExactDto = new exactTokenAmountDto();
        buyExactDto.vaultAddress = vaultAddress;
        buyExactDto.tokenAmount = new BigNumber(amountOutMeme); // 1000000

        const calculatedAmount = await client.LaunchPad.CallNativeTokenIn(buyExactDto);

        // Declare calculatedAmountNumber at the beginning

        // Calculating Current Supply
        const fetchSaleDTO = new fetchSaleDto();
        fetchSaleDTO.vaultAddress = vaultAddress;

        const fetchSaleDetails = await client.LaunchPad.FetchSale(fetchSaleDTO);

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

        const buyExactDTO = new exactTokenAmountDto();
        buyExactDTO.vaultAddress = vaultAddress;
        buyExactDTO.tokenAmount = amountOutMeme;

        buyExactDTO.sign(user1.privateKey);

        const buyExactTokenRes = await client.LaunchPad.BuyExactToken(buyExactDTO);

        //Fetch Sale Details After purchase
        const updatedSaleDetails = await client.LaunchPad.FetchSale(fetchSaleDTO);

        const updatedSellingTokenQuantity = Number(updatedSaleDetails.Data?.sellingTokenQuantity);

        const updatedCurrentSupply = totalSupply - updatedSellingTokenQuantity;

        const FetchBalanceResAfter = await client1.token.FetchBalances(FetchBalanceDto);

        const TokenBalanceAfter = (FetchBalanceResAfter.Data?.[0] as any).quantity;

        const balanceDiffBuy = TokenBalance - TokenBalanceAfter;

        //  if(i !== 10 || (tokens%1000000)== 0)
        //{

        expect(balanceDiffBuy).toBeCloseTo(Number(calculatedAmount.Data));

        const expectedSellingQuantity = totalSupply - (currentSupply + Number(amountOutMeme));
        // Validate sellingTokenQuantity equals totalSupply - (currentSupply + amountOutMeme)
        expect(updatedSellingTokenQuantity).toEqual(expectedSellingQuantity);

        //return

        //**Sell Tokens Test**
        const sellExactTokenDTO = new exactTokenAmountDto();
        sellExactTokenDTO.vaultAddress = vaultAddress;
        sellExactTokenDTO.tokenAmount = amountOutMeme;

        const sellExpected = await client.LaunchPad.CallNativeTokenOut(sellExactTokenDTO);

        const balanceBeforeSellRes = await client1.token.FetchBalances(FetchBalanceDto);

        const balanceBeforeSell = (balanceBeforeSellRes.Data?.[0] as any).quantity;

        sellExactTokenDTO.sign(user1.privateKey);

        const sellExactTokeRes = await client.LaunchPad.SellToken(sellExactTokenDTO);

        const balanceAfterSellRes = await client1.token.FetchBalances(FetchBalanceDto);

        const balanceAfterSell = (balanceAfterSellRes.Data?.[0] as any).quantity;

        const balanceDiffSell = balanceAfterSell - balanceBeforeSell;

        expect(balanceDiffSell).toBeCloseTo(Number(sellExpected.Data));

        // Total tokens sold should be back to the previous state

        //Fetch sale details

        const fetchSaleDetailsDTO = new fetchSaleDto();

        fetchSaleDetailsDTO.vaultAddress = vaultAddress;

        const fetchaSaleDetailsRes = await client.LaunchPad.FetchSale(fetchSaleDetailsDTO);

        const sellingTokenQuantityAfterSell = Number(fetchaSaleDetailsRes.Data?.sellingTokenQuantity);

        const CurrentSupplyAfterSell = totalSupply - sellingTokenQuantityAfterSell;

        expect(currentSupply).toEqual(CurrentSupplyAfterSell);

        //  else {

        //    expect(balanceDiffBuy).toBeCloseTo(Number("1129679.89")) ;

        //    console.log("updated Selling token quantity " , updatedSellingTokenQuantity);
        //    expect(updatedSellingTokenQuantity).toEqual(1); //Last token left in vault to sell

        // }
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

        const nativeTokenAmountDTO = new nativeTokenAmountDto();
        nativeTokenAmountDTO.vaultAddress = vaultAddress;
        nativeTokenAmountDTO.nativeTokenAmount = new BigNumber(nativeTokensIn);

        const calculatedReturns = await client.LaunchPad.CallMemeTokenOut(nativeTokenAmountDTO);

        nativeTokenAmountDTO.sign(user1.privateKey);

        const buyWithNativeRes = await client.LaunchPad.BuyWithNative(nativeTokenAmountDTO);

        //Fetch User's Token Balance
        const FetchBalanceDto = new FetchBalancesDto();
        FetchBalanceDto.owner = user1.identityKey;
        FetchBalanceDto.collection = "Token";
        FetchBalanceDto.category = "Unit";
        FetchBalanceDto.type = "SALETHREE";

        const fetchBalanceRes = await client1.token.FetchBalances(FetchBalanceDto);

        const balanceOfUser = (fetchBalanceRes?.Data?.[0] as any).quantity;

        expect(Number(calculatedReturns.Data)).toBeCloseTo(Number(balanceOfUser));

        const callWithNativeTokenDTO = new exactTokenAmountDto();
        callWithNativeTokenDTO.vaultAddress = vaultAddress;
        callWithNativeTokenDTO.tokenAmount = new BigNumber(balanceOfUser);

        const callNativeTokensOutVal = await client.LaunchPad.CallNativeTokenOut(callWithNativeTokenDTO);

        const callMemeTokensInDTO = new nativeTokenAmountDto();
        callMemeTokensInDTO.vaultAddress = vaultAddress;
        callMemeTokensInDTO.nativeTokenAmount = new BigNumber(callNativeTokensOutVal.Data ?? "0");

        const callMemeTokensForBalance = await client.LaunchPad.CallMemeTokenIn(callMemeTokensInDTO);

        callMemeTokensInDTO.sign(user1.privateKey);
        const sellWithNativeRes = await client.LaunchPad.SellWithNative(callMemeTokensInDTO);

        expect(Number(calculatedReturns.Data)).toBeCloseTo(Number(callMemeTokensForBalance.Data));

        const remainingBalance = await client1.token.FetchBalances(FetchBalanceDto);

        const remainingBalanceUser = (remainingBalance?.Data?.[0] as any).quantity;

        //Fetch Total tokens sold from sale

        const fetchSaleDetailsDto = new fetchSaleDto();
        fetchSaleDetailsDto.vaultAddress = vaultAddress;

        const fetchsaleRes = await client.LaunchPad.FetchSale(fetchSaleDetailsDto);
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

        const callMemeTokensOutDTO = new nativeTokenAmountDto();
        callMemeTokensOutDTO.vaultAddress = vaultAddress;
        callMemeTokensOutDTO.nativeTokenAmount = new BigNumber(nativeTokensIn);

        const calculatedReturn = await client.LaunchPad.CallMemeTokenOut(callMemeTokensOutDTO);

        //BuyWithNative

        callMemeTokensOutDTO.sign(user1.privateKey);
        const buyWithNativeRes = await client.LaunchPad.BuyWithNative(callMemeTokensOutDTO);

        //Fetch User's Token Balance
        const FetchBalanceDto = new FetchBalancesDto();
        FetchBalanceDto.owner = user1.identityKey;
        FetchBalanceDto.collection = "Token";
        FetchBalanceDto.category = "Unit";
        FetchBalanceDto.type = "SALEFIVE";

        const fetchBalanceRes = await client1.token.FetchBalances(FetchBalanceDto);

        const balanceOfUser = (fetchBalanceRes?.Data?.[0] as any).quantity;

        expect(Number(calculatedReturn.Data)).toBeCloseTo(Number(balanceOfUser));

        const calNativeTokensOutDTO = new exactTokenAmountDto();
        calNativeTokensOutDTO.vaultAddress = vaultAddress;
        calNativeTokensOutDTO.tokenAmount = new BigNumber(calculatedReturn.Data ?? "0");

        const sellExpected = await client.LaunchPad.CallNativeTokenOut(calNativeTokensOutDTO);

        //Gala Balance Before Sell

        const FetchGalaBalanceDto = new FetchBalancesDto();
        FetchGalaBalanceDto.owner = user1.identityKey;
        FetchGalaBalanceDto.collection = "GALA";
        FetchGalaBalanceDto.category = "Unit";
        FetchGalaBalanceDto.type = "none";

        const fetchGalaBalanceRes = await client1.token.FetchBalances(FetchGalaBalanceDto);

        const balanceBeforeSell = (fetchGalaBalanceRes?.Data?.[0] as any).quantity;

        //Sell Tokens

        const sellExactTokensDTO = new exactTokenAmountDto();
        sellExactTokensDTO.vaultAddress = vaultAddress;
        sellExactTokensDTO.tokenAmount = new BigNumber(calculatedReturn.Data ?? "0");

        sellExactTokensDTO.sign(user1.privateKey);

        const sellExactTokenRes = await client.LaunchPad.SellToken(sellExactTokensDTO);

        const fetchGalaBalanceAfterRes = await client1.token.FetchBalances(FetchGalaBalanceDto);

        const balanceAfterSell = (fetchGalaBalanceAfterRes?.Data?.[0] as any).quantity;

        const balanceDiff = balanceAfterSell - balanceBeforeSell;
        expect(balanceDiff).toBeCloseTo(Number(sellExpected.Data));

        //Total tokens sold should be back to the previous state (after sell)

        const fetchSaleDetailsDto = new fetchSaleDto();
        fetchSaleDetailsDto.vaultAddress = vaultAddress;

        const fetchSaleDetailsRes = await client.LaunchPad.FetchSale(fetchSaleDetailsDto);

        const fetchSellingQuantity = fetchSaleDetailsRes.Data?.sellingTokenQuantity;

        expect(Number(fetchSellingQuantity)).toEqual(10000000);
      }
    });

    test("It should BuyExactToken and SellWithNative (Cross Function Check)", async () => {
      const sale = await createSale(client, user, "Asset6", "saleSIX");

      vaultAddress = vaultAddress = sale.Data?.vaultAddress;

      const totalSupply = 10000000;
      const tokensToBuyAndSell = 1000000;
      let sellingTokenQuantity = totalSupply;
      let currentSupply = 0;

      for (let i = 1; i <= 10; i++) {
        let tokens = tokensToBuyAndSell * i;

        //comment this if you want to test till complete supply
        // if buy till 9999999
        if (i === 10) {
          tokens = 999999;
        }

        const amountOutMeme = new BigNumber(tokens);

        const callNativeTokenInDTO = new exactTokenAmountDto();
        callNativeTokenInDTO.vaultAddress = vaultAddress;
        callNativeTokenInDTO.tokenAmount = amountOutMeme;

        const calculatedAmountOfNativeCoins = await client.LaunchPad.CallNativeTokenIn(callNativeTokenInDTO);

        const fetchSaleDetailsDTO = new fetchSaleDto();
        fetchSaleDetailsDTO.vaultAddress = vaultAddress;

        const fetchSaleDetailsRes = await client.LaunchPad.FetchSale(fetchSaleDetailsDTO);
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

        const buyExactTokenDTO = new exactTokenAmountDto();
        buyExactTokenDTO.vaultAddress = vaultAddress;
        buyExactTokenDTO.tokenAmount = new BigNumber(amountOutMeme);

        buyExactTokenDTO.sign(user1.privateKey);

        const buyExactTokenRes = await client.LaunchPad.BuyExactToken(buyExactTokenDTO);

        const fetchGalaBalanceAfterBuyRes = await client1.token.FetchBalances(FetchGalaBalanceDto);

        const balanceAfterBuy = (fetchGalaBalanceAfterBuyRes?.Data?.[0] as any).quantity;

        const balanceDiff = balanceBeforeBuy - balanceAfterBuy;

        expect(balanceDiff).toBeCloseTo(Number(calculatedAmountOfNativeCoins.Data));

        //Total tokens sold after buy

        const fetchSaleRes = await client.LaunchPad.FetchSale(fetchSaleDetailsDTO);

        const sellingQty = Number(fetchSaleRes.Data?.sellingTokenQuantity);

        const totalTokensSoldAfterBuy = totalSupply - sellingQty;

        const updatedSupply = new BigNumber(curSupply).plus(amountOutMeme);

        expect(Number(totalTokensSoldAfterBuy)).toBeCloseTo(Number(updatedSupply));

        const sellExpectedDTO = new exactTokenAmountDto();
        sellExpectedDTO.vaultAddress = vaultAddress;
        sellExpectedDTO.tokenAmount = new BigNumber(amountOutMeme);

        const sellExpected = await client.LaunchPad.CallNativeTokenOut(sellExpectedDTO);

        //Fetch User's Gala Balance Before Sell
        const fetchGalaBalanceBeforeSell = await client1.token.FetchBalances(FetchGalaBalanceDto);

        const balanceBeforeSell = (fetchGalaBalanceBeforeSell?.Data?.[0] as any).quantity;

        const callMemeOutValDTO = new nativeTokenAmountDto();
        callMemeOutValDTO.vaultAddress = vaultAddress;
        callMemeOutValDTO.nativeTokenAmount = new BigNumber(calculatedAmountOfNativeCoins.Data ?? "0");

        const calMemeOutVal = await client.LaunchPad.CallMemeTokenIn(callMemeOutValDTO);
        expect(Number(sellExpected.Data)).toBeCloseTo(Number(calculatedAmountOfNativeCoins.Data));

        //Selling

        const sellWithNativeDTO = new nativeTokenAmountDto();
        sellWithNativeDTO.vaultAddress = vaultAddress;
        sellWithNativeDTO.nativeTokenAmount = new BigNumber(calculatedAmountOfNativeCoins.Data ?? "0");

        sellWithNativeDTO.sign(user1.privateKey);

        const sellWithNativeRes = await client.LaunchPad.SellWithNative(sellWithNativeDTO);

        //Token Selling Quantity should be back to initial

        const fetchTokenSellingQtyRes = await client.LaunchPad.FetchSale(fetchSaleDetailsDTO);

        const tokensSellingQty = Number(fetchTokenSellingQtyRes.Data?.sellingTokenQuantity);
        expect(Number(calculatedAmountOfNativeCoins.Data)).toBeCloseTo(Number(sellExpected.Data));
      }
    });
  });

  describe("Slippage Test ", () => {
    test("BuyWithNative  || It should rever if expected amount is greater than the actual amount", async () => {
      const sale = await createSale(client, user, "Asset22", "saleTwentyTwo");
      vaultAddress = sale.Data?.vaultAddress;

      const buyWithNativeDTO = new nativeTokenAmountDto();
      buyWithNativeDTO.vaultAddress = vaultAddress;
      buyWithNativeDTO.nativeTokenAmount = new BigNumber("100");

      const callMemeTokenOutRes = await client.LaunchPad.CallMemeTokenOut(buyWithNativeDTO);

      const callMemeTokenOutVal = Number(callMemeTokenOutRes.Data);

      const increasedExpectedAmout = callMemeTokenOutVal + 10;

      buyWithNativeDTO.expectedToken = new BigNumber(increasedExpectedAmout);

      buyWithNativeDTO.sign(user1.privateKey);
      const buyWithNativeRes = await client.LaunchPad.BuyWithNative(buyWithNativeDTO);
      expect(buyWithNativeRes.Message).toBe(
        "Tokens expected from this operation are less than the the actual amount that will be provided."
      );
    });

    test("BuyWithExactToken  || It should revert if tokens expected to perform this operation are less than the actual amount required", async () => {
      const sale = await createSale(client, user, "Asset23", "saleTwentyThree");
      vaultAddress = sale.Data?.vaultAddress;

      const buyWithExactDTO = new exactTokenAmountDto();
      buyWithExactDTO.vaultAddress = vaultAddress;
      buyWithExactDTO.tokenAmount = new BigNumber("2000000");

      const callNativeTokenInRes = await client.LaunchPad.CallNativeTokenIn(buyWithExactDTO);

      const callNativeTokenInResVal = Number(callNativeTokenInRes.Data);
      const expecteGalaForBuy = callNativeTokenInResVal - 5;

      buyWithExactDTO.expectedNativeToken = new BigNumber(expecteGalaForBuy);

      buyWithExactDTO.sign(user1.privateKey);

      const buyWithExactTokenRes = await client.LaunchPad.BuyExactToken(buyWithExactDTO);

      expect(buyWithExactTokenRes.Message).toBe(
        "Gala tokens expected to perform this operation are less than the actual amount required."
      );
    });

    test("SellWithNative || It should revert if Token amount expected to cost for this operation is less than the the actual amount required", async () => {
      const sale = await createSale(client, user, "Asset32", "saleThirtyTwo");
      vaultAddress = sale.Data?.vaultAddress;

      const buyWithNativeDTO = new nativeTokenAmountDto();
      buyWithNativeDTO.vaultAddress = vaultAddress;
      buyWithNativeDTO.nativeTokenAmount = new BigNumber("100");

      buyWithNativeDTO.sign(user1.privateKey);
      const buyWithNativeRes = await client.LaunchPad.BuyWithNative(buyWithNativeDTO);

      //Sell With Native

      const sellWithNativeDTO = new nativeTokenAmountDto();
      sellWithNativeDTO.vaultAddress = vaultAddress;
      sellWithNativeDTO.nativeTokenAmount = new BigNumber("50");

      const callMemeTokenInRes = await client.LaunchPad.CallMemeTokenIn(sellWithNativeDTO);

      const callTokenInVal = Number(callMemeTokenInRes.Data);

      const decreaseGalaSellQuantity = callTokenInVal - 2;

      sellWithNativeDTO.expectedToken = new BigNumber(decreaseGalaSellQuantity);

      sellWithNativeDTO.sign(user1.privateKey);
      const sellWithNativeRes = await client.LaunchPad.SellWithNative(sellWithNativeDTO);

      await expect(sellWithNativeRes.Message).toBe(
        "Token amount expected to cost for this operation is less than the the actual amount required."
      );
    });

    test("SellWithExactTokens || It should rever if Expected Gala tokens from this operation exceeds the actual amount that will be provided.", async () => {
      const sale = await createSale(client, user, "Asset26", "saleTwentySix");
      vaultAddress = sale.Data?.vaultAddress;

      const buyWithExactDTO = new exactTokenAmountDto();
      buyWithExactDTO.vaultAddress = vaultAddress;
      buyWithExactDTO.tokenAmount = new BigNumber("2000000");

      buyWithExactDTO.sign(user1.privateKey);

      const buyWithExactTokenRes = await client.LaunchPad.BuyExactToken(buyWithExactDTO);

      //  Sell With Exact tokens

      const sellWithExactDTO = new exactTokenAmountDto();
      sellWithExactDTO.vaultAddress = vaultAddress;
      sellWithExactDTO.tokenAmount = new BigNumber("500");

      const callNativeTokenOutRes = await client.LaunchPad.CallNativeTokenOut(sellWithExactDTO);

      const callNativeTokenOutVal = Number(callNativeTokenOutRes.Data);

      const increasedExpectedNativeValue = callNativeTokenOutVal + 1;

      sellWithExactDTO.expectedNativeToken = new BigNumber(increasedExpectedNativeValue);

      sellWithExactDTO.sign(user1.privateKey);

      const sellWithNativerRes = await client.LaunchPad.SellToken(sellWithExactDTO);

      expect(sellWithNativerRes.Message).toEqual(
        "Expected Gala tokens from this operation exceeds the actual amount that will be provided."
      );
    });
  });

  describe("Finalise", () => {
    test("Finalise sale @Token Supply exceeding 10 Million", async () => {
      const sale = await createSale(client, user, "Asset17", "saleSeventeen");
      vaultAddress = sale.Data?.vaultAddress;

      const BuyExactToken = new exactTokenAmountDto();
      BuyExactToken.vaultAddress = vaultAddress;
      BuyExactToken.tokenAmount = new BigNumber("9999999");
      BuyExactToken.expectedNativeToken = new BigNumber("1700000");

      BuyExactToken.sign(user1.privateKey);
      const buyres = await client.LaunchPad.BuyExactToken(BuyExactToken);

      const BuyExactToken1 = new exactTokenAmountDto();
      BuyExactToken1.vaultAddress = vaultAddress;
      BuyExactToken1.tokenAmount = new BigNumber("2");
      BuyExactToken1.expectedNativeToken = new BigNumber("1700000");

      BuyExactToken1.sign(user2.privateKey);
      const buyres1 = await client.LaunchPad.BuyExactToken(BuyExactToken1);

      const fetchSaleDetails = new fetchSaleDto();
      fetchSaleDetails.vaultAddress = vaultAddress;

      const fetchSaleStatus = await client.LaunchPad.FetchSale(fetchSaleDetails);

      expect(fetchSaleStatus.Data?.saleStatus).toBe(saleStatus.END);
    });

    test("Finalise Sale  @Native Gala equivalent to MARKET_CAP ", async () => {
      //Creation of sale

      const sale = await createSale(client, user, "Asset18", "saleEighteen");
      vaultAddress = vaultAddress = sale.Data?.vaultAddress;

      const buyWithNativeDTO = new nativeTokenAmountDto();

      buyWithNativeDTO.vaultAddress = vaultAddress;
      buyWithNativeDTO.nativeTokenAmount = new BigNumber("1640984");

      buyWithNativeDTO.sign(user2.privateKey);

      const buyRes = await client.LaunchPad.BuyWithNative(buyWithNativeDTO);

      const buyWithNativeDTO1 = new nativeTokenAmountDto();
      buyWithNativeDTO1.vaultAddress = vaultAddress;
      buyWithNativeDTO1.nativeTokenAmount = new BigNumber("50");

      buyWithNativeDTO1.sign(user2.privateKey);

      const buyres1 = await client.LaunchPad.BuyWithNative(buyWithNativeDTO1);

      const fetchSaleDetails = new fetchSaleDto();
      fetchSaleDetails.vaultAddress = vaultAddress;

      const fetchSaleStatus = await client.LaunchPad.FetchSale(fetchSaleDetails);

      expect(fetchSaleStatus.Data?.saleStatus).toBe(saleStatus.END);
    });

   

    test("Pool Gets created after finalization", async () => {
      const sale = await createSale(client, user3, "Asset29", "saleTwentyNine");
      vaultAddress = sale.Data?.vaultAddress;
      const buyWithNativeDTO = new nativeTokenAmountDto();

      buyWithNativeDTO.vaultAddress = vaultAddress;
      buyWithNativeDTO.nativeTokenAmount = new BigNumber("1640986");

      buyWithNativeDTO.sign(user2.privateKey);

      const buyRes = await client.LaunchPad.BuyWithNative(buyWithNativeDTO);

      const token0classKey = new TokenClassKey();
      token0classKey.collection = "GALA";
      token0classKey.category = "Unit";
      token0classKey.type = "none";
      token0classKey.additionalKey = "none";

      const token1classKey = new TokenClassKey();
      token1classKey.collection = "Token";
      token1classKey.category = "Unit";
      token1classKey.type = "SALETWENTYNINE";
      token1classKey.additionalKey = user3.identityKey.replace(/\|/, ":");

      //Fetch sale status
      const fetchSaleDetailsDTO = new fetchSaleDto();
      fetchSaleDetailsDTO.vaultAddress = vaultAddress;

      const saleStatus1 = await client.LaunchPad.FetchSale(fetchSaleDetailsDTO);

      const getPoolDTO = new GetPoolDto(token0classKey, token1classKey, 3000);

      const response = await client3.dexV3Contract.getPoolData(getPoolDTO);

      expect(response.Status).toEqual(1);
    });

    test("User will not be able to buy when the sale end", async () => {
      const sale = await createSale(client, user3, "Asset30", "saleThity");
      vaultAddress = sale.Data?.vaultAddress;
      const buyWithNativeDTO = new nativeTokenAmountDto();

      buyWithNativeDTO.vaultAddress = vaultAddress;
      buyWithNativeDTO.nativeTokenAmount = new BigNumber("1640986");

      buyWithNativeDTO.sign(user1.privateKey);

      const buyRes = await client.LaunchPad.BuyWithNative(buyWithNativeDTO);

      // Buy after sale ends

      const buyWithNative1DTO = new nativeTokenAmountDto();

      buyWithNative1DTO.vaultAddress = vaultAddress;
      buyWithNative1DTO.nativeTokenAmount = new BigNumber("10");

      buyWithNative1DTO.sign(user1.privateKey);

      const buyRes1 = await client.LaunchPad.BuyWithNative(buyWithNativeDTO);

      expect(buyRes1.Message).toEqual("This sale has already ended.");
    });
  });

  describe("Calculations Check", () => {
    test("Calculate Native tokens out", async () => {
      const sale = await createSale(client, user, "Asset27", "saleTwentySeve");
      vaultAddress = sale.Data?.vaultAddress;

      //Creating 100000 Supply

      const buyExactTokenDTO = new exactTokenAmountDto();
      buyExactTokenDTO.vaultAddress = vaultAddress;
      buyExactTokenDTO.tokenAmount = new BigNumber("100000");

      buyExactTokenDTO.sign(user1.privateKey);
      const buyExactTokenRes = await client.LaunchPad.BuyExactToken(buyExactTokenDTO);

      //Call Native Tokens out
      const exactAmountDTO = new exactTokenAmountDto();
      exactAmountDTO.vaultAddress = vaultAddress;
      exactAmountDTO.tokenAmount = new BigNumber("100");
      exactAmountDTO.sign(user2.privateKey);

      const res = await client.LaunchPad.CallNativeTokenOut(exactAmountDTO);

      expect(Number(res.Data)).toEqual(0.0018547);

      //Cal Meme Tokens in
      const nativeAmountDTO = new nativeTokenAmountDto();
      nativeAmountDTO.vaultAddress = vaultAddress;
      nativeAmountDTO.nativeTokenAmount = new BigNumber("20");

      nativeAmountDTO.sign(user2.privateKey);
      const res1 = await client.LaunchPad.CallMemeTokenIn(nativeAmountDTO);

      expect(Number(res1.Data)).toEqual(100000.00024139816);

      // Meme Tokens out
      const nativeAmount1DTO = new nativeTokenAmountDto();
      nativeAmount1DTO.vaultAddress = vaultAddress;
      nativeAmount1DTO.nativeTokenAmount = new BigNumber("50");

      nativeAmount1DTO.sign(user2.privateKey);

      const res2 = await client.LaunchPad.CallMemeTokenOut(nativeAmountDTO);

      expect(Number(res2.Data)).toEqual(698232.67504198138631);

      //Cal Native tokens in
      const exactAmount1DTO = new exactTokenAmountDto();
      exactAmount1DTO.vaultAddress = vaultAddress;
      exactAmount1DTO.tokenAmount = new BigNumber("30");

      exactAmount1DTO.sign(user2.privateKey);

      const res3 = await client.LaunchPad.CallNativeTokenOut(exactAmountDTO);

      expect(Number(res3.Data)).toEqual(0.0018547);
    });

    test("Calculate memes tokens out for preminting", async () => {
      const nativeAmountDTO = new preMintCalculationDto();
      nativeAmountDTO.nativeTokenAmount = new BigNumber("50");
      nativeAmountDTO.sign(user2.privateKey);

      const preMintVal = await client.LaunchPad.CalculatePreMintTokens(nativeAmountDTO);

      expect(Number(preMintVal.Data)).toEqual(1295968.3836584872964);
    });
  });
});

interface LaunchPadContractAPI {
  CreateSale(dto: createTokenSaleDTO): Promise<GalaChainResponse<createSaleResponse>>;
  BuyExactToken(dto: exactTokenAmountDto): Promise<GalaChainResponse<tradeResponse>>;
  SellToken(dto: exactTokenAmountDto): Promise<GalaChainResponse<tradeResponse>>;
  BuyWithNative(dto: nativeTokenAmountDto): Promise<GalaChainResponse<tradeResponse>>;
  SellWithNative(dto: nativeTokenAmountDto): Promise<GalaChainResponse<tradeResponse>>;
  CallNativeTokenIn(dto: exactTokenAmountDto): Promise<GalaChainResponse<BigNumber>>;
  CallMemeTokenOut(dto: nativeTokenAmountDto): Promise<GalaChainResponse<BigNumber>>;
  CallNativeTokenOut(dto: exactTokenAmountDto): Promise<GalaChainResponse<BigNumber>>;
  CallMemeTokenIn(dto: nativeTokenAmountDto): Promise<GalaChainResponse<BigNumber>>;
  CalculatePreMintTokens(dto: preMintCalculationDto): Promise<GalaChainResponse<BigNumber>>;
  FetchSale(dto: fetchSaleDto): Promise<GalaChainResponse<LaunchPadSale>>;
}

function LaunchPadContractAPI(client: ChainClient): LaunchPadContractAPI & CommonContractAPI {
  return {
    ...commonContractAPI(client),

    CreateSale(dto: createTokenSaleDTO) {
      return client.submitTransaction("CreateSale", dto) as Promise<GalaChainResponse<createSaleResponse>>;
    },
    BuyExactToken(dto: exactTokenAmountDto) {
      return client.submitTransaction("BuyExactToken", dto) as Promise<GalaChainResponse<tradeResponse>>;
    },
    SellToken(dto: exactTokenAmountDto) {
      return client.submitTransaction("SellExactToken", dto) as Promise<GalaChainResponse<tradeResponse>>;
    },
    BuyWithNative(dto: nativeTokenAmountDto) {
      return client.submitTransaction("BuyWithNative", dto) as Promise<GalaChainResponse<tradeResponse>>;
    },
    SellWithNative(dto: nativeTokenAmountDto) {
      return client.submitTransaction("SellWithNative", dto) as Promise<GalaChainResponse<tradeResponse>>;
    },
    CallNativeTokenIn(dto: exactTokenAmountDto) {
      return client.submitTransaction("CallNativeTokenIn", dto) as Promise<GalaChainResponse<BigNumber>>;
    },
    CallMemeTokenOut(dto: nativeTokenAmountDto) {
      return client.submitTransaction("CallMemeTokenOut", dto) as Promise<GalaChainResponse<BigNumber>>;
    },
    CallNativeTokenOut(dto: exactTokenAmountDto) {
      return client.submitTransaction("CallNativeTokenOut", dto) as Promise<GalaChainResponse<BigNumber>>;
    },
    CallMemeTokenIn(dto: nativeTokenAmountDto) {
      return client.submitTransaction("CallMemeTokenIn", dto) as Promise<GalaChainResponse<BigNumber>>;
    },
    CalculatePreMintTokens(dto: preMintCalculationDto) {
      return client.submitTransaction("CalculatePreMintTokens", dto) as Promise<GalaChainResponse<BigNumber>>;
    },
    FetchSale(dto: fetchSaleDto) {
      return client.evaluateTransaction("FetchSaleDetails", dto) as Promise<GalaChainResponse<LaunchPadSale>>;
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

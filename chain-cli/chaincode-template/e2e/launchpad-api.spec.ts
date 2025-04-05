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
  ConfigureLaunchpadFeeAddressDto,
  CreateSaleResDto,
  CreateTokenClassDto,
  CreateTokenSaleDTO,
  ExactTokenQuantityDto,
  FetchBalancesDto,
  FetchSaleDto,
  FinalizeTokenAllocationDto,
  GalaChainResponse,
  GetPoolDto,
  LaunchpadFeeConfig,
  LaunchpadFinalizeFeeAllocation,
  LaunchpadSale,
  MintTokenWithAllowanceDto,
  NativeTokenQuantityDto,
  Pool,
  PreMintCalculationDto,
  SaleStatus,
  TokenBalance,
  TokenClassKey,
  TokenInstanceKey,
  TradeCalculationResDto,
  TradeResDto,
  TransferTokenDto
} from "@gala-chain/api";
import { ChainClient, ChainUser, CommonContractAPI, commonContractAPI } from "@gala-chain/client";
import {
  AdminChainClients,
  TestClients,
  transactionError,
  transactionErrorMessageContains,
  transactionSuccess
} from "@gala-chain/test";
import { BigNumber } from "bignumber.js";

import {
  calMemeTokensInTest,
  calMemeTokensOutTest,
  calNativeTokensInTest,
  calNativeTokensOutTest
} from "./launchpadTestHelper";

jest.setTimeout(100000);

describe.skip("LaunchpadContract", () => {
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

  let client: AdminChainClients<typeof LaunchpadContractConfig>;
  let user: ChainUser;

  let client1: AdminChainClients<typeof GalaTokenContractConfig>;
  let user1: ChainUser;
  let user2: ChainUser;

  let client3: AdminChainClients<typeof DexV3ContractConfig>;
  let user3: ChainUser;

  let user4: ChainUser;
  let user5: ChainUser;

  let vaultAddress: string;
  const totalSupply = 10000000;

  beforeAll(async () => {
    client = await TestClients.createForAdmin(LaunchpadContractConfig);
    user = await client.createRegisteredUser();

    client1 = await TestClients.createForAdmin(GalaTokenContractConfig);
    user1 = await client1.createRegisteredUser();

    user2 = await client.createRegisteredUser();

    client3 = await TestClients.createForAdmin(DexV3ContractConfig);
    user3 = await client.createRegisteredUser();
    user4 = await client.createRegisteredUser();
    user5 = await client.createRegisteredUser();
  });
  afterAll(async () => {
    await client.disconnect();
    await client1.disconnect();
    await client3.disconnect();
  });

  // Create sale helper function
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
    if (!response.Data?.vaultAddress) {
      throw new Error("Sale Creation failed");
    }
    return response;
  }

  // Get Balance Helper function
  async function getTokenBalance(
    owner: string,
    collection: string,
    category: string,
    type: string
  ): Promise<BigNumber> {
    const fetchBalanceDto = new FetchBalancesDto();
    fetchBalanceDto.owner = owner;
    fetchBalanceDto.collection = collection;
    fetchBalanceDto.category = category;
    fetchBalanceDto.type = type;

    const fetchBalanceRes = await client1.token.FetchBalances(fetchBalanceDto);

    const balanceData = fetchBalanceRes.Data;
    if (balanceData === undefined || balanceData.length === 0) {
      return new BigNumber(0);
    }
    const balanceValue = balanceData[0].getQuantityTotal();

    return new BigNumber(balanceValue);
  }

  test("Creating Test Gala for Test", async () => {
    
    // Creating Gala Dummy token for Buying
    // Minting 100,000,000GALA  to user1

    const classKey = new TokenClassKey();

    classKey.collection = "GALA";
    classKey.category = "Unit";
    classKey.type = "none";
    classKey.additionalKey = "none";

    const tokenClassDto = new CreateTokenClassDto();

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

    await client1.token.CreateToken(tokenClassDto);

    const mintDTO = new MintTokenWithAllowanceDto();

    mintDTO.tokenClass = classKey;
    mintDTO.quantity = new BigNumber("3e+7");
    mintDTO.owner = user1.identityKey;
    mintDTO.tokenInstance = new BigNumber(0);

    mintDTO.sign(user1.privateKey);

    await client1.token.MintTokenWithAllowance(mintDTO);

    const FetchBalancesDTO = new FetchBalancesDto();
    FetchBalancesDTO.owner = user1.identityKey;
    FetchBalancesDTO.collection = "GALA";
    FetchBalancesDTO.category = "Unit";
    FetchBalancesDTO.type = "none";

    const tokenIntance = new TokenInstanceKey();
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

    await client1.token.TransferToken(transferTokenDto);

    //Transferring Gala to user
    const transferTokenUserDto = new TransferTokenDto();
    transferTokenUserDto.from = user1.identityKey;
    transferTokenUserDto.to = user.identityKey;
    transferTokenUserDto.tokenInstance = tokenIntance;
    transferTokenUserDto.quantity = new BigNumber("2e+6");
    transferTokenUserDto.sign(user1.privateKey);

    await client1.token.TransferToken(transferTokenUserDto);
  });

  describe("Create Sale ", () => {
    test("Create Sale Test", async () => {

      //Given 

      const createLaunchpadSaleDTO = new CreateTokenSaleDTO(
        "Asset",
        "ART",
        "created for sale",
        "www.test.com",
        new BigNumber("0"),
        "UnitTest",
        "none"
      );
      createLaunchpadSaleDTO.websiteUrl = "abc.com";

      createLaunchpadSaleDTO.sign(user.privateKey);

      //When 

      const response = await client.Launchpad.CreateSale(createLaunchpadSaleDTO);

      //Then 

      expect(response).toBeDefined();
      expect(response).toMatchObject({
        Data: expect.objectContaining({
          creatorAddress: user.identityKey,
          description: "created for sale",
          image: "www.test.com",
          initialBuyQuantity: "0",
          symbol: "ART",
          telegramUrl: "",
          tokenName: "Asset",
          twitterUrl: "",
          vaultAddress: `service|UnitTest$none$ART$eth:${user.name}$launchpad`,
          websiteUrl: "abc.com",
          collection: "UnitTest",
          category: "none"
        }),
        Status: 1
      });
    });

    test("It should revert if token name is not given", async () => {

      //Given 

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

      //When

      const response = await client.Launchpad.CreateSale(createLaunchpadSaleDTO);

      //Then

      expect(response).toEqual(transactionError());
      expect(response.Message).toContain("tokenName should not be empty");
    });

    test("It should revert if token symbol is not given", async () => {
      
      //Given

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

      //When 

      const response = await client.Launchpad.CreateSale(createLaunchpadSaleDTO);

      //Then 

      expect(response).toEqual(transactionError());
      expect(response).toEqual(
        transactionErrorMessageContains(
          "DTO validation failed: (1) isNotEmpty: tokenSymbol should not be empty"
        )
      );
    });

    test("It should revert in token description is empty", async () => {

      //Given 

      const createLaunchpadSaleDTO = new CreateTokenSaleDTO(
        "Asset8",
        "saleEight",
        "",
        "www.test.com",
        new BigNumber("0"),
        "UnitTest",
        "none"
      );

      //When 

      const response = await client.Launchpad.CreateSale(createLaunchpadSaleDTO);

      //Then

      expect(response).toEqual(transactionError());
      expect(response).toEqual(
        transactionErrorMessageContains(
          "DTO validation failed: (1) isNotEmpty: tokenDescription should not be empty"
        )
      );
    });

    test("Sale cannot be created without social link", async () => {

      //Given 

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

      //When 

      const response = await client.Launchpad.CreateSale(createLaunchpadSaleDTO);

      //Then

      expect(response).toEqual(transactionError());
      expect(response).toEqual(
        transactionErrorMessageContains("Token sale creation requires atleast one social link.")
      );
    });

    test("Same sale cannot be created with same user", async () => {

      //Given 

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

      //When 

      const response = await client.Launchpad.CreateSale(createLaunchpadSaleDTO);
      expect(response).toEqual(transactionSuccess());

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

      //Then 

      expect(response2).toEqual(transactionError());
      expect(response2.Message).toEqual("This token and a sale associated with it already exists");
    });

    test("2 times of the total supply is pre-minted to vault address", async () => {

      //Given 

      const sale = await createSale(client, user, "Asset9", "saleNine");
      if (!sale.Data) throw new Error();
      vaultAddress = sale.Data.vaultAddress;

      //When 

      const balanceOfVault = await getTokenBalance(vaultAddress, "UnitTest", "Test", "SALENINE");

      //Then 

      expect(BigNumber(balanceOfVault)).toEqual(BigNumber("2e+7"));
    });

    test("Initial Buy Amount Test (for sale owner) ", async () => {

      //Given

      const galaBalanceBeforeBuy = await getTokenBalance(user.identityKey, "GALA", "Unit", "none");

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

      //When 

      const response = await client.Launchpad.CreateSale(createLaunchpadSaleDTO);

      //Then 

      expect(response).toEqual(transactionSuccess());

      const initialBuyAmountFromSale = Number(response.Data?.initialBuyQuantity);
      expect(Number(initialBuyAmountFromSale)).toEqual(50);

      //Fetch Owner's Gala Balance after Buy
      const galaBalanceAfterBuy = await getTokenBalance(user.identityKey, "GALA", "Unit", "none");
      //const galaBalanceAfterBuy = ownerGalaBalanceAfter.getQuantity();

      const galaBalanceDiff = galaBalanceBeforeBuy.minus(galaBalanceAfterBuy);
      expect(Number(galaBalanceDiff)).toEqual(50);

      //Fetch Owner's Token Balance
      const tokenBalanceOfOwner = await getTokenBalance(user.identityKey, "UnitTest", "Test", "SALESEVEN");

      expect(Number(tokenBalanceOfOwner)).toBeCloseTo(1295968.384);
    });
  });

  test("User 1 Buys whole supply , then same amout of gala to be used to buy with native", async () => {
    
    //Given 

    //Buy with exact token
    const sale = await createSale(client, user, "Asset24", "saleTwentyFour");
    if (!sale.Data) throw new Error();
    vaultAddress = sale.Data?.vaultAddress;

  
    //Fetch Gala Balance before buy
    const galaBalanceBeforeBuy = await getTokenBalance(user.identityKey, "GALA", "Unit", "none");

    const buyWithExactDTO = new ExactTokenQuantityDto();
    buyWithExactDTO.vaultAddress = vaultAddress;
    buyWithExactDTO.tokenQuantity = new BigNumber("9999999");

    buyWithExactDTO.sign(user.privateKey);

    //When 

    await client.Launchpad.BuyExactToken(buyWithExactDTO);

    //Fetch Gala Balance before After
    const galaBalanceAfterBuy = await getTokenBalance(user.identityKey, "GALA", "Unit", "none");

    let balanceDiff = galaBalanceBeforeBuy.minus(galaBalanceAfterBuy);

    // Buy with native
    const sale2 = await createSale(client, user, "Asset25", "saleTwentyFive");
    if (!sale2.Data) throw new Error();
    vaultAddress = sale2.Data?.vaultAddress;

    balanceDiff = new BigNumber(roundToDecimal(balanceDiff, 8));

    const buyWithNativeDTO = new NativeTokenQuantityDto();
    buyWithNativeDTO.vaultAddress = vaultAddress;
    buyWithNativeDTO.nativeTokenQuantity = new BigNumber(balanceDiff);

    buyWithNativeDTO.sign(user2.privateKey);

    await client.Launchpad.BuyWithNative(buyWithNativeDTO);

    //Token Sale Quantity from sale
    const fetchSaleDetailsDTO = new FetchSaleDto();
    fetchSaleDetailsDTO.vaultAddress = vaultAddress;

    const fetchSaleDetailsRes = await client.Launchpad.FetchSale(fetchSaleDetailsDTO);
    const sellingTokenQuantity = fetchSaleDetailsRes.Data?.sellingTokenQuantity;

    const tokensSold = totalSupply - Number(sellingTokenQuantity);

    //Then 
    expect(tokensSold).toBeCloseTo(9999999);
  });

  test("1st token buy price should be equal to the base price", async () => {

    //Given 

    const sale = await createSale(client, user, "Asset10", "SaleTen");
    if (!sale.Data) throw new Error();
    vaultAddress = sale.Data?.vaultAddress;

    //User's Gala balance before buy
    const galaBalanceBeforeBuy = await getTokenBalance(user1.identityKey, "GALA", "Unit", "none");

   
    const buyExactTokenDTO = new ExactTokenQuantityDto();
    buyExactTokenDTO.vaultAddress = vaultAddress;
    buyExactTokenDTO.tokenQuantity = new BigNumber("1");

    buyExactTokenDTO.sign(user1.privateKey);

    //When 

    await client.Launchpad.BuyExactToken(buyExactTokenDTO);

    //User's Gala balance after buy
    const galaBalanceAfterBuy = await getTokenBalance(user1.identityKey, "GALA", "Unit", "none");

    const balanceDiff = galaBalanceBeforeBuy.minus(galaBalanceAfterBuy);

    //Then 

    expect(Number(balanceDiff)).toBeCloseTo(0.000016510486602783203); // Base Price
  });

  describe("Buy and Sell Functions test", () => {
    test("Buy with Native", async () => {

      //Given 

      const sale = await createSale(client, user, "Asset13", "saleThirteen");
      if (!sale.Data) throw new Error();
      vaultAddress = sale.Data?.vaultAddress;

      //Fetch User's Gala Balance
      const galaBalanceBeforeBuy = await getTokenBalance(user1.identityKey, "GALA", "Unit", "none");

    
      const buyWithNativeDTO = new NativeTokenQuantityDto();
      buyWithNativeDTO.vaultAddress = vaultAddress;
      buyWithNativeDTO.nativeTokenQuantity = new BigNumber("31.27520343");

      buyWithNativeDTO.sign(user1.privateKey);

      //When

      await client.Launchpad.BuyWithNative(buyWithNativeDTO);

      //User's Gala balance after buy
      const galaBalanceAfterBuy = await getTokenBalance(user1.identityKey, "GALA", "Unit", "none");

      const balanceDiff = galaBalanceBeforeBuy.minus(galaBalanceAfterBuy);

      //Then 

      expect(Number(balanceDiff)).toBeCloseTo(31.27520343);

      //Fetching token balance
      const tokenBalanceAfterBuy = await getTokenBalance(
        user1.identityKey,
        "UnitTest",
        "Test",
        "SALETHIRTEEN"
      );

      //Fetch tokens sold from sale
      const fetchSaleDetailDTO = new FetchSaleDto();
      fetchSaleDetailDTO.vaultAddress = vaultAddress;

      const fetchSaleRes = await client.Launchpad.FetchSale(fetchSaleDetailDTO);

      const sellingQty = fetchSaleRes.Data?.sellingTokenQuantity;
      const tokensSold = totalSupply - Number(sellingQty);

      expect(tokensSold).toBeCloseTo(Number(tokenBalanceAfterBuy));
    });

    test("Buy Exact tokens", async () => {

      //Given 
      const sale = await createSale(client, user, "Asset14", "saleFourteen");
      if (!sale.Data) throw new Error();
      vaultAddress = sale.Data?.vaultAddress; 
      
      const buyWithExactDTO = new ExactTokenQuantityDto();
      buyWithExactDTO.vaultAddress = vaultAddress;
      buyWithExactDTO.tokenQuantity = new BigNumber("2000000");

      buyWithExactDTO.sign(user1.privateKey);

      //When
      const buyExactTokenRes = await client.Launchpad.BuyExactToken(buyWithExactDTO);

      const tokenQuantitySold = buyExactTokenRes.Data?.outputQuantity;

      //Fetch User's Token Balance
      const tokenbalanceOfUser = await getTokenBalance(user1.identityKey, "UnitTest", "Test", "SALEFOURTEEN");

      expect(tokenbalanceOfUser).toEqual(new BigNumber(tokenQuantitySold ?? "0"));

      //Fetch Sale
      const fetchSaleDetailDTO = new FetchSaleDto();
      fetchSaleDetailDTO.vaultAddress = vaultAddress;

      const fetchSaleRes = await client.Launchpad.FetchSale(fetchSaleDetailDTO);
      const sellingQty = fetchSaleRes.Data?.sellingTokenQuantity;
      const tokensSold = totalSupply - Number(sellingQty);

      //Then 
      expect(Number(tokenbalanceOfUser)).toBeCloseTo(tokensSold);
    });

    test("Sell With Native", async () => {

      //Given 

      const sale = await createSale(client, user, "Asset16", "saleSixteen");
      if (!sale.Data) throw new Error();
      vaultAddress = sale.Data?.vaultAddress;

      const buyWithNativeDTO = new NativeTokenQuantityDto();
      buyWithNativeDTO.vaultAddress = vaultAddress;
      buyWithNativeDTO.nativeTokenQuantity = new BigNumber("31.27520343");

      //Gala Balance Before Buy
      const galaBalanceBeforeBuy = await getTokenBalance(user1.identityKey, "GALA", "Unit", "none");

      buyWithNativeDTO.sign(user1.privateKey);

      //When 

      await client.Launchpad.BuyWithNative(buyWithNativeDTO);

      //Sell With Native

      const sellWithNativeDTO = new NativeTokenQuantityDto();
      sellWithNativeDTO.vaultAddress = vaultAddress;
      sellWithNativeDTO.nativeTokenQuantity = new BigNumber("31.27520343");

      sellWithNativeDTO.sign(user1.privateKey);

      await client.Launchpad.SellWithNative(sellWithNativeDTO);

      //Gala Balance After Sell
      const galaBalanceAfterSell = await getTokenBalance(user1.identityKey, "GALA", "Unit", "none");

      //Then 
      expect(galaBalanceBeforeBuy).toEqual(galaBalanceAfterSell);

      //Fetch Sale
      const fetchSaleDTO = new FetchSaleDto();
      fetchSaleDTO.vaultAddress = vaultAddress;

      const fetchSaleRes = await client.Launchpad.FetchSale(fetchSaleDTO);
      const sellingTokenQuantity = fetchSaleRes.Data?.sellingTokenQuantity;

      expect(Number(sellingTokenQuantity)).toEqual(10000000);

      //User's Token Balance
      const tokenBalance = await getTokenBalance(user1.identityKey, "UnitTest", "Test", "SALESIXTEEN");

      expect(Number(tokenBalance)).toEqual(0);
    });

    test("Sell Exact Tokens", async () => {

      //Given 

      const sale = await createSale(client, user, "Asset20", "saleTwenty");
      if (!sale.Data) throw new Error();
      vaultAddress = sale.Data?.vaultAddress;

      const buyWithExactDTO = new ExactTokenQuantityDto();
      buyWithExactDTO.vaultAddress = vaultAddress;
      buyWithExactDTO.tokenQuantity = new BigNumber("2000000");

      buyWithExactDTO.sign(user1.privateKey);

      //When 

      await client.Launchpad.BuyExactToken(buyWithExactDTO);

      // User's Token Balance before sell
      const tokenBalanceBefore = await getTokenBalance(user1.identityKey, "UnitTest", "Test", "SALETWENTY");

      const sellExactTokenDTO = new ExactTokenQuantityDto();
      sellExactTokenDTO.vaultAddress = vaultAddress;
      sellExactTokenDTO.tokenQuantity = new BigNumber("5000");

      sellExactTokenDTO.sign(user1.privateKey);

      await client.Launchpad.SellExactToken(sellExactTokenDTO);

      const tokenBalanceAfter = await getTokenBalance(user1.identityKey, "UnitTest", "Test", "SALETWENTY");
      const balanceDiff = tokenBalanceBefore.minus(tokenBalanceAfter);

      //Then 

      expect(Number(balanceDiff)).toEqual(5000);
    });

    test("Buy and Sell using both Exact Functions", async () => {

      //Given 

      const sale = await createSale(client, user, "Asset2", "saleTwo");
      if (!sale.Data) throw new Error();
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
        
        //Given 

        const buyExactDto = new ExactTokenQuantityDto();
        buyExactDto.vaultAddress = vaultAddress;
        buyExactDto.tokenQuantity = new BigNumber(amountOutMeme); // 1000000

        //When 

        const calculatedAmountNative = await client.Launchpad.CallNativeTokenIn(buyExactDto);
        const calculatedAmount = calculatedAmountNative.Data?.calculatedQuantity;
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

        //Then 

        expect(Number(calculatedAmount)).toBeCloseTo(Number(expectedAmount));

        //Fetch User's Gala Balance
        const tokenBalance = await getTokenBalance(user1.identityKey, "GALA", "Unit", "none");

        const buyExactDTO = new ExactTokenQuantityDto();
        buyExactDTO.vaultAddress = vaultAddress;
        buyExactDTO.tokenQuantity = amountOutMeme;

        buyExactDTO.sign(user1.privateKey);

        //When 

        await client.Launchpad.BuyExactToken(buyExactDTO);

        //Fetch Sale Details After purchase
        const updatedSaleDetails = await client.Launchpad.FetchSale(fetchSaleDTO);

        const updatedSellingTokenQuantity = Number(updatedSaleDetails.Data?.sellingTokenQuantity);

        //User balance after purchase
        const tokenBalanceAfter = await getTokenBalance(user1.identityKey, "GALA", "Unit", "none");

        const balanceDiffBuy = tokenBalance.minus(tokenBalanceAfter);

        //Then 

        expect(balanceDiffBuy.toNumber()).toBeCloseTo(Number(calculatedAmount));

        const expectedSellingQuantity = totalSupply - (currentSupply + Number(amountOutMeme));

        expect(updatedSellingTokenQuantity).toEqual(expectedSellingQuantity);
        //return

        //Given 

        //**Sell Tokens Test**
        const sellExactTokenDTO = new ExactTokenQuantityDto();
        sellExactTokenDTO.vaultAddress = vaultAddress;
        sellExactTokenDTO.tokenQuantity = amountOutMeme;
        sellExactTokenDTO.sign(user1.privateKey);

        //When 

        const sellExpectedRes = await client.Launchpad.CallNativeTokenOut(sellExactTokenDTO);
        const sellExpected = sellExpectedRes.Data?.calculatedQuantity;

        //User Balance before sell
        const balanceBeforeSell = await getTokenBalance(user1.identityKey, "GALA", "Unit", "none");

        await client.Launchpad.SellExactToken(sellExactTokenDTO);

        //User Balance after sell
        const balanceAfterSell = await getTokenBalance(user1.identityKey, "GALA", "Unit", "none");

        const balanceDiffSell = balanceAfterSell.minus(balanceBeforeSell);

        //Then 

        expect(balanceDiffSell.toNumber()).toBeCloseTo(Number(sellExpected));

        // Total tokens sold should be back to the previous state

        //Fetch sale details

        //Given 

        const fetchSaleDetailsDTO = new FetchSaleDto();

        fetchSaleDetailsDTO.vaultAddress = vaultAddress;

        //When 

        const fetchaSaleDetailsRes = await client.Launchpad.FetchSale(fetchSaleDetailsDTO);

        const sellingTokenQuantityAfterSell = Number(fetchaSaleDetailsRes.Data?.sellingTokenQuantity);

        const CurrentSupplyAfterSell = totalSupply - sellingTokenQuantityAfterSell;

        //Then 

        expect(currentSupply).toEqual(CurrentSupplyAfterSell);
      }
    });
  });

  test("Buy and Sell using both Native Functions", async () => {

    //Given 

    // creating new sale

    const sale = await createSale(client, user, "Asset3", "saleThree");
    if (!sale.Data) throw new Error();
    vaultAddress = sale.Data?.vaultAddress;

    const arr: string[] = [
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

      //Given 

      nativeCoins += Number(arr[i]);
      nativeCoins = roundToDecimal(nativeCoins, 8);

      const nativeTokensIn = nativeCoins;

      
      const NativeTokenQuantityDTO = new NativeTokenQuantityDto();
      NativeTokenQuantityDTO.vaultAddress = vaultAddress;
      NativeTokenQuantityDTO.nativeTokenQuantity = new BigNumber(nativeTokensIn);

      //When 

      const calculatedReturnsRes = await client.Launchpad.CallMemeTokenOut(NativeTokenQuantityDTO);
      const calculatedReturns = calculatedReturnsRes.Data?.calculatedQuantity;

      NativeTokenQuantityDTO.sign(user1.privateKey);

      await client.Launchpad.BuyWithNative(NativeTokenQuantityDTO);

      //Fetch User's Token Balance
      const balanceOfUser = await getTokenBalance(user1.identityKey, "UnitTest", "Test", "SALETHREE");

      //Then 

      expect(Number(calculatedReturns)).toBeCloseTo(Number(balanceOfUser));

      //Given 

      const callWithNativeTokenDTO = new ExactTokenQuantityDto();
      callWithNativeTokenDTO.vaultAddress = vaultAddress;
      callWithNativeTokenDTO.tokenQuantity = new BigNumber(balanceOfUser);

      //When 

      const callNativeTokensOutVal = await client.Launchpad.CallNativeTokenOut(callWithNativeTokenDTO);
      const calculatedQuantity = callNativeTokensOutVal.Data?.calculatedQuantity;

      const callMemeTokensInDTO = new NativeTokenQuantityDto();
      callMemeTokensInDTO.vaultAddress = vaultAddress;
      callMemeTokensInDTO.nativeTokenQuantity = new BigNumber(calculatedQuantity ?? "0");

      const callMemeTokensForBalanceRes = await client.Launchpad.CallMemeTokenIn(callMemeTokensInDTO);
      const callMemeTokensForBalance = callMemeTokensForBalanceRes.Data?.calculatedQuantity;

      callMemeTokensInDTO.sign(user1.privateKey);
      await client.Launchpad.SellWithNative(callMemeTokensInDTO);

      //Then 

      expect(Number(calculatedReturns)).toBeCloseTo(Number(callMemeTokensForBalance));

      //When 

      const remainingBalanceUser = await getTokenBalance(user1.identityKey, "UnitTest", "Test", "SALETHREE");

      //Fetch Total tokens sold from sale

      const fetchSaleDetailsDto = new FetchSaleDto();
      fetchSaleDetailsDto.vaultAddress = vaultAddress;

      const fetchsaleRes = await client.Launchpad.FetchSale(fetchSaleDetailsDto);
      const tokenBalance = totalSupply - Number(fetchsaleRes.Data?.sellingTokenQuantity);

      //Then 

      expect(Number(remainingBalanceUser)).toBeCloseTo(tokenBalance);
    }
  });

  test("It should buyWithNative and Sell with Exact tokens (Cross Function Check)", async () => {

    //Given

    const sale = await createSale(client, user, "Asset5", "saleFive");
    if (!sale.Data) throw new Error();
    vaultAddress = sale.Data?.vaultAddress;

    const arr: string[] = [
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
      callMemeTokensOutDTO.sign(user1.privateKey);

      //When 

      const calculatedReturnRes = await client.Launchpad.CallMemeTokenOut(callMemeTokensOutDTO);
      const calculatedReturn = calculatedReturnRes.Data?.calculatedQuantity;

      //BuyWithNative
      await client.Launchpad.BuyWithNative(callMemeTokensOutDTO);

      //Fetch User's Token Balance
      const balanceOfUser = await getTokenBalance(user1.identityKey, "UnitTest", "Test", "SALEFIVE");

      //Then 
      expect(Number(calculatedReturn)).toBeCloseTo(Number(balanceOfUser));

      const calNativeTokensOutDTO = new ExactTokenQuantityDto();
      calNativeTokensOutDTO.vaultAddress = vaultAddress;
      calNativeTokensOutDTO.tokenQuantity = new BigNumber(calculatedReturn ?? "0");

      //When 

      const sellExpectedRes = await client.Launchpad.CallNativeTokenOut(calNativeTokensOutDTO);
      const sellExpected = sellExpectedRes.Data?.calculatedQuantity;

      //Gala Balance Before Sell
      const balanceBeforeSell = await getTokenBalance(user1.identityKey, "GALA", "Unit", "none");

      //Sell Tokens
      const sellExactTokensDTO = new ExactTokenQuantityDto();
      sellExactTokensDTO.vaultAddress = vaultAddress;
      sellExactTokensDTO.tokenQuantity = new BigNumber(calculatedReturn ?? "0");

      sellExactTokensDTO.sign(user1.privateKey);

      await client.Launchpad.SellExactToken(sellExactTokensDTO);

      //Gala Balance After Sell
      const balanceAfterSell = await getTokenBalance(user1.identityKey, "GALA", "Unit", "none");

      const balanceDiff = balanceAfterSell.minus(balanceBeforeSell);

      //Then 
      
      expect(balanceDiff.toNumber()).toBeCloseTo(Number(sellExpected));

      //Total tokens sold should be back to the previous state (after sell)

      const fetchSaleDetailsDto = new FetchSaleDto();
      fetchSaleDetailsDto.vaultAddress = vaultAddress;

      //When

      const fetchSaleDetailsRes = await client.Launchpad.FetchSale(fetchSaleDetailsDto);

      const fetchSellingQuantity = fetchSaleDetailsRes.Data?.sellingTokenQuantity;

      //Then 

      expect(Number(fetchSellingQuantity)).toEqual(10000000);
    }
  });

  test("It should BuyExactToken and SellWithNative (Cross Function Check)", async () => {
    
    //Given

    const sale = await createSale(client, user, "Asset6", "saleSIX");
    if (!sale.Data) throw new Error();
    vaultAddress = vaultAddress = sale.Data?.vaultAddress;

    const tokensToBuyAndSell = 1000000;

    for (let i = 1; i <= 3; i++) {
      let tokens = tokensToBuyAndSell * i;

      if (i === 10) {
        tokens = 999999;
      }

      const amountOutMeme = new BigNumber(tokens);

      const callNativeTokenInDTO = new ExactTokenQuantityDto();
      callNativeTokenInDTO.vaultAddress = vaultAddress;
      callNativeTokenInDTO.tokenQuantity = amountOutMeme;

      //When 

      const calculatedAmountOfNativeCoins = await client.Launchpad.CallNativeTokenIn(callNativeTokenInDTO);
      const nativeAmountQty = calculatedAmountOfNativeCoins.Data?.calculatedQuantity;

      const fetchSaleDetailsDTO = new FetchSaleDto();
      fetchSaleDetailsDTO.vaultAddress = vaultAddress;

      const fetchSaleDetailsRes = await client.Launchpad.FetchSale(fetchSaleDetailsDTO);
      const tokenSold = Number(fetchSaleDetailsRes.Data?.sellingTokenQuantity);

      const curSupply = totalSupply - tokenSold;

      const expectedAmount = calNativeTokensInTest(curSupply, tokens);

      //Then 
      //Check that calculated amount from on-chain matches the off-chain calculation
      expect(Number(nativeAmountQty)).toBeCloseTo(Number(expectedAmount));

      //Fetch User's Gala Balance
      const balanceBeforeBuy = await getTokenBalance(user1.identityKey, "GALA", "Unit", "none");

      //Buy Tokens
      const buyExactTokenDTO = new ExactTokenQuantityDto();
      buyExactTokenDTO.vaultAddress = vaultAddress;
      buyExactTokenDTO.tokenQuantity = new BigNumber(amountOutMeme);

      buyExactTokenDTO.sign(user1.privateKey);

      //When 
      await client.Launchpad.BuyExactToken(buyExactTokenDTO);

      //Fetch Gala Balance After Buy
      const balanceAfterBuy = await getTokenBalance(user1.identityKey, "GALA", "Unit", "none");

      const balanceDiff = balanceBeforeBuy.minus(balanceAfterBuy);

      //Then 

      expect(balanceDiff.toNumber()).toBeCloseTo(Number(nativeAmountQty));

      //When 

      //Total tokens sold after buy
      const fetchSaleRes = await client.Launchpad.FetchSale(fetchSaleDetailsDTO);

      const sellingQty = Number(fetchSaleRes.Data?.sellingTokenQuantity);

      const totalTokensSoldAfterBuy = totalSupply - sellingQty;

      const updatedSupply = new BigNumber(curSupply).plus(amountOutMeme);

      //Then 

      expect(Number(totalTokensSoldAfterBuy)).toBeCloseTo(Number(updatedSupply));

      const sellExpectedDTO = new ExactTokenQuantityDto();
      sellExpectedDTO.vaultAddress = vaultAddress;
      sellExpectedDTO.tokenQuantity = new BigNumber(amountOutMeme);

      //When 
      const sellExpectedRes = await client.Launchpad.CallNativeTokenOut(sellExpectedDTO);
      const sellExpected = sellExpectedRes.Data?.calculatedQuantity;

      //Fetch User's Gala Balance Before Sell
      const callMemeOutValDTO = new NativeTokenQuantityDto();
      callMemeOutValDTO.vaultAddress = vaultAddress;
      callMemeOutValDTO.nativeTokenQuantity = new BigNumber(nativeAmountQty ?? "0");

      //Then 
      expect(Number(sellExpected)).toBeCloseTo(Number(nativeAmountQty));

      //Selling

      const sellWithNativeDTO = new NativeTokenQuantityDto();
      sellWithNativeDTO.vaultAddress = vaultAddress;
      sellWithNativeDTO.nativeTokenQuantity = new BigNumber(nativeAmountQty ?? "0");

      sellWithNativeDTO.sign(user1.privateKey);

      //When

      await client.Launchpad.SellWithNative(sellWithNativeDTO);

      //Then 

      expect(Number(nativeAmountQty)).toBeCloseTo(Number(sellExpected));
    }
  });

  describe("Slippage Test ", () => {
    test("BuyWithNative  || It should revert if expected amount is greater than the actual amount", async () => {

      //Given
      const sale = await createSale(client, user, "Asset22", "saleTwentyTwo");
      if (!sale.Data) throw new Error();
      vaultAddress = sale.Data?.vaultAddress;

      const buyWithNativeDTO = new NativeTokenQuantityDto();
      buyWithNativeDTO.vaultAddress = vaultAddress;
      buyWithNativeDTO.nativeTokenQuantity = new BigNumber("100");

      //When

      const callMemeTokenOutRes = await client.Launchpad.CallMemeTokenOut(buyWithNativeDTO);
      const callMemeTokenOutVal = callMemeTokenOutRes.Data?.calculatedQuantity ?? "0";

      const increasedExpectedAmout = new BigNumber(callMemeTokenOutVal).plus(10);

      buyWithNativeDTO.expectedToken = new BigNumber(increasedExpectedAmout);

      buyWithNativeDTO.sign(user1.privateKey);

      const buyWithNativeRes = await client.Launchpad.BuyWithNative(buyWithNativeDTO);

      //Then 

      expect(buyWithNativeRes.Message).toEqual(
        "Tokens expected from this operation are more than the the actual amount that will be provided."
      );
    });

    test("BuyWithExactToken  || It should revert if tokens expected to perform this operation are less than the actual amount required", async () => {

      //Given 

      const sale = await createSale(client, user, "Asset23", "saleTwentyThree");
      if (!sale.Data) throw new Error();
      vaultAddress = sale.Data?.vaultAddress;

      const buyWithExactDTO = new ExactTokenQuantityDto();
      buyWithExactDTO.vaultAddress = vaultAddress;
      buyWithExactDTO.tokenQuantity = new BigNumber("2000000");

      //When  
      const callNativeTokenInRes = await client.Launchpad.CallNativeTokenIn(buyWithExactDTO);
      const callNativeTokenInResVal = callNativeTokenInRes.Data?.calculatedQuantity ?? "0";

      const expecteGalaForBuy = new BigNumber(callNativeTokenInResVal).minus(5);

      buyWithExactDTO.expectedNativeToken = new BigNumber(expecteGalaForBuy);

      buyWithExactDTO.sign(user1.privateKey);

      const buyWithExactTokenRes = await client.Launchpad.BuyExactToken(buyWithExactDTO);

      //Then 

      expect(buyWithExactTokenRes.Message).toEqual(
        "Gala tokens expected to perform this operation are less than the actual amount required."
      );
    });

    test("SellWithNative || It should revert if Token amount expected to cost for this operation is less than the the actual amount required", async () => {

      //Given 

      const sale = await createSale(client, user, "Asset32", "saleThirtyTwo");
      if (!sale.Data) throw new Error();
      vaultAddress = sale.Data?.vaultAddress;

      const buyWithNativeDTO = new NativeTokenQuantityDto();
      buyWithNativeDTO.vaultAddress = vaultAddress;
      buyWithNativeDTO.nativeTokenQuantity = new BigNumber("100");

      buyWithNativeDTO.sign(user1.privateKey);

      //When 
      await client.Launchpad.BuyWithNative(buyWithNativeDTO);

      //Sell With Native

      const sellWithNativeDTO = new NativeTokenQuantityDto();
      sellWithNativeDTO.vaultAddress = vaultAddress;
      sellWithNativeDTO.nativeTokenQuantity = new BigNumber("50");

      const callMemeTokenInRes = await client.Launchpad.CallMemeTokenIn(sellWithNativeDTO);

      const callTokenInVal = callMemeTokenInRes.Data?.calculatedQuantity ?? "0";

      const decreaseGalaSellQuantity = new BigNumber(callTokenInVal).minus(2);

      sellWithNativeDTO.expectedToken = new BigNumber(decreaseGalaSellQuantity);

      sellWithNativeDTO.sign(user1.privateKey);
      const sellWithNativeRes = await client.Launchpad.SellWithNative(sellWithNativeDTO);

      //Then 

      await expect(sellWithNativeRes.Message).toEqual(
        "Token amount expected to cost for this operation is less than the the actual amount required."
      );
    });

    test("SellWithExactTokens || It should revert if Expected Gala tokens from this operation exceeds the actual amount that will be provided.", async () => {
      
      //Given 
      const sale = await createSale(client, user, "Asset26", "saleTwentySix");
      if (!sale.Data) throw new Error();
      vaultAddress = sale.Data?.vaultAddress;

      const buyWithExactDTO = new ExactTokenQuantityDto();
      buyWithExactDTO.vaultAddress = vaultAddress;
      buyWithExactDTO.tokenAmount = new BigNumber("2000000");

      buyWithExactDTO.sign(user1.privateKey);

      //When 
      await client.Launchpad.BuyExactToken(buyWithExactDTO);

      //  Sell With Exact tokens

      const sellWithExactDTO = new ExactTokenQuantityDto();
      sellWithExactDTO.vaultAddress = vaultAddress;
      sellWithExactDTO.tokenQuantity = new BigNumber("500");

      const callNativeTokenOutRes = await client.Launchpad.CallNativeTokenOut(sellWithExactDTO);

      const callNativeTokenOutVal = callNativeTokenOutRes.Data?.calculatedQuantity ?? "0";

      const increasedExpectedNativeValue = new BigNumber(callNativeTokenOutVal).plus(1);

      sellWithExactDTO.expectedNativeToken = new BigNumber(increasedExpectedNativeValue);

      sellWithExactDTO.sign(user1.privateKey);

      const sellWithNativeRes = await client.Launchpad.SellExactToken(sellWithExactDTO);

      //Then

      expect(sellWithNativeRes.Message).toEqual(
        "Expected Gala tokens from this operation exceeds the actual amount that will be provided."
      );
    });
  });

  describe("Configure and fetch Platform fee", () => {
    test("Sale will not be finalized if platform fee address is not configured", async () => {

      //Given 

      const sale = await createSale(client, user, "Asset50", "saleFifty");
      if (!sale.Data) throw new Error();
      vaultAddress = sale.Data?.vaultAddress;

      const buyWithNativeDTO = new NativeTokenQuantityDto();
      buyWithNativeDTO.vaultAddress = vaultAddress;
      buyWithNativeDTO.nativeTokenQuantity = new BigNumber("1640986"); //Exceeded MARKET_CAP

      buyWithNativeDTO.sign(user1.privateKey);

      //When 

      const buyRes = await client.Launchpad.BuyWithNative(buyWithNativeDTO);
      expect(buyRes.Message).toEqual("Platform fee configuration is yet to be defined.");

      //Fetch Sale Details
      const fetchSaleDetailsDTO = new FetchSaleDto();
      fetchSaleDetailsDTO.vaultAddress = vaultAddress;

      const fetchSaleRes = await client.Launchpad.FetchSale(fetchSaleDetailsDTO);

      //Then 

      expect(fetchSaleRes.Data?.saleStatus).toEqual(SaleStatus.ONGOING);
    });
    test("It will revert if none of the input field are present", async () => {

      //Given 

      const configPlatformFeeAddressDTO = new ConfigureLaunchpadFeeAddressDto();
      configPlatformFeeAddressDTO.newPlatformFeeAddress = "";
      configPlatformFeeAddressDTO.newAuthorities = [];

      configPlatformFeeAddressDTO.sign(user3.privateKey);

      //When
      
      const configRes = await client.Launchpad.ConfigureLaunchpadFeeAddress(configPlatformFeeAddressDTO);

      //Then 

      expect(configRes.Status).toEqual(0);
      expect(configRes.Message).toEqual("None of the input fields are present.");
    });

    test("Only Platform Fee Address can be changed", async () => {

      //Given 

      const configPlatformFeeAddressDTO = new ConfigureLaunchpadFeeAddressDto();
      configPlatformFeeAddressDTO.newPlatformFeeAddress = user5.identityKey;

      configPlatformFeeAddressDTO.sign(user3.privateKey);

      //When 

      const configRes = await client.Launchpad.ConfigureLaunchpadFeeAddress(configPlatformFeeAddressDTO);
     
      //Then 

      expect(configRes.Status).toEqual(1);
      expect(configRes.Data?.feeAddress).toEqual(user5.identityKey);
    });

    test("Only New Authority Address can be changed/Added", async () => {

      //Given 

      const configPlatformFeeAddressDTO = new ConfigureLaunchpadFeeAddressDto();
      configPlatformFeeAddressDTO.newAuthorities = [user2.identityKey, user1.identityKey];
      configPlatformFeeAddressDTO.newPlatformFeeAddress = user5.identityKey;
      configPlatformFeeAddressDTO.sign(user3.privateKey);

      //When 

      const configRes = await client.Launchpad.ConfigureLaunchpadFeeAddress(configPlatformFeeAddressDTO);

      //Then 

      expect(configRes.Status).toEqual(1);
      expect(configRes.Data?.feeAddress).toEqual(user5.identityKey);

      const callingUserDto = new ChainCallDTO();
      callingUserDto.sign(user1.privateKey);

      //When
      //Fetch Currenct Fee Address and Authorities
      const fetchCurrentConfig = await client.Launchpad.FetchLaunchpadFeeConfig(callingUserDto);

      //Then 

      expect(fetchCurrentConfig.Data?.authorities[0]).toEqual(user2.identityKey);
      expect(fetchCurrentConfig.Data?.authorities[1]).toEqual(user1.identityKey);
    });

    test("It will revert if non authority tries to update the addresss", async () => {

      //Given 

      const configPlatformFeeAddressDTO = new ConfigureLaunchpadFeeAddressDto();
      configPlatformFeeAddressDTO.newAuthorities = [user.identityKey];
      configPlatformFeeAddressDTO.sign(user4.privateKey);


      //When 

      const configRes = await client.Launchpad.ConfigureLaunchpadFeeAddress(configPlatformFeeAddressDTO);

      //Then 

      expect(configRes.Status).toEqual(0);
      expect(configRes.Message).toEqual(
        `CallingUser ${user4.identityKey} is not authorized to create or update`
      );
    });
  });

  describe("Finalise", () => {
    //User5 will be considered as platform fee address as per last configured platform fee address
    test("Finalization of sale should work with default fee values", async () => {

      //Given 

      const sale = await createSale(client, user, "Asset48", "saleFortyEight");
      if (!sale.Data) throw new Error();
      vaultAddress = vaultAddress = sale.Data?.vaultAddress;

      const callingUserDto = new ChainCallDTO();
      callingUserDto.sign(user1.privateKey);

      //When 
      await client.Launchpad.FetchLaunchpadFeeConfig(callingUserDto);

      const buyWithNativeDTO = new NativeTokenQuantityDto();
      buyWithNativeDTO.vaultAddress = vaultAddress;
      buyWithNativeDTO.nativeTokenQuantity = new BigNumber("1640986");
      buyWithNativeDTO.sign(user1.privateKey);

      await client.Launchpad.BuyWithNative(buyWithNativeDTO);

      //Fetch Sale Details
      const fetchSaleDetailsDTO = new FetchSaleDto();
      fetchSaleDetailsDTO.vaultAddress = vaultAddress;

      const fetchSaleRes = await client.Launchpad.FetchSale(fetchSaleDetailsDTO);

      //Then 

      expect(fetchSaleRes.Data?.saleStatus).toEqual(SaleStatus.END);

      //Check Balance of Default INITIAL_PLATFORM_FEE_ADDRESS
      const platformBalance = await getTokenBalance(user5.identityKey, "GALA", "Unit", "none");

      //Default Platform Fee Value is 10%
      const mCap_Value = Number("1640985.8441726");
      const TEN_PERCENT_GALA = mCap_Value * 0.1;

      expect(Number(platformBalance)).toBeCloseTo(TEN_PERCENT_GALA);
    });
    test("Finalise sale @Token Supply exceeding 10 Million", async () => {

      //Given 

      const sale = await createSale(client, user, "Asset17", "saleSeventeen");
      if (!sale.Data) throw new Error();
      vaultAddress = sale.Data?.vaultAddress;

      const BuyExactToken = new ExactTokenQuantityDto();
      BuyExactToken.vaultAddress = vaultAddress;
      BuyExactToken.tokenQuantity = new BigNumber("9999999");
      BuyExactToken.expectedNativeToken = new BigNumber("1700000");

      BuyExactToken.sign(user1.privateKey);

      //When 

      await client.Launchpad.BuyExactToken(BuyExactToken);

      const BuyExactToken1 = new ExactTokenQuantityDto();
      BuyExactToken1.vaultAddress = vaultAddress;
      BuyExactToken1.tokenQuantity = new BigNumber("2");
      BuyExactToken1.expectedNativeToken = new BigNumber("1700000");

      BuyExactToken1.sign(user2.privateKey);
      await client.Launchpad.BuyExactToken(BuyExactToken1);

      const fetchSaleDetails = new FetchSaleDto();
      fetchSaleDetails.vaultAddress = vaultAddress;

      const fetchSaleStatus = await client.Launchpad.FetchSale(fetchSaleDetails);

      //Then 
      
      expect(fetchSaleStatus.Data?.saleStatus).toBe(SaleStatus.END);
    });

    test("Finalise Sale  @Native Gala equivalent to MARKET_CAP ", async () => {
      //Creation of sale
      //Given 
      const sale = await createSale(client, user, "Asset18", "saleEighteen");
      if (!sale.Data) throw new Error();
      vaultAddress = vaultAddress = sale.Data?.vaultAddress;

      const buyWithNativeDTO = new NativeTokenQuantityDto();

      buyWithNativeDTO.vaultAddress = vaultAddress;
      buyWithNativeDTO.nativeTokenQuantity = new BigNumber("1640984");

      buyWithNativeDTO.sign(user2.privateKey);
      //Given 

      //When 

      await client.Launchpad.BuyWithNative(buyWithNativeDTO);

      const buyWithNativeDTO1 = new NativeTokenQuantityDto();
      buyWithNativeDTO1.vaultAddress = vaultAddress;
      buyWithNativeDTO1.nativeTokenQuantity = new BigNumber("50");

      buyWithNativeDTO1.sign(user2.privateKey);

      await client.Launchpad.BuyWithNative(buyWithNativeDTO1);

      const fetchSaleDetails = new FetchSaleDto();
      fetchSaleDetails.vaultAddress = vaultAddress;

      const fetchSaleStatus = await client.Launchpad.FetchSale(fetchSaleDetails);

      //Then 

      expect(fetchSaleStatus.Data?.saleStatus).toBe(SaleStatus.END);
    });

    test("Finalise Sale @Checking Allocation", async () => {

      //Given 

      const sale = await createSale(client, user, "Asset33", "saleThirtyThree");
      if (!sale.Data) throw new Error();
      vaultAddress = sale.Data?.vaultAddress;

      //Creator balance before Finalize
      const tokenBalanceBefore = await getTokenBalance(user.identityKey, "GALA", "Unit", "none");

      //Platform balance before
      const fetchPlatformFeeAddressBalanceBefore = await getTokenBalance(
        user5.identityKey,
        "GALA",
        "Unit",
        "none"
      );

      const buyWithNativeDTO = new NativeTokenQuantityDto();
      buyWithNativeDTO.vaultAddress = vaultAddress;
      buyWithNativeDTO.nativeTokenQuantity = new BigNumber("1640984");

      buyWithNativeDTO.sign(user1.privateKey);

      //When 

      await client.Launchpad.BuyWithNative(buyWithNativeDTO);

      const buyWithNative1DTO = new NativeTokenQuantityDto();
      buyWithNative1DTO.vaultAddress = vaultAddress;
      buyWithNative1DTO.nativeTokenQuantity = new BigNumber("5");

      buyWithNative1DTO.sign(user2.privateKey);

      await client.Launchpad.BuyWithNative(buyWithNative1DTO);

      const fetchSaleDetails = new FetchSaleDto();
      fetchSaleDetails.vaultAddress = vaultAddress;

      const fetchSaleStatus = await client.Launchpad.FetchSale(fetchSaleDetails);

      //Then 

      expect(fetchSaleStatus.Data?.saleStatus).toBe(SaleStatus.END);

      const mCap_Value = Number("1640985.8441726");
      const SIXTY_PERCENT_GALA = mCap_Value * 0.6;

      //Creator balance before Finalize
      const tokenBalanceAfter = await getTokenBalance(user.identityKey, "GALA", "Unit", "none");

      const tokenBalanceDiff = tokenBalanceAfter.minus(tokenBalanceBefore);

      // Owner's Gala Balance should be 60% of the Gala collected

      expect(tokenBalanceDiff.toNumber()).toBeCloseTo(SIXTY_PERCENT_GALA);

      //Fetch Balance from PlatformFee Address
      const fetchPlatformFeeAddressBalanceAfter = await getTokenBalance(
        user5.identityKey,
        "GALA",
        "Unit",
        "none"
      );

      const platformBalanceDiff = fetchPlatformFeeAddressBalanceAfter.minus(
        fetchPlatformFeeAddressBalanceBefore
      );

      const TEN_PERCENT_GALA = mCap_Value * 0.1;

      expect(platformBalanceDiff.toNumber()).toBeCloseTo(TEN_PERCENT_GALA);

      //Left tokens left in vault should be Burned
      const tokenLeftInVaultVal = await getTokenBalance(vaultAddress, "UnitTest", "Test", "SALETHIRTYTHREE");

      expect(Number(tokenLeftInVaultVal)).toEqual(0);
    });

    test("Pool Gets created after finalization", async () => {

      //Given 

      const sale = await createSale(client, user3, "Asset29", "saleTwentyNine");
      if (!sale.Data) throw new Error();
      vaultAddress = sale.Data?.vaultAddress;
      const buyWithNativeDTO = new NativeTokenQuantityDto();

      buyWithNativeDTO.vaultAddress = vaultAddress;
      buyWithNativeDTO.nativeTokenQuantity = new BigNumber("1640986");

      buyWithNativeDTO.sign(user2.privateKey);

      //When 

      await client.Launchpad.BuyWithNative(buyWithNativeDTO);

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

      const getPoolDTO = new GetPoolDto(token0classKey, token1classKey, 3000);

      const response = await client3.dexV3Contract.getPoolData(getPoolDTO);

      //Then

      expect(response.Status).toEqual(1);
    });

    test("User will not be able to buy when the sale end", async () => {

      //Given 

      const sale = await createSale(client, user3, "Asset30", "saleThirty");
      if (!sale.Data) throw new Error();
      vaultAddress = sale.Data?.vaultAddress;
      const buyWithNativeDTO = new NativeTokenQuantityDto();

      buyWithNativeDTO.vaultAddress = vaultAddress;
      buyWithNativeDTO.nativeTokenQuantity = new BigNumber("1640986");

      buyWithNativeDTO.sign(user1.privateKey);
 
      //When 

      await client.Launchpad.BuyWithNative(buyWithNativeDTO);

      // Buy after sale ends

      const buyWithNative1DTO = new NativeTokenQuantityDto();

      buyWithNative1DTO.vaultAddress = vaultAddress;
      buyWithNative1DTO.nativeTokenQuantity = new BigNumber("10");

      buyWithNative1DTO.sign(user1.privateKey);

      const buyRes1 = await client.Launchpad.BuyWithNative(buyWithNativeDTO);

      //Then 

      expect(buyRes1.Message).toEqual("This sale has already ended.");
    });
  });

  describe("Configurable Platform Fee and Admin Allocation Check", () => {
    test("Set Allocation test", async () => {
      //Given 
      const setPlatformFeeAllocationDTO = new FinalizeTokenAllocationDto();
      setPlatformFeeAllocationDTO.platformFeePercentage = 0.2;
      setPlatformFeeAllocationDTO.ownerFeePercentage = 0.3;

      setPlatformFeeAllocationDTO.sign(user2.privateKey);

      //When 
      const setPlatformAllocationRes =
        await client.Launchpad.FinalizeTokenAllocation(setPlatformFeeAllocationDTO);

      //Then
      expect(setPlatformAllocationRes).toBeDefined();
      expect(setPlatformAllocationRes.Status).toBe(1);
      expect(setPlatformAllocationRes.Data).toBeDefined();

      // Verify the allocation percentages in the response
      expect(setPlatformAllocationRes.Data?.liquidityAllocationPercentage).toBe(0.5);
      expect(setPlatformAllocationRes.Data?.ownerAllocationPercentage).toBe(0.3);
      expect(setPlatformAllocationRes.Data?.platformFeePercentage).toBe(0.2);
    });

    test("It will revert if total sum while setting allocation exceeds 1 (ie 100%)", async () => {

      //Given 

      const setPlatformFeeAllocationDTO = new FinalizeTokenAllocationDto();
      setPlatformFeeAllocationDTO.platformFeePercentage = 0.2;
      setPlatformFeeAllocationDTO.ownerFeePercentage = 0.9;

      setPlatformFeeAllocationDTO.sign(user1.privateKey);

      //When 

      const setPlatformAllocationRes =
        await client.Launchpad.FinalizeTokenAllocation(setPlatformFeeAllocationDTO);

      //Then

      expect(setPlatformAllocationRes.Status).toBe(0);
      expect(setPlatformAllocationRes.Message).toEqual(
        "Total allocation (Platform Fee + Owner Allocation) cannot exceed 1."
      );
    });

    test("Check Whether Finalize Allocation is happening according to the provided allocation", async () => {


      //Given 

      const setPlatformFeeAllocationDTO = new FinalizeTokenAllocationDto();
      setPlatformFeeAllocationDTO.platformFeePercentage = 0.05;
      setPlatformFeeAllocationDTO.ownerFeePercentage = 0.3;

      //Platform Gala Balance Before
      const platformBalanceBefore = await getTokenBalance(user5.identityKey, "GALA", "Unit", "none");

      //Fetch User 3 gala balance
      const ownerTokenBalanceBefore = await getTokenBalance(user.identityKey, "GALA", "Unit", "none");

      setPlatformFeeAllocationDTO.sign(user2.privateKey);

      //When 

      await client.Launchpad.FinalizeTokenAllocation(setPlatformFeeAllocationDTO);

      const sale = await createSale(client, user, "Asset37", "saleThirtyEight");
      if (!sale.Data) throw new Error();
      vaultAddress = sale.Data?.vaultAddress;

      const buyWithNativeDTO = new NativeTokenQuantityDto();
      buyWithNativeDTO.vaultAddress = vaultAddress;
      buyWithNativeDTO.nativeTokenQuantity = new BigNumber("1640986");

      buyWithNativeDTO.sign(user1.privateKey);

      await client.Launchpad.BuyWithNative(buyWithNativeDTO);

      //Fetch Sale Details
      const fetchSaleDetailsDTO = new FetchSaleDto();
      fetchSaleDetailsDTO.vaultAddress = vaultAddress;

      const fetchSaleRes = await client.Launchpad.FetchSale(fetchSaleDetailsDTO);


      //Then
      expect(fetchSaleRes.Data?.saleStatus).toEqual(SaleStatus.END);

      //30% of Market Cap
      const THIRTY_PERCENT_MCAP = Number(LaunchpadSale.MARKET_CAP) * 0.3;

      //5% of Market Cap
      const FIVE_PERCENT_MCAP = Number(LaunchpadSale.MARKET_CAP) * 0.05;

      const ownerTokenBalanceAfter = await getTokenBalance(user.identityKey, "GALA", "Unit", "none");

      const balanceDifferenc = ownerTokenBalanceAfter.minus(ownerTokenBalanceBefore);

      expect(Number(balanceDifferenc)).toBeCloseTo(THIRTY_PERCENT_MCAP);

      //Platform Gala Balance
      const platformBalanceAfter = await getTokenBalance(user5.identityKey, "GALA", "Unit", "none");

      const platforBalanceDiff = platformBalanceAfter.minus(platformBalanceBefore);

      expect(Number(platforBalanceDiff)).toBeCloseTo(FIVE_PERCENT_MCAP);
    });
  });

  describe("Calculations Check", () => {
    test("Calculate Native Tokens Out Test", async () => {

      //Given 

      // Create a sale
      const sale = await createSale(client, user, "Asset36", "saleThirtySix");
      if (!sale.Data) throw new Error();
      vaultAddress = sale.Data?.vaultAddress;

      // Creating 63452 Supply
      const buyExactTokenDTO = new ExactTokenQuantityDto();
      buyExactTokenDTO.vaultAddress = vaultAddress;
      buyExactTokenDTO.tokenQuantity = new BigNumber("634452");
      buyExactTokenDTO.sign(user1.privateKey);


      //When 

      const buyExactTokenRes = await client.Launchpad.BuyExactToken(buyExactTokenDTO);

      expect(buyExactTokenRes).toEqual(transactionSuccess());

      // Fetch sale details
      const fetchSaleDTO = new FetchSaleDto();
      fetchSaleDTO.vaultAddress = vaultAddress;

      const fetchSaleRes = await client.Launchpad.FetchSale(fetchSaleDTO);

      const currentSellingQty = Number(fetchSaleRes.Data?.sellingTokenQuantity);

      const currentSupply = totalSupply - currentSellingQty;

      // Calculations for Native Tokens Out (On-Chain Call)
      const calNativeTokenOutDTO = new ExactTokenQuantityDto();
      calNativeTokenOutDTO.vaultAddress = vaultAddress;
      calNativeTokenOutDTO.tokenQuantity = new BigNumber("220");

      const calNativeTokensOutRes = await client.Launchpad.CallNativeTokenOut(calNativeTokenOutDTO);
      // const resObject = calNativeTokensOutRes.Data as { calculatedQuantity?: string };
      // const calculatedQuantity = resObject.calculatedQuantity ?? "";
      const calculatedQuantity = calNativeTokensOutRes.Data?.calculatedQuantity;

      // Off-Chain Calculation for Verification
      const calculatedTestRes = calNativeTokensOutTest(currentSupply, 220);

      //Then 

      expect(Number(calculatedQuantity)).toEqual(calculatedTestRes);
    });

    test("Calculate Meme Tokens Out Test", async () => {
          
      //Given

      const sale = await createSale(client, user, "Asset37", "saleThirtySeven");
      if (!sale.Data) throw new Error();
      vaultAddress = sale.Data?.vaultAddress;

      //Creating Supply

      const buyWithNativeDTO = new NativeTokenQuantityDto();
      buyWithNativeDTO.vaultAddress = vaultAddress;
      buyWithNativeDTO.nativeTokenQuantity = new BigNumber("80");
      buyWithNativeDTO.sign(user1.privateKey);

      //When
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

      const calculatedQuantity = calMemeTokenOutRes.Data?.calculatedQuantity;

      //Calculate Meme Tokens Out Test off-chain
      const calculatedTestRes = calMemeTokensOutTest(currentSupply, 73);

      //Then

      expect(Number(calculatedQuantity)).toBeCloseTo(Number(calculatedTestRes));
    });

    test("Calculate Native Tokens In Test", async () => {

      //Given
      // const totalSupply = 10000000 ;

      const sale = await createSale(client, user, "Asset39", "saleThirtyNine");
      if (!sale.Data) throw new Error();
      vaultAddress = sale.Data?.vaultAddress;

      //Creating 7002 Supply
      const buyExactTokenDTO = new ExactTokenQuantityDto();
      buyExactTokenDTO.vaultAddress = vaultAddress;
      buyExactTokenDTO.tokenQuantity = new BigNumber("7002");
      buyExactTokenDTO.sign(user1.privateKey);

      //When 
      const buyExactTokenRes = await client.Launchpad.BuyExactToken(buyExactTokenDTO);

      //Then 

      expect(buyExactTokenRes).toEqual(transactionSuccess());

      const fetchSaleDTO = new FetchSaleDto();
      fetchSaleDTO.vaultAddress = vaultAddress;

      const fetchSaleRes = await client.Launchpad.FetchSale(fetchSaleDTO);
      const currentSellingQty = Number(fetchSaleRes.Data?.sellingTokenQuantity);

      const currentSupply = totalSupply - currentSellingQty;

      const calculateNativeTokenInDTO = new ExactTokenQuantityDto();
      calculateNativeTokenInDTO.vaultAddress = vaultAddress;
      calculateNativeTokenInDTO.tokenQuantity = new BigNumber("672");
      
      //When
      //Calculate Native Tokens In on-chain call
      const calculateNativeTokenInRes = await client.Launchpad.CallNativeTokenIn(calculateNativeTokenInDTO);
      const calculatedQuantity = calculateNativeTokenInRes.Data?.calculatedQuantity;

      //Calculate Native Tokens In off-chain
      const calculatedTestRes = calNativeTokensInTest(currentSupply, 672);

      //Then 
      expect(Number(calculatedQuantity)).toEqual(Number(calculatedTestRes));
    });

    test("Calculate Meme Token In Test", async () => {
      // const totalSupply = 10000000 ;
      //Given

      const sale = await createSale(client, user, "Asset40", "saleForty");
      if (!sale.Data) throw new Error();
      vaultAddress = sale.Data?.vaultAddress;

      //Creating 711264 Supply
      const buyExactTokenDTO = new ExactTokenQuantityDto();
      buyExactTokenDTO.vaultAddress = vaultAddress;
      buyExactTokenDTO.tokenQuantity = new BigNumber("711264");
      buyExactTokenDTO.sign(user2.privateKey);

      //When 
      const buyExactTokenRes = await client.Launchpad.BuyExactToken(buyExactTokenDTO);

      //Then 
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

      //When 

      const calculateMemeTokenInRes = await client.Launchpad.CallMemeTokenIn(calculateMemeTokenInDTO);
      const calculatedQuantity = calculateMemeTokenInRes.Data?.calculatedQuantity;

      //Calculate Meme Token In off-chain
      const calculatedTestRes = calMemeTokensInTest(currentSupply, 10);

      //Then 

      expect(Number(calculatedQuantity)).toEqual(Number(calculatedTestRes));
    });

    test("Calculate memes tokens out for preminting", async () => {
      //Given
      const nativeAmountDTO = new PreMintCalculationDto();
      nativeAmountDTO.nativeTokenQuantity = new BigNumber("50");

      //When 
      const preMintVal = await client.Launchpad.CalculatePreMintTokens(nativeAmountDTO);

      if (!preMintVal.Data) {
        throw new Error("preMintValue is undefined");
      }

      //Then 
      expect(new BigNumber(preMintVal.Data).toFixed()).toEqual(
        new BigNumber("1295968.3836584872964").toFixed()
      );
    });
  });
});
interface LaunchpadContractAPI {
  CreateSale(dto: CreateTokenSaleDTO): Promise<GalaChainResponse<CreateSaleResDto>>;
  BuyExactToken(dto: ExactTokenQuantityDto): Promise<GalaChainResponse<TradeResDto>>;
  SellExactToken(dto: ExactTokenQuantityDto): Promise<GalaChainResponse<TradeResDto>>;
  BuyWithNative(dto: NativeTokenQuantityDto): Promise<GalaChainResponse<TradeResDto>>;
  SellWithNative(dto: NativeTokenQuantityDto): Promise<GalaChainResponse<TradeResDto>>;
  CallNativeTokenIn(dto: ExactTokenQuantityDto): Promise<GalaChainResponse<TradeCalculationResDto>>;
  CallMemeTokenOut(dto: NativeTokenQuantityDto): Promise<GalaChainResponse<TradeCalculationResDto>>;
  CallNativeTokenOut(dto: ExactTokenQuantityDto): Promise<GalaChainResponse<TradeCalculationResDto>>;
  CallMemeTokenIn(dto: NativeTokenQuantityDto): Promise<GalaChainResponse<TradeCalculationResDto>>;
  CalculatePreMintTokens(dto: PreMintCalculationDto): Promise<GalaChainResponse<BigNumber>>;
  FetchSale(dto: FetchSaleDto): Promise<GalaChainResponse<LaunchpadSale>>;
  ConfigureLaunchpadFeeAddress(
    dto: ConfigureLaunchpadFeeAddressDto
  ): Promise<GalaChainResponse<LaunchpadFeeConfig>>;
  FinalizeTokenAllocation(
    dto: FinalizeTokenAllocationDto
  ): Promise<GalaChainResponse<LaunchpadFinalizeFeeAllocation>>;
  FetchLaunchpadFeeConfig(dto: ChainCallDTO): Promise<GalaChainResponse<LaunchpadFeeConfig>>;
}

function LaunchpadContractAPI(client: ChainClient): LaunchpadContractAPI & CommonContractAPI {
  return {
    ...commonContractAPI(client),

    CreateSale(dto: CreateTokenSaleDTO) {
      return client.submitTransaction("CreateSale", dto, CreateSaleResDto);
    },
    BuyExactToken(dto: ExactTokenQuantityDto) {
      return client.submitTransaction("BuyExactToken", dto, TradeResDto);
    },
    SellExactToken(dto: ExactTokenQuantityDto) {
      return client.submitTransaction("SellExactToken", dto, TradeResDto);
    },
    BuyWithNative(dto: NativeTokenQuantityDto) {
      return client.submitTransaction("BuyWithNative", dto, TradeResDto);
    },
    SellWithNative(dto: NativeTokenQuantityDto) {
      return client.submitTransaction("SellWithNative", dto, TradeResDto);
    },
    CallNativeTokenIn(dto: ExactTokenQuantityDto) {
      return client.evaluateTransaction("CallNativeTokenIn", dto, TradeCalculationResDto);
    },
    CallMemeTokenOut(dto: NativeTokenQuantityDto) {
      return client.evaluateTransaction("CallMemeTokenOut", dto, TradeCalculationResDto);
    },
    CallNativeTokenOut(dto: ExactTokenQuantityDto) {
      return client.evaluateTransaction("CallNativeTokenOut", dto, TradeCalculationResDto);
    },
    CallMemeTokenIn(dto: NativeTokenQuantityDto) {
      return client.evaluateTransaction("CallMemeTokenIn", dto, TradeCalculationResDto);
    },
    CalculatePreMintTokens(dto: PreMintCalculationDto) {
      return client.evaluateTransaction<BigNumber>("CalculatePreMintTokens", dto, BigNumber);
    },
    FetchSale(dto: FetchSaleDto) {
      return client.evaluateTransaction<LaunchpadSale>("FetchSaleDetails", dto, LaunchpadSale);
    },
    ConfigureLaunchpadFeeAddress(dto: ConfigureLaunchpadFeeAddressDto) {
      return client.submitTransaction<LaunchpadFeeConfig>(
        "ConfigureLaunchpadFeeAddress",
        dto,
        LaunchpadFeeConfig
      );
    },
    FinalizeTokenAllocation(dto: FinalizeTokenAllocationDto) {
      return client.submitTransaction<LaunchpadFinalizeFeeAllocation>(
        "FinalizeTokenAllocation",
        dto,
        LaunchpadFinalizeFeeAllocation
      );
    },
    FetchLaunchpadFeeConfig(dto: ChainCallDTO) {
      return client.evaluateTransaction<LaunchpadFeeConfig>(
        "FetchLaunchpadFeeConfig",
        dto,
        LaunchpadFeeConfig
      );
    }
  };
}

interface GalaTokenContractAPI {
  CreateToken(dto: CreateTokenClassDto): Promise<GalaChainResponse<TokenClassKey>>;
  MintTokenWithAllowance(dto: MintTokenWithAllowanceDto): Promise<GalaChainResponse<TokenInstanceKey>>;
  TransferToken(dto: TransferTokenDto): Promise<GalaChainResponse<TokenBalance[]>>;
  FetchBalances(dto: FetchBalancesDto): Promise<GalaChainResponse<TokenBalance[]>>;
}

function GalaTokenContractAPI(client: ChainClient): GalaTokenContractAPI & CommonContractAPI {
  return {
    ...commonContractAPI(client),

    CreateToken(dto: CreateTokenClassDto) {
      return client.submitTransaction("CreateTokenClass", dto, TokenClassKey);
    },
    MintTokenWithAllowance(dto: MintTokenWithAllowanceDto) {
      return client.submitTransaction("MintTokenWithAllowance", dto, TokenInstanceKey);
    },
    TransferToken(dto: TransferTokenDto) {
      return client.submitTransaction<TokenBalance[]>("TransferToken", dto, TokenBalance);
    },
    FetchBalances(dto: FetchBalancesDto) {
      return client.evaluateTransaction<TokenBalance[]>("FetchBalances", dto, TokenBalance);
    }
  };
}

interface DexV3ContractAPI {
  getPoolData(dto: GetPoolDto): Promise<GalaChainResponse<Pool>>;
}

function dexV3ContractAPI(client: ChainClient): DexV3ContractAPI & CommonContractAPI {
  return {
    ...commonContractAPI(client),

    getPoolData(dto: GetPoolDto) {
      return client.evaluateTransaction<Pool>("GetPoolData", dto, Pool);
    }
  };
}

function roundToDecimal(value, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

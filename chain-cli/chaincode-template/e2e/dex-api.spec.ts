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
  AddLiquidityDTO,
  AddLiquidityResDto,
  BurnDto,
  BurnEstimateDto,
  ChainCallDTO,
  CollectDto,
  CollectTradingFeesDto,
  CollectTradingFeesResDto,
  ConfigureDexFeeAddressDto,
  CreatePoolDto,
  CreateTokenClassDto,
  DexFeeConfig,
  DexNftBatchLimit,
  DexNftBatchLimitDto,
  FetchBalancesDto,
  GalaChainResponse,
  GetAddLiquidityEstimationDto,
  GetAddLiquidityEstimationResDto,
  GetLiquidityResDto,
  GetPoolDto,
  GetPositionDto,
  GetPositionResDto,
  GetPositionWithNftIdDto,
  GetRemoveLiqEstimationResDto,
  GetUserPositionsDto,
  GetUserPositionsResDto,
  GrantAllowanceDto,
  MintTokenDto,
  MintTokenWithAllowanceDto,
  Pool,
  QuoteExactAmountDto,
  QuoteExactAmountResDto,
  SetProtocolFeeDto,
  SetProtocolFeeResDto,
  Slot0ResDto,
  SwapDto,
  SwapResDto,
  TokenAllowance,
  TokenBalance,
  TokenClassKey,
  TokenInstanceKey,
  TransferTokenDto,
  UserBalanceResDto,
  feeAmountTickSpacing,
  sqrtPriceToTick
} from "@gala-chain/api";
import { ChainClient, ChainUser, CommonContractAPI, commonContractAPI } from "@gala-chain/client";
import {
  AdminChainClients,
  TestClients,
  transactionErrorMessageContains,
  transactionSuccess
} from "@gala-chain/test";
import BigNumber from "bignumber.js";

import TOKENS, { ETH_ClassKey, SOL_ClassKey, USDC_ClassKey, USDT_ClassKey } from "./tokens";

jest.setTimeout(3000000);

const spacedTicksFromPrice = (pa: number, pb: number, tickSpacing: number) => {
  return [
    Math.ceil(sqrtPriceToTick(new BigNumber(Math.sqrt(pa))) / tickSpacing) * tickSpacing,
    Math.floor(sqrtPriceToTick(new BigNumber(Math.sqrt(pb))) / tickSpacing) * tickSpacing
  ];
};
describe("DEx v3 Testing", () => {
  const contractConfig = {
    dexV3Contract: {
      channel: "product-channel",
      chaincode: "basic-product",
      contract: "DexV3Contract",
      api: dexV3ContractAPI
    },
    tokenContract: {
      channel: "product-channel",
      chaincode: "basic-product",
      contract: "GalaChainToken",
      api: tokenContractAPI
    }
  };

  let client: AdminChainClients<typeof contractConfig>;
  let user: ChainUser;
  let authorityUser: ChainUser;

  beforeAll(async () => {
    client = await TestClients.createForAdmin(contractConfig);
    user = await client.createRegisteredUser();
    authorityUser = await client.createRegisteredUser();
  });
  afterAll(async () => {
    await client.disconnect();
  });

  test(`Api of ${contractConfig.dexV3Contract.contract}`, async () => {
    const response = await client.dexV3Contract.GetContractAPI();
    expect(response).toEqual(transactionSuccess());
  });

  describe("creating tokens", () => {
    const GENERAL = {
      MAX_SUPPLY: new BigNumber(100000000000000),
      MAX_CAPACITY: new BigNumber(100000000000000),
      TOTAL_MINT_ALLOWANCE: new BigNumber(0),
      TOTAL_SUPPLY: new BigNumber(0),
      NETWORK: "GC",
      IS_NON_FUNGIBLE: false,
      DECIMALS: 18,
      TOTAL_BURNED: new BigNumber(0)
    };
    for (const TOKEN of Object.entries(TOKENS)) {
      test(`Create  ${TOKEN[0]} token`, async () => {
        const token = TOKEN[1];
        const classKey = Object.assign(new TokenClassKey(), token.KEY);
        const tokenClassDto = Object.assign(new CreateTokenClassDto(), token);
        tokenClassDto.tokenClass = classKey;
        tokenClassDto.decimals = GENERAL.DECIMALS;
        tokenClassDto.maxSupply = GENERAL.MAX_SUPPLY;
        tokenClassDto.maxCapacity = GENERAL.MAX_CAPACITY;
        tokenClassDto.totalMintAllowance = GENERAL.TOTAL_MINT_ALLOWANCE;
        tokenClassDto.totalSupply = GENERAL.TOTAL_SUPPLY;
        tokenClassDto.totalBurned = GENERAL.TOTAL_BURNED;
        tokenClassDto.network = GENERAL.NETWORK;
        tokenClassDto.isNonFungible = GENERAL.IS_NON_FUNGIBLE;
        tokenClassDto.sign(user.privateKey);
        const tokenCreationRes = await client.tokenContract.CreateToken(tokenClassDto);
        expect(tokenCreationRes).toMatchObject({
          Status: 1,
          Data: expect.objectContaining({
            additionalKey: expect.stringMatching(/[a-zA-Z0-9]{0,40}$/),
            category: expect.stringMatching(/[a-zA-Z0-9]{0,40}$/),
            collection: expect.stringMatching(/[a-zA-Z0-9]{0,40}$/),
            type: expect.stringMatching(/[a-zA-Z0-9]{0,40}$/)
          })
        });
      });
    }
  });

  describe("Mint tokens", () => {
    const GENERAL = {
      GRANT_QUANTITY: new BigNumber(100000000),
      ALLOWANCE_TYPE: 4,
      USES: new BigNumber(100000000),
      MINT_QUANTITY: new BigNumber(100000000)
    };
    for (const TOKEN of Object.entries(TOKENS))
      test(`Mint ${TOKEN[0]} token`, async () => {
        const token = TOKEN[1];
        const tokenClassKey = Object.assign(new TokenClassKey(), token.KEY);
        const dto = new MintTokenWithAllowanceDto();
        dto.tokenClass = tokenClassKey;
        dto.quantity = GENERAL.MINT_QUANTITY;
        dto.owner = user.identityKey;
        dto.tokenInstance = new BigNumber(0);
        dto.sign(user.privateKey);
        const mintTokenRes = await client.tokenContract.MintTokenWithAllowance(dto);
        expect(mintTokenRes).toMatchObject({
          Status: 1,
          Data: [
            expect.objectContaining({
              additionalKey: expect.stringMatching(/[a-zA-Z0-9]{0,40}$/),
              category: expect.stringMatching(/[a-zA-Z0-9]{0,40}$/),
              collection: expect.stringMatching(/[a-zA-Z0-9]{0,40}$/),
              type: expect.stringMatching(/[a-zA-Z0-9]{0,40}$/)
            })
          ]
        });
      });

    test("Should return user balance", async () => {
      const fetchBalancesDto = new FetchBalancesDto();
      fetchBalancesDto.owner = user.identityKey;
      const fetchBalanceRes = await client.tokenContract.FetchBalances(fetchBalancesDto);
      const balancesData = fetchBalanceRes.Data;
      if (balancesData) {
        for (const balance of balancesData) {
          const balanceN = balance.getQuantityTotal();
          expect(balanceN).toEqual(GENERAL.MINT_QUANTITY);
        }
      }
    });
  });
  /**
   * Let say we are creating a pair of ETH and USDT with token0 as ETH
   * with initial price as 1 ETH = 2000 USDT with fee 500
   */
  /////////// 0.5 %////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////
  describe("Create Pool with 0.05% fee with adding liquidity with intial price 2000", () => {
    const fee = 500,
      initialSqrtPrice = new BigNumber("44.72136");
    const tickSpacing = feeAmountTickSpacing[fee];

    test("Should create Pool with 0.05% fee", async () => {
      const dto = new CreatePoolDto(ETH_ClassKey, USDT_ClassKey, fee, initialSqrtPrice).signed(
        user.privateKey
      );
      const createPoolRes = await client.dexV3Contract.createPool(dto);
      expect(createPoolRes).toStrictEqual(transactionSuccess());
    });

    test("Should create error create pool with 0.05% fee", async () => {
      const dto = new CreatePoolDto(ETH_ClassKey, USDT_ClassKey, fee, initialSqrtPrice).signed(
        user.privateKey
      );
      const createPoolRes = await client.dexV3Contract.createPool(dto);
      expect(createPoolRes.Status).toEqual(0);
    });

    test("should Read details from slot0", async () => {
      const poolDataDTO = new GetPoolDto(ETH_ClassKey, USDT_ClassKey, fee).signed(user.privateKey);
      const slot0 = await client.dexV3Contract.getSlot0(poolDataDTO);
      const poolData = await client.dexV3Contract.getPoolData(poolDataDTO);
      expect(poolData.Data?.sqrtPrice.toString()).toEqual(initialSqrtPrice.toString());
      expect(slot0.Data?.sqrtPrice.toString()).toEqual(initialSqrtPrice.toString());
    });

    test("should throw error when tried adding liquidity below the min tick", async () => {
      // Given
      const fee = 500;
      const ta = -887280,
        tb = 324340;
      const dto = new AddLiquidityDTO(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        ta,
        tb,
        new BigNumber(1),
        new BigNumber(1),
        new BigNumber(1),
        new BigNumber(1)
      ).signed(user.privateKey);

      // When
      const result = await client.dexV3Contract.addLiquidity(dto);

      // Then
      expect(result).toEqual(
        transactionErrorMessageContains(
          "DTO validation failed: (1) min: tickLower must not be less than -887272"
        )
      );
    });

    test("should throw error when tried adding liquidity above the max tick", async () => {
      const fee = 500;
      const tb = 887280,
        ta = -324340;
      const dto = new AddLiquidityDTO(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        ta,
        tb,
        new BigNumber(1),
        new BigNumber(1),
        new BigNumber(1),
        new BigNumber(1)
      ).signed(user.privateKey);

      const result = await client.dexV3Contract.addLiquidity(dto);
      expect(result).toEqual(
        transactionErrorMessageContains(
          "DTO validation failed: (1) max: tickUpper must not be greater than 887272"
        )
      );
    });

    test("should throw error when  tick lower is greater than upper tick", async () => {
      const fee = 500;
      const ta = 887280,
        tb = -324340;
      const dto = new AddLiquidityDTO(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        ta,
        tb,
        new BigNumber(1),
        new BigNumber(1),
        new BigNumber(1),
        new BigNumber(1)
      ).signed(user.privateKey);

      const result = await client.dexV3Contract.addLiquidity(dto);
      expect(result).toEqual(
        transactionErrorMessageContains(
          "DTO validation failed: (1) isLessThan: tickLower must be less than tickUpper"
        )
      );
    });

    test("should throw error when  ticks are not spaced", async () => {
      const fee = 500;
      const ta = 887,
        tb = 32434;
      const dto = new AddLiquidityDTO(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        ta,
        tb,
        new BigNumber(1),
        new BigNumber(1),
        new BigNumber(1),
        new BigNumber(1)
      ).signed(user.privateKey);

      const result = await client.dexV3Contract.addLiquidity(dto);
      expect(result.Message).toContain("Tick is not spaced");
    });

    test("Checking for the expectedTokens to provide liquidity in the range of 1700 - 1900 range ", async () => {
      const fee = 500;
      const pa = 1700,
        pb = 1900;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);
      const dto = new GetAddLiquidityEstimationDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber(1),
        ta,
        tb,
        false
      ).signed(user.privateKey);

      const result = await client.dexV3Contract.getAddLiquidityEstimation(dto);
      const data = result.Data;
      expect(data?.amount0).toEqual(new BigNumber("0"));
      expect(data?.amount1).toEqual(new BigNumber("1"));
      expect(data?.liquidity.toString()).toEqual("0.42495639238882534");
    });

    test("Checking for the expectedTokens to provide liquidity in the range of 1980 - 2020 range ", async () => {
      const pa = 1980,
        pb = 2020;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);
      const fee = 500;
      const dto = new GetAddLiquidityEstimationDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber("10"),
        ta,
        tb,
        true
      ).signed(user.privateKey);

      const result = await client.dexV3Contract.getAddLiquidityEstimation(dto);
      const data = result.Data;
      expect(data?.amount0).toEqual(new BigNumber("10"));
      expect(data?.amount1).toEqual(new BigNumber("19106.858496401901029315"));
      expect(data?.liquidity).toEqual(new BigNumber("92271.497628802094407218"));
    });

    test("Checking for the expectedTokens to provide liquidity in the range of 2100 - 2200 range ", async () => {
      const pa = 2100,
        pb = 2200;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, 10);
      const fee = 500;
      const dto = new GetAddLiquidityEstimationDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber(1),
        ta,
        tb,
        true
      ).signed(user.privateKey);

      const result = await client.dexV3Contract.getAddLiquidityEstimation(dto);
      const data = result.Data;

      expect(data?.amount0).toEqual(new BigNumber("1"));
      expect(data?.amount1).toEqual(new BigNumber("0"));
      expect(data?.liquidity).toEqual(new BigNumber("2060.753664493334613554"));
    });

    test("Adding liquidity more than max liquidity will throw error", async () => {
      const pa = 1700,
        pb = 1900;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);
      const slippage = 0.5;
      const token0 = new BigNumber("0"),
        token1 = new BigNumber("10000000000000000000000000000000000000000000000000");
      const [token0Slipped, token1Slipped] = slippedValue([token0, token1], slippage);

      const dto = new AddLiquidityDTO(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        ta,
        tb,
        token0,
        token1,
        token0Slipped,
        token1Slipped
      ).signed(user.privateKey);

      const addLiquidityRes = await client.dexV3Contract.addLiquidity(dto);
      expect(addLiquidityRes.Message).toBe("liquidity crossed max liquidity");
    });

    test("Adding liquidity equal to zero will throw error", async () => {
      const pa = 1700,
        pb = 1900;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);
      const slippage = 0.5;
      const token0 = new BigNumber("0"),
        token1 = new BigNumber("0");
      const [token0Slipped, token1Slipped] = slippedValue([token0, token1], slippage);

      const dto = new AddLiquidityDTO(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        ta,
        tb,
        token0,
        token1,
        token0Slipped,
        token1Slipped
      ).signed(user.privateKey);

      const addLiquidityRes = await client.dexV3Contract.addLiquidity(dto);
      expect(addLiquidityRes.Message).toBe("Invalid Liquidity");
    });

    test("Add liquidity in range 1700 - 1900", async () => {
      const pa = 1700,
        pb = 1900;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);
      const expectedTokenDTO = new GetAddLiquidityEstimationDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber(1),
        ta,
        tb,
        false
      ).signed(user.privateKey);

      const slippage = 0.5;

      const result = await client.dexV3Contract.getAddLiquidityEstimation(expectedTokenDTO);
      const data = result.Data;
      expect(data).toBeDefined();
      if (!data) throw new Error();
      const token0 = new BigNumber(data.amount0),
        token1 = new BigNumber(data.amount1);
      const [token0Slipped, token1Slipped] = slippedValue([token0, token1], slippage);

      const dto = new AddLiquidityDTO(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        ta,
        tb,
        token0,
        token1,
        token0Slipped,
        token1Slipped
      ).signed(user.privateKey);

      const addLiquidityRes = await client.dexV3Contract.addLiquidity(dto);
      expect(addLiquidityRes).toMatchObject({
        Status: 1,
        Data: {
          userBalanceDelta: {
            token0Balance: expect.objectContaining({
              additionalKey: "ETH",
              category: "new-category0",
              collection: "new-collection0",
              inUseHolds: [],
              instanceIds: [],
              lockedHolds: [],
              owner: expect.stringMatching(/^eth\|[a-fA-F0-9]{40}$/),
              quantity: "100000000",
              type: "new-type0"
            }),
            token1Balance: expect.objectContaining({
              additionalKey: "USDT",
              category: "new-category0",
              collection: "new-collection0",
              inUseHolds: [],
              instanceIds: [],
              lockedHolds: [],
              owner: expect.stringMatching(/^eth\|[a-fA-F0-9]{40}$/),
              type: "new-type0"
            })
          },
          amounts: [new BigNumber("0"), new BigNumber("0.999999999999999998")]
        }
      });
      const getLiquidityDTO = new GetPoolDto(ETH_ClassKey, USDT_ClassKey, fee).signed(user.privateKey);
      const liq = await client.dexV3Contract.getLiquidity(getLiquidityDTO);

      // As we have provided our first liquidity outside the range then the global liquidity must be equal to zero
      expect(liq.Data?.liquidity).toEqual(new BigNumber("0"));
    });

    test("should test for liquidity", async () => {
      const getLiquidityDTO = new GetPoolDto(ETH_ClassKey, USDT_ClassKey, fee).signed(user.privateKey);
      const liq = await client.dexV3Contract.getLiquidity(getLiquidityDTO);

      // As we have provided our first liquidity outside the range then the global liquidity must be equal to zero
      expect(liq.Data?.liquidity.toString()).toEqual("0");
    });

    test("Add liquidity in range 1980 - 2020", async () => {
      const pa = 1980,
        pb = 2020;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);
      const expectedTokenDTO = new GetAddLiquidityEstimationDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber(10),
        ta,
        tb,
        true
      ).signed(user.privateKey);
      const slippage = 0.5;
      const result = await client.dexV3Contract.getAddLiquidityEstimation(expectedTokenDTO);
      const data = result.Data;
      expect(data).toBeDefined();
      if (!data) throw new Error();
      const token0 = new BigNumber(data.amount0),
        token1 = new BigNumber(data.amount1),
        liquidity = new BigNumber(data.liquidity);
      const [token0Slipped, token1Slipped] = slippedValue([token0, token1], slippage);
      const dto = new AddLiquidityDTO(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        ta,
        tb,
        token0,
        token1,
        token0Slipped,
        token1Slipped
      ).signed(user.privateKey);
      await client.dexV3Contract.addLiquidity(dto);
      const getLiquidityDTO = new GetPoolDto(ETH_ClassKey, USDT_ClassKey, fee).signed(user.privateKey);
      const liq = await client.dexV3Contract.getLiquidity(getLiquidityDTO);
      expect(Number(liq.Data?.liquidity)).toBeCloseTo(Number(liquidity.toString()));
    });

    test("Add liquidity in range 2100 - 2200", async () => {
      const pa = 2100,
        pb = 2200;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);
      const expectedTokenDTO = new GetAddLiquidityEstimationDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber(1),
        ta,
        tb,
        true
      ).signed(user.privateKey);

      const slippage = 0.5;

      const result = await client.dexV3Contract.getAddLiquidityEstimation(expectedTokenDTO);
      const data = result.Data;
      expect(data).toBeDefined();
      if (!data) throw new Error();
      const token0 = new BigNumber(data.amount0),
        token1 = new BigNumber(data.amount1);
      const [token0Slipped, token1Slipped] = slippedValue([token0, token1], slippage);
      const dto = new AddLiquidityDTO(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        ta,
        tb,
        token0,
        token1,
        token0Slipped,
        token1Slipped
      ).signed(user.privateKey);
      await client.dexV3Contract.addLiquidity(dto);
      const getLiquidityDTO = new GetPoolDto(ETH_ClassKey, USDT_ClassKey, fee).signed(user.privateKey);
      const liq = await client.dexV3Contract.getLiquidity(getLiquidityDTO);
      expect(liq.Data?.liquidity).toEqual(new BigNumber("92271.497628802094407217"));
    });

    test("It should provide NFT to the liquidity provider", async () => {
      //Iterate through the loop to get the positions
      const pa = 2100,
        pb = 2200;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);
      const expectedTokenDTO = new GetAddLiquidityEstimationDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber(1),
        ta,
        tb,
        true
      ).signed(user.privateKey);
      const result = await client.dexV3Contract.getAddLiquidityEstimation(expectedTokenDTO);

      const data = result.Data;

      expect(data).toBeDefined();
      if (!data) throw new Error();

      const GetPoolDataDTO = new GetPoolDto(ETH_ClassKey, USDT_ClassKey, fee).signed(user.privateKey);
      const getPoolData = await client.dexV3Contract.getPoolData(GetPoolDataDTO);
      const poolDataInstance = getPoolData.Data;
      if (!poolDataInstance) {
        throw new Error("Pool Not found");
      }

      const fetchUsersBalancesDTO = new FetchBalancesDto();
      fetchUsersBalancesDTO.owner = user.identityKey;

      const fetchUsersBalances = await client.tokenContract.FetchBalances(fetchUsersBalancesDTO);
      // Check whether the owner has NFTs
      expect(fetchUsersBalances.Data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: "LiquidityPositions",
            type: "new-collection0$new-category0$new-type0$ETH$new-collection0$new-category0$new-type0$USDT$500",
            owner: user.identityKey,
            collection: "DexNFT"
          })
        ])
      );

      // Check whether the owner has an NFT for each of their position in the pool
      const nft = fetchUsersBalances.Data?.[0];
      expect(nft?.getNftInstanceCount()).toBe(3);
    });

    test("NFT should point to a position in the pool", async () => {
      const getPositionWithNftIdDto = new GetPositionWithNftIdDto(ETH_ClassKey, USDT_ClassKey, fee, "1$1");
      const getPositionWithNftIdRes =
        await client.dexV3Contract.getPositionWithNftId(getPositionWithNftIdDto);
      expect(getPositionWithNftIdRes).toMatchObject({
        Status: 1,
        Data: {
          feeGrowthInside0Last: "0",
          feeGrowthInside1Last: "0",
          liquidity: "0.42495639238882534",
          nftId: "1$1",
          tickLower: "74390",
          tickUpper: "75500",
          tokensOwed0: "0",
          tokensOwed1: "0"
        }
      });
    });

    test("should Read details from slot0", async () => {
      const poolDataDTO = new GetPoolDto(ETH_ClassKey, USDT_ClassKey, fee).signed(user.privateKey);
      const slot0 = await client.dexV3Contract.getSlot0(poolDataDTO);
      const poolData = await client.dexV3Contract.getPoolData(poolDataDTO);
      expect(poolData.Data?.sqrtPrice.toString()).toEqual(initialSqrtPrice.toString());
      expect(slot0.Data?.sqrtPrice.toString()).toEqual(initialSqrtPrice.toString());
    });

    test("should estimate swap", async () => {
      const amountToSwap = new BigNumber(2),
        sqrtPriceLimit = new BigNumber(5);
      const dto = new SwapDto(ETH_ClassKey, USDT_ClassKey, fee, amountToSwap, true, sqrtPriceLimit).signed(
        user.privateKey
      );
      const expectSwapRes = await client.dexV3Contract.quoteExactAmount(dto);
      const result = expectSwapRes.Data;
      expect(result).toBeDefined();
      if (!result) throw new Error();
      expect(result.amount0.toString()).toBe("2");
      expect(result.amount1.toString()).toBe("-3994.130334466043470346");
      expect(result.currentSqrtPrice.toString()).toBe("44.72136");
      expect(result.newSqrtPrice.toString()).toBe("44.678073281597162509");
    });

    test("should throw error in estimating swap while swap more than avaiable liquiidity", async () => {
      const amountToSwap = new BigNumber("200000000000000000000000000"),
        sqrtPriceLimit = new BigNumber(1);
      const dto = new SwapDto(ETH_ClassKey, USDT_ClassKey, fee, amountToSwap, true, sqrtPriceLimit).signed(
        user.privateKey
      );
      const expectSwapRes = await client.dexV3Contract.quoteExactAmount(dto);
      expect(expectSwapRes.Message).toBe("Not enough liquidity available in pool");
    });

    test("should estimate swap for exact out", async () => {
      const amountToSwap = new BigNumber("-0.003"),
        sqrtPriceLimit = new BigNumber(5000);
      const dto = new SwapDto(ETH_ClassKey, USDT_ClassKey, fee, amountToSwap, false, sqrtPriceLimit).signed(
        user.privateKey
      );
      const quoteExactResponse = await client.dexV3Contract.quoteExactAmount(dto);
      expect(quoteExactResponse.Data).toMatchObject({
        amount0: new BigNumber("-0.003"),
        amount1: new BigNumber("6.003010350022664756"),
        currentSqrtPrice: new BigNumber("44.72136"),
        newSqrtPrice: new BigNumber("44.721425025592940791")
      });
    });

    test("should throw error while estimating swap for buy", async () => {
      const amountToSwap = new BigNumber("-0.00000000000000000000000001");
      const dto = new QuoteExactAmountDto(ETH_ClassKey, USDT_ClassKey, fee, amountToSwap, false).signed(
        user.privateKey
      );
      const quoteExactResponse = await client.dexV3Contract.quoteExactAmount(dto);
      expect(quoteExactResponse.Message).toBe("Invalid specified amount");
    });

    test("should swap with changing sqrtPrice", async () => {
      const amountToSwap = new BigNumber(2),
        sqrtPriceLimit = new BigNumber(5);

      const dto = new SwapDto(ETH_ClassKey, USDT_ClassKey, fee, amountToSwap, true, sqrtPriceLimit).signed(
        user.privateKey
      );
      const swapRes = await client.dexV3Contract.swap(dto);
      expect(swapRes).toMatchObject({
        Status: 1,
        Data: {
          amount0: "2.000000000000000000",
          amount1: "-3994.130334466043470347",
          timeStamp: expect.anything(),
          token0: "ETH",
          token0ImageUrl: expect.stringMatching(
            /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d{1,5})?(\/[^\s]*)?\.(jpg|jpeg|png|gif|bmp|webp|svg)$/
          ),
          token1: "USDT",
          token1ImageUrl: expect.stringMatching(
            /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d{1,5})?(\/[^\s]*)?\.(jpg|jpeg|png|gif|bmp|webp|svg)$/
          ),
          userAddress: expect.stringMatching(/^eth\|[a-fA-F0-9]{40}$/)
        }
      });
    });

    test("state changes after first swap", async () => {
      const poolData = new GetPoolDto(ETH_ClassKey, USDT_ClassKey, fee).signed(user.privateKey);
      const getData = await client.dexV3Contract.getPoolData(poolData);
      // fee collected after swap
      expect(getData.Data?.feeGrowthGlobal0.toString()).toBe("9.75382456261e-9");
    });

    test("Add liquidity in range 1980 - 2020 after the price has been slipped", async () => {
      const pa = 1980,
        pb = 2020;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);
      const expectedTokenDTO = new GetAddLiquidityEstimationDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber(10),
        ta,
        tb,
        true
      ).signed(user.privateKey);
      const slippage = 0.5;
      const result = await client.dexV3Contract.getAddLiquidityEstimation(expectedTokenDTO);
      const data = result.Data;
      expect(data).toBeDefined();
      if (!data) throw new Error();
      const token0 = new BigNumber("10"),
        token1 = new BigNumber("19106.858496401901029315");
      const [token0Slipped, token1Slipped] = slippedValue([token0, token1], slippage);

      const dto = new AddLiquidityDTO(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        ta,
        tb,
        token0,
        token1,
        token0Slipped,
        token1Slipped
      ).signed(user.privateKey);

      const liquidityRes = await client.dexV3Contract.addLiquidity(dto);
      expect(liquidityRes.ErrorCode).toBe(412);
      expect(liquidityRes.Message).toContain("Slippage check failed");
    });

    test("slot0 data", async () => {
      const poolData = new GetPoolDto(ETH_ClassKey, USDT_ClassKey, fee).signed(user.privateKey);
      const slot0 = await client.dexV3Contract.getSlot0(poolData);
      // value slipped from 44.72136 to 44.67807328159716250969
      const getData = await client.dexV3Contract.getPoolData(poolData);
      // fee collected after swap
      expect(getData.Data?.feeGrowthGlobal0.toString()).toBe("9.75382456261e-9");
      expect(slot0.Data?.sqrtPrice.toString()).toEqual("44.67807328159716250969");
    });

    test("check the user position for token0Owed before the removal of liqudity", async () => {
      const pa = 1980,
        pb = 2020;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, 10);
      const getPositionDto = new GetPositionDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        user.identityKey,
        ta,
        tb
      ).signed(user.privateKey);
      const positionRes = await client.dexV3Contract.getPositions(getPositionDto);
      expect(positionRes.Data).toMatchObject({
        feeGrowthInside0Last: "9.75382456261e-9",
        feeGrowthInside1Last: "0",
        liquidity: "92271.497628802094407217",
        tokensOwed0: "0.00090000000000062",
        tokensOwed1: "0"
      });
    });

    test("check the user position for token0Owed and token1Owed before the removal of liqudity", async () => {
      const getPositionsDto = new GetUserPositionsDto(user.identityKey, "", 1).signed(user.privateKey);
      const positions = await client.dexV3Contract.getUserPositions(getPositionsDto);
      expect(positions).toMatchObject({
        Status: 1,
        Data: expect.objectContaining({ nextBookMark: expect.anything(), positions: expect.anything() })
      });
    });

    test("Remove liquidity should throw an error if slippage check fails", async () => {
      // Given
      const tickSpacing = feeAmountTickSpacing[fee];
      const pa = 1980,
        pb = 2020;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);

      const burndto = new BurnDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber("92271.497628802094407217"),
        ta,
        tb,
        new BigNumber("12"),
        new BigNumber("15113")
      ).signed(user.privateKey);

      // When
      const burnRes = await client.dexV3Contract.RemoveLiquidity(burndto);

      // Then
      expect(burnRes).toEqual(transactionErrorMessageContains("Slippage check failed"));
    });

    test("Remove liquidity", async () => {
      const tickSpacing = feeAmountTickSpacing[fee];
      const pa = 1980,
        pb = 2020;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);

      const estimateDto = new BurnEstimateDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber("92271.497628802094407217"),
        ta,
        tb,
        user.identityKey
      );
      const dto = new BurnDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber("92271.497628802094407217"),
        ta,
        tb,
        new BigNumber("11.998999999999999999"),
        new BigNumber("15112.728161935857558968")
      );

      const removeLiqEstimation = await client.dexV3Contract.burnEstimate(estimateDto);
      const data = removeLiqEstimation.Data;
      if (data === undefined) throw new Error();
      expect(data.amount0.toString()).toBe("11.998999999999999999");
      expect(data.amount1.toString()).toBe("15112.728161935857558968");
      dto.sign(user.privateKey);
      const burnRes = await client.dexV3Contract.RemoveLiquidity(dto);
      expect(burnRes).toMatchObject({
        Status: 1,
        Data: {
          token0Balance: expect.objectContaining({
            additionalKey: "ETH",
            category: "new-category0",
            collection: "new-collection0",
            inUseHolds: [],
            instanceIds: [],
            lockedHolds: [],
            owner: expect.stringMatching(/^eth\|[a-fA-F0-9]{40}$/),
            quantity: "99999998",
            type: "new-type0"
          }),
          token1Balance: expect.objectContaining({
            additionalKey: "USDT",
            category: "new-category0",
            collection: "new-collection0",
            quantity: "99996004.869665533956529657",
            inUseHolds: [],
            instanceIds: [],
            lockedHolds: [],
            owner: expect.stringMatching(/^eth\|[a-fA-F0-9]{40}$/),
            type: "new-type0"
          })
        }
      });

      const getPositionsDto = new GetUserPositionsDto(user.identityKey).signed(user.privateKey);
      const userPositionsRes = await client.dexV3Contract.getUserPositions(getPositionsDto);
      expect(userPositionsRes).toMatchObject({
        Status: 1,
        Data: expect.objectContaining({ nextBookMark: expect.anything(), positions: expect.anything() })
      });
    });

    test("Removing liquidity more than in the position will throw an error", async () => {
      const tickSpacing = feeAmountTickSpacing[fee];
      const pa = 1980,
        pb = 2020;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);

      const dto = new BurnEstimateDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber("92271.497628802094407217"),
        ta,
        tb,
        user.identityKey
      );
      const removeLiqEstimation = await client.dexV3Contract.burnEstimate(dto);
      expect(removeLiqEstimation.Message).toBe("Uint Out of Bounds error :Uint");
    });

    test("Positions are transferred to new owner along with NFT", async () => {
      const nftInstanceKey = new TokenInstanceKey();
      nftInstanceKey.type =
        "new-collection0$new-category0$new-type0$ETH$new-collection0$new-category0$new-type0$USDT$500";
      nftInstanceKey.category = "LiquidityPositions";
      nftInstanceKey.collection = "DexNFT";
      nftInstanceKey.additionalKey = "1";
      nftInstanceKey.instance = new BigNumber("1");

      const transferNFTDto = new TransferTokenDto();
      transferNFTDto.from = user.identityKey;
      transferNFTDto.to = authorityUser.identityKey;
      transferNFTDto.tokenInstance = nftInstanceKey;
      transferNFTDto.quantity = new BigNumber("1");
      transferNFTDto.sign(user.privateKey);

      const transferNFTRes = await client.tokenContract.TransferToken(transferNFTDto);
      expect(transferNFTRes).toStrictEqual(transactionSuccess());

      const GetUserPositionsDTO = new GetUserPositionsDto(authorityUser.identityKey, "", 1);
      const getUser2position = await client.dexV3Contract.getUserPositions(GetUserPositionsDTO);

      const positions = getUser2position.Data?.positions;

      const positionArray =
        positions?.[
          "new-collection0$new-category0$new-type0$ETH$new-collection0$new-category0$new-type0$USDT$500"
        ];

      expect(positionArray).toMatchObject([
        {
          liquidity: "0.42495639238882534",
          tickLower: "74390",
          tickUpper: "75500",
          token0Symbol: "ETH",
          token1Symbol: "USDT"
        }
      ]);
    });

    test("check the user position for token0Owed after the removal of liqudity", async () => {
      const pa = 1980,
        pb = 2020;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, 10);
      const getPositionDto = new GetPositionDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        user.identityKey,
        ta,
        tb
      ).signed(user.privateKey);
      const positionRes = await client.dexV3Contract.getPositions(getPositionDto);
      expect(positionRes.Data).toMatchObject({
        feeGrowthInside0Last: "9.75382456261e-9",
        feeGrowthInside1Last: "0",
        liquidity: "0",
        tokensOwed0: "0.00090000000000062",
        tokensOwed1: "0"
      });
    });

    test("collecting more tokens will throw error", async () => {
      const tickSpacing = feeAmountTickSpacing[fee];
      const pa = 1980,
        pb = 2020;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);

      const dto = new CollectDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber("0.001"),
        new BigNumber("0"),
        ta,
        tb
      ).signed(user.privateKey);
      const collectRes = await client.dexV3Contract.collect(dto);
      expect(collectRes.Message).toBe("Less balance accumulated");
      const getPositionsDto = new GetUserPositionsDto(user.identityKey).signed(user.privateKey);
      await client.dexV3Contract.getUserPositions(getPositionsDto);
    });

    test("collect token0 and token1", async () => {
      const tickSpacing = feeAmountTickSpacing[fee];
      const pa = 1980,
        pb = 2020;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);

      const dto = new CollectDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber("0.00090000000000062"),
        new BigNumber("0"),
        ta,
        tb
      ).signed(user.privateKey);
      const collectRes = await client.dexV3Contract.collect(dto);
      expect(collectRes).toMatchObject({
        Status: 1,
        Data: {
          token0Balance: expect.objectContaining({
            additionalKey: "ETH",
            category: "new-category0",
            collection: "new-collection0",
            inUseHolds: [],
            instanceIds: [],
            lockedHolds: [],
            owner: expect.stringMatching(/^eth\|[a-fA-F0-9]{40}$/),
            type: "new-type0"
          }),
          token1Balance: expect.objectContaining({
            additionalKey: "USDT",
            category: "new-category0",
            collection: "new-collection0",
            inUseHolds: [],
            instanceIds: [],
            lockedHolds: [],
            owner: expect.stringMatching(/^eth\|[a-fA-F0-9]{40}$/),
            type: "new-type0"
          })
        }
      });
      const getPositionsDto = new GetUserPositionsDto(user.identityKey).signed(user.privateKey);
      await client.dexV3Contract.getUserPositions(getPositionsDto);
    });

    test("check the user position for token0Owed after the removal of liqudity", async () => {
      const pa = 1980,
        pb = 2020;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, 10);
      const getPositionDto = new GetPositionDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        user.identityKey,
        ta,
        tb
      ).signed(user.privateKey);
      const position = await client.dexV3Contract.getPositions(getPositionDto);
      expect(position.Data).toBeUndefined();
    });

    test("It should burn NFT when all liquidity has been withdrawn and all the fees has been collected", async () => {
      const fetchUsersBalancesDTO = new FetchBalancesDto();
      fetchUsersBalancesDTO.owner = user.identityKey;

      const fetchUsersBalances = await client.tokenContract.FetchBalances(fetchUsersBalancesDTO);
      // Check whether the owner has NFTs
      expect(fetchUsersBalances.Data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: "LiquidityPositions",
            type: "new-collection0$new-category0$new-type0$ETH$new-collection0$new-category0$new-type0$USDT$500",
            owner: user.identityKey,
            collection: "DexNFT"
          })
        ])
      );

      // Check whether the owner has an NFT for each of their position in the pool
      const nft = fetchUsersBalances.Data?.slice(-1);
      expect(nft?.[0]?.getNftInstanceIds()).not.toEqual(expect.arrayContaining([new BigNumber(2)]));
    });

    test("It should burn NFT when all liquidity has been withdrawn and no fees existed", async () => {
      const tickSpacing = feeAmountTickSpacing[fee];
      const pa = 2100,
        pb = 2200;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);

      const dto = new BurnDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber("2060.753664493334613554"),
        ta,
        tb,
        new BigNumber(0),
        new BigNumber(0)
      );
      dto.sign(user.privateKey);
      await client.dexV3Contract.RemoveLiquidity(dto);

      const fetchUsersBalancesDTO = new FetchBalancesDto();
      fetchUsersBalancesDTO.owner = user.identityKey;

      const getPositionWithNftIdDto = new GetPositionWithNftIdDto(ETH_ClassKey, USDT_ClassKey, fee, "1_3");
      const getPositionWithNftIdRes =
        await client.dexV3Contract.getPositionWithNftId(getPositionWithNftIdDto);
      expect(getPositionWithNftIdRes.Message).toEqual("No position with the nftId 1_3 found in this pool");

      const fetchUsersBalances = await client.tokenContract.FetchBalances(fetchUsersBalancesDTO);
      expect(fetchUsersBalances.Data?.[0]?.getNftInstanceIds()).not.toEqual(
        expect.arrayContaining([new BigNumber(3)])
      );
    });
  });

  //////////// 0.3% //////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  /**
   * Let say we are creating a pair of ETH and USDT with token0 as ETH
   * with initial price as 1 ETH = 2000 USDT with fee 3000
   */
  describe("Create Pool with 0.3% fee with adding liquidity with intial price 2000", () => {
    const fee = 3000,
      initialSqrtPrice = new BigNumber("44.72136");
    const tickSpacing = feeAmountTickSpacing[fee];
    const ETH = Object.assign(new TokenClassKey(), TOKENS.ETH.KEY).toStringKey(),
      USDT = Object.assign(new TokenClassKey(), TOKENS.USDT.KEY).toStringKey();

    test("Should create Pool with 0.3% fee", async () => {
      const dto = new CreatePoolDto(ETH_ClassKey, USDT_ClassKey, fee, initialSqrtPrice).signed(
        user.privateKey
      );
      const createPoolRes = await client.dexV3Contract.createPool(dto);
      expect(createPoolRes).toStrictEqual(transactionSuccess());
    });

    test("Should create error create pool with 0.03% fee", async () => {
      const dto = new CreatePoolDto(ETH_ClassKey, USDT_ClassKey, fee, initialSqrtPrice).signed(
        user.privateKey
      );
      const createPoolRes = await client.dexV3Contract.createPool(dto);
      expect(createPoolRes.Status).toEqual(0);
    });

    test("should Read details from slot0", async () => {
      const poolDataDTO = new GetPoolDto(ETH_ClassKey, USDT_ClassKey, fee).signed(user.privateKey);
      const slot0 = await client.dexV3Contract.getSlot0(poolDataDTO);
      expect(slot0.Data?.sqrtPrice.toString()).toEqual(initialSqrtPrice.toString());
    });

    test("Checking for the expectedTokens to provide liquidity in the range of 1700 - 1900 range", async () => {
      const pa = 1700,
        pb = 1900;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);

      const dto = new GetAddLiquidityEstimationDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber(1),
        ta,
        tb,
        false
      ).signed(user.privateKey);

      const result = await client.dexV3Contract.getAddLiquidityEstimation(dto);
      const data = result.Data;
      expect(data).toBeDefined();
      if (!data) throw new Error();
      expect(data.amount0.toString()).toEqual("0");
      expect(data.amount1.toString()).toEqual("1");
      expect(data.liquidity.toString()).toEqual("0.436872924385936373");
    });

    test("Checking for the expectedTokens to provide liquidity in the range of 1980 - 2020 range", async () => {
      const pa = 1980,
        pb = 2020;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);

      const dto = new GetAddLiquidityEstimationDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber(1),
        ta,
        tb,
        true
      ).signed(user.privateKey);

      const result = await client.dexV3Contract.getAddLiquidityEstimation(dto);
      const data = result.Data;
      expect(data).toBeDefined();
      if (!data) throw new Error();
      expect(data.amount0.toString()).toEqual("1");
      expect(data.amount1.toString()).toEqual("1573.331577716744383555");
      expect(data.liquidity.toString()).toEqual("13337.957541974915714025");
    });

    test("Checking for the expectedTokens to provide liquidity in the range of 2100 - 2200 range ", async () => {
      const pa = 2100,
        pb = 2200;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);
      const dto = new GetAddLiquidityEstimationDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber(1),
        ta,
        tb,
        true
      ).signed(user.privateKey);

      const result = await client.dexV3Contract.getAddLiquidityEstimation(dto);
      const data = result.Data;
      expect(data).toBeDefined();
      if (!data) throw new Error();
      expect(data.amount0).toEqual(new BigNumber("1"));
      expect(data.amount1).toEqual(new BigNumber("0"));
      expect(data.liquidity).toEqual(new BigNumber("2576.605678369885528483"));
    });

    test("Add liquidity in range 1700 - 1900", async () => {
      const pa = 1700,
        pb = 1900;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);
      const expectedTokenDTO = new GetAddLiquidityEstimationDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber(1),
        ta,
        tb,
        false
      ).signed(user.privateKey);

      const slippage = 0.5;

      const result = await client.dexV3Contract.getAddLiquidityEstimation(expectedTokenDTO);
      const data = result.Data;
      expect(data).toBeDefined();
      if (!data) throw new Error();
      const token0 = new BigNumber(data.amount0),
        token1 = new BigNumber(data.amount1),
        liquidity = new BigNumber(data.liquidity);

      expect(liquidity.toString()).toEqual("0.436872924385936373");
      const [token0Slipped, token1Slipped] = slippedValue([token0, token1], slippage);
      const dto = new AddLiquidityDTO(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        ta,
        tb,
        token0,
        token1,
        token0Slipped,
        token1Slipped
      ).signed(user.privateKey);

      await checkBalanceOfPool(ETH_ClassKey.toStringKey(), USDT_ClassKey.toStringKey(), fee);
      await client.dexV3Contract.addLiquidity(dto);
      const getLiquidityDTO = new GetPoolDto(ETH_ClassKey, USDT_ClassKey, fee).signed(user.privateKey);
      const liq = await client.dexV3Contract.getLiquidity(getLiquidityDTO);
      expect(liq.Data?.liquidity).toEqual(new BigNumber("0"));
    });

    test("Add liquidity in range 1980 - 2020", async () => {
      const pa = 1980,
        pb = 2020;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);
      const expectedTokenDTO = new GetAddLiquidityEstimationDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber(1),
        ta,
        tb,
        true
      ).signed(user.privateKey);
      const slippage = 0.5;
      const result = await client.dexV3Contract.getAddLiquidityEstimation(expectedTokenDTO);
      const data = result.Data;
      expect(data).toBeDefined();
      if (!data) throw new Error();
      const token0 = new BigNumber(data.amount0),
        token1 = new BigNumber(data.amount1),
        liquidity = new BigNumber(data.liquidity);

      expect(liquidity.toString()).toEqual("13337.957541974915714025");

      const [token0Slipped, token1Slipped] = slippedValue([token0, token1], slippage);
      const dto = new AddLiquidityDTO(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        ta,
        tb,
        token0,
        token1,
        token0Slipped,
        token1Slipped
      ).signed(user.privateKey);
      const addLiquidityRes = await client.dexV3Contract.addLiquidity(dto);
      expect(addLiquidityRes).toMatchObject({
        Status: 1,
        Data: {
          userBalanceDelta: {
            token0Balance: expect.objectContaining({
              additionalKey: "ETH",
              category: "new-category0",
              collection: "new-collection0",
              inUseHolds: [],
              instanceIds: [],
              lockedHolds: [],
              owner: expect.stringMatching(/^eth\|[a-fA-F0-9]{40}$/),
              type: "new-type0"
            }),
            token1Balance: expect.objectContaining({
              additionalKey: "USDT",
              category: "new-category0",
              collection: "new-collection0",
              inUseHolds: [],
              instanceIds: [],
              lockedHolds: [],
              owner: expect.stringMatching(/^eth\|[a-fA-F0-9]{40}$/),
              type: "new-type0"
            })
          },
          amounts: [new BigNumber("1"), new BigNumber("1573.331577716744383554")]
        }
      });
    });

    test("Add liquidity in range 2100 - 2200", async () => {
      const pa = 1980,
        pb = 2020;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);
      const expectedTokenDTO = new GetAddLiquidityEstimationDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber(1),
        ta,
        tb,
        true
      ).signed(user.privateKey);

      const slippage = 0.5;

      const result = await client.dexV3Contract.getAddLiquidityEstimation(expectedTokenDTO);
      const data = result.Data;
      expect(data).toBeDefined();
      if (!data) throw new Error();
      const token0 = new BigNumber(data.amount0),
        token1 = new BigNumber(data.amount1),
        liquidity = new BigNumber(data.liquidity);

      expect(liquidity.toString()).toEqual("13337.957541974915714025");
      const [token0Slipped, token1Slipped] = slippedValue([token0, token1], slippage);
      const dto = new AddLiquidityDTO(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        ta,
        tb,
        token0,
        token1,
        token0Slipped,
        token1Slipped
      ).signed(user.privateKey);

      await client.dexV3Contract.addLiquidity(dto);

      const getLiquidityDTO = new GetPoolDto(ETH_ClassKey, USDT_ClassKey, fee).signed(user.privateKey);

      const liqRes = await client.dexV3Contract.getLiquidity(getLiquidityDTO);
      expect(liqRes.Data?.liquidity.toString()).toBe("26675.915083949831428038");
    });

    test("should swap with changing sqrtPrice", async () => {
      const amountToSwap = new BigNumber(0.2),
        sqrtPriceLimit = new BigNumber(5);

      const dto = new SwapDto(ETH_ClassKey, USDT_ClassKey, fee, amountToSwap, true, sqrtPriceLimit).signed(
        user.privateKey
      );

      const swapRes = await client.dexV3Contract.swap(dto);
      expect(swapRes).toMatchObject({
        Status: 1,
        Data: {
          amount0: "0.200000000000000000",
          amount1: "-398.666738505901022666",
          timeStamp: expect.anything(),
          token0: "ETH",
          token1: "USDT",
          token0ImageUrl: expect.stringMatching(
            /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d{1,5})?(\/[^\s]*)?\.(jpg|jpeg|png|gif|bmp|webp|svg)$/
          ),
          token1ImageUrl: expect.stringMatching(
            /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d{1,5})?(\/[^\s]*)?\.(jpg|jpeg|png|gif|bmp|webp|svg)$/
          ),
          userAddress: expect.stringMatching(/^eth\|[a-fA-F0-9]{40}$/)
        }
      });
    });

    test("GetPool data", async () => {
      const poolData = new GetPoolDto(ETH_ClassKey, USDT_ClassKey, fee).signed(user.privateKey);
      const slot0 = await client.dexV3Contract.getSlot0(poolData);
      const getPoolDataRes = await client.dexV3Contract.getPoolData(poolData);

      // value slipped from 44.72136 to 44.70641518040332314986
      expect(getPoolDataRes.Data?.sqrtPrice.toString()).toEqual("44.70641518040332314986");
    });

    test("check the user position for token0Owed and token1Owed before the removal of liqudity", async () => {
      const pa = 1980,
        pb = 2020;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);
      const getPositionDto = new GetPositionDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        user.identityKey,
        ta,
        tb
      ).signed(user.privateKey);
      const position = await client.dexV3Contract.getPositions(getPositionDto);
      expect(position.Data).toMatchObject({
        feeGrowthInside0Last: "2.024297941798e-8",
        feeGrowthInside1Last: "0",
        liquidity: "26675.915083949831428038",
        tokensOwed0: "0.000540000000000178",
        tokensOwed1: "0"
      });
    });

    test("RemoveLiquidity", async () => {
      const pa = 1980,
        pb = 2020;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);
      const estimateDto = new BurnEstimateDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber("26675.915083949831428038"),
        ta,
        tb,
        user.identityKey
      );

      const dto = new BurnDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber("26675.915083949831428038"),
        ta,
        tb,
        new BigNumber("2.0"),
        new BigNumber("2747.8")
      );
      const removeLiqEstimation = await client.dexV3Contract.burnEstimate(estimateDto);
      const data = removeLiqEstimation.Data;

      if (data === undefined) throw new Error();

      expect(data.amount0.toString()).toBe("2.199399999999999999");
      expect(data.amount1.toString()).toBe("2747.996416927587744444");

      dto.sign(user.privateKey);
      const burnRes = await client.dexV3Contract.RemoveLiquidity(dto);
      expect(burnRes).toMatchObject({
        Status: 1,
        Data: {
          token0Balance: expect.objectContaining({
            additionalKey: "ETH",
            category: "new-category0",
            collection: "new-collection0",
            inUseHolds: [],
            instanceIds: [],
            lockedHolds: [],
            owner: expect.stringMatching(/^eth\|[a-fA-F0-9]{40}$/),
            type: "new-type0"
          }),
          token1Balance: expect.objectContaining({
            additionalKey: "USDT",
            category: "new-category0",
            collection: "new-collection0",
            inUseHolds: [],
            instanceIds: [],
            lockedHolds: [],
            owner: expect.stringMatching(/^eth\|[a-fA-F0-9]{40}$/),
            type: "new-type0"
          })
        }
      });
      const getPositionsDto = new GetUserPositionsDto(user.identityKey).signed(user.privateKey);
      const positions = await client.dexV3Contract.getUserPositions(getPositionsDto);
      expect(positions).toMatchObject({
        Status: 1,
        Data: expect.objectContaining({ nextBookMark: expect.anything(), positions: expect.anything() })
      });
    });

    test("check the user position for token0Owed after the removal of liqudity", async () => {
      const pa = 1980,
        pb = 2020;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, 10);
      const getPositionDto = new GetPositionDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        user.identityKey,
        ta,
        tb
      ).signed(user.privateKey);
      const position = await client.dexV3Contract.getPositions(getPositionDto);
      expect(position.Data).toBeUndefined();
    });

    test("collect Tokens0 and token1", async () => {
      const pa = 1980,
        pb = 2020;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);

      const dto = new CollectDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber("10"),
        new BigNumber("19106.858496401901029314"),
        ta,
        tb
      ).signed(user.privateKey);
      const poolVirtualAddress = `service|${ETH}_${USDT}_500`;
      const fetchBalanceDto = new FetchBalancesDto();
      fetchBalanceDto.owner = poolVirtualAddress;
      await client.dexV3Contract.collect(dto);
      await client.tokenContract.FetchBalances(fetchBalanceDto);
      const getPositionsDto = new GetUserPositionsDto(user.identityKey).signed(user.privateKey);
      const userPositions = await client.dexV3Contract.getUserPositions(getPositionsDto);
      expect(userPositions).toMatchObject({
        Status: 1,
        Data: {
          positions: {
            "new-collection0$new-category0$new-type0$ETH$new-collection0$new-category0$new-type0$USDT$3000": [
              {
                feeGrowthInside0Last: "0",
                feeGrowthInside1Last: "0",
                liquidity: "0.436872924385936373",
                tickLower: "74400",
                tickUpper: "75480",
                token0Img: "https://logosite.com/logos/ethereum-eth-logo.png",
                token0InstanceKey: {
                  additionalKey: "ETH",
                  category: "new-category0",
                  collection: "new-collection0",
                  instance: "0",
                  type: "new-type0"
                },
                token0Symbol: "ETH",
                token1Img: "https://logosite.com/logos/tether-usdt-logo.png",
                token1InstanceKey: {
                  additionalKey: "USDT",
                  category: "new-category0",
                  collection: "new-collection0",
                  instance: "0",
                  type: "new-type0"
                },
                token1Symbol: "USDT",
                tokensOwed0: "0",
                tokensOwed1: "0"
              },
              {
                feeGrowthInside0Last: "2.024297941798e-8",
                feeGrowthInside1Last: "0",
                liquidity: "0",
                tickLower: "75960",
                tickUpper: "76080",
                token0Img: "https://logosite.com/logos/ethereum-eth-logo.png",
                token0InstanceKey: {
                  additionalKey: "ETH",
                  category: "new-category0",
                  collection: "new-collection0",
                  instance: "0",
                  type: "new-type0"
                },
                token0Symbol: "ETH",
                token1Img: "https://logosite.com/logos/tether-usdt-logo.png",
                token1InstanceKey: {
                  additionalKey: "USDT",
                  category: "new-category0",
                  collection: "new-collection0",
                  instance: "0",
                  type: "new-type0"
                },
                token1Symbol: "USDT",
                tokensOwed0: "0.00054000000000017866144066378549332324",
                tokensOwed1: "0"
              }
            ]
          },
          nextBookMark: ""
        }
      });
    });

    test("check the user position for token0Owed after the removal of liqudity", async () => {
      const pa = 1980,
        pb = 2020;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, 10);
      const getPositionDto = new GetPositionDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        user.identityKey,
        ta,
        tb
      ).signed(user.privateKey);
      const positionRes = await client.dexV3Contract.getPositions(getPositionDto);
      expect(positionRes.Data).toBeUndefined();
    });
  });

  //////////// 1.0% //////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  /**
   * Let say we are creating a pair of ETH and USDT with token0 as ETH
   * with initial price as 1 ETH = 2000 USDT with fee 3000
   */
  describe("Create Pool with 1% fee", () => {
    const fee = 10000,
      initialSqrtPrice = new BigNumber("44.72136"),
      tickSpacing = feeAmountTickSpacing[fee];
    test("Create Pool with 1% fee", async () => {
      const dto = new CreatePoolDto(ETH_ClassKey, USDT_ClassKey, fee, initialSqrtPrice).signed(
        user.privateKey
      );
      const createPoolRes = await client.dexV3Contract.createPool(dto);
      expect(createPoolRes).toStrictEqual(transactionSuccess());
      const poolData = new GetPoolDto(ETH_ClassKey, USDT_ClassKey, fee).signed(user.privateKey);
      const slotDetails = await client.dexV3Contract.getSlot0(poolData);
      expect(slotDetails.Data?.sqrtPrice.toString()).toEqual(initialSqrtPrice.toString());
    });

    test("Checking for the expectedTokens to provide liquidity in the range of 1600 - 1900 range ", async () => {
      const pa = 1600,
        pb = 1900;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);
      const dto = new GetAddLiquidityEstimationDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber(1),
        ta,
        tb,
        false
      ).signed(user.privateKey);
      const result = await client.dexV3Contract.getAddLiquidityEstimation(dto);
      const data = result.Data;
      expect(data).toBeDefined();
      if (!data) throw new Error();
      expect(data.amount0.toString()).toEqual("0");
      expect(data.amount1.toString()).toEqual("1");
      expect(data.liquidity.toString()).toEqual("0.299901408704333964");
    });

    test("Checking for the expectedTokens to provide liquidity in the range of 1880 - 2220 range ", async () => {
      const pa = 1880,
        pb = 2220;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);
      const dto = new GetAddLiquidityEstimationDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber(1),
        ta,
        tb,
        true
      ).signed(user.privateKey);

      const result = await client.dexV3Contract.getAddLiquidityEstimation(dto);
      const data = result.Data;
      expect(data).toBeDefined();
      if (!data) throw new Error();
      expect(data.amount0.toString()).toEqual("1");
      expect(data.amount1.toString()).toEqual("1253.169150694844108754");
      expect(data.liquidity.toString()).toEqual("928.637339589079235191");
    });

    test("Checking for the expectedTokens to provide liquidity in the range of 2000 - 2200 range ", async () => {
      const pa = 2000,
        pb = 2200;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);

      const dto = new GetAddLiquidityEstimationDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber(1),
        ta,
        tb,
        true
      ).signed(user.privateKey);

      const result = await client.dexV3Contract.getAddLiquidityEstimation(dto);
      const data = result.Data;
      expect(data).toBeDefined();
      if (!data) throw new Error();
      expect(data.amount0.toString()).toEqual("1");
      expect(data.amount1.toString()).toEqual("0");
      expect(data.liquidity.toString()).toEqual("1527.486971963149328921");
    });

    test("Add liquidity in range 1600 - 1900", async () => {
      const pa = 1600,
        pb = 1900;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);
      const expectedTokenDTO = new GetAddLiquidityEstimationDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber(1),
        ta,
        tb,
        false
      ).signed(user.privateKey);
      const slippage = 0.5;
      const result = await client.dexV3Contract.getAddLiquidityEstimation(expectedTokenDTO);
      const data = result.Data;
      expect(data).toBeDefined();
      if (!data) throw new Error();
      const token0 = new BigNumber(data.amount0),
        token1 = new BigNumber(data.amount1),
        liquidity = new BigNumber(data.liquidity);
      expect(liquidity.toString()).toEqual("0.299901408704333964");

      const [token0Slipped, token1Slipped] = slippedValue([token0, token1], slippage);
      const dto = new AddLiquidityDTO(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        ta,
        tb,
        token0,
        token1,
        token0Slipped,
        token1Slipped
      ).signed(user.privateKey);
      await client.dexV3Contract.addLiquidity(dto);
      const getLiquidityDTO = new GetPoolDto(ETH_ClassKey, USDT_ClassKey, fee).signed(user.privateKey);

      const liq = await client.dexV3Contract.getLiquidity(getLiquidityDTO);
      expect(liq.Data?.liquidity.toString()).toBe("0");
    });

    test("Add liquidity in range 1880 - 2220", async () => {
      const pa = 1880,
        pb = 2220;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);
      const expectedTokenDTO = new GetAddLiquidityEstimationDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber(1),
        ta,
        tb,
        true
      ).signed(user.privateKey);
      const slippage = 0.5;

      const result = await client.dexV3Contract.getAddLiquidityEstimation(expectedTokenDTO);
      const data = result.Data;
      expect(data).toBeDefined();
      if (!data) throw new Error();
      const token0 = new BigNumber(data.amount0),
        token1 = new BigNumber(data.amount1),
        liquidity = new BigNumber(data.liquidity);
      expect(liquidity.toString()).toEqual("928.637339589079235191");
      const [token0Slipped, token1Slipped] = slippedValue([token0, token1], slippage);
      const dto = new AddLiquidityDTO(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        ta,
        tb,
        token0,
        token1,
        token0Slipped,
        token1Slipped
      ).signed(user.privateKey);
      await client.dexV3Contract.addLiquidity(dto);
      const getLiquidityDTO = new GetPoolDto(ETH_ClassKey, USDT_ClassKey, fee).signed(user.privateKey);

      const liq = await client.dexV3Contract.getLiquidity(getLiquidityDTO);
      expect(liq.Data?.liquidity.toString()).toBe("928.637339589079235191");
    });

    test("Add liquidity in range 2000 - 2200", async () => {
      const pa = 2000,
        pb = 2220;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);

      const expectedTokenDTO = new GetAddLiquidityEstimationDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber(1),
        ta,
        tb,
        true
      ).signed(user.privateKey);

      const slippage = 0.5;

      const result = await client.dexV3Contract.getAddLiquidityEstimation(expectedTokenDTO);
      const data = result.Data;
      expect(data).toBeDefined();
      if (!data) throw new Error();
      const token0 = new BigNumber(data.amount0),
        token1 = new BigNumber(data.amount1),
        liquidity = new BigNumber(data.liquidity);
      expect(liquidity.toString()).toBe("1151.323784674744885624");

      const [token0Slipped, token1Slipped] = slippedValue([token0, token1], slippage);
      const dto = new AddLiquidityDTO(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        ta,
        tb,
        token0,
        token1,
        token0Slipped,
        token1Slipped
      ).signed(user.privateKey);

      await client.dexV3Contract.addLiquidity(dto);

      const getLiquidityDTO = new GetPoolDto(ETH_ClassKey, USDT_ClassKey, fee).signed(user.privateKey);

      const liq = await client.dexV3Contract.getLiquidity(getLiquidityDTO);
      expect(liq.Data?.liquidity.toString()).toBe("928.637339589079235191");
    });

    test("slot0 data", async () => {
      const poolData = new GetPoolDto(ETH_ClassKey, USDT_ClassKey, fee).signed(user.privateKey);
      const slot0 = await client.dexV3Contract.getSlot0(poolData);
      // value slipped from 44.72136 to 44.67807328159716250969
      const getData = await client.dexV3Contract.getPoolData(poolData);
      // fee collected after swap
      expect(getData.Data?.feeGrowthGlobal0.toString()).toBe("0");
      expect(slot0.Data?.sqrtPrice.toString()).toEqual(initialSqrtPrice.toString());
    });

    test("RemoveLiquidity", async () => {
      const pa = 1880,
        pb = 2220;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);
      const estimateDto = new BurnEstimateDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber("928.637339589079235191"),
        ta,
        tb,
        user.identityKey
      );
      const dto = new BurnDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber("928.637339589079235191"),
        ta,
        tb,
        new BigNumber("1"),
        new BigNumber("1253.169150694844108753")
      );

      const removeLiqEstimation = await client.dexV3Contract.burnEstimate(estimateDto);
      const data = removeLiqEstimation.Data;
      if (data === undefined) throw new Error();

      expect(data.amount0.toString()).toBe("1");
      expect(data.amount1.toString()).toBe("1253.169150694844108753");

      dto.sign(user.privateKey);
      const burnRes = await client.dexV3Contract.RemoveLiquidity(dto);
      expect(burnRes).toMatchObject({
        Status: 1,
        Data: {
          token0Balance: expect.objectContaining({
            additionalKey: "ETH",
            category: "new-category0",
            collection: "new-collection0",
            inUseHolds: [],
            instanceIds: [],
            lockedHolds: [],
            owner: expect.stringMatching(/^eth\|[a-fA-F0-9]{40}$/),
            type: "new-type0"
          }),
          token1Balance: expect.objectContaining({
            additionalKey: "USDT",
            category: "new-category0",
            collection: "new-collection0",
            inUseHolds: [],
            instanceIds: [],
            lockedHolds: [],
            owner: expect.stringMatching(/^eth\|[a-fA-F0-9]{40}$/),
            type: "new-type0"
          })
        }
      });
      const getPositionsDto = new GetUserPositionsDto(user.identityKey).signed(user.privateKey);
      const positions = await client.dexV3Contract.getUserPositions(getPositionsDto);
      expect(positions).toMatchObject({
        Status: 1,
        Data: expect.objectContaining({ nextBookMark: expect.anything(), positions: expect.anything() })
      });
    });
  });
  describe("Increasing liquidity to pool", () => {
    const fee = 500;
    const tickSpacing = feeAmountTickSpacing[fee];
    test("Checking for the expectedTokens to provide liquidity in the range of 1700 - 1900 range ", async () => {
      const pa = 1700,
        pb = 1900;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);

      const dto = new GetAddLiquidityEstimationDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber(10),
        ta,
        tb,
        false
      ).signed(user.privateKey);

      const result = await client.dexV3Contract.getAddLiquidityEstimation(dto);
      const data = result.Data;
      expect(data).toBeDefined();
      if (!data) throw new Error();
      expect(data.amount0.toString()).toEqual("0");
      expect(data.amount1.toString()).toEqual("10");
      expect(data.liquidity.toString()).toEqual("4.249563923888253405");
    });

    test("Checking for the expectedTokens to provide liquidity in the range of 1980 - 2020 range", async () => {
      const pa = 1980,
        pb = 2020;
      const ta = Math.round(sqrtPriceToTick(new BigNumber(Math.sqrt(pa))) / 10) * 10,
        tb = Math.round(sqrtPriceToTick(new BigNumber(Math.sqrt(pb))) / 10) * 10;
      const dto = new GetAddLiquidityEstimationDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber(100),
        ta,
        tb,
        true
      ).signed(user.privateKey);

      const result = await client.dexV3Contract.getAddLiquidityEstimation(dto);
      const data = result.Data;
      expect(data).toBeDefined();
      if (!data) throw new Error();
      expect(data.amount0.toString()).toEqual("100");
      expect(data.amount1.toString()).toEqual("143060.356679853947733062");
      expect(data.liquidity.toString()).toEqual("768993.229675823772064336");
    });

    test("Checking for the expectedTokens to provide liquidity in the range of 2100 - 2200 range ", async () => {
      const pa = 2100,
        pb = 2200;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, 10);
      const dto = new GetAddLiquidityEstimationDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber(10),
        ta,
        tb,
        true
      ).signed(user.privateKey);

      const result = await client.dexV3Contract.getAddLiquidityEstimation(dto);
      const data = result.Data;
      expect(data).toBeDefined();
      if (!data) throw new Error();
      expect(data.amount0.toString()).toEqual("10");
      expect(data.amount1.toString()).toEqual("0");
      expect(data.liquidity.toString()).toEqual("20607.53664493334613554");
    });

    test("Add liquidity in range 1980 - 2020", async () => {
      const pa = 1980,
        pb = 2020;
      const ta = Math.round(sqrtPriceToTick(new BigNumber(Math.sqrt(pa))) / 10) * 10,
        tb = Math.round(sqrtPriceToTick(new BigNumber(Math.sqrt(pb))) / 10) * 10;

      const expectedTokenDTO = new GetAddLiquidityEstimationDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber(100),
        ta,
        tb,
        true
      ).signed(user.privateKey);

      const slippage = 0.5;

      const result = await client.dexV3Contract.getAddLiquidityEstimation(expectedTokenDTO);
      const data = result.Data;
      expect(data).toBeDefined();
      if (!data) throw new Error();
      const token0 = new BigNumber(data.amount0),
        token1 = new BigNumber(data.amount1),
        liquidity = new BigNumber(data.liquidity);
      expect(liquidity.toString()).toBe("768993.229675823772064336");

      const [token0Slipped, token1Slipped] = slippedValue([token0, token1], slippage);
      const dto = new AddLiquidityDTO(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        ta,
        tb,
        token0,
        token1,
        token0Slipped,
        token1Slipped
      ).signed(user.privateKey);
      const addLiqRes = await client.dexV3Contract.addLiquidity(dto);
      expect(addLiqRes.Data).toMatchObject({
        amounts: [new BigNumber("100"), new BigNumber("143060.356679853947733061")],
        userBalanceDelta: {
          token0Balance: {
            additionalKey: "ETH",
            category: "new-category0",
            collection: "new-collection0",
            inUseHolds: [],
            instanceIds: [],
            lockedHolds: [],
            owner: expect.stringMatching(/^eth\|[a-fA-F0-9]{40}$/),
            quantity: "99999896.8",
            type: "new-type0"
          },
          token1Balance: {
            additionalKey: "USDT",
            category: "new-category0",
            collection: "new-collection0",
            inUseHolds: [],
            instanceIds: [],
            lockedHolds: [],
            owner: expect.stringMatching(/^eth\|[a-fA-F0-9]{40}$/),
            quantity: "99852543.846247174107773938",
            type: "new-type0"
          }
        }
      });
    });

    test("Add liquidity in range 2100 - 2200", async () => {
      const pa = 1980,
        pb = 2020;
      const ta = Math.round(sqrtPriceToTick(new BigNumber(Math.sqrt(pa))) / 10) * 10,
        tb = Math.round(sqrtPriceToTick(new BigNumber(Math.sqrt(pb))) / 10) * 10;

      const expectedTokenDTO = new GetAddLiquidityEstimationDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber(1),
        ta,
        tb,
        true
      ).signed(user.privateKey);

      const slippage = 0.5;

      const result = await client.dexV3Contract.getAddLiquidityEstimation(expectedTokenDTO);
      const data = result.Data;
      expect(data).toBeDefined();
      if (!data) throw new Error();
      const token0 = new BigNumber(data.amount0),
        token1 = new BigNumber(data.amount1),
        liquidity = new BigNumber(data.liquidity);
      expect(liquidity.toString()).toBe("7689.932296758237720643");
      const [token0Slipped, token1Slipped] = slippedValue([token0, token1], slippage);
      const dto = new AddLiquidityDTO(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        ta,
        tb,
        token0,
        token1,
        token0Slipped,
        token1Slipped
      ).signed(user.privateKey);

      const poolVirtualAddress = "service|ETH_USDT_500";

      const fetchBalanceDto = new FetchBalancesDto();
      fetchBalanceDto.owner = poolVirtualAddress;
      await client.tokenContract.FetchBalances(fetchBalanceDto);
      const fetchBalanceDtouser = new FetchBalancesDto();
      fetchBalanceDtouser.owner = user.identityKey;
      await client.tokenContract.FetchBalances(fetchBalanceDtouser);

      await client.dexV3Contract.addLiquidity(dto);

      const getLiquidityDTO = new GetPoolDto(ETH_ClassKey, USDT_ClassKey, fee).signed(user.privateKey);

      const liq = await client.dexV3Contract.getLiquidity(getLiquidityDTO);
      expect(liq.Data?.liquidity.toString()).toBe("776683.161972582009784974");
    });

    test("Swaping case 1", async () => {
      /**
       * Estimate out was '50', '-99732.3746901'
       *
       * USER
       * before
       * ETH :  99999889
       * USDT:  99866910.096615645588509671
       * after
       * ETH : 99999839
       * USDT: 99767177.721925532740521664
       *
       * POOL
       * before
       * ETH : 111
       * USDT: 232822.278074467259478336
       * after
       * ETH : 161
       * USDT: 133089.903384354411490329
       */

      const dto = new SwapDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber(50),
        true,
        new BigNumber(40)
      ).signed(user.privateKey);
      const swapRes = await client.dexV3Contract.swap(dto);
      expect(swapRes.Data).toMatchObject({
        amount0: "50.000000000000000000",
        amount1: "-99470.652941823282562844",
        timeStamp: expect.any(Number),
        token0: "ETH",
        token0ImageUrl: expect.stringMatching(
          /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d{1,5})?(\/[^\s]*)?\.(jpg|jpeg|png|gif|bmp|webp|svg)$/
        ),
        token1: "USDT",
        token1ImageUrl: expect.stringMatching(
          /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d{1,5})?(\/[^\s]*)?\.(jpg|jpeg|png|gif|bmp|webp|svg)$/
        ),
        userAddress: expect.stringMatching(/^eth\|[a-fA-F0-9]{40}$/)
      });
    });

    test("Increasing liquidity to pool: slot0 data Incresing liquidity", async () => {
      const poolData = new GetPoolDto(ETH_ClassKey, USDT_ClassKey, fee).signed(user.privateKey);
      const slot0 = await client.dexV3Contract.getSlot0(poolData);
      // value slipped from 44.72136 to 44.55000219957551475027
      const getData = await client.dexV3Contract.getPoolData(poolData);
      // fee collected after swap
      expect(getData.Data?.feeGrowthGlobal0.toString()).toBe("3.872316637615e-8");
      expect(slot0.Data?.sqrtPrice.toString()).toEqual("44.55000219957551475027");
    });
  });

  describe("Create Pool with 0.05% fee with adding liquidity with intial price 2000 with protocol fees", () => {
    const fee = 500,
      initialSqrtPrice = new BigNumber("44.72136");
    const tickSpacing = feeAmountTickSpacing[fee];
    const protocolFees = 0.5,
      newProtocolFee = 0.3;

    describe("Configure and fetch Platform fee", () => {
      test("It will revert if none of the input field are present", async () => {
        const configPlatformFeeAddressDTO = new ConfigureDexFeeAddressDto();
        configPlatformFeeAddressDTO.newAuthorities = [];

        configPlatformFeeAddressDTO.sign(authorityUser.privateKey);
        const configRes = await client.dexV3Contract.configureDexFeeAddress(configPlatformFeeAddressDTO);
        expect(configRes.Status).toEqual(0);
        expect(configRes.Message).toEqual("At least one user should be defined to provide access");
      });
      test("It should add address to authorities", async () => {
        const configPlatformFeeAddressDTO = new ConfigureDexFeeAddressDto();
        configPlatformFeeAddressDTO.newAuthorities = [authorityUser.identityKey];

        configPlatformFeeAddressDTO.sign(authorityUser.privateKey);
        const configRes = await client.dexV3Contract.configureDexFeeAddress(configPlatformFeeAddressDTO);
        expect(configRes.Status).toEqual(1);
      });
    });

    describe("Change Dex Protocol fees", () => {
      test("Should throw error while changing fee by unauthorized person", async () => {
        const dto = new SetProtocolFeeDto(newProtocolFee).signed(user.privateKey);
        const setFeeResponse = await client.dexV3Contract.setProtocolFee(dto);
        expect(setFeeResponse.Message).toBe(
          `CallingUser ${user.identityKey} is not authorized to create or update`
        );
      });

      test("Should change the dex protocol fee", async () => {
        const dto = new SetProtocolFeeDto(newProtocolFee).signed(authorityUser.privateKey);
        const setFeeResponse = await client.dexV3Contract.setProtocolFee(dto);
        expect(setFeeResponse.Data?.protocolFee).toBe(0.3);
      });

      test("Should get the dex protocol fee", async () => {
        const dto: ChainCallDTO = new ChainCallDTO();
        dto.sign(authorityUser.privateKey);
        const getFeeResponse = await client.dexV3Contract.getDexConfig(dto);
        expect(getFeeResponse.Data?.protocolFee).toBe(0.3);
      });
    });

    test("Should create Pool with 0.05% fee", async () => {
      const dto = new CreatePoolDto(ETH_ClassKey, USDC_ClassKey, fee, initialSqrtPrice, protocolFees).signed(
        user.privateKey
      );
      const createPoolRes = await client.dexV3Contract.createPool(dto);
      expect(createPoolRes).toStrictEqual(transactionSuccess());
    });

    test("should Read details from pool", async () => {
      const poolDataDTO = new GetPoolDto(ETH_ClassKey, USDC_ClassKey, fee).signed(user.privateKey);
      const pool = await client.dexV3Contract.getPoolData(poolDataDTO);
      expect(pool.Data?.sqrtPrice).toEqual(initialSqrtPrice);
    });

    test("Add liquidity in range 1980 - 2020", async () => {
      const pa = 1980,
        pb = 2020;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);
      const expectedTokenDTO = new GetAddLiquidityEstimationDto(
        ETH_ClassKey,
        USDC_ClassKey,
        fee,
        new BigNumber(10),
        ta,
        tb,
        true
      ).signed(user.privateKey);
      const slippage = 0.5;
      const result = await client.dexV3Contract.getAddLiquidityEstimation(expectedTokenDTO);
      const data = result.Data;
      expect(data).toBeDefined();
      if (!data) throw new Error();
      const token0 = new BigNumber(data.amount0),
        token1 = new BigNumber(data.amount1),
        liquidity = new BigNumber(data.liquidity);
      const [token0Slipped, token1Slipped] = slippedValue([token0, token1], slippage);
      const dto = new AddLiquidityDTO(
        ETH_ClassKey,
        USDC_ClassKey,
        fee,
        ta,
        tb,
        token0,
        token1,
        token0Slipped,
        token1Slipped
      ).signed(user.privateKey);
      await client.dexV3Contract.addLiquidity(dto);
      const getLiquidityDTO = new GetPoolDto(ETH_ClassKey, USDC_ClassKey, fee).signed(user.privateKey);
      const liq = await client.dexV3Contract.getLiquidity(getLiquidityDTO);
      expect(Number(liq.Data?.liquidity)).toBeCloseTo(Number(liquidity.toString()));
    });

    test("should estimate swap", async () => {
      const amountToSwap = new BigNumber(2),
        sqrtPriceLimit = new BigNumber(5);
      const dto = new SwapDto(ETH_ClassKey, USDC_ClassKey, fee, amountToSwap, true, sqrtPriceLimit).signed(
        user.privateKey
      );
      const expectSwapRes = await client.dexV3Contract.quoteExactAmount(dto);
      const result = expectSwapRes.Data;

      expect(result?.amount0).toEqual(new BigNumber("2"));
      expect(result?.amount1).toEqual(new BigNumber("-3994.130334466043470346"));
      expect(result?.currentSqrtPrice).toEqual(new BigNumber("44.72136"));
      expect(result?.newSqrtPrice).toEqual(new BigNumber("44.678073281597162509"));
    });

    test("should estimate swap for exact out", async () => {
      const amountToSwap = new BigNumber("-0.003"),
        sqrtPriceLimit = new BigNumber(5000);
      const dto = new SwapDto(ETH_ClassKey, USDC_ClassKey, fee, amountToSwap, false, sqrtPriceLimit).signed(
        user.privateKey
      );
      const quoteExactResponse = await client.dexV3Contract.quoteExactAmount(dto);
      expect(quoteExactResponse.Data).toMatchObject({
        amount0: new BigNumber("-0.003"),
        amount1: new BigNumber("6.003010350022664756"),
        currentSqrtPrice: new BigNumber("44.72136"),
        newSqrtPrice: new BigNumber("44.721425025592940791")
      });
    });

    test("should swap with changing sqrtPrice", async () => {
      const amountToSwap = new BigNumber(2),
        sqrtPriceLimit = new BigNumber(5);

      const dto = new SwapDto(ETH_ClassKey, USDC_ClassKey, fee, amountToSwap, true, sqrtPriceLimit).signed(
        user.privateKey
      );
      const swapRes = await client.dexV3Contract.swap(dto);
      expect(swapRes).toMatchObject({
        Status: 1,
        Data: {
          amount0: "2.000000000000000000",
          amount1: "-3994.130334466043470347",
          timeStamp: expect.anything(),
          token0: "ETH",
          token0ImageUrl: expect.stringMatching(
            /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d{1,5})?(\/[^\s]*)?\.(jpg|jpeg|png|gif|bmp|webp|svg)$/
          ),
          token1: "USDC",
          token1ImageUrl: expect.stringMatching(
            /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d{1,5})?(\/[^\s]*)?\.(jpg|jpeg|png|gif|bmp|webp|svg)$/
          ),
          userAddress: expect.stringMatching(/^eth\|[a-fA-F0-9]{40}$/)
        }
      });
    });

    test("state changes after first swap with protocol fees", async () => {
      const poolData = new GetPoolDto(ETH_ClassKey, USDC_ClassKey, fee).signed(user.privateKey);
      const getData = await client.dexV3Contract.getPoolData(poolData);
      // fee collected after swap
      expect(getData.Data?.feeGrowthGlobal0.toString()).toBe("7.58630799314e-9");
      expect(getData.Data?.protocolFeesToken0.toString()).toBe("0.000300000000000000108");
    });

    test("state changes after first swap with protocol fees", async () => {
      const poolData = new GetPoolDto(ETH_ClassKey, USDC_ClassKey, fee).signed(user.privateKey);
      const getData = await client.dexV3Contract.getPoolData(poolData);
      // fee collected after swap
      expect(getData.Data?.feeGrowthGlobal0.toString()).toBe("7.58630799314e-9");
      expect(getData.Data?.protocolFeesToken0.toString()).toBe("0.000300000000000000108");
    });

    test("collect protocol fees", async () => {
      const dto = new CollectTradingFeesDto(ETH_ClassKey, USDC_ClassKey, fee, user.identityKey).signed(
        user.privateKey
      );
      const collectResponse = await client.dexV3Contract.collectTradingFees(dto);
      expect(collectResponse.Status).toBe(0);
      expect(collectResponse.ErrorKey).toBe("UNAUTHORIZED");
    });

    test("collect protocol fees by auth user", async () => {
      const dto = new CollectTradingFeesDto(ETH_ClassKey, USDC_ClassKey, fee, user.identityKey).signed(
        authorityUser.privateKey
      );
      const collectResponse = await client.dexV3Contract.collectTradingFees(dto);
      expect(collectResponse.Data).toMatchObject({
        protocolFeesToken0: new BigNumber("0.0003"),
        protocolFeesToken1: new BigNumber("0")
      });
    });

    test("state changes after first swap with protocol fees", async () => {
      const poolData = new GetPoolDto(ETH_ClassKey, USDC_ClassKey, fee).signed(user.privateKey);
      const getData = await client.dexV3Contract.getPoolData(poolData);
      // fee collected after swap
      expect(getData.Data?.feeGrowthGlobal0.toString()).toBe("7.58630799314e-9");
      expect(getData.Data?.protocolFeesToken0.toString()).toBe("0");
    });

    describe("Configurable Batch Limit", () => {
      test("Set new NFT Batch Limit", async () => {
        //Given

        const newBatchLimitDto = new DexNftBatchLimitDto();
        newBatchLimitDto.newMaxSupply = new BigNumber(3);
        newBatchLimitDto.sign(user.privateKey);

        //When

        const setRes = await client.dexV3Contract.configureDexNftBatchLimit(newBatchLimitDto);

        //Then

        expect(setRes.Data?.maxSupply.toString()).toEqual("3");
      });

      test("Get the current batch limit", async () => {
        //Given
        const batchLimitDto = new ChainCallDTO();
        batchLimitDto.sign(user.privateKey);

        //When

        const getBatchLimitRes = await client.dexV3Contract.fetchDexNftBatchLimit(batchLimitDto);

        //Then

        expect(getBatchLimitRes.Data?.maxSupply.toString()).toEqual("3");
      });

      test("New pools created from this point on should mint Nft batch limit number of NFTs", async () => {
        // Given
        const dto = new CreatePoolDto(SOL_ClassKey, USDT_ClassKey, fee, initialSqrtPrice).signed(
          user.privateKey
        );
        const createPoolRes = await client.dexV3Contract.createPool(dto);
        const poolAlias = createPoolRes.Data?.getPoolAlias();
        const fetchBalancesDto = new FetchBalancesDto();
        fetchBalancesDto.owner = poolAlias;

        // When
        const batchNfts = await client.tokenContract.FetchBalances(fetchBalancesDto);

        // Then
        expect(batchNfts.Data?.[0].getNftInstanceCount()).toEqual(3);
      });
    });
  });

  async function checkBalanceOfPool(token0: string, token1: string, fee: number) {
    const poolVirtualAddress = `service|${token0}_${token1}_${fee}`;
    const fetchBalanceDto = new FetchBalancesDto();
    fetchBalanceDto.owner = poolVirtualAddress;

    return await client.tokenContract.FetchBalances(fetchBalanceDto);
  }
});

interface TokenContractAPI {
  CreateToken(dto: CreateTokenClassDto): Promise<GalaChainResponse<TokenClassKey>>;
  MintToken(dto: MintTokenDto): Promise<GalaChainResponse<TokenInstanceKey[]>>;
  GrantAllowance(dto: GrantAllowanceDto): Promise<GalaChainResponse<TokenAllowance[]>>;
  MintTokenWithAllowance(dto: MintTokenWithAllowanceDto): Promise<GalaChainResponse<TokenInstanceKey[]>>;
  FetchBalances(dto: FetchBalancesDto): Promise<GalaChainResponse<TokenBalance[]>>;
  TransferToken(dto: TransferTokenDto): Promise<GalaChainResponse<TokenBalance[]>>;
}

function tokenContractAPI(client: ChainClient): TokenContractAPI & CommonContractAPI {
  return {
    ...commonContractAPI(client),

    CreateToken(dto: CreateTokenClassDto) {
      return client.submitTransaction<TokenClassKey>("CreateTokenClass", dto, TokenClassKey);
    },

    FetchBalances(dto: FetchBalancesDto) {
      return client.evaluateTransaction<TokenBalance[]>("FetchBalances", dto, TokenBalance);
    },

    MintToken(dto: MintTokenDto) {
      return client.submitTransaction<TokenInstanceKey[]>("MintToken", dto, TokenInstanceKey);
    },

    GrantAllowance(dto: GrantAllowanceDto) {
      return client.submitTransaction<TokenAllowance[]>("GrantAllowance", dto, TokenAllowance);
    },

    MintTokenWithAllowance(dto: MintTokenWithAllowanceDto) {
      return client.submitTransaction<TokenInstanceKey[]>("MintTokenWithAllowance", dto, TokenInstanceKey);
    },

    TransferToken(dto: TransferTokenDto) {
      return client.submitTransaction<TokenBalance[]>("TransferToken", dto, TokenBalance);
    }
  };
}

interface DexV3ContractAPI {
  createPool(dto: CreatePoolDto): Promise<GalaChainResponse<Pool>>;
  addLiquidity(dto: AddLiquidityDTO): Promise<GalaChainResponse<AddLiquidityResDto>>;
  swap(dto: SwapDto): Promise<GalaChainResponse<SwapResDto>>;
  RemoveLiquidity(dto: BurnDto): Promise<GalaChainResponse<UserBalanceResDto>>;
  getLiquidity(dto: GetPoolDto): Promise<GalaChainResponse<GetLiquidityResDto>>;
  getPositions(dto: GetPositionDto): Promise<GalaChainResponse<GetPositionResDto>>;
  getPositionWithNftId(dto: GetPositionWithNftIdDto): Promise<GalaChainResponse<GetPositionResDto>>;
  getSlot0(dto: GetPoolDto): Promise<GalaChainResponse<Slot0ResDto>>;
  getUserPositions(dto: GetUserPositionsDto): Promise<GalaChainResponse<GetUserPositionsResDto>>;
  getAddLiquidityEstimation(
    dto: GetAddLiquidityEstimationDto
  ): Promise<GalaChainResponse<GetAddLiquidityEstimationResDto>>;
  quoteExactAmount(dto: QuoteExactAmountDto): Promise<GalaChainResponse<QuoteExactAmountResDto>>;
  getPoolData(dto: GetPoolDto): Promise<GalaChainResponse<Pool>>;
  burnEstimate(dto: BurnEstimateDto): Promise<GalaChainResponse<GetRemoveLiqEstimationResDto>>;
  collect(dto: CollectDto): Promise<GalaChainResponse<UserBalanceResDto>>;
  collectTradingFees(dto: CollectTradingFeesDto): Promise<GalaChainResponse<CollectTradingFeesResDto>>;
  setProtocolFee(dto: SetProtocolFeeDto): Promise<GalaChainResponse<SetProtocolFeeResDto>>;
  configureDexFeeAddress(dto: ConfigureDexFeeAddressDto): Promise<GalaChainResponse<DexFeeConfig>>;
  getDexConfig(dto: ChainCallDTO): Promise<GalaChainResponse<DexFeeConfig>>;
  fetchDexNftBatchLimit(dto: ChainCallDTO): Promise<GalaChainResponse<DexNftBatchLimit>>;
  configureDexNftBatchLimit(dto: DexNftBatchLimitDto): Promise<GalaChainResponse<DexNftBatchLimit>>;
}

function dexV3ContractAPI(client: ChainClient): DexV3ContractAPI & CommonContractAPI {
  return {
    ...commonContractAPI(client),
    createPool(dto: CreatePoolDto) {
      return client.submitTransaction<Pool>("CreatePool", dto, Pool);
    },
    getPoolData(dto: GetPoolDto) {
      return client.evaluateTransaction<Pool>("GetPoolData", dto, Pool);
    },
    addLiquidity(dto: AddLiquidityDTO) {
      return client.submitTransaction<AddLiquidityResDto>("AddLiquidity", dto, AddLiquidityResDto);
    },
    swap(dto: SwapDto) {
      return client.submitTransaction<SwapResDto>("Swap", dto, SwapResDto);
    },
    RemoveLiquidity(dto: BurnDto) {
      return client.submitTransaction<UserBalanceResDto>("RemoveLiquidity", dto, UserBalanceResDto);
    },
    burnEstimate(dto: BurnEstimateDto) {
      GalaChainResponse<GetRemoveLiqEstimationResDto>;
      return client.evaluateTransaction<GetRemoveLiqEstimationResDto>(
        "GetRemoveLiquidityEstimation",
        dto,
        GetRemoveLiqEstimationResDto
      );
    },
    getSlot0(dto: GetPoolDto) {
      return client.evaluateTransaction<Slot0ResDto>("GetSlot0", dto, Slot0ResDto);
    },
    getLiquidity(dto: GetPoolDto) {
      return client.evaluateTransaction<GetLiquidityResDto>("GetLiquidity", dto, GetLiquidityResDto);
    },
    getPositions(dto: GetPositionDto) {
      return client.evaluateTransaction<GetPositionResDto>("GetPositions", dto, GetPositionResDto);
    },
    getPositionWithNftId(dto: GetPositionWithNftIdDto) {
      return client.evaluateTransaction<GetPositionResDto>("GetPositionWithNftId", dto, GetPositionResDto);
    },
    getUserPositions(dto: GetUserPositionsDto) {
      return client.evaluateTransaction<GetUserPositionsResDto>(
        "GetUserPositions",
        dto,
        GetUserPositionsResDto
      );
    },
    getAddLiquidityEstimation(dto: GetAddLiquidityEstimationDto) {
      return client.evaluateTransaction<GetAddLiquidityEstimationResDto>(
        "GetAddLiquidityEstimation",
        dto,
        GetAddLiquidityEstimationResDto
      );
    },
    quoteExactAmount(dto: QuoteExactAmountDto) {
      return client.evaluateTransaction<QuoteExactAmountResDto>(
        "QuoteExactAmount",
        dto,
        QuoteExactAmountResDto
      );
    },
    collect(dto: CollectDto) {
      return client.submitTransaction<UserBalanceResDto>("CollectPositionFees", dto, UserBalanceResDto);
    },
    collectTradingFees(dto: CollectTradingFeesDto) {
      return client.submitTransaction<CollectTradingFeesResDto>(
        "CollectTradingFees",
        dto,
        CollectTradingFeesResDto
      );
    },
    setProtocolFee(dto: SetProtocolFeeDto) {
      return client.submitTransaction<SetProtocolFeeResDto>("SetProtocolFee", dto, SetProtocolFeeResDto);
    },
    configureDexFeeAddress(dto: ConfigureDexFeeAddressDto) {
      return client.submitTransaction<DexFeeConfig>("ConfigureDexFeeAddress", dto, DexFeeConfig);
    },
    getDexConfig(dto: ChainCallDTO) {
      return client.evaluateTransaction<DexFeeConfig>("GetDexFeeConfigration", dto, DexFeeConfig);
    },
    fetchDexNftBatchLimit(dto: ChainCallDTO) {
      return client.evaluateTransaction<DexNftBatchLimit>("FetchDexNftBatchLimit", dto, DexNftBatchLimit);
    },
    configureDexNftBatchLimit(dto: DexNftBatchLimitDto) {
      return client.submitTransaction<DexNftBatchLimit>("ConfigureDexNftBatchLimit", dto, DexNftBatchLimit);
    }
  };
}

function slippedValue(val: BigNumber[], slippage: BigNumber | number) {
  if (typeof slippage === "number" || typeof slippage === "string") {
    slippage = new BigNumber(slippage);
  }
  const hundred = new BigNumber(100);
  return val.map((e) => e.multipliedBy(hundred.minus(slippage)).dividedBy(hundred));
}

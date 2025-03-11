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
  ChainCallDTO,
  CollectDto,
  CollectTradingFeesDto,
  CollectTradingFeesResDto,
  ConfigureDexFeeAddressDto,
  CreatePoolDto,
  CreateTokenClassDto,
  DexFeeConfig,
  FetchBalancesDto,
  GalaChainResponse,
  GetAddLiquidityEstimationDto,
  GetAddLiquidityEstimationResDto,
  GetLiquidityResDto,
  GetPoolDto,
  GetPositionDto,
  GetPositionResDto,
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
  UserBalanceResDto,
  feeAmountTickSpacing,
  sqrtPriceToTick
} from "@gala-chain/api";
import { ChainClient, ChainUser, CommonContractAPI, commonContractAPI } from "@gala-chain/client";
import { AdminChainClients, TestClients, transactionSuccess } from "@gala-chain/test";
import BigNumber from "bignumber.js";

import TOKENS, { ETH_ClassKey, USDC_ClassKey, USDT_ClassKey } from "./tokens";

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
          balance.getQuantityTotal = function (): BigNumber {
            return this.quantity;
          };
          const balanceN = balance.getQuantityTotal();
          expect(balanceN).toEqual(GENERAL.MINT_QUANTITY.toString());
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
      expect(poolData.Data?.sqrtPrice).toEqual(initialSqrtPrice.toString());
      expect(slot0.Data?.sqrtPrice).toEqual(initialSqrtPrice.toString());
    });

    test("should throw error when tried adding liquidity below the min tick", async () => {
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

      const result = await client.dexV3Contract.addLiquidity(dto);

      expect(result.Message).toBe("Lower Tick is less than Min Tick");
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
      expect(result.Message).toBe("Upper Tick is greater than Max Tick");
    });

    test("should throw error when  tick lower tick is greater than upper tick", async () => {
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
      expect(result.Message).toBe("Lower Tick is greater than Upper Tick");
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
      expect(data?.amount0.toString()).toEqual("0");
      expect(data?.amount1.toString()).toEqual("1");
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
      expect(data?.amount0).toEqual("10");
      expect(data?.amount1).toEqual("19106.858496401901029315");
      expect(data?.liquidity).toEqual("92271.497628802094407218");
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

      expect(data?.amount0).toEqual("1");
      expect(data?.amount1).toEqual("0");
      expect(data?.liquidity).toEqual("2060.753664493334613554");
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
          amounts: ["0", "0.999999999999999998"]
        }
      });
      const getLiquidityDTO = new GetPoolDto(ETH_ClassKey, USDT_ClassKey, fee).signed(user.privateKey);
      const liq = await client.dexV3Contract.getLiquidity(getLiquidityDTO);

      // As we have provided our first liquidity outside the range then the global liquidity must be equal to zero
      expect(liq.Data?.liquidity).toEqual("0");
    });

    test("should test for liquidity", async () => {
      const getLiquidityDTO = new GetPoolDto(ETH_ClassKey, USDT_ClassKey, fee).signed(user.privateKey);
      const liq = await client.dexV3Contract.getLiquidity(getLiquidityDTO);

      // As we have provided our first liquidity outside the range then the global liquidity must be equal to zero
      expect(liq.Data?.liquidity).toEqual("0");
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
      expect(liq.Data?.liquidity).toEqual("92271.497628802094407217");
    });

    test("should Read details from slot0", async () => {
      const poolDataDTO = new GetPoolDto(ETH_ClassKey, USDT_ClassKey, fee).signed(user.privateKey);
      const slot0 = await client.dexV3Contract.getSlot0(poolDataDTO);
      const poolData = await client.dexV3Contract.getPoolData(poolDataDTO);
      expect(poolData.Data?.sqrtPrice).toEqual(initialSqrtPrice.toString());
      expect(slot0.Data?.sqrtPrice).toEqual(initialSqrtPrice.toString());
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
      expect(result.amount0).toBe("2");
      expect(result.amount1).toBe("-3994.130334466043470346");
      expect(result.currentSqrtPrice).toBe("44.72136");
      expect(result.newSqrtPrice).toBe("44.678073281597162509");
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
        amount0: "-0.003",
        amount1: "6.003010350022664756",
        currentSqrtPrice: "44.72136",
        newSqrtPrice: "44.721425025592940791"
      });
    });

    test("should  throw error while estimating swap for buy", async () => {
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
      expect(getData.Data?.feeGrowthGlobal0).toBe("0.00000000975382456261");
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
      expect(liquidityRes.Message).toContain("Slippage check Failed");
    });

    test("slot0 data", async () => {
      const poolData = new GetPoolDto(ETH_ClassKey, USDT_ClassKey, fee).signed(user.privateKey);
      const slot0 = await client.dexV3Contract.getSlot0(poolData);
      // value slipped from 44.72136 to 44.67807328159716250969
      const getData = await client.dexV3Contract.getPoolData(poolData);
      // fee collected after swap
      expect(getData.Data?.feeGrowthGlobal0).toBe("0.00000000975382456261");
      expect(slot0.Data?.sqrtPrice).toEqual("44.67807328159716250969");
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
        owner: expect.stringMatching(/^eth\|[a-fA-F0-9]{40}$/),
        tokensOwed0: "0.00090000000000062",
        tokensOwed1: "0"
      });
    });

    test("check the user position for token0Owed and token1Owed before the removal of liqudity", async () => {
      const getPositionsDto = new GetUserPositionsDto(user.identityKey, 1, 1).signed(user.privateKey);
      const positions = await client.dexV3Contract.getUserPositions(getPositionsDto);
      expect(positions).toMatchObject({
        Status: 1,
        Data: expect.objectContaining({ totalCount: expect.anything(), positions: expect.anything() })
      });
    });

    test("Remove liquidity", async () => {
      const tickSpacing = feeAmountTickSpacing[fee];
      const pa = 1980,
        pb = 2020;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);

      const dto = new BurnDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber("92271.497628802094407217"),
        ta,
        tb,
        user.identityKey
      );
      const removeLiqEstimation = await client.dexV3Contract.burnEstimate(dto);
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
            quantity: "99999998.999",
            type: "new-type0"
          }),
          token1Balance: expect.objectContaining({
            additionalKey: "USDT",
            category: "new-category0",
            collection: "new-collection0",
            quantity: "99999999.000000000000000004",
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
        Data: expect.objectContaining({ totalCount: expect.anything(), positions: expect.anything() })
      });
    });

    test("Removing liquidity more than in the position will throw an error", async () => {
      const tickSpacing = feeAmountTickSpacing[fee];
      const pa = 1980,
        pb = 2020;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);

      const dto = new BurnDto(
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
        owner: expect.stringMatching(/^eth\|[a-fA-F0-9]{40}$/),
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
      expect(slot0.Data?.sqrtPrice).toEqual(initialSqrtPrice.toString());
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
      expect(data.amount0).toEqual("0");
      expect(data.amount1).toEqual("1");
      expect(data.liquidity).toEqual("0.436872924385936373");
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
      expect(data.amount0).toEqual("1");
      expect(data.amount1).toEqual("1573.331577716744383555");
      expect(data.liquidity).toEqual("13337.957541974915714025");
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
      expect(data.amount0).toEqual("1");
      expect(data.amount1).toEqual("0");
      expect(data.liquidity).toEqual("2576.605678369885528483");
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
      expect(liq.Data?.liquidity).toBe("0");
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
          amounts: ["1", "1573.331577716744383554"]
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
      expect(liqRes.Data?.liquidity).toBe("26675.915083949831428038");
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
      expect(getPoolDataRes.Data?.sqrtPrice).toEqual("44.70641518040332314986");
      expect(slot0.Data?.sqrtPrice).toEqual("44.70641518040332314986");
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
        owner: expect.stringMatching(/^eth\|[a-fA-F0-9]{40}$/),
        tokensOwed0: "0.000540000000000178",
        tokensOwed1: "0"
      });
    });

    test("RemoveLiquidity", async () => {
      const pa = 1980,
        pb = 2020;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);
      const dto = new BurnDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber("26675.915083949831428038"),
        ta,
        tb,
        user.identityKey
      );

      const removeLiqEstimation = await client.dexV3Contract.burnEstimate(dto);
      const data = removeLiqEstimation.Data;

      if (data === undefined) throw new Error();

      expect(data.amount0).toBe("2.199399999999999999");
      expect(data.amount1).toBe("2747.996416927587744444");

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
        Data: expect.objectContaining({ totalCount: expect.anything(), positions: expect.anything() })
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
        Data: expect.objectContaining({
          totalCount: 4,
          positions: expect.objectContaining({
            "new-collection0$new-category0$new-type0$ETH_new-collection0$new-category0$new-type0$USDT_3000": [
              {
                liquidity: "0.436872924385936373",
                tickLower: 74400,
                tickUpper: 75480,
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
                token1Symbol: "USDT"
              },
              {
                liquidity: "0",
                tickLower: 75960,
                tickUpper: 76080,
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
                token1Symbol: "USDT"
              }
            ],
            "new-collection0$new-category0$new-type0$ETH_new-collection0$new-category0$new-type0$USDT_500": [
              {
                liquidity: "0.42495639238882534",
                tickLower: 74390,
                tickUpper: 75500,
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
                token1Symbol: "USDT"
              },
              {
                liquidity: "2060.753664493334613554",
                tickLower: 76510,
                tickUpper: 76960,
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
                token1Symbol: "USDT"
              }
            ]
          })
        })
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
      expect(slotDetails.Data?.sqrtPrice).toEqual(initialSqrtPrice.toString());
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
      expect(data.amount0).toEqual("0");
      expect(data.amount1).toEqual("1");
      expect(data.liquidity).toEqual("0.299901408704333964");
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
      expect(data.amount0).toEqual("1");
      expect(data.amount1).toEqual("1253.169150694844108754");
      expect(data.liquidity).toEqual("928.637339589079235191");
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
      expect(data.amount0).toEqual("1");
      expect(data.amount1).toEqual("0");
      expect(data.liquidity).toEqual("1527.486971963149328921");
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
      expect(liq.Data?.liquidity).toBe("0");
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
      expect(liq.Data?.liquidity).toBe("928.637339589079235191");
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
      expect(liq.Data?.liquidity).toBe("928.637339589079235191");
    });

    test("slot0 data", async () => {
      const poolData = new GetPoolDto(ETH_ClassKey, USDT_ClassKey, fee).signed(user.privateKey);
      const slot0 = await client.dexV3Contract.getSlot0(poolData);
      // value slipped from 44.72136 to 44.67807328159716250969
      const getData = await client.dexV3Contract.getPoolData(poolData);
      // fee collected after swap
      expect(getData.Data?.feeGrowthGlobal0).toBe("0");
      expect(slot0.Data?.sqrtPrice).toEqual(initialSqrtPrice.toString());
    });

    test("RemoveLiquidity", async () => {
      const pa = 1880,
        pb = 2220;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);
      const dto = new BurnDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber("928.637339589079235191"),
        ta,
        tb,
        user.identityKey
      );

      const removeLiqEstimation = await client.dexV3Contract.burnEstimate(dto);
      const data = removeLiqEstimation.Data;
      if (data === undefined) throw new Error();

      expect(data.amount0).toBe("1");
      expect(data.amount1).toBe("1253.169150694844108753");

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
        Data: expect.objectContaining({ totalCount: expect.anything(), positions: expect.anything() })
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
      expect(data.amount0).toEqual("0");
      expect(data.amount1).toEqual("10");
      expect(data.liquidity).toEqual("4.249563923888253405");
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
      expect(data.amount0).toEqual("100");
      expect(data.amount1).toEqual("143060.356679853947733062");
      expect(data.liquidity).toEqual("768993.229675823772064336");
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
      expect(data.amount0).toEqual("10");
      expect(data.amount1).toEqual("0");
      expect(data.liquidity).toEqual("20607.53664493334613554");
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
        amounts: ["100", "143060.356679853947733061"],
        userBalanceDelta: {
          token0Balance: {
            additionalKey: "ETH",
            category: "new-category0",
            collection: "new-collection0",
            inUseHolds: [],
            instanceIds: [],
            lockedHolds: [],
            owner: expect.stringMatching(/^eth\|[a-fA-F0-9]{40}$/),
            quantity: "99999897.99930000000000062",
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
            quantity: "99856936.643320146052266951",
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
      expect(liq.Data?.liquidity).toBe("776683.161972582009784974");
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
      expect(getData.Data?.feeGrowthGlobal0).toBe("0.00000003872316637615");
      expect(slot0.Data?.sqrtPrice).toEqual("44.55000219957551475027");
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

        configPlatformFeeAddressDTO.sign(authorityUser.privateKey);        const configRes = await client.dexV3Contract.configureDexFeeAddress(configPlatformFeeAddressDTO);
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
      expect(pool.Data?.sqrtPrice).toEqual(initialSqrtPrice.toString());
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

      expect(result?.amount0).toBe("2");
      expect(result?.amount1).toBe("-3994.130334466043470346");
      expect(result?.currentSqrtPrice).toBe("44.72136");
      expect(result?.newSqrtPrice).toBe("44.678073281597162509");
    });

    test("should estimate swap for exact out", async () => {
      const amountToSwap = new BigNumber("-0.003"),
        sqrtPriceLimit = new BigNumber(5000);
      const dto = new SwapDto(ETH_ClassKey, USDC_ClassKey, fee, amountToSwap, false, sqrtPriceLimit).signed(
        user.privateKey
      );
      const quoteExactResponse = await client.dexV3Contract.quoteExactAmount(dto);
      expect(quoteExactResponse.Data).toMatchObject({
        amount0: "-0.003",
        amount1: "6.003010350022664756",
        currentSqrtPrice: "44.72136",
        newSqrtPrice: "44.721425025592940791"
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
      expect(getData.Data?.feeGrowthGlobal0).toBe("0.00000000758630799314");
      expect(getData.Data?.protocolFeesToken0).toBe("0.000300000000000000108");
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
}

function tokenContractAPI(client: ChainClient): TokenContractAPI & CommonContractAPI {
  return {
    ...commonContractAPI(client),

    CreateToken(dto: CreateTokenClassDto) {
      return client.submitTransaction("CreateTokenClass", dto) as Promise<GalaChainResponse<TokenClassKey>>;
    },

    FetchBalances(dto: FetchBalancesDto) {
      return client.evaluateTransaction("FetchBalances", dto) as Promise<GalaChainResponse<TokenBalance[]>>;
    },
    MintToken(dto: MintTokenDto) {
      return client.submitTransaction("MintToken", dto) as Promise<GalaChainResponse<TokenInstanceKey[]>>;
    },

    GrantAllowance(dto: GrantAllowanceDto) {
      return client.submitTransaction("GrantAllowance", dto) as Promise<GalaChainResponse<TokenAllowance[]>>;
    },

    MintTokenWithAllowance(dto: MintTokenWithAllowanceDto) {
      return client.submitTransaction("MintTokenWithAllowance", dto) as Promise<
        GalaChainResponse<TokenInstanceKey[]>
      >;
    }
  };
}

interface DexV3ContractAPI {
  createPool(dto: CreatePoolDto): Promise<GalaChainResponse<void>>;
  addLiquidity(dto: AddLiquidityDTO): Promise<GalaChainResponse<AddLiquidityResDto>>;
  swap(dto: SwapDto): Promise<GalaChainResponse<SwapResDto>>;
  RemoveLiquidity(dto: BurnDto): Promise<GalaChainResponse<UserBalanceResDto>>;
  getLiquidity(dto: GetPoolDto): Promise<GalaChainResponse<GetLiquidityResDto>>;
  getPositions(dto: GetPositionDto): Promise<GalaChainResponse<GetPositionResDto>>;
  getSlot0(dto: GetPoolDto): Promise<GalaChainResponse<Slot0ResDto>>;
  getUserPositions(dto: GetUserPositionsDto): Promise<GalaChainResponse<GetUserPositionsResDto>>;
  getAddLiquidityEstimation(
    dto: GetAddLiquidityEstimationDto
  ): Promise<GalaChainResponse<GetAddLiquidityEstimationResDto>>;
  quoteExactAmount(dto: QuoteExactAmountDto): Promise<GalaChainResponse<QuoteExactAmountResDto>>;
  getPoolData(dto: GetPoolDto): Promise<GalaChainResponse<Pool>>;
  burnEstimate(dto: BurnDto): Promise<GalaChainResponse<GetRemoveLiqEstimationResDto>>;
  collect(dto: CollectDto): Promise<GalaChainResponse<UserBalanceResDto>>;
  collectTradingFees(dto: CollectTradingFeesDto): Promise<GalaChainResponse<CollectTradingFeesResDto>>;
  setProtocolFee(dto: SetProtocolFeeDto): Promise<GalaChainResponse<SetProtocolFeeResDto>>;
  configureDexFeeAddress(dto: ConfigureDexFeeAddressDto): Promise<GalaChainResponse<DexFeeConfig>>;
  getDexConfig(dto: ChainCallDTO): Promise<GalaChainResponse<DexFeeConfig>>;
}

function dexV3ContractAPI(client: ChainClient): DexV3ContractAPI & CommonContractAPI {
  return {
    ...commonContractAPI(client),
    createPool(dto: CreatePoolDto) {
      return client.submitTransaction("CreatePool", dto) as Promise<GalaChainResponse<void>>;
    },
    getPoolData(dto: GetPoolDto) {
      return client.evaluateTransaction("GetPoolData", dto) as Promise<GalaChainResponse<Pool>>;
    },
    addLiquidity(dto: AddLiquidityDTO) {
      return client.submitTransaction("AddLiquidity", dto) as Promise<GalaChainResponse<AddLiquidityResDto>>;
    },
    swap(dto: SwapDto) {
      return client.submitTransaction("Swap", dto) as Promise<GalaChainResponse<SwapResDto>>;
    },
    RemoveLiquidity(dto: BurnDto) {
      return client.submitTransaction("RemoveLiquidity", dto) as Promise<
        GalaChainResponse<UserBalanceResDto>
      >;
    },
    burnEstimate(dto: BurnDto) {
      return client.evaluateTransaction("GetRemoveLiquidityEstimation", dto) as Promise<
        GalaChainResponse<GetRemoveLiqEstimationResDto>
      >;
    },
    getSlot0(dto: GetPoolDto) {
      return client.evaluateTransaction("GetSlot0", dto) as Promise<GalaChainResponse<Slot0ResDto>>;
    },
    getLiquidity(dto: GetPoolDto) {
      return client.evaluateTransaction("GetLiquidity", dto) as Promise<
        GalaChainResponse<GetLiquidityResDto>
      >;
    },
    getPositions(dto: GetPositionDto) {
      return client.evaluateTransaction("GetPositions", dto) as Promise<GalaChainResponse<GetPositionResDto>>;
    },
    getUserPositions(dto: GetUserPositionsDto) {
      return client.evaluateTransaction("GetUserPositions", dto) as Promise<
        GalaChainResponse<GetUserPositionsResDto>
      >;
    },
    getAddLiquidityEstimation(dto: GetAddLiquidityEstimationDto) {
      return client.evaluateTransaction("GetAddLiquidityEstimation", dto) as Promise<
        GalaChainResponse<GetAddLiquidityEstimationResDto>
      >;
    },
    quoteExactAmount(dto: QuoteExactAmountDto) {
      return client.evaluateTransaction("QuoteExactAmount", dto) as Promise<
        GalaChainResponse<QuoteExactAmountResDto>
      >;
    },
    collect(dto: CollectDto) {
      return client.submitTransaction("CollectPositionFees", dto) as Promise<
        GalaChainResponse<UserBalanceResDto>
      >;
    },
    collectTradingFees(dto: CollectTradingFeesDto) {
      return client.submitTransaction("CollectTradingFees", dto) as Promise<
        GalaChainResponse<CollectTradingFeesResDto>
      >;
    },
    setProtocolFee(dto: SetProtocolFeeDto) {
      return client.submitTransaction("SetProtocolFee", dto) as Promise<
        GalaChainResponse<SetProtocolFeeResDto>
      >;
    },
    configureDexFeeAddress(dto: ConfigureDexFeeAddressDto) {
      return client.submitTransaction("ConfigureDexFeeAddress", dto) as Promise<
        GalaChainResponse<DexFeeConfig>
      >;
    },
    getDexConfig(dto: ChainCallDTO) {
      return client.evaluateTransaction("GetDexFeeConfigration", dto) as Promise<
        GalaChainResponse<DexFeeConfig>
      >;
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

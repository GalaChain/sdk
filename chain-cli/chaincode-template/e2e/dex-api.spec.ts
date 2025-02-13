import {
  CreateTokenClassDto,
  FetchBalancesDto,
  GalaChainResponse,
  GrantAllowanceDto,
  MintTokenDto,
  MintTokenWithAllowanceDto,
  TokenAllowance,
  TokenBalance,
  TokenClassKey,
  TokenInstanceKey,
} from "@gala-chain/api";
import { ChainClient, ChainUser, CommonContractAPI, commonContractAPI } from "@gala-chain/client";
import { AdminChainClients, TestClients, transactionSuccess } from "@gala-chain/test";
import BigNumber from "bignumber.js";

import {
  AddLiquidityDTO,
  BurnDto,
  CollectDTO,
  CreatePoolDto,
  ExpectedTokenDTO,
  GetPoolDto,
  GetPositionDto,
  GetUserPositionsDto,
  PositionDto,
  QuoteExactAmountDto,
  SwapDto
} from "../src/v3/dtos";
import { feeAmountTickSpacing, sqrtPriceToTick } from "../src/v3/helpers/tick.helper";
import TOKENS, { ETH_ClassKey, USDT_ClassKey } from "./tokens";

jest.setTimeout(3000000);


const spacedTicksFromPrice = (pa: number, pb: number, tickSpacing: number) => {
  return [
    Math.ceil(sqrtPriceToTick(new BigNumber(Math.sqrt(pa))) / tickSpacing) * tickSpacing,
    Math.floor(sqrtPriceToTick(new BigNumber(Math.sqrt(pb))) / tickSpacing) * tickSpacing
  ];
};

describe("Dex v3 Testing", () => {
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

  beforeAll(async () => {
    client = await TestClients.createForAdmin(contractConfig);
    user = await client.createRegisteredUser();
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
    for (let TOKEN of Object.entries(TOKENS)) {
      test(`Create  ${TOKEN[0]} token`, async () => {
        const token = TOKEN[1];
        let classKey = Object.assign(new TokenClassKey(), token.KEY);
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
        let tokenCreationRes = await client.tokenContract.CreateToken(tokenClassDto);
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
    for (let TOKEN of Object.entries(TOKENS))
      test(`Mint ${TOKEN[0]} token`, async () => {
        const token = TOKEN[1];
        let tokenClassKey = Object.assign(new TokenClassKey(), token.KEY);
        const dto = new MintTokenWithAllowanceDto();
        dto.tokenClass = tokenClassKey;
        dto.quantity = GENERAL.MINT_QUANTITY;
        dto.owner = user.identityKey;
        dto.tokenInstance = new BigNumber(0);
        dto.sign(user.privateKey);
        const a = await client.tokenContract.MintTokenWithAllowance(dto);      });

    test("Should return user balance", async () => {
      const fetchBalancesDto = new FetchBalancesDto();
      fetchBalancesDto.owner = user.identityKey;
      const fetchBalanceRes = await client.tokenContract.FetchBalances(fetchBalancesDto);
      const balancesData = fetchBalanceRes.Data;
      if (balancesData) {
        for (let balance of balancesData) {
          let balanceN = balance as any;
          expect(balanceN.quantity).toEqual(GENERAL.MINT_QUANTITY.toString());
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
    const ETH = Object.assign(new TokenClassKey(), TOKENS.ETH.KEY).toStringKey(),
      USDT = Object.assign(new TokenClassKey(), TOKENS.USDT.KEY).toStringKey();

    test("Should create Pool with 0.05% fee", async () => {
      let dto = new CreatePoolDto(ETH_ClassKey, USDT_ClassKey, fee, initialSqrtPrice).signed(user.privateKey);
      let createPoolRes = await client.dexV3Contract.createPool(dto);
    });

    test("Should create error create pool with 0.05% fee", async () => {
      let dto = new CreatePoolDto(ETH_ClassKey, USDT_ClassKey, fee, initialSqrtPrice).signed(user.privateKey);
      let createPoolRes = await client.dexV3Contract.createPool(dto);
      expect(createPoolRes.Status).toEqual(0);
    });

    test("should Read details from slot0", async () => {
      const poolDataDTO = new GetPoolDto(ETH_ClassKey, USDT_ClassKey, fee).signed(user.privateKey);
      const slot0 = await client.dexV3Contract.slot0(poolDataDTO);
      expect(slot0.Data?.sqrtPrice).toEqual(initialSqrtPrice.toString());
    });

    test("Checking for the expectedTokens to provide liquidity in the range of 1700 - 1900 range ", async () => {
      const fee = 500;
      const pa = 1700,
        pb = 1900;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);
      const dto = new ExpectedTokenDTO(
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
      expect(data[0]).toEqual("0");
      expect(data[1]).toEqual("1");
      expect(data[2]).toEqual("0.42495639238882534");
    });

    test("Checking for the expectedTokens to provide liquidity in the range of 1980 - 2020 range ", async () => {
      const pa = 1980,
        pb = 2020;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);
      let fee = 500;
      const dto = new ExpectedTokenDTO(
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
      expect(data[0]).toEqual("10");
      expect(data[1]).toEqual("19106.858496401901029315");
      expect(data[2]).toEqual("92271.497628802094407218");
    });

    test("Checking for the expectedTokens to provide liquidity in the range of 2100 - 2200 range ", async () => {
      const pa = 2100,
        pb = 2200;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, 10);
      let fee = 500;
      const dto = new ExpectedTokenDTO(
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

      expect(data[0]).toEqual("1");
      expect(data[1]).toEqual("0");
      expect(data[2]).toEqual("2060.753664493334613554");
    });

    test("Add liquidity in range 1700 - 1900", async () => {
      const pa = 1700,
        pb = 1900;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);
      const expectedTokenDTO = new ExpectedTokenDTO(
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
      const token0 = new BigNumber(data[0]),
        token1 = new BigNumber(data[1]),
        liquidity = new BigNumber(data[2]);
      const [token0Slipped, token1Slipped] = slippedValue([token0, token1], slippage);

      let dto = new AddLiquidityDTO(
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

      const balanceOfPoolBefore = await checkBalanceOfPool(
        ETH_ClassKey.toStringKey(),
        USDT_ClassKey.toStringKey(),
        fee
      );
      await client.dexV3Contract.addLiquidity(dto);
      const getLiquidityDTO = new GetPoolDto(ETH_ClassKey, USDT_ClassKey, fee).signed(user.privateKey);
      const liq = await client.dexV3Contract.liquidity(getLiquidityDTO);
      // As we have provided our first liquidity outside the range then the global liquidity must be equal to zero
      expect(liq.Data).toEqual("0");
    });

    test("Add liquidity in range 1980 - 2020", async () => {
      const pa = 1980,
        pb = 2020;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);
      const expectedTokenDTO = new ExpectedTokenDTO(
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
      const token0 = new BigNumber(data[0]),
        token1 = new BigNumber(data[1]),
        liquidity = new BigNumber(data[2]);

      const [token0Slipped, token1Slipped] = slippedValue([token0, token1], slippage);

      let dto = new AddLiquidityDTO(
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
      const balanceOfPoolBefore = await checkBalanceOfPool(
        ETH_ClassKey.toStringKey(),
        USDT_ClassKey.toStringKey(),
        fee
      );
      await client.dexV3Contract.addLiquidity(dto);
      const getLiquidityDTO = new GetPoolDto(ETH_ClassKey, USDT_ClassKey, fee).signed(user.privateKey);

      const liq = await client.dexV3Contract.liquidity(getLiquidityDTO);

      expect(Number(liq.Data)).toBeCloseTo(Number(liquidity.toString()));
    });
    test("Add liquidity in range 2100 - 2200", async () => {
      const pa = 2100,
        pb = 2200;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);
      const expectedTokenDTO = new ExpectedTokenDTO(
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
      const token0 = new BigNumber(data[0]),
        token1 = new BigNumber(data[1]),
        liquidity = new BigNumber(data[2]);
      const [token0Slipped, token1Slipped] = slippedValue([token0, token1], slippage);

      let dto = new AddLiquidityDTO(
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
      const liq = await client.dexV3Contract.liquidity(getLiquidityDTO);
      expect(liq.Data).toEqual("92271.497628802094407217");
    });

    test("should estimate swap", async () => {
      const amountToSwap = new BigNumber(2),
        sqrtPriceLimit = new BigNumber(5);
      let dto = new SwapDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        user.identityKey,
        amountToSwap,
        true,
        sqrtPriceLimit
      ).signed(user.privateKey);
      let expectSwapRes = await client.dexV3Contract.quoteExactAmount(dto);
      const result = expectSwapRes.Data;
      expect(result[0]).toBe("2");
      expect(result[1]).toBe("-3994.130334466043470346");
      expect(result[2]).toBe("44.72136");
      expect(result[3]).toBe("44.678073281597162509");
    });
    test("should estimate swap for bug ", async () => {
      const amountToSwap = new BigNumber("-0.003"),
        sqrtPriceLimit = new BigNumber(5000);
      let dto = new SwapDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        user.identityKey,
        amountToSwap,
        false,
        sqrtPriceLimit
      ).signed(user.privateKey);
      await client.dexV3Contract.quoteExactAmount(dto)
    });

    test("should estimate swap for buy", async () => {
      const amountToSwap = new BigNumber("-0.00000000000000000000000001")
      const dto = new QuoteExactAmountDto(ETH_ClassKey, USDT_ClassKey, fee, amountToSwap, false).signed(
        user.privateKey
      );
     await client.dexV3Contract.quoteExactAmount(dto);

    });

    test("should swap with changing sqrtPrice", async () => {
      const amountToSwap = new BigNumber(2),
        sqrtPriceLimit = new BigNumber(5);

      let dto = new SwapDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        user.identityKey,
        amountToSwap,
        true,
        sqrtPriceLimit
      ).signed(user.privateKey);
       await client.dexV3Contract.swap(dto);

    });

    test("Add liquidity in range 1980 - 2020", async () => {
      const pa = 1980,
        pb = 2020;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);
      const expectedTokenDTO = new ExpectedTokenDTO(
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
      const token0 = new BigNumber("10"),
        token1 = new BigNumber("19106.858496401901029315"),
        liquidity = new BigNumber(data[2]);
      const [token0Slipped, token1Slipped] = slippedValue([token0, token1], slippage);

      let dto = new AddLiquidityDTO(
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
    });

    test("GetPool data", async () => {
      const poolData = new GetPoolDto(ETH_ClassKey, USDT_ClassKey, fee).signed(user.privateKey);
      const slot0 = await client.dexV3Contract.slot0(poolData);
      // value slipped from 44.72136 to 44.67807328159716250969
      expect(slot0.Data?.sqrtPrice).toEqual("44.67807328159716250969");
    });

    test("check the user position for token0Owed and token1Owed before the removal of liqudity", async () => {

      const getPositionsDto = new GetUserPositionsDto(user.identityKey, 1, 1).signed(user.privateKey);
      const positions = await client.dexV3Contract.getUserPositions(getPositionsDto);
    });

    test("RemoveLiquidity", async () => {

      let fee = 500;

      const tickSpacing = feeAmountTickSpacing[fee];
      const pa = 1980,
        pb = 2020;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);

      let dto = new BurnDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        user.identityKey,
        new BigNumber("92271.497628802094407217"),
        ta,
        tb
      ).signed(user.privateKey);
      const poolVirtualAddress = `service|${ETH}_${USDT}_500`;
      const fetchBalanceDto = new FetchBalancesDto();
      fetchBalanceDto.owner = poolVirtualAddress;

      await client.dexV3Contract.burn(dto);
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
      await client.dexV3Contract.positions(getPositionDto);
    });

    test("collect Tokens0 and token1", async () => {
      let fee = 500;

      const tickSpacing = feeAmountTickSpacing[fee];
      const pa = 1980,
        pb = 2020;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);

      let dto = new CollectDTO(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        new BigNumber("0.001"),
        new BigNumber("0"),
        ta,
        tb
      ).signed(user.privateKey);
      const poolVirtualAddress = `service|${ETH}_${USDT}_500`;
      const fetchBalanceDto = new FetchBalancesDto();
      fetchBalanceDto.owner = poolVirtualAddress;
      await client.dexV3Contract.collect(dto);
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
      const position = await client.dexV3Contract.positions(getPositionDto);
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
      let dto = new CreatePoolDto(ETH_ClassKey, USDT_ClassKey, fee, initialSqrtPrice).signed(user.privateKey);
      await client.dexV3Contract.createPool(dto);
    });

    test("Should create error create pool with 0.03% fee", async () => {
      let dto = new CreatePoolDto(ETH_ClassKey, USDT_ClassKey, fee, initialSqrtPrice).signed(user.privateKey);

      let createPoolRes = await client.dexV3Contract.createPool(dto);
      // TODO: add error type
      expect(createPoolRes.Status).toEqual(0);
    });

    test("should Read details from slot0", async () => {
      const poolDataDTO = new GetPoolDto(ETH_ClassKey, USDT_ClassKey, fee).signed(user.privateKey);
      const slot0 = await client.dexV3Contract.slot0(poolDataDTO);
      expect(slot0.Data?.sqrtPrice).toEqual(initialSqrtPrice.toString());
    });
    test("Checking for the expectedTokens to provide liquidity in the range of 1700 - 1900 range", async () => {
      // const pa = 2100, pb = 2200
      const fee = 3000;

      const tickSpacing = feeAmountTickSpacing[fee];
      const pa = 1700,
        pb = 1900;
      // const pa = 1980, pb = 2020
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);

      const dto = new ExpectedTokenDTO(
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
      expect(data[0]).toEqual("0");
      expect(data[1]).toEqual("1");
      expect(data[2]).toEqual("0.436872924385936373");
    });
    test("Checking for the expectedTokens to provide liquidity in the range of 1980 - 2020 range", async () => {
      // const pa = 2100, pb = 2200
      const fee = 3000;
      const tickSpacing = feeAmountTickSpacing[fee];
      const pa = 1980,
        pb = 2020;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);

      const dto = new ExpectedTokenDTO(
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
      expect(data[0]).toEqual("1");
      expect(data[1]).toEqual("1573.331577716744383555");
      expect(data[2]).toEqual("13337.957541974915714025");
    });
    test("Checking for the expectedTokens to provide liquidity in the range of 2100 - 2200 range ", async () => {
      const fee = 3000;

      const tickSpacing = feeAmountTickSpacing[fee];
      const pa = 2100,
        pb = 2200;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);
      const dto = new ExpectedTokenDTO(
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

      expect(data[0]).toEqual("1");
      expect(data[1]).toEqual("0");
      expect(data[2]).toEqual("2576.605678369885528483");
    });

    test("Add liquidity in range 1700 - 1900", async () => {
      const tickSpacing = feeAmountTickSpacing[fee];
      const pa = 1700,
        pb = 1900;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);
      const expectedTokenDTO = new ExpectedTokenDTO(
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
      const token0 = new BigNumber(data[0]),
        token1 = new BigNumber(data[1]),
        liquidity = new BigNumber(data[2]);

      const [token0Slipped, token1Slipped] = slippedValue([token0, token1], slippage);
      let dto = new AddLiquidityDTO(
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

      await checkBalanceOfPool(
        ETH_ClassKey.toStringKey(),
        USDT_ClassKey.toStringKey(),
        fee
      );

      await client.dexV3Contract.addLiquidity(dto);
 
      const getLiquidityDTO = new GetPoolDto(ETH_ClassKey, USDT_ClassKey, fee).signed(user.privateKey);
      const liq = await client.dexV3Contract.liquidity(getLiquidityDTO);
    });
    test("Add liquidity in range 1980 - 2020", async () => {
      const fee = 3000;

      const tickSpacing = feeAmountTickSpacing[fee];

      const pa = 1980,
        pb = 2020;

      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);

      const expectedTokenDTO = new ExpectedTokenDTO(
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
      const token0 = new BigNumber(data[0]),
        token1 = new BigNumber(data[1]),
        liquidity = new BigNumber(data[2]);

      const [token0Slipped, token1Slipped] = slippedValue([token0, token1], slippage);
      let dto = new AddLiquidityDTO(
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
    });
    test("Add liquidity in range 2100 - 2200", async () => {
      const fee = 3000;

      const tickSpacing = feeAmountTickSpacing[fee];

      const pa = 1980,
        pb = 2020;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);
      const expectedTokenDTO = new ExpectedTokenDTO(
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
      const token0 = new BigNumber(data[0]),
        token1 = new BigNumber(data[1]),
        liquidity = new BigNumber(data[2]);

      const [token0Slipped, token1Slipped] = slippedValue([token0, token1], slippage);
      let dto = new AddLiquidityDTO(
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

      let addLiquidityRes = await client.dexV3Contract.addLiquidity(dto);

      const checkPoolBalanceAfter = await checkBalanceOfPool(
        ETH_ClassKey.toStringKey(),
        USDT_ClassKey.toStringKey(),
        fee
      );
      const getLiquidityDTO = new GetPoolDto(ETH_ClassKey, USDT_ClassKey, fee).signed(user.privateKey);

     await client.dexV3Contract.liquidity(getLiquidityDTO);
    });

    test("should swap with changing sqrtPrice", async () => {
      const amountToSwap = new BigNumber(0.2),
        sqrtPriceLimit = new BigNumber(5);

      let dto = new SwapDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        user.identityKey,
        amountToSwap,
        true,
        sqrtPriceLimit
      ).signed(user.privateKey);


   

      await client.dexV3Contract.swap(dto);



    });

    test("GetPool data", async () => {
      const poolData = new GetPoolDto(ETH_ClassKey, USDT_ClassKey, fee).signed(user.privateKey);
      const slot0 = await client.dexV3Contract.slot0(poolData);
      const getPoolDataRes = await client.dexV3Contract.getPoolData(poolData);

      // value slipped from 44.72136 to 44.70641518040332314986
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
      const position = await client.dexV3Contract.positions(getPositionDto);
    });


    test("RemoveLiquidity", async () => {
      let fee = 3000;

      const tickSpacing = feeAmountTickSpacing[fee];
      const pa = 1980,
        pb = 2020;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);

      let dto = new BurnDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        user.identityKey,
        new BigNumber("26675.915083949831428038"),
        ta,
        tb
      ).signed(user.privateKey);
      const poolVirtualAddress = `service|${ETH}_${USDT}_500`;

      const fetchBalanceDto = new FetchBalancesDto();
      fetchBalanceDto.owner = poolVirtualAddress;

      let burnRes = await client.dexV3Contract.burn(dto);
      const getPositionsDto = new GetUserPositionsDto(user.identityKey).signed(user.privateKey);
      const positions = await client.dexV3Contract.getUserPositions(getPositionsDto);
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
      const position = await client.dexV3Contract.positions(getPositionDto);

    });

    test("collect Tokens0 and token1", async () => {
      let fee = 3000;

      const tickSpacing = feeAmountTickSpacing[fee];
      const pa = 1980,
        pb = 2020;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);

      let dto = new CollectDTO(
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
      const balanceOfPool = await client.tokenContract.FetchBalances(fetchBalanceDto);
     await client.dexV3Contract.collect(dto);
    await client.tokenContract.FetchBalances(fetchBalanceDto);


      const getPositionsDto = new GetUserPositionsDto(user.identityKey).signed(user.privateKey);

      await client.dexV3Contract.getUserPositions(getPositionsDto)
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
      const position = await client.dexV3Contract.positions(getPositionDto);
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
      initialSqrtPrice = new BigNumber("44.72136");
    test("Create Pool with 1% fee", async () => {
      let dto = new CreatePoolDto(ETH_ClassKey, USDT_ClassKey, fee, initialSqrtPrice).signed(user.privateKey);

     await client.dexV3Contract.createPool(dto);
      const poolData = new GetPoolDto(ETH_ClassKey, USDT_ClassKey, fee).signed(user.privateKey);
      const slotDetails = await client.dexV3Contract.slot0(poolData);
      expect(slotDetails.Data?.sqrtPrice).toEqual(initialSqrtPrice.toString());

    });

    test("Checking for the expectedTokens to provide liquidity in the range of 1600 - 1900 range ", async () => {
      // const pa = 2100, pb = 2200
      const fee = 10000;

      const tickSpacing = feeAmountTickSpacing[fee];
      const pa = 1600,
        pb = 1900;
      // const pa = 1980, pb = 2020
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);

      const dto = new ExpectedTokenDTO(
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
      expect(data[0]).toEqual("0");
      expect(data[1]).toEqual("1");
      expect(data[2]).toEqual("0.299901408704333964");
    });
    test("Checking for the expectedTokens to provide liquidity in the range of 1880 - 2220 range ", async () => {
      // const pa = 2100, pb = 2200
      const fee = 10000;
      const tickSpacing = feeAmountTickSpacing[fee];
      const pa = 1880,
        pb = 2220;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);
      const dto = new ExpectedTokenDTO(
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
      expect(data[0]).toEqual("1");
      expect(data[1]).toEqual("1253.169150694844108754");
      expect(data[2]).toEqual("928.637339589079235191");
    });
    test("Checking for the expectedTokens to provide liquidity in the range of 2000 - 2200 range ", async () => {
      const fee = 10000;

      const tickSpacing = feeAmountTickSpacing[fee];
      const pa = 2000,
        pb = 2200;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);

      const dto = new ExpectedTokenDTO(
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
      expect(data[0]).toEqual("1");
      expect(data[1]).toEqual("0");
      expect(data[2]).toEqual("1527.486971963149328921");
    });

    test("Add liquidity in range 1600 - 1900", async () => {
      const fee = 10000;

      const tickSpacing = feeAmountTickSpacing[fee];
      // const pa = 2100, pb = 2200
      const pa = 1600,
        pb = 1900;
      // const pa = 1980, pb = 2020
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);
      // const []
      const expectedTokenDTO = new ExpectedTokenDTO(
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
      const token0 = new BigNumber(data[0]),
        token1 = new BigNumber(data[1]),
        liquidity = new BigNumber(data[2]);

      const [token0Slipped, token1Slipped] = slippedValue([token0, token1], slippage);

      let dto = new AddLiquidityDTO(
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

      const liq = await client.dexV3Contract.liquidity(getLiquidityDTO);

      expect(liq.Data).toBe("0");
    });
    test("Add liquidity in range 1880 - 2220", async () => {
      const fee = 10000;

      const tickSpacing = feeAmountTickSpacing[fee];

      const pa = 1880,
        pb = 2220;

      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);

      const expectedTokenDTO = new ExpectedTokenDTO(
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
      const token0 = new BigNumber(data[0]),
        token1 = new BigNumber(data[1]),
        liquidity = new BigNumber(data[2]);

      const [token0Slipped, token1Slipped] = slippedValue([token0, token1], slippage);
      let dto = new AddLiquidityDTO(
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

      const liq = await client.dexV3Contract.liquidity(getLiquidityDTO);
      expect(liq.Data).toBe("928.637339589079235191");
    });
    test("Add liquidity in range 2000 - 2200", async () => {
      const fee = 10000;

      const tickSpacing = feeAmountTickSpacing[fee];

      const pa = 2000,
        pb = 2220;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);

      const expectedTokenDTO = new ExpectedTokenDTO(
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
      const token0 = new BigNumber(data[0]),
        token1 = new BigNumber(data[1]),
        liquidity = new BigNumber(data[2]);

      const [token0Slipped, token1Slipped] = slippedValue([token0, token1], slippage);
      let dto = new AddLiquidityDTO(
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

      const liq = await client.dexV3Contract.liquidity(getLiquidityDTO);
      expect(liq.Data).toBe("928.637339589079235191");
    });
  });
  describe("Increasing liquidity to pool", () => {
    test("Checking for the expectedTokens to provide liquidity in the range of 1700 - 1900 range ", async () => {
      const fee = 500;
      const tickSpacing = feeAmountTickSpacing[fee];

      const pa = 1700,
        pb = 1900;
      const [ta, tb] = spacedTicksFromPrice(pa, pb, tickSpacing);

      const dto = new ExpectedTokenDTO(
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
      expect(data[0]).toEqual("0");
      expect(data[1]).toEqual("10");
      expect(data[2]).toEqual("4.249563923888253405");
    });
    test("Checking for the expectedTokens to provide liquidity in the range of 1980 - 2020 range", async () => {
      // const pa = 2100, pb = 2200

      const pa = 1980,
        pb = 2020;
      const ta = Math.round(sqrtPriceToTick(new BigNumber(Math.sqrt(pa))) / 10) * 10,
        tb = Math.round(sqrtPriceToTick(new BigNumber(Math.sqrt(pb))) / 10) * 10;

      let fee = 500;
      const dto = new ExpectedTokenDTO(
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

      expect(data[0]).toEqual("100");
      expect(data[1]).toEqual("143060.356679853947733062");

      expect(data[2]).toEqual("768993.229675823772064336");
    });
    test("Checking for the expectedTokens to provide liquidity in the range of 2100 - 2200 range ", async () => {
      const pa = 2100,
        pb = 2200;
      // const pa = 1700, pb = 1900
      // const pa = 1980, pb = 2020
      const [ta, tb] = spacedTicksFromPrice(pa, pb, 10);
      let fee = 500;
      const dto = new ExpectedTokenDTO(
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
      expect(data[0]).toEqual("10");
      expect(data[1]).toEqual("0");
      expect(data[2]).toEqual("20607.53664493334613554");
    });

    test("Add liquidity in range 1980 - 2020", async () => {
      let fee = 500;

      const pa = 1980,
        pb = 2020;
      const ta = Math.round(sqrtPriceToTick(new BigNumber(Math.sqrt(pa))) / 10) * 10,
        tb = Math.round(sqrtPriceToTick(new BigNumber(Math.sqrt(pb))) / 10) * 10;

      const expectedTokenDTO = new ExpectedTokenDTO(
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
      const token0 = new BigNumber(data[0]),
        token1 = new BigNumber(data[1]),
        liquidity = new BigNumber(data[2]);

      const [token0Slipped, token1Slipped] = slippedValue([token0, token1], slippage);
      let dto = new AddLiquidityDTO(
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
    });
    test("Add liquidity in range 2100 - 2200", async () => {
      let fee = 500;

      const pa = 1980,
        pb = 2020;
      const ta = Math.round(sqrtPriceToTick(new BigNumber(Math.sqrt(pa))) / 10) * 10,
        tb = Math.round(sqrtPriceToTick(new BigNumber(Math.sqrt(pb))) / 10) * 10;

      const expectedTokenDTO = new ExpectedTokenDTO(
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
      const token0 = new BigNumber(data[0]),
        token1 = new BigNumber(data[1]),
        liquidity = new BigNumber(data[2]);

      const [token0Slipped, token1Slipped] = slippedValue([token0, token1], slippage);
      let dto = new AddLiquidityDTO(
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

      const liq = await client.dexV3Contract.liquidity(getLiquidityDTO);
    });

    test("Swaping case 1", async () => {
      let fee = 500;

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

      let dto = new SwapDto(
        ETH_ClassKey,
        USDT_ClassKey,
        fee,
        user.identityKey,
        new BigNumber(50),
        true,
        new BigNumber(40)
      ).signed(user.privateKey);

      const poolVirtualAddress = `service|${ETH_ClassKey}_${USDT_ClassKey}_500`;

      const fetchBalanceDto = new FetchBalancesDto();
      fetchBalanceDto.owner = poolVirtualAddress;
      const balanceOfPool = await client.tokenContract.FetchBalances(fetchBalanceDto);

      const fetchBalanceDtouser = new FetchBalancesDto();
      fetchBalanceDtouser.owner = user.identityKey;
      const balanceOfUser = await client.tokenContract.FetchBalances(fetchBalanceDtouser);

      let swapRes = await client.dexV3Contract.swap(dto);
      const balanceOfUserAfter = await client.tokenContract.FetchBalances(fetchBalanceDtouser);

      const balanceOfPoolAfter = await client.tokenContract.FetchBalances(fetchBalanceDto);
    });
  });

  async function checkBalanceOfPool(token0: string, token1: string, fee: number) {
    const poolVirtualAddress = `service|${token0}_${token1}_${fee}`;
    const fetchBalanceDto = new FetchBalancesDto();
    fetchBalanceDto.owner = poolVirtualAddress;

    return await client.tokenContract.FetchBalances(fetchBalanceDto);
  }

  async function checkBalanceOfuser(identityKey: string) {
    const fetchBalanceDto = new FetchBalancesDto();
    fetchBalanceDto.owner = identityKey;

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
      return client.submitTransaction("FetchBalances", dto) as Promise<GalaChainResponse<TokenBalance[]>>;
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
  addLiquidity(dto: AddLiquidityDTO): Promise<GalaChainResponse<void>>;
  swap(dto: SwapDto): Promise<GalaChainResponse<void>>;
  burn(dto: BurnDto): Promise<GalaChainResponse<void>>;
  liquidity(dto: GetPoolDto): Promise<GalaChainResponse<string>>;
  positions(dto: GetPositionDto): Promise<GalaChainResponse<string>>;
  slot0(dto: GetPoolDto): Promise<GalaChainResponse<any>>;
  getPool(dto: GetPoolDto): Promise<GalaChainResponse<string>>;
  getUserPositions(dto: GetUserPositionsDto): Promise<GalaChainResponse<any>>;
  getAddLiquidityEstimation(dto: ExpectedTokenDTO): Promise<GalaChainResponse<any>>;
  quoteExactAmount(dto: QuoteExactAmountDto): Promise<GalaChainResponse<any>>;
  getPoolData(dto: GetPoolDto): Promise<GalaChainResponse<any>>;
  burnEstimate(dto: BurnDto): Promise<GalaChainResponse<string[]>>;
  collect(dto: CollectDTO): Promise<GalaChainResponse<string[]>>;
}

function dexV3ContractAPI(client: ChainClient): DexV3ContractAPI & CommonContractAPI {
  return {
    ...commonContractAPI(client),

    createPoolD(dto: CreatePoolDto) {
      return client.submitTransaction("CreatePool", dto) as Promise<GalaChainResponse<void>>;
    },
    createPool(dto: CreatePoolDto) {
      return client.submitTransaction("CreatePool", dto) as Promise<GalaChainResponse<void>>;
    },
    getPoolData(dto: GetPoolDto) {
      return client.submitTransaction("GetPoolData", dto) as Promise<GalaChainResponse<any>>;
    },
    swap(dto: SwapDto) {
      return client.submitTransaction("Swap", dto) as Promise<GalaChainResponse<void>>;
    },
    burn(dto: BurnDto) {
      return client.submitTransaction("RemoveLiquidity", dto) as Promise<GalaChainResponse<void>>;
    },
    burnEstimate(dto: BurnDto) {
      return client.submitTransaction("RemoveLiquidityEstimation", dto) as Promise<
        GalaChainResponse<string[]>
      >;
    },
    getPool(dto: GetPoolDto) {
      return client.submitTransaction("GetPool", dto) as Promise<GalaChainResponse<string>>;
    },
    slot0(dto: GetPoolDto) {
      return client.submitTransaction("Slot0", dto) as Promise<GalaChainResponse<string>>;
    },
    liquidity(dto: GetPoolDto) {
      return client.submitTransaction("Liquidity", dto) as Promise<GalaChainResponse<string>>;
    },
    positions(dto: GetPositionDto) {
      return client.submitTransaction("Positions", dto) as Promise<GalaChainResponse<string>>;
    },
    getUserPositions(dto: GetUserPositionsDto) {
      return client.submitTransaction("UserPositions", dto) as Promise<GalaChainResponse<string>>;
    },
    getAddLiquidityEstimation(dto: ExpectedTokenDTO) {
      return client.submitTransaction("AddLiquidityEstimation", dto) as Promise<GalaChainResponse<any>>;
    },
    quoteExactAmount(dto: QuoteExactAmountDto) {
      return client.submitTransaction("QuoteExactAmount", dto) as Promise<GalaChainResponse<any>>;
    },
    addLiquidity(dto: AddLiquidityDTO) {
      return client.submitTransaction("AddLiquidity", dto) as Promise<GalaChainResponse<void>>;
    },
    collect(dto: CollectDTO) {
      return client.submitTransaction("Collect", dto) as Promise<GalaChainResponse<any>>;
    }
  };
}

function convObjWithBigNumber(obj: any) {
  if (Array.isArray(obj)) {
    return obj;
  }
  const arr = Object.entries(obj);
  for (let [key, val] of arr) {
    if (val instanceof BigNumber) {
      obj[key] = (val as BigNumber).toString();
    }
  }
  return obj;
}

function slippedValue(val: BigNumber[], slippage: BigNumber | number) {
  if (typeof slippage === "number" || typeof slippage === "string") {
    slippage = new BigNumber(slippage);
  }
  const hundred = new BigNumber(100);
  return val.map((e) => e.multipliedBy(hundred.minus(slippage)).dividedBy(hundred));
}
